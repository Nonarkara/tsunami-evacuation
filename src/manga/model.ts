/**
 * The Bang Niang manga street model: the town drawn as a manga background
 * (ink outlines, screentone), open to walk through or fly over.
 *
 * This is the owner's miaoshen "Grand model" engine (miaoshen.nonarkara.org
 * #model/) ported to this application and fed by the Bang Niang bake
 * (scripts/bake-manga-model.ts). Data is baked; nothing is fetched from
 * elsewhere at render time. The model is an illustrative reading of OSM data —
 * flat ground, flat outlines for unknown heights, sea not drawn — and
 * is never a survey or an evacuation surface.
 */
import * as THREE from 'three';
import earcut from 'earcut';
import {decodeManga,mangaCoordinates} from './data';

THREE.ColorManagement.enabled = false; // colours below are written straight to the screen
const TOD: Record<string, { paper: string; ink: string; sun: [number, number, number]; invert: number; sky: number }> = {
  day: { paper: '#f4ecda', ink: '#1d1b18', sun: [-0.55, 0.62, 0.55], invert: 0, sky: 0.5 },
  dusk: { paper: '#f0d9bd', ink: '#2b1814', sun: [0.82, 0.16, -0.35], invert: 0, sky: 0.85 },
  night: { paper: '#121a2b', ink: '#ece3cc', sun: [0.2, 0.7, -0.3], invert: 1, sky: 0.9 }
};
const ROAD_W = [6, 9, 12, 17, 28, 12, 4]; // by class: minor, secondary/tertiary, primary, motorway/trunk, river, canal, stream
const EYE = 1.65, CELL = 400, SMALL = 80;

const GLSL = `
uniform vec3 uPaper,uInk,uSun,uCam;uniform float uCell,uLine,uInvert,uFogNear,uFogFar;
float ht(vec2 fc,float t,float cell){vec2 p=mat2(.7071,.7071,-.7071,.7071)*fc/cell;vec2 g=fract(p)-.5;
 float r=sqrt(clamp(1.-t,0.,1.)*.3183);float aa=fwidth(p.x)*.7+.001;return 1.-smoothstep(r-aa,r+aa,length(g));}
float hatch(vec2 fc,float cell){float d=(fc.x-fc.y)/(cell*1.3);float f=abs(fract(d)-.5);return 1.-smoothstep(.1,.2,f);}
float hash21(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
`;
const BUILD_V = `varying vec3 vW;varying vec2 vUw;varying float vInfo;attribute vec2 uw;attribute float info;
void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vUw=uw;vInfo=info;gl_Position=projectionMatrix*viewMatrix*w;}`;
// vInfo is constant on every face (each wall or roof carries one value), so it is
// declared as a plain varying instead of `flat` — same result, portable GLSL.
const BUILD_F = GLSL + `varying vec3 vW;varying vec2 vUw;varying float vInfo;
void main(){
 float kind=mod(vInfo,2.),known=mod(floor(vInfo/2.),2.),h=floor(vInfo/4.)*.5;
 vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));if(dot(n,vW-uCam)>0.)n=-n;
 float lit=clamp(dot(n,uSun)*.5+.5,0.,1.);
 float t=kind>.5?mix(.8,.96,lit):mix(.1,.8,smoothstep(.2,.95,lit));
 float tt=mix(t,1.-t*.9,uInvert);
 vec2 fc=gl_FragCoord.xy;float cell=uCell*(known>.5?1.:1.35);
 float ink=ht(fc,tt,cell);
 if(kind<.5&&uInvert<.5&&t<.36)ink=max(ink,hatch(fc,uCell)*.9);
 float e=0.;
 if(kind<.5){float L=vUw.y,du=min(vUw.x,L-vUw.x);float fu=max(fwidth(vUw.x),1e-4),fv=max(fwidth(vW.y),1e-4);
  float px=min(min(du/fu,(h-vW.y)/fv),vW.y/fv);e=1.-smoothstep(uLine*.55,uLine*1.35,px);}
 vec3 col=mix(uPaper,uInk,clamp(max(ink,e),0.,1.));
 if(uInvert>.5&&kind<.5){vec2 c=vec2(floor(vUw.x/3.),floor(vW.y/3.3));float r=hash21(c);
  float win=step(.78,r)*step(.25,fract(vUw.x/3.))*step(fract(vUw.x/3.),.75)*step(.3,fract(vW.y/3.3))*step(fract(vW.y/3.3),.8);
  col=mix(col,vec3(1.,.82,.45),win*(1.-e)*.9);}
 float f=smoothstep(uFogNear,uFogFar,length(vW-uCam));gl_FragColor=vec4(mix(col,uPaper,f),1.);}`;
