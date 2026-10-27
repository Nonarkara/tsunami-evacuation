import { distance, type Coord, type ExerciseRoute, type Person, type TerrainGrid, elevation } from './crowd';

export type AreaPack = { id: string; label: string; placeIndex?: number; routesUrl?: string; terrainUrl?: string; hazardUrl?: string; bounds: [number, number, number, number]; source: string; destinations: 'unapproved'; };
/** Common entry point for each area. Additional areas need sourced local packs, not copied Khao Lak guidance. */
export const areaPacks: Readonly<Record<string, AreaPack>> = {
  'khao-lak': { id: 'khao-lak', label: 'Bang Niang exercise', placeIndex: 2, routesUrl: '/data/rehearsal-routes.json', terrainUrl: '/data/terrain.json', bounds: [98.22, 8.62, 98.31, 8.8], source: 'OSM snapshot + Mapzen Terrain Tiles', destinations: 'unapproved' },
};
export function bearing(a: Coord, b: Coord) {
  const rad = Math.PI / 180, dl = (b[0] - a[0]) * rad;
  return (Math.atan2(Math.sin(dl) * Math.cos(b[1] * rad), Math.cos(a[1] * rad) * Math.sin(b[1] * rad) - Math.sin(a[1] * rad) * Math.cos(b[1] * rad) * Math.cos(dl)) / rad + 360) % 360;
}
export function routeChainage(route: ExerciseRoute) {
  let sum = 0;
  return route.coordinates.map((p, i) => { if (i) sum += distance(route.coordinates[i - 1], p); return sum; });
}
export function alongRoute(route: ExerciseRoute, metres: number) {
  const chain = routeChainage(route), total = chain.at(-1) ?? 0;
  const target = Math.max(0, Math.min(total, metres));
  let i = 0; while (i < chain.length - 2 && chain[i + 1] < target) i++;
  const a = route.coordinates[i], b = route.coordinates[i + 1] ?? a;
  const t = (target - chain[i]) / Math.max(1e-9, (chain[i + 1] ?? chain[i]) - chain[i]);
  return { coord: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as Coord, heading: bearing(a, b), index: i, metres: target, total };
}
export function walkerProgress(person: Person, route: ExerciseRoute, seconds: number) {
  const chain = routeChainage(route);
  if (seconds >= person.finish) return { ...alongRoute(route, chain.at(-1) ?? 0), state: 'arrived' as const };
  const i = Math.max(0, person.legs.findIndex(l => seconds < l.exit));
  const leg = person.legs[i];
  const fraction = Math.max(0, Math.min(1, (seconds - leg.enter) / (leg.exit - leg.enter)));
  const metres = chain[i] + (chain[i + 1] - chain[i]) * fraction;
  return { ...alongRoute(route, metres), state: seconds < leg.arrival ? 'preparing' as const : seconds < leg.enter ? 'queued' as const : 'moving' as const };
}
export function nextTurn(route: ExerciseRoute, metres: number) {
  const chain = routeChainage(route);
  for (let i = 1; i < chain.length - 1; i++) {
    if (chain[i] < metres + 8) continue;
    const before = alongRoute(route, Math.max(0, chain[i] - 12));
    const after = alongRoute(route, Math.min(chain.at(-1)!, chain[i] + 12));
    const turn = ((bearing(route.coordinates[i], after.coord) - bearing(before.coord, route.coordinates[i]) + 540) % 360) - 180;
    if (Math.abs(turn) >= 35) return { distanceM: Math.round(chain[i] - metres), direction: turn > 0 ? 'right' : 'left', angle: turn };
  }
  return null;
}
export function routeArrows(route: ExerciseRoute, spacingM = 120): GeoJSON.FeatureCollection<GeoJSON.Point> {
  if (!Number.isFinite(spacingM) || spacingM < 10) throw new Error('Arrow spacing must be at least 10m');
  const total = routeChainage(route).at(-1) ?? 0;
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (let m = Math.min(40, total / 2); m < total; m += spacingM) {
    const p = alongRoute(route, m);
    features.push({ type: 'Feature', properties: { heading: p.heading }, geometry: { type: 'Point', coordinates: p.coord } });
  }
  return { type: 'FeatureCollection', features };
}
/** User-chosen rise timing is an illustration, never a wave arrival/height prediction. */
export function demonstrationLevel(seconds: number, peakM: number, riseSeconds: number) {
  if (![seconds, peakM, riseSeconds].every(Number.isFinite) || peakM < 0 || peakM > 20 || riseSeconds <= 0) throw new Error('Invalid water demonstration inputs');
  const t = Math.max(0, Math.min(1, seconds / riseSeconds));
  return peakM * t * t * (3 - 2 * t);
}
export function groundHeight(grid: TerrainGrid | undefined, coord: Coord) { return grid ? elevation(grid, coord) : null; }

