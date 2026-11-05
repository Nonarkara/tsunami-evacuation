/**
 * Bake the Bang Niang manga street model (public/model/bang-niang.bin.gz).
 *
 * Input is already-collected, already-published data — the bake fetches nothing:
 *   - public/data/buildings-khao-lak-2.json  (published building pack, validated)
 *   - public/data/roofs-khao-lak-2.json      (published roof readings, validated)
 *   - .cache/buildings-khao-lak-2.raw.json   (the OSM map snapshot the building
 *     pack was collected from; roads, waterways and land use come from here)
 *
 * Output format matches the owner's miaoshen "Grand model" binary so the manga
 * renderer ports one to one: u32 header length, JSON header, then little-endian
 * typed arrays (bLen, bH, bK, bXY, rC, rLen, rXY, wLen, wXY, pLen, pXY), each
 * block four-byte aligned. Heights are decimetres. Only explicit height tags
 * draw volume; unknown and floor-derived heights remain flat outlines. Roof
 * readings are source metadata only and do not supply roof altitude.
 *
 * Run: npx tsx scripts/bake-manga-model.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import {createHash} from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseBuildings } from '../src/buildings';
import { parseRoofShapes } from '../src/roofshapes';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const AREA = 'khao-lak-2';
const OUT = `${ROOT}public/model/bang-niang.bin.gz`;
const Q = 0.25; // metres per quantization unit; the bbox spans ~5.5 km, well inside Int16.

const pack = parseBuildings(JSON.parse(readFileSync(`${ROOT}public/data/buildings-${AREA}.json`, 'utf8')), AREA);
const roofs = parseRoofShapes(JSON.parse(readFileSync(`${ROOT}public/data/roofs-${AREA}.json`, 'utf8')), AREA, pack);
const receipt = JSON.parse(readFileSync(`${ROOT}.cache/buildings-${AREA}.raw.receipt.json`, 'utf8'));
const rawBytes=readFileSync(`${ROOT}.cache/buildings-${AREA}.raw.json`);
const raw=JSON.parse(rawBytes.toString('utf8'));
if(createHash('sha256').update(rawBytes).digest('hex')!==receipt.sha256||receipt.sha256!==pack.rawSha256)throw Error('OSM snapshot checksum mismatch');
if (!receipt.url?.startsWith('https://api.openstreetmap.org/') || !/^[a-f0-9]{64}$/.test(receipt.sha256 ?? '')) {
  throw new Error('OSM cache receipt is missing provenance');
}

const [L0, LAT0] = [98.26558885, 8.6710932]; // centre of the pack's geometry bounds
const MX = 111320 * Math.cos(LAT0 * Math.PI / 180), MY = 110574;
const project = (lng: number, lat: number): [number, number] => [(lng - L0) * MX, -(lat - LAT0) * MY];

// ---- buildings from the published pack -------------------------------------
// Height truth (owner rule, 4 November 2026): only explicit source heights
// draw volume. Unknown heights and floor-count estimates stay flat — they
// become ink ring outlines in the renderer, never a 3 m fallback.
const bLen: number[] = [], bH: number[] = [], bK: number[] = [], bXY: number[] = [];
let known = 0;
for (const feature of pack.features) {
  const ring = feature.geometry.coordinates[0].slice(0, -1);
  const p = feature.properties;
  const h = p.heightSource === 'heightTag' ? p.height as number : 0;
  bLen.push(ring.length);
  bH.push(Math.round(h * 10));
  if (p.heightSource === 'heightTag') known++;
  bK.push(p.heightSource === 'heightTag' ? 1 : 0);
  for (const [lng, lat] of ring) { const [x, z] = project(lng, lat); bXY.push(x, z); }
}

// ---- roads, waterways, water and parks from the OSM snapshot ---------------
const nodes = new Map<number, [number, number]>();
for (const e of raw.elements) if (e.type === 'node') nodes.set(e.id, [e.lon, e.lat]);

const ROAD_CLASS: Record<string, number> = {
  motorway: 3, motorway_link: 3, trunk: 3, trunk_link: 3,
  primary: 2, primary_link: 2,
  secondary: 1, secondary_link: 1, tertiary: 1, tertiary_link: 1,
  residential: 0, unclassified: 0, service: 0, living_street: 0, pedestrian: 0, road: 0, track: 0,
};
const WATER_CLASS: Record<string, number> = { river: 4, canal: 5, stream: 6, ditch: 6, drain: 6 };
const WATER_AREAS = new Set(['riverbank', 'dock']);
const LANDUSE_WATER = new Set(['basin', 'reservoir']);
const PARK_LEISURE = new Set(['park', 'garden', 'pitch', 'golf_course', 'miniature_golf']);
const PARK_NATURAL = new Set(['wood', 'scrub', 'beach']);
const PARK_LANDUSE = new Set(['forest', 'grass', 'recreation_ground', 'village_green', 'cemetery']);
const SKIP_ROAD = new Set(['footway', 'path', 'steps', 'cycleway', 'crossing', 'construction', 'proposed', 'bus_stop', 'traffic_signals', 'raceway', 'bus_guideway']);

const ringOf = (way: { nodes: number[] }): number[][] | null => {
  if(way.nodes.length<4||way.nodes[0]!==way.nodes.at(-1))return null;
  const ring: number[][] = [];
  for (const id of way.nodes) {
    const node = nodes.get(id);
    if (!node) return null; // incomplete geometry is skipped, never closed by invention
    ring.push(node);
  }
  if (ring.length > 1 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1]) ring.pop();
  return ring;
};

const rC: number[] = [], rLen: number[] = [], rXY: number[] = [];
const wLen: number[] = [], wXY: number[] = [];
const pLen: number[] = [], pXY: number[] = [];
const skipped = { private: 0, incomplete: 0, tiny: 0 };

for (const way of raw.elements) {
  if (way.type !== 'way' || !way.tags) continue;
  const t = way.tags;
  if (t.access === 'private' || t.access === 'no') { skipped.private++; continue; }
  if (t.highway && ROAD_CLASS[t.highway] !== undefined) {
    const ring = way.nodes.map(id => nodes.get(id)).filter(Boolean) as [number, number][];
    if (ring.length !== way.nodes.length) { skipped.incomplete++; continue; }
    if (t.service === 'parking_aisle') { skipped.tiny++; continue; }
    rC.push(ROAD_CLASS[t.highway]);
    rLen.push(ring.length);
    for (const [lng, lat] of ring) { const [x, z] = project(lng, lat); rXY.push(x, z); }
    continue;
  }
  if (t.waterway && WATER_CLASS[t.waterway] !== undefined) {
    const ring = way.nodes.map(id => nodes.get(id)).filter(Boolean) as [number, number][];
    if (ring.length !== way.nodes.length) { skipped.incomplete++; continue; }
    rC.push(WATER_CLASS[t.waterway]);
    rLen.push(ring.length);
    for (const [lng, lat] of ring) { const [x, z] = project(lng, lat); rXY.push(x, z); }
    continue;
  }
  const isWaterArea = (t.natural === 'water' && t.water !== 'river' && t.water !== 'canal' && t.water !== 'stream')
    || (t.waterway && WATER_AREAS.has(t.waterway)) || (t.landuse && LANDUSE_WATER.has(t.landuse))
    || t.leisure === 'swimming_pool';
  const isPark = (t.leisure && PARK_LEISURE.has(t.leisure)) || (t.natural && PARK_NATURAL.has(t.natural))
    || (t.landuse && PARK_LANDUSE.has(t.landuse));
  if (isWaterArea || isPark) {
    const ring = ringOf(way);
    if (!ring || ring.length < 3) { skipped.incomplete++; continue; }
    const target = isWaterArea ? [wLen, wXY] : [pLen, pXY];
    target[0].push(ring.length);
    for (const [lng, lat] of ring) { const [x, z] = project(lng, lat); target[1].push(x, z); }
  }
  // natural=coastline is deliberately not drawn: the sea stays paper and the
  // model note says so. A coastline polygon invented here would be fabricated GIS.
}

// ---- quantize to Int16 relative to the joint bbox ---------------------------
const all = [bXY, rXY, wXY, pXY];
let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
for (const list of all) for (let i = 0; i < list.length; i += 2) {
  x0 = Math.min(x0, list[i]); x1 = Math.max(x1, list[i]);
  z0 = Math.min(z0, list[i + 1]); z1 = Math.max(z1, list[i + 1]);
}
const quantize = (list: number[]): Int16Array => {
  const out = new Int16Array(list.length);
  for (let i = 0; i < list.length; i += 2) {
    out[i] = Math.round((list[i] - x0) / Q);
    out[i + 1] = Math.round((list[i + 1] - z0) / Q);
  }
  return out;
};
if ((x1 - x0) / Q > 32767 || (z1 - z0) / Q > 32767) throw new Error('Area too large for Int16 quantization at this scale');

// ---- serialize ---------------------------------------------------------------
const encoder = new TextEncoder();
const header = {
  q: Q, origin: [LAT0, L0], bbox: [x0, z0, x1, z1],
  nB: bLen.length, nBV: bXY.length / 2, nR: rLen.length, nRV: rXY.length / 2,
  nW: wLen.length, nWV: wXY.length / 2, nP: pLen.length, nPV: pXY.length / 2,
  area: AREA,
  generatedAt: new Date().toISOString(),
  sources: {
    buildings: { url: pack.sourceUrl, retrievedAt: pack.retrievedAt, sha256: pack.rawSha256 },
    roofs: { pack: `data/roofs-${AREA}.json`, imagery: 'See per-feature imagery/classifier receipts in the roof pack', judged: roofs.size },
    osm: { url: receipt.url, retrievedAt: receipt.retrievedAt, sha256: receipt.sha256 },
  },
  attribution: '© OpenStreetMap contributors (ODbL); roof readings from Esri World Imagery (© Esri and contributors); rendered with three.js (MIT)',
  notes: 'Flat ground; sea not drawn; height truth applies: only explicit source heights draw volume, unknown and floor-count estimates stay flat outlines; not for navigation.',
};
const headerBytes = encoder.encode(JSON.stringify(header));
const blocks: Uint8Array[] = [];
const push = (view: ArrayBufferView) => {
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  blocks.push(bytes);
  const pad = (4 - (bytes.byteLength % 4)) % 4;
  if (pad) blocks.push(new Uint8Array(pad));
};
const u16 = (a: number[]) => { const v = new Uint16Array(a.length); a.forEach((x, i) => v[i] = Math.min(65535, x)); return v; };
const i16 = (a: number[]) => { const v = new Int16Array(a.length); a.forEach((x, i) => v[i] = x); return v; };
push(new Uint8Array(new Uint32Array([headerBytes.length]).buffer));
blocks.push(headerBytes); if (headerBytes.length % 4) blocks.push(new Uint8Array(4 - (headerBytes.length % 4)));
push(u16(bLen)); push(u16(bH)); push(new Uint8Array(bK)); push(quantize(bXY));
push(new Uint8Array(rC)); push(u16(rLen)); push(quantize(rXY));
push(u16(wLen)); push(quantize(wXY));
push(u16(pLen)); push(quantize(pXY));

const total = blocks.reduce((n, b) => n + b.byteLength, 0);
const out = new Uint8Array(total);
let off = 0;
for (const b of blocks) { out.set(b, off); off += b.byteLength; }
mkdirSync(`${ROOT}public/model`, { recursive: true });
writeFileSync(OUT, gzipSync(out, { level: 9 }));

console.log(`baked ${OUT}`);
console.log(`buildings ${header.nB} (explicit source heights ${known}, flat outlines ${header.nB - known})`);
console.log(`roads+waterways ${header.nR}, water areas ${header.nW}, parks ${header.nP}`);
console.log(`roof readings validated: ${roofs.size} judged of ${roofs.size} records in pack`);
console.log(`skipped: private/access ${skipped.private}, incomplete ${skipped.incomplete}, parking aisles ${skipped.tiny}`);
console.log(`binary ${(total / 1024).toFixed(1)} KB raw`);
