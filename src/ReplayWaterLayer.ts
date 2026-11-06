import { MercatorCoordinate, type CustomLayerInterface, type CustomRenderMethodInput, type Map as LibreMap } from 'maplibre-gl';
import { WATER_DEEP, WATER_SHALLOW } from './water-depth';

type GL = WebGLRenderingContext | WebGL2RenderingContext;
/** An actual horizontal/cell-average water surface. No procedural wave forecast or made-up dynamics.
 * The subtle surface shimmer is purely illustrative texture, not wave motion.
 * The colour carries the depth the model gives for the cell: pale where the water is
 * shallow, dark where it is deep, on a scale relative to the frame in view. */
export class ReplayWaterLayer implements CustomLayerInterface {
  id = 'replay-water-surface';
  type = 'custom' as const;
  renderingMode = '3d' as const;
  private map?: LibreMap;
  private program?: WebGLProgram;
  private buffer?: WebGLBuffer;
  private depthBuffer?: WebGLBuffer;
  private origin = MercatorCoordinate.fromLngLat([0, 0], 0);
  private units = 1;
  private vertices = new Float32Array();
  private depths = new Float32Array();
  private depthMax = 0;
  private demonstration = true;
  private dirty = false;
  private depthDirty = false;
  private visible = true;
  private attribute = -1;
  private depthAttribute = -1;
  private matrix?: WebGLUniformLocation | null;
  private shallow?: WebGLUniformLocation | null;
  private deep?: WebGLUniformLocation | null;
  private depthMaxUniform?: WebGLUniformLocation | null;
  private time?: WebGLUniformLocation | null;
  private t0 = performance.now();
  private animationElapsed = 0;
  private animating = false;
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
      vs = shader(gl.VERTEX_SHADER, `${is2 ? '#version 300 es\nin' : 'attribute'} vec3 a_position;\n${is2 ? 'in' : 'attribute'} float a_depth;\n${is2 ? 'out' : 'varying'} float v_depth;\nuniform mat4 u_matrix;void main(){v_depth=a_depth;gl_Position=u_matrix*vec4(a_position,1.0);}`);
      fs = shader(gl.FRAGMENT_SHADER, `${is2 ? '#version 300 es\n' : ''}precision highp float;uniform vec4 u_shallow;uniform vec4 u_deep;uniform float u_depth_max;uniform float u_time;${is2 ? 'out vec4 fragmentColor;' : ''}void main(){float t=u_depth_max>0.0?clamp(v_depth/u_depth_max,0.0,1.0):0.0;float shimmer=0.94+0.06*sin(u_time*1.8+gl_FragCoord.x*0.04+gl_FragCoord.y*0.03);vec4 c=mix(u_shallow,u_deep,t);${is2 ? 'fragmentColor' : 'gl_FragColor'}=vec4(c.rgb*shimmer,c.a);}`);
      p = gl.createProgram(); if (!p) throw new Error('Water program allocation failed');
      gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Water program could not link');
      this.program = p; this.buffer = gl.createBuffer() ?? undefined;
      this.depthBuffer = gl.createBuffer() ?? undefined;
      if (!this.buffer || !this.depthBuffer) throw new Error('Water mesh allocation failed');
      this.attribute = gl.getAttribLocation(p, 'a_position');
      this.depthAttribute = gl.getAttribLocation(p, 'a_depth');
      this.matrix = gl.getUniformLocation(p, 'u_matrix');
      this.shallow = gl.getUniformLocation(p, 'u_shallow');
      this.deep = gl.getUniformLocation(p, 'u_deep');
      this.depthMaxUniform = gl.getUniformLocation(p, 'u_depth_max');
      this.time = gl.getUniformLocation(p, 'u_time');
    } catch (error) { if (p) gl.deleteProgram(p); this.program = undefined; this.onFailure(error instanceof Error ? error.message : '3D water unavailable'); }
    finally { if (vs) gl.deleteShader(vs); if (fs) gl.deleteShader(fs); }
  }
  setVisible(visible: boolean) { this.visible = visible; this.map?.triggerRepaint(); }
  /** Decorative texture moves only while an explicitly started, visible exercise runs. */
  setAnimating(animating:boolean) {
    if(this.animating===animating)return;
    const now=performance.now();
    if(this.animating)this.animationElapsed+=(now-this.t0)/1000;
    this.t0=now;this.animating=animating;this.map?.triggerRepaint();
  }
  update(data: GeoJSON.FeatureCollection<GeoJSON.Polygon>, demonstrationM?: number) {
    const valid = data.features.filter(f => Number.isFinite(demonstrationM ?? f.properties?.surfaceM));
    if (!valid.length) { this.vertices = new Float32Array(); this.depths = new Float32Array(); this.dirty = true; this.depthDirty = true; this.map?.triggerRepaint(); return false; }
    const first = valid[0].geometry.coordinates[0][0];
    this.origin = MercatorCoordinate.fromLngLat([first[0], first[1]], 0); this.units = this.origin.meterInMercatorCoordinateUnits();
    const vertices: number[] = [], depths: number[] = [];
    let max = 0;
    for (const f of valid) {
      const ring = f.geometry.coordinates[0], height = demonstrationM ?? Number(f.properties?.surfaceM);
      const depth = demonstrationM === undefined ? Number(f.properties?.depthM) : 0;
      if (Number.isFinite(depth) && depth > max) max = depth;
      for (const i of [0, 1, 2, 0, 2, 3]) {
        const p = MercatorCoordinate.fromLngLat([ring[i][0], ring[i][1]], height);
        vertices.push((p.x - this.origin.x) / this.units, (p.y - this.origin.y) / this.units, p.z / this.units);
        depths.push(Number.isFinite(depth) ? depth : 0);
      }
    }
    this.vertices = new Float32Array(vertices); this.depths = new Float32Array(depths); this.depthMax = max;
    this.demonstration = demonstrationM === undefined;
    this.dirty = true; this.depthDirty = true; this.map?.triggerRepaint(); return true;
  }
  render(gl: GL, args: CustomRenderMethodInput) {
    if (!this.visible || !this.program || !this.buffer || !this.depthBuffer || !this.vertices.length) return;
    const base = args.defaultProjectionData.mainMatrix, m = new Float32Array(16);
    for (let r = 0; r < 4; r++) {
      m[r] = base[r] * this.units; m[4 + r] = base[4 + r] * this.units; m[8 + r] = base[8 + r] * this.units;
      m[12 + r] = base[r] * this.origin.x + base[4 + r] * this.origin.y + base[12 + r];
    }
    gl.useProgram(this.program); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    if (this.dirty) { gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW); this.dirty = false; }
    gl.enableVertexAttribArray(this.attribute); gl.vertexAttribPointer(this.attribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.depthBuffer);
    if (this.depthDirty) { gl.bufferData(gl.ARRAY_BUFFER, this.depths, gl.DYNAMIC_DRAW); this.depthDirty = false; }
    gl.enableVertexAttribArray(this.depthAttribute); gl.vertexAttribPointer(this.depthAttribute, 1, gl.FLOAT, false, 0, 0);
    const animate = this.animating && !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const secs = this.animationElapsed + (animate ? (performance.now() - this.t0) / 1000 : 0);
    gl.uniformMatrix4fv(this.matrix!, false, m);
    const shallow = this.demonstration
      ? ([0.08, 0.42, 0.63, 0.52] as [number, number, number, number])
      : ([WATER_SHALLOW.rgb[0], WATER_SHALLOW.rgb[1], WATER_SHALLOW.rgb[2], WATER_SHALLOW.alpha] as [number, number, number, number]);
    gl.uniform4f(this.shallow!, shallow[0], shallow[1], shallow[2], shallow[3]);
    gl.uniform4f(this.deep!, WATER_DEEP.rgb[0], WATER_DEEP.rgb[1], WATER_DEEP.rgb[2], WATER_DEEP.alpha);
    gl.uniform1f(this.depthMaxUniform!, this.depthMax);
    gl.uniform1f(this.time!, secs);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(false); gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    if (animate) this.map?.triggerRepaint();
  }
  onRemove(_map: LibreMap, gl: GL) { if (this.buffer) gl.deleteBuffer(this.buffer); if (this.depthBuffer) gl.deleteBuffer(this.depthBuffer); if (this.program) gl.deleteProgram(this.program); this.map = undefined; }
}