export type HazardFrame = { seconds: number; depthM: Array<number | null>; waveHeightM?: number };
export type HazardReplay = {
  schemaVersion: 1; areaId: string; title: string; sourceUrl: string; model: string; license: string;
  timeOrigin: 'warning'; verticalDatum: 'MSL'; depthUnit: 'm';
  grid: { west: number; east: number; south: number; north: number; rows: number; cols: number; rowOrder: 'north-to-south'; groundM?: Array<number | null> };
  waveGauge?: { name: string; longitude: number; latitude: number; quantity: 'crest-to-trough wave height' };
  frames: HazardFrame[];
};
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
/** Local import remains a research replay: a file cannot certify its own routes or authority status. */
export function parseHazardReplay(value: unknown, areaId: string): HazardReplay {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.areaId !== areaId) throw new Error('Scenario area or schema does not match this map.');
  for (const key of ['title', 'sourceUrl', 'model', 'license']) if (typeof value[key] !== 'string' || !value[key] || (value[key] as string).length > 500) throw new Error(`Scenario needs ${key}.`);
  try { const source = new URL(value.sourceUrl as string); if (source.protocol !== 'https:' || source.username || source.password) throw new Error(); } catch { throw new Error('Scenario source must be an HTTPS reference without credentials.'); }
  if (value.timeOrigin !== 'warning' || value.verticalDatum !== 'MSL' || value.depthUnit !== 'm') throw new Error('Replay requires warning-relative seconds, MSL datum and depths in metres.');
  const g = value.grid;
  if (!isRecord(g) || !['west','east','south','north','rows','cols'].every(k => finite(g[k])) || g.rowOrder !== 'north-to-south') throw new Error('Scenario grid metadata is incomplete.');
  const grid = g as HazardReplay['grid'];
  if (!(grid.west < grid.east && grid.south < grid.north && grid.west >= -180 && grid.east <= 180 && grid.south >= -85 && grid.north <= 85) || !Number.isInteger(grid.rows) || !Number.isInteger(grid.cols) || grid.rows < 1 || grid.cols < 1 || grid.rows * grid.cols > 16384) throw new Error('Scenario grid bounds or dimensions are invalid.');
  if (grid.groundM !== undefined && (!Array.isArray(grid.groundM) || grid.groundM.length !== grid.rows * grid.cols || !grid.groundM.every(x => x === null || finite(x) && x >= -12000 && x <= 9000))) throw new Error('Model ground grid is invalid.');
  if (!Array.isArray(value.frames) || value.frames.length < 2 || value.frames.length > 120) throw new Error('Provide 2–120 ordered frames.');
  let previous = -1;
  const frames = value.frames as HazardFrame[];
  for (const f of frames) {
    if (!isRecord(f) || !finite(f.seconds) || f.seconds < 0 || f.seconds > 604800 || f.seconds <= previous || !Array.isArray(f.depthM) || f.depthM.length !== grid.rows * grid.cols || !f.depthM.every(x => x === null || finite(x) && x >= 0 && x <= 1000)) throw new Error('Scenario frame times or depth cells are invalid.');
    if (f.waveHeightM !== undefined && (!finite(f.waveHeightM) || f.waveHeightM < 0 || !isRecord(value.waveGauge))) throw new Error('Wave height requires a named gauge and quantity definition.');
    previous = f.seconds;
  }
  if (value.waveGauge !== undefined) {
    const w = value.waveGauge;
    if (!isRecord(w) || typeof w.name !== 'string' || !w.name || !finite(w.longitude) || !finite(w.latitude) || Math.abs(w.longitude) > 180 || Math.abs(w.latitude) > 85 || w.quantity !== 'crest-to-trough wave height') throw new Error('Wave-gauge reference is invalid.');
  }
  return value as unknown as HazardReplay;
}
export function replayAt(data: HazardReplay, seconds: number) {
  if (seconds < data.frames[0].seconds || seconds > data.frames.at(-1)!.seconds) return null;
  const exact = data.frames.find(f => f.seconds === seconds);
  if (exact) return { depthM: [...exact.depthM], waveHeightM: exact.waveHeightM ?? null };
  let i = 0; while (i < data.frames.length - 2 && data.frames[i + 1].seconds < seconds) i++;
  const a = data.frames[i], b = data.frames[i + 1], t = (seconds - a.seconds) / (b.seconds - a.seconds);
  return { depthM: a.depthM.map((v,j) => v === null || b.depthM[j] === null ? null : v + (b.depthM[j]! - v) * t), waveHeightM: a.waveHeightM === undefined || b.waveHeightM === undefined ? null : a.waveHeightM + (b.waveHeightM - a.waveHeightM) * t };
}
export function replayPolygons(data: HazardReplay, seconds: number): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const f = replayAt(data, seconds), features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
  if (!f) return { type: 'FeatureCollection', features };
  const g = data.grid, dx = (g.east - g.west) / g.cols, dy = (g.north - g.south) / g.rows;
  f.depthM.forEach((depth, i) => {
    if (depth === null || depth <= .01) return;
    const x = i % g.cols, y = Math.floor(i / g.cols), w = g.west + x * dx, e = w + dx, n = g.north - y * dy, s = n - dy;
    features.push({ type: 'Feature', properties: { depthM: depth, surfaceM: g.groundM?.[i] == null ? null : g.groundM[i]! + depth }, geometry: { type: 'Polygon', coordinates: [[[w,s],[e,s],[e,n],[w,n],[w,s]]] } });
  });
  return { type: 'FeatureCollection', features };
}