const FLAT_V = `varying vec3 vW;varying float vA;attribute float across;
void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vA=across;gl_Position=projectionMatrix*viewMatrix*w;}`;
const FLAT_F = GLSL + `varying vec3 vW;varying float vA;uniform int uMode;
void main(){
 vec2 fc=gl_FragCoord.xy;float ink=0.;
 if(uMode==0){float fa=max(fwidth(vA),1e-4);float px=min(vA,1.-vA)/fa;ink=1.-smoothstep(uLine*.5,uLine*1.2,px);ink=max(ink,ht(fc,.9,uCell*1.1)*.7);}
 else if(uMode==1){float y=fc.y/(uCell*.8)+sin(fc.x*.045)*.12;float f=abs(fract(y)-.5);ink=1.-smoothstep(.07,.17,f);ink*=.85;}
 else{vec2 c=floor(vW.xz/2.4);vec2 o=vec2(hash21(c),hash21(c+7.3))*.6+.2;float d=length(fract(vW.xz/2.4)-o);float w=fwidth(vW.x/2.4);
  float s=(1.-smoothstep(.1,.16+w,d))*step(.35,hash21(c+3.1))*(1.-smoothstep(.12,.3,w));ink=s;}
 vec3 col=mix(uPaper,uInk,clamp(ink,0.,1.));
 float f=smoothstep(uFogNear,uFogFar,length(vW-uCam));gl_FragColor=vec4(mix(col,uPaper,f),1.);}`;
const SKY_V = `varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.);gl_Position.z=gl_Position.w*.9999;}`;
const SKY_F = GLSL + `varying vec3 vD;uniform float uSky;
void main(){vec3 d=normalize(vD);float e=d.y;vec3 col=uPaper;
 if(e>0.){vec2 fc=gl_FragCoord.xy;float t=1.-uSky*smoothstep(.0,.85,e)*.62;float ink=ht(fc,t,uCell*1.5);
  if(uInvert>.5){vec2 c=floor(fc/(uCell*.9));float s=step(.985,hash21(c))*(1.-step(.35,fract(sin(dot(c,vec2(3.,5.)))*91.)))*.0;ink=ink*.35+step(.992,hash21(floor(fc/(uCell*.8))))*.9;}
  col=mix(uPaper,uInk,clamp(ink,0.,1.));}
 gl_FragColor=vec4(col,1.);}`;

export type MangaState = { mode: 'sky' | 'walk'; x: number; z: number; dist: number; yaw: number; pitch: number; px: number; pz: number; wyaw: number; wpitch: number; speed: number; tod: string };

