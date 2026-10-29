import { MercatorCoordinate, type CustomLayerInterface, type CustomRenderMethodInput, type Map as LibreMap } from 'maplibre-gl';

type GL = WebGLRenderingContext | WebGL2RenderingContext;
/** An actual horizontal/cell-average water surface. No procedural wave forecast or made-up dynamics.
 * The subtle surface shimmer is purely illustrative texture, not wave motion. */
export class ReplayWaterLayer implements CustomLayerInterface {
  id = 'replay-water-surface';
  type = 'custom' as const;
  renderingMode = '3d' as const;
  private map?: LibreMap;
  private program?: WebGLProgram;
  private buffer?: WebGLBuffer;
  private origin = MercatorCoordinate.fromLngLat([0, 0], 0);
  private units = 1;
  private vertices = new Float32Array();
  private dirty = false;
  private visible = true;
  private attribute = -1;
  private matrix?: WebGLUniformLocation | null;
  private color?: WebGLUniformLocation | null;
  private time?: WebGLUniformLocation | null;
  private t0 = performance.now();
  constructor(private onFailure: (message: string) => void) {}
  onAdd(map: LibreMap, gl: GL) {
    this.map = map;
    const is2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    const shader = (type: number, source: string) => {
      const s = gl.createShader(type); if (!s) throw new Error('Water shader allocation failed');
      gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); throw new Error('Water shader could not compile'); }
      return s;
    };
    let vs: WebGLShader | undefined, fs: WebGLShader | undefined, p: WebGLProgram | null = null;
    try {
      vs = shader(gl.VERTEX_SHADER, `${is2 ? '#version 300 es\nin' : 'attribute'} vec3 a_position;\nuniform mat4 u_matrix;void main(){gl_Position=u_matrix*vec4(a_position,1.0);}`);
      fs = shader(gl.FRAGMENT_SHADER, `${is2 ? '#version 300 es\n' : ''}precision highp float;uniform vec4 u_color;uniform float u_time;${is2 ? 'out vec4 fragmentColor;' : ''}void main(){float shimmer=0.94+0.06*sin(u_time*1.8+gl_FragCoord.x*0.04+gl_FragCoord.y*0.03);${is2 ? 'fragmentColor' : 'gl_FragColor'}=u_color*vec4(vec3(shimmer),1.0);}`);
      p = gl.createProgram(); if (!p) throw new Error('Water program allocation failed');
      gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Water program could not link');
      this.program = p; this.buffer = gl.createBuffer() ?? undefined;
      if (!this.buffer) throw new Error('Water mesh allocation failed');
      this.attribute = gl.getAttribLocation(p, 'a_position'); this.matrix = gl.getUniformLocation(p, 'u_matrix'); this.color = gl.getUniformLocation(p, 'u_color'); this.time = gl.getUniformLocation(p, 'u_time');
    } catch (error) { if (p) gl.deleteProgram(p); this.program = undefined; this.onFailure(error instanceof Error ? error.message : '3D water unavailable'); }
    finally { if (vs) gl.deleteShader(vs); if (fs) gl.deleteShader(fs); }
  }
  setVisible(visible: boolean) { this.visible = visible; this.map?.triggerRepaint(); }
  update(data: GeoJSON.FeatureCollection<GeoJSON.Polygon>, demonstrationM?: number) {
    const valid = data.features.filter(f => Number.isFinite(demonstrationM ?? f.properties?.surfaceM));
    if (!valid.length) { this.vertices = new Float32Array(); this.dirty = true; this.map?.triggerRepaint(); return false; }
    const first = valid[0].geometry.coordinates[0][0];
    this.origin = MercatorCoordinate.fromLngLat([first[0], first[1]], 0); this.units = this.origin.meterInMercatorCoordinateUnits();
    const vertices: number[] = [];
    for (const f of valid) {
      const ring = f.geometry.coordinates[0], height = demonstrationM ?? Number(f.properties?.surfaceM);
      for (const i of [0, 1, 2, 0, 2, 3]) {
        const p = MercatorCoordinate.fromLngLat([ring[i][0], ring[i][1]], height);
        vertices.push((p.x - this.origin.x) / this.units, (p.y - this.origin.y) / this.units, p.z / this.units);
      }
    }
    this.vertices = new Float32Array(vertices); this.dirty = true; this.map?.triggerRepaint(); return true;
  }
  render(gl: GL, args: CustomRenderMethodInput) {
    if (!this.visible || !this.program || !this.buffer || !this.vertices.length) return;
    const base = args.defaultProjectionData.mainMatrix, m = new Float32Array(16);
    for (let r = 0; r < 4; r++) {
      m[r] = base[r] * this.units; m[4 + r] = base[4 + r] * this.units; m[8 + r] = base[8 + r] * this.units;
      m[12 + r] = base[r] * this.origin.x + base[4 + r] * this.origin.y + base[12 + r];
    }
    gl.useProgram(this.program); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    if (this.dirty) { gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW); this.dirty = false; }
    gl.enableVertexAttribArray(this.attribute); gl.vertexAttribPointer(this.attribute, 3, gl.FLOAT, false, 0, 0);
    const animate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const secs = animate ? (performance.now() - this.t0) / 1000 : 0;
    gl.uniformMatrix4fv(this.matrix!, false, m); gl.uniform4f(this.color!, .08, .42, .63, .52); gl.uniform1f(this.time!, secs);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(false); gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    if (animate) this.map?.triggerRepaint();
  }
  onRemove(_map: LibreMap, gl: GL) { if (this.buffer) gl.deleteBuffer(this.buffer); if (this.program) gl.deleteProgram(this.program); this.map = undefined; }
}