export type MangaLabels = Record<string, string>;
export async function start(host: HTMLElement, opt: {
  labels: MangaLabels; state?: MangaState | null; signal?: AbortSignal;
  dpr?: number; url: string; hintHost?: HTMLElement; controlsHost?:HTMLElement;
}) {
  const O = Object.assign({ labels: {} as MangaLabels, state: null as MangaState | null, dpr: Math.min(devicePixelRatio || 1, 2) }, opt);
  const say = (k: string, fb: string) => O.labels[k] || fb;
  let disposed = false, scene: THREE.Scene | null = null, ro: ResizeObserver | null = null, io: IntersectionObserver | null = null, modal: MutationObserver | null = null, raf = 0;
  const abort = new AbortController();
  function dispose() {
    if (disposed) return;
    disposed = true;
    abort.abort(); cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect(); modal?.disconnect();
    const materials = new Set<THREE.Material>();
    scene?.traverse(o => { (o as THREE.Mesh).geometry?.dispose(); if ((o as THREE.Mesh).material) { for (const m of Array.isArray((o as THREE.Mesh).material) ? (o as THREE.Mesh).material as THREE.Material[] : [(o as THREE.Mesh).material as THREE.Material]) materials.add(m); } });
    materials.forEach(m => m.dispose());
    renderer?.dispose(); renderer?.forceContextLoss(); host.replaceChildren(); O.hintHost?.replaceChildren(); O.controlsHost?.replaceChildren(); O.signal?.removeEventListener('abort', dispose);
  }
  if (O.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  O.signal?.addEventListener('abort', dispose, { once: true });
  const canvas = document.createElement('canvas'); canvas.className = 'manga-canvas-canvas'; canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', say('canvas', 'Interactive manga street model'));
  let renderer: THREE.WebGLRenderer;
  try {
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: O.dpr < 2.01, powerPreference: 'high-performance' }); }
    catch { throw new Error('webgl'); }
    renderer.setPixelRatio(O.dpr);
    host.appendChild(canvas);
    const el = (tag: string, cls?: string, text?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const seg = (label: string, items: [string, string][], on: string) => {
      const d = el('div', 'manga-seg'); d.setAttribute('role', 'group'); d.setAttribute('aria-label', label);
      items.forEach(([k, t]) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = t;
        b.dataset.k = k; b.setAttribute('aria-pressed', String(k === on)); d.appendChild(b);
      });
      return d;
    };
    const ui: Record<string, any> = {};
    ui.mode = seg(say('mode', 'View'), [['sky', say('sky', 'Sky')], ['walk', say('walk', 'Walk')]], 'sky');
    ui.tod = seg(say('tod', 'Light'), [['day', say('day', 'Day')], ['dusk', say('dusk', 'Dusk')], ['night', say('night', 'Night')]], 'day');
    ui.speed = seg(say('speed', 'Pace'), [['0.8', '0.8 m/s'], ['1.4', '1.4 m/s'], ['2.4', '2.4 m/s']], '1.4');
    ui.speed.hidden = true;
    ui.hint = el('p', 'manga-hint'); ui.hint.id = 'manga-instructions';
    canvas.setAttribute('aria-describedby', ui.hint.id);
    ui.joy = el('div', 'manga-joy'); ui.joy.appendChild(el('span')); ui.joy.hidden = true; ui.joy.setAttribute('aria-hidden', 'true');
    const bar = el('div', 'manga-bar'); bar.append(ui.mode, ui.tod, ui.speed);
    const loading = el('p', 'manga-loading', say('loading', 'Building the model…'));
    ui.ready = () => loading.remove();
    (O.controlsHost??host).append(bar);host.append(ui.joy, loading);
    (O.hintHost ?? host).append(ui.hint);
    scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(55, 1, 0.6, 16000);
    const touch = matchMedia('(pointer:coarse)').matches;
    const U: Record<string, { value: unknown }> = {
      uPaper: { value: new THREE.Color() }, uInk: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3() }, uCam: { value: cam.position },
      uCell: { value: 4.6 * O.dpr }, uLine: { value: 1.15 * O.dpr }, uInvert: { value: 0 }, uFogNear: { value: 1800 }, uFogFar: { value: 5200 }, uSky: { value: .5 }
    };

    // ---- data
    const res = await fetch(O.url, { signal: abort.signal }); if (!res.ok) throw new Error('data');
    let buf = await res.arrayBuffer();
    if (new Uint8Array(buf, 0, 2).join() === '31,139') buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    if (disposed) throw new DOMException('Aborted', 'AbortError');
    const decoded=decodeManga(buf);
    const {H,bLen,bH,bK,rC,rLen,wLen,pLen}=decoded;
    const coordinates=(array:Int16Array)=>mangaCoordinates(array,H.q,H.bbox);
    const bXY=coordinates(decoded.bXY),rXY=coordinates(decoded.rXY),wXY=coordinates(decoded.wXY),pXY=coordinates(decoded.pXY);
    const [bx0, bz0, bx1, bz1] = H.bbox;
    const MX = 111320 * Math.cos(H.origin[0] * Math.PI / 180), MY = 110574;
    const project = (lat: number, lng: number): [number, number] => [(lng - H.origin[1]) * MX, -(lat - H.origin[0]) * MY];

    // ---- buildings, in 400 m chunks; small unmapped ones kept apart so they can drop from a distance.
    // Height truth: buildings without an explicit source height (bH === 0) draw as ink ring
    // outlines — a line-drawn plan — and never as an invented 3 m volume.
    const matB = bH.some(height=>height>0)?new THREE.ShaderMaterial({ uniforms: U as never, vertexShader: BUILD_V, fragmentShader: BUILD_F, side: THREE.DoubleSide }):null;
    const chunks = new Map<string, { big: number[]; small: number[] }>();
    const flatChunks = new Map<string, number[]>();
    let o = 0; const bS = new Int32Array(H.nB); const GR = 60; const grid = new Map<string, number[]>();
    for (let i = 0; i < H.nB; i++) {
      const n = bLen[i], s = o; bS[i] = s; o += n; let cx = 0, cz = 0, a = 0;
      for (let k = 0; k < n; k++) {
        const j = (s + k) * 2, j2 = (s + (k + 1) % n) * 2, x = bXY[j], z = bXY[j + 1], x2 = bXY[j2], z2 = bXY[j2 + 1];
        cx += x; cz += z; a += x * z2 - x2 * z;
      }
      cx /= n; cz /= n; a = Math.abs(a) / 2;
      const key = Math.floor((cx - bx0) / CELL) + ',' + Math.floor((cz - bz0) / CELL);
      if (bH[i] === 0) {
        const flat = flatChunks.get(key) || []; flatChunks.set(key, flat);
        for (let k = 0; k < n; k++) {
          const j = (s + k) * 2, j2 = (s + (k + 1) % n) * 2;
          flat.push(bXY[j], 0.025, bXY[j + 1], bXY[j2], 0.025, bXY[j2 + 1]);
        }
        continue;
      }
      const c = chunks.get(key) || { big: [], small: [] }; chunks.set(key, c);
      (a < SMALL && !bK[i] ? c.small : c.big).push(i, s, n);
    }
    function buildGeo(list: number[]) {
      let nv = 0, ni = 0; for (let q = 0; q < list.length; q += 3) { const n = list[q + 2]; nv += 4 * n + n; ni += 6 * n + 3 * (n - 2); }
      const pos = new Float32Array(nv * 3), uw = new Float32Array(nv * 2), info = new Float32Array(nv), idx = new Uint32Array(ni);
      let v = 0, t = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, hm = 0; const flat: number[] = [];
      for (let q = 0; q < list.length; q += 3) {
        const bi = list[q], s = list[q + 1], n = list[q + 2], h = bH[bi] / 10, knownB = bK[bi], wi = Math.floor(h * 2) * 4 + knownB * 2; hm = Math.max(hm, h);
        flat.length = 0;
        for (let k = 0; k < n; k++) {
          const a = (s + k) * 2, b = (s + (k + 1) % n) * 2, xa = bXY[a], za = bXY[a + 1], xb = bXY[b], zb = bXY[b + 1], L = Math.hypot(xb - xa, zb - za);
          x0 = Math.min(x0, xa); x1 = Math.max(x1, xa); z0 = Math.min(z0, za); z1 = Math.max(z1, za); flat.push(xa, za);
          const p = v * 3; pos.set([xa, 0, za, xb, 0, zb, xb, h, zb, xa, h, za], p); uw.set([0, L, L, L, L, L, 0, L], v * 2); info[v] = info[v + 1] = info[v + 2] = info[v + 3] = wi;
          idx[t++] = v; idx[t++] = v + 1; idx[t++] = v + 2; idx[t++] = v; idx[t++] = v + 2; idx[t++] = v + 3; v += 4;
        }
        const tri = earcut(flat), base = v;
        for (let k = 0; k < n; k++) { pos.set([flat[k * 2], h, flat[k * 2 + 1]], v * 3); info[v] = wi + 1; v++; }
        for (let k = 0; k < tri.length; k++) idx[t++] = base + tri[k];
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, v * 3), 3));
      g.setAttribute('uw', new THREE.BufferAttribute(uw.subarray(0, v * 2), 2));
      g.setAttribute('info', new THREE.BufferAttribute(info.subarray(0, v), 1));
      g.setIndex(new THREE.BufferAttribute(idx.subarray(0, t), 1));
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, hm / 2, cz), Math.hypot(x1 - x0, z1 - z0, hm) / 2 + 2);
      return g;
    }
    const meshes: { m: THREE.Mesh | THREE.LineSegments; small: boolean }[] = [];
    for (const c of chunks.values()) {
      if (c.big.length) { const m = new THREE.Mesh(buildGeo(c.big), matB!); scene.add(m); meshes.push({ m, small: false }); }
      if (c.small.length) { const m = new THREE.Mesh(buildGeo(c.small), matB!); scene.add(m); meshes.push({ m, small: true }); }
    }
    // Flat buildings: one ink LineSegments per chunk, following the time-of-day ink.
    const lineMat = new THREE.LineBasicMaterial({ color: TOD.day.ink });
    for (const flat of flatChunks.values()) {
      if (!flat.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
      g.computeBoundingSphere();
      const m = new THREE.LineSegments(g, lineMat); scene.add(m); meshes.push({ m, small: false });
    }

    // ---- you cannot walk through buildings: a 60 m grid of footprints, tested point by point
    for (let i = 0; i < H.nB; i++) {
      if (bH[i] < 30) continue;
      const n = bLen[i], s = bS[i]; let X0 = 1e9, X1 = -1e9, Z0 = 1e9, Z1 = -1e9;
      for (let k = 0; k < n; k++) { const x = bXY[(s + k) * 2], z = bXY[(s + k) * 2 + 1]; X0 = Math.min(X0, x); X1 = Math.max(X1, x); Z0 = Math.min(Z0, z); Z1 = Math.max(Z1, z); }
      for (let gx = Math.floor(X0 / GR); gx <= Math.floor(X1 / GR); gx++) for (let gz = Math.floor(Z0 / GR); gz <= Math.floor(Z1 / GR); gz++) {
        const key = gx + ',' + gz; (grid.get(key) || grid.set(key, []).get(key)!).push(i);
      }
    }
    function blocked(x: number, z: number): boolean {
      const c = grid.get(Math.floor(x / GR) + ',' + Math.floor(z / GR)); if (!c) return false;
      for (const i of c) {
        const n = bLen[i], s = bS[i]; let inside = false;
        for (let a = 0, b = n - 1; a < n; b = a++) {
          const xa = bXY[(s + a) * 2], za = bXY[(s + a) * 2 + 1], xb = bXY[(s + b) * 2], zb = bXY[(s + b) * 2 + 1];
          if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) inside = !inside;
        }
        if (inside) return true;
      }
      return false;
    }
    function freeSpot(x: number, z: number): [number, number] {
      if (!blocked(x, z)) return [x, z];
      for (let r = 5; r <= 120; r += 5) for (let a = 0; a < 18; a++) { const xx = x + Math.cos(a / 18 * 6.2832) * r, zz = z + Math.sin(a / 18 * 6.2832) * r; if (!blocked(xx, zz)) return [xx, zz]; }
      return [x, z];
    }
    // ---- roads and rivers as ribbons, water and parks as filled polygons, all flat on the ground
    function ribbons(filter: (c: number) => boolean, y: number) {
      const P: number[] = [], A: number[] = [], I: number[] = []; let o2 = 0, v = 0;
      for (let i = 0; i < H.nR; i++) {
        const n = rLen[i], s = o2; o2 += n; if (!filter(rC[i])) continue;
        const w = ROAD_W[rC[i]] / 2, pts: number[][] = [];
        for (let k = 0; k < n; k++) { const j = (s + k) * 2, x = rXY[j], z = rXY[j + 1]; if (!pts.length || Math.hypot(x - pts[pts.length - 1][0], z - pts[pts.length - 1][1]) > 0.5) pts.push([x, z]); }
        if (pts.length < 2) continue;
        for (let k = 0; k < pts.length; k++) {
          const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
          P.push(pts[k][0] - dz * w, y, pts[k][1] + dx * w, pts[k][0] + dz * w, y, pts[k][1] - dx * w); A.push(0, 1);
          if (k) { const b0 = v + (k - 1) * 2; I.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2); }
        }
        v += pts.length * 2;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('across', new THREE.Float32BufferAttribute(A, 1)); g.setIndex(I); return g;
    }
    function polys(lens: Uint16Array, xy: ArrayLike<number>, count: number, y: number) {
      const P: number[] = [], I: number[] = []; let o2 = 0, v = 0;
      for (let i = 0; i < count; i++) {
        const n = lens[i], s = o2; o2 += n; if (n < 3) continue; const flat: number[] = [];
        for (let k = 0; k < n; k++) { const j = (s + k) * 2; flat.push(xy[j], xy[j + 1]); P.push(xy[j], y, xy[j + 1]); }
        const tri = earcut(flat); for (const t of tri) I.push(v + t); v += n;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('across', new THREE.Float32BufferAttribute(new Float32Array(P.length / 3), 1)); g.setIndex(I); return g;
    }
    const flatMat = (mode: number) => new THREE.ShaderMaterial({ uniforms: Object.assign({ uMode: { value: mode } }, U) as never, vertexShader: FLAT_V, fragmentShader: FLAT_F, side: THREE.DoubleSide });
    const water = new THREE.Mesh(polys(wLen, wXY, H.nW, 0.02), flatMat(1)), parks = new THREE.Mesh(polys(pLen, pXY, H.nP, 0.01), flatMat(2));
    const creeks = new THREE.Mesh(ribbons(c => c >= 4, 0.03), flatMat(1)), roads = new THREE.Mesh(ribbons(c => c < 4, 0.06), flatMat(0));
    [parks, water, creeks, roads].forEach(m => { m.frustumCulled = false; scene!.add(m); });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 24, 12), new THREE.ShaderMaterial({ uniforms: Object.assign({ uSky: U.uSky }, U) as never, vertexShader: SKY_V, fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);

    // ---- time of day
    let tod = 'day';
    function setTod(k: string) {
      tod = k; const t = TOD[k];
      (U.uPaper.value as THREE.Color).set(t.paper); (U.uInk.value as THREE.Color).set(t.ink);
      lineMat.color.set(t.ink);
      (U.uSun.value as THREE.Vector3).set(...t.sun).normalize();
      U.uInvert.value = t.invert; U.uSky.value = t.sky; renderer.setClearColor(t.paper); invalidate();
      host.dataset.tod = k; (ui.tod as HTMLElement).querySelectorAll<HTMLButtonElement>('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
    }

    // ---- camera state. The sky starts over the mapped walk start, facing the town.
    const ws = project(8.666894, 98.2529673);
    const defaults: MangaState = { mode: 'sky', x: ws[0] + 220, z: ws[1] + 140, dist: 1500, yaw: -0.7, pitch: 0.55, px: 0, pz: 0, wyaw: 0, wpitch: 0, speed: 1.4, tod: 'day' };
    const S: MangaState = Object.assign(defaults, O.state ?? {});
    let dirty = true; const keys = new Set<string>(); let joy = { x: 0, y: 0 };
    const resetInput = () => { keys.clear(); joy = { x: 0, y: 0 }; (ui.joy.firstElementChild as HTMLElement).style.transform = ''; };
    addEventListener('blur', resetInput, { signal: abort.signal });
    document.addEventListener('visibilitychange', () => {resetInput();if(document.hidden){cancelAnimationFrame(raf);raf=0;}else invalidate();}, { signal: abort.signal });
    modal=new MutationObserver(()=>{if(document.querySelector('dialog[open]')){resetInput();cancelAnimationFrame(raf);raf=0;}else invalidate();});
    modal.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
    const clampXZ = (x: number, z: number): [number, number] => [Math.max(bx0, Math.min(bx1, x)), Math.max(bz0, Math.min(bz1, z))];
    function place() {
      if (S.mode === 'sky') {
        const cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
        cam.position.set(S.x + Math.sin(S.yaw) * cp * S.dist, Math.max(3, sp * S.dist), S.z + Math.cos(S.yaw) * cp * S.dist);
        cam.lookAt(S.x, 0, S.z);
        U.uFogNear.value = 1800; U.uFogFar.value = 5200;
      } else {
        cam.position.set(S.px, EYE, S.pz); cam.rotation.order = 'YXZ'; cam.rotation.set(S.wpitch, S.wyaw, 0);
        U.uFogNear.value = 700; U.uFogFar.value = (touch ? 2600 : 4200);
      }
    }
    function resize() {
      const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); invalidate();
    }
    function setMode(m: 'sky' | 'walk', at?: [number, number]) {
      if (m === 'walk' && (S.mode === 'sky' || at)) { const p = at || [S.x, S.z], c = clampXZ(...freeSpot(p[0] as number, p[1] as number)); S.px = c[0]; S.pz = c[1]; S.wyaw = S.yaw + Math.PI; S.wpitch = -0.02; cam.fov = 70; }
      if (m === 'sky' && S.mode === 'walk') { S.x = S.px; S.z = S.pz; S.yaw = S.wyaw + Math.PI; S.dist = Math.max(S.dist < 900 ? 900 : S.dist, 900); S.pitch = 0.55; cam.fov = 55; }
      S.mode = m; cam.fov = m === 'walk' ? 70 : 55; cam.updateProjectionMatrix(); host.dataset.mode = m;
      (ui.mode as HTMLElement).querySelectorAll<HTMLButtonElement>('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === m)));
      ui.hint.textContent = m === 'walk' ? (touch ? say('hintWalkT', 'Drag to look. Hold the circle to walk.') : say('hintWalk', 'W A S D to walk · drag to look · Shift to hurry')) : (touch ? say('hintSkyT', 'Drag to turn · pinch to zoom · double-tap to stand there') : say('hintSky', 'Drag to turn · right-drag to move · scroll to zoom · double-click to stand there'));
      (ui.speed as HTMLElement).querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.k)===S.speed)));
      ui.joy.hidden = !(touch && m === 'walk'); ui.speed.hidden = m !== 'walk'; invalidate();
    }
    function cull() {
      const cx = S.mode === 'walk' ? S.px : cam.position.x, cz = S.mode === 'walk' ? S.pz : cam.position.z;
      const far = S.mode === 'walk' ? (touch ? 2800 : 4600) : 1e9, farSmall = S.mode === 'walk' ? 1100 : (cam.position.y < 700 ? 1100 : 0);
      for (const e of meshes) { const b = e.m.geometry.boundingSphere!, d = Math.hypot(b.center.x - cx, b.center.z - cz) - b.radius; e.m.visible = e.small ? d < farSmall : d < far; }
    }

    // ---- input
    const ptr = new Map<number, { x: number; y: number; b: number }>(); let dragMoved = 0, lastTap = 0;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function ground(cx: number, cy: number): [number, number] | null {
      const r = canvas.getBoundingClientRect();
      ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam); const d = ray.ray.direction, o2 = ray.ray.origin;
      if (d.y >= -1e-3) return null; const t = -o2.y / d.y; return [o2.x + d.x * t, o2.z + d.z * t];
    }
    canvas.addEventListener('pointerdown', (e: PointerEvent) => { canvas.focus({ preventScroll: true }); canvas.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button }); dragMoved = 0; });
    canvas.addEventListener('pointermove', e => {
      const p = ptr.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (ptr.size === 2 && S.mode === 'sky') {
        const [a, b] = [...ptr.values()]; const before = Math.hypot(a.x - b.x, a.y - b.y); p.x = e.clientX; p.y = e.clientY; const after = Math.hypot(a.x - b.x, a.y - b.y);
        S.dist = Math.max(60, Math.min(7500, S.dist * (before / Math.max(after, 1)))); panBy(dx / 2, dy / 2); invalidate(); dragMoved += 9; return;
      }
      p.x = e.clientX; p.y = e.clientY; dragMoved += Math.abs(dx) + Math.abs(dy);
      if (S.mode === 'sky') { if (p.b === 2 || e.shiftKey || e.buttons === 2) panBy(dx, dy); else { S.yaw -= dx * 0.006; S.pitch = Math.max(0.12, Math.min(1.5, S.pitch + dy * 0.005)); } }
      else { S.wyaw -= dx * 0.005; S.wpitch = Math.max(-1.2, Math.min(1.2, S.wpitch - dy * 0.004)); }
      invalidate();
    });
    const up = (e: PointerEvent) => {
      const p = ptr.get(e.pointerId); ptr.delete(e.pointerId);
      if (p && dragMoved < 6 && e.type === 'pointerup') { const now = performance.now(); if (now - lastTap < 380 && S.mode === 'sky') { const g = ground(e.clientX, e.clientY); if (g) { setMode('walk', g); place(); } } lastTap = now; }
    };
    canvas.addEventListener('pointerup', (e: PointerEvent) => up(e)); canvas.addEventListener('pointercancel', (e: PointerEvent) => up(e));
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    function panBy(dx: number, dy: number) {
      const k = S.dist * 0.0016, sy = Math.sin(S.yaw), cy = Math.cos(S.yaw);
      S.x += (-dx * cy + dy * sy) * k * -1; S.z += (dx * sy + dy * cy) * k * -1;
      [S.x, S.z] = clampXZ(S.x, S.z);
    }
    canvas.addEventListener('wheel', (e: WheelEvent) => { e.preventDefault(); if (S.mode === 'sky') { S.dist = Math.max(60, Math.min(7500, S.dist * Math.exp(e.deltaY * 0.0012))); } invalidate(); }, { passive: false });
    const kd = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toLowerCase();
      if (k === '+' || k === '=' || k === '-') { if (S.mode === 'sky') { S.dist = Math.max(60, Math.min(7500, S.dist * (k === '-' ? 1.2 : 1 / 1.2))); invalidate(); } e.preventDefault(); return; }
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) { keys.add(k); invalidate();e.preventDefault(); }
    };
    const ku = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    canvas.addEventListener('keydown', kd); canvas.addEventListener('keyup', ku); canvas.addEventListener('blur', () => keys.clear());
    // virtual stick: hold and slide to walk
    (() => {
      const j = ui.joy as HTMLElement, k = j.firstElementChild as HTMLElement; let id: number | null = null, cx = 0, cy = 0;
      j.addEventListener('pointerdown', (e: PointerEvent) => { id = e.pointerId; j.setPointerCapture(id); const r = j.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; mv(e); e.stopPropagation(); });
      const mv = (e: PointerEvent) => {
        if (e.pointerId !== id) return; let dx = (e.clientX - cx) / 44, dy = (e.clientY - cy) / 44; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
        joy = { x: dx, y: dy };invalidate(); k.style.transform = `translate(${dx * 34}px,${dy * 34}px)`;
      };
      j.addEventListener('pointermove', mv);
      const end = (e: PointerEvent) => { if (e.pointerId !== id) return; id = null; joy = { x: 0, y: 0 }; k.style.transform = ''; };
      j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end);
    })();

    // ---- controls
    (ui.mode as HTMLElement).addEventListener('click', e => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return; if (b.dataset.k !== S.mode) { setMode(b.dataset.k as 'sky' | 'walk'); place(); } });
    (ui.tod as HTMLElement).addEventListener('click', e => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (b) setTod(b.dataset.k!); });
    (ui.speed as HTMLElement).addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest('button') as HTMLElement | null;
      if (b) { S.speed = Number(b.dataset.k); (ui.speed as HTMLElement).querySelectorAll<HTMLButtonElement>('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }
    });
    ro = new ResizeObserver(resize); ro.observe(host);

    // ---- loop: renders only when something changed, so idle never burns frames
    let prev = performance.now(), visible = true;
    io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) invalidate(); }); io.observe(host);
    function invalidate(){dirty=true;if(!raf&&!disposed&&!document.hidden&&!document.querySelector('dialog[open]'))raf=requestAnimationFrame(frame);}
    function frame(now: number) {
      raf=0;
      const dt = Math.min(0.1, (now - prev) / 1000); prev = now;
      if (!visible || disposed || document.hidden || document.querySelector('dialog[open]')) {resetInput();return;}
      if (S.mode === 'walk') {
        const f = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - joy.y;
        const s = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + joy.x;
        const turn = (keys.has('q') ? 1 : 0) - (keys.has('e') ? 1 : 0); if (turn) { S.wyaw += turn * dt * 1.6; dirty=true; }
        if (f || s) {
          const sp = S.speed * (keys.has('shift') ? 3.2 : 1), sy = Math.sin(S.wyaw), cy = Math.cos(S.wyaw);
          const dx = (-sy * f + cy * s) * sp * dt, dz = (-cy * f - sy * s) * sp * dt;
          const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .5));
          for (let i = 0; i < steps; i++) {
            const nx = S.px + dx / steps, nz = S.pz + dz / steps;
            if (!blocked(nx, nz)) { S.px = nx; S.pz = nz; } else if (!blocked(nx, S.pz)) S.px = nx; else if (!blocked(S.px, nz)) S.pz = nz;
          }
          [S.px, S.pz] = clampXZ(S.px, S.pz); dirty=true;
        }
      } else {
        const f = (keys.has('arrowup') ? 1 : 0) - (keys.has('arrowdown') ? 1 : 0), s = (keys.has('arrowright') ? 1 : 0) - (keys.has('arrowleft') ? 1 : 0);
        if (f || s) { const k = S.dist * 0.6 * dt, sy = Math.sin(S.yaw), cy = Math.cos(S.yaw); S.x += (-sy * f + cy * s) * k * -1; S.z += (-cy * f - sy * s) * k * -1; [S.x, S.z] = clampXZ(S.x, S.z); dirty=true; }
      }
      if(keys.size||joy.x||joy.y)raf=requestAnimationFrame(frame);
      if (!dirty) return; dirty = false;
      place(); sky.position.copy(cam.position); cull(); renderer.render(scene!, cam);host.dataset.camera=JSON.stringify({x:cam.position.x,y:cam.position.y,z:cam.position.z,speed:S.speed});
    }

    // ---- chrome
    setTod(O.state?.tod || 'day'); setMode(S.mode); resize(); place(); cull(); renderer.render(scene, cam);
    invalidate();
    ui.ready();
    return {
      state: (): MangaState => ({ ...S, tod }),
      stats: (): { buildings: number; chunks: number; roads: number; water: number; parks: number } => ({ buildings: H.nB, chunks: meshes.length, roads: H.nR, water: H.nW, parks: H.nP }),
      dispose
    };
  } catch (e) { dispose(); throw e; }
}
