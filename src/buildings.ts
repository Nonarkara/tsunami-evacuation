import type { Coord } from './crowd';

export const EYE_HEIGHT_M = 1.65;
export const UNKNOWN_BUILDING_MASSING_M = 3;
export type BuildingProperties = { height: number | null; heightSource: 'heightTag' | 'levelsEstimate' | 'unknown'; levels: number | null; building: string; osm: string };
export type BuildingPack = GeoJSON.FeatureCollection<GeoJSON.Polygon, BuildingProperties> & {
  schemaVersion: 1; area: string; sourceUrl: string; retrievedAt: string; rawSha256: string;
  queryBounds: number[]; geometryBounds: number[] | null;
  counts: { heightTag: number; levelsEstimate: number; unknown: number; total: number };
  walkStart: { coord: Coord; bearing: number; node: string; way: string; note: string } | null;
};
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function buildingAreaId(region: string, selected: number) { return `${region}-${selected}`; }
export function parseBuildings(value: unknown, area: string): BuildingPack {
  if (!record(value) || value.type !== 'FeatureCollection' || value.schemaVersion !== 1 || value.area !== area || !Array.isArray(value.features) || value.features.length > 25000) throw new Error('Building snapshot area/schema mismatch');
  if (typeof value.sourceUrl !== 'string' || !value.sourceUrl.startsWith('https://api.openstreetmap.org/api/0.6/map.json?bbox=') || typeof value.retrievedAt !== 'string' || !Number.isFinite(Date.parse(value.retrievedAt)) || typeof value.rawSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.rawSha256)) throw new Error('Building provenance unavailable');
  const bounds = (b: unknown): b is number[] => Array.isArray(b) && b.length===4 && b.every(finite) && b[0]<b[2] && b[1]<b[3] && b[0]>=-180 && b[2]<=180 && b[1]>=-85 && b[3]<=85;
  if (!bounds(value.queryBounds) || (value.features.length ? !bounds(value.geometryBounds) : value.geometryBounds !== null)) throw new Error('Building coverage bounds unavailable');
  if (value.walkStart !== null && (!record(value.walkStart) || !Array.isArray(value.walkStart.coord) || value.walkStart.coord.length!==2 || !value.walkStart.coord.every(finite) || !finite(value.walkStart.bearing) || typeof value.walkStart.node!=='string' || !/^node\/\d+$/.test(value.walkStart.node) || typeof value.walkStart.way!=='string' || !/^way\/\d+$/.test(value.walkStart.way))) throw new Error('Ground-view reference is invalid');
  const counts = { heightTag:0, levelsEstimate:0, unknown:0, total:value.features.length };
  const seen = new Set<string>();
  for (const f of value.features) {
    if (!record(f) || f.type !== 'Feature' || !record(f.geometry) || f.geometry.type !== 'Polygon' || !Array.isArray(f.geometry.coordinates) || f.geometry.coordinates.length !== 1 || !record(f.properties)) throw new Error('Building geometry is invalid');
    const ring = f.geometry.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4 || ring.length > 1001 || !ring.every(p=>Array.isArray(p) && p.length === 2 && finite(p[0]) && finite(p[1]) && Math.abs(p[0])<=180 && Math.abs(p[1])<=85) || ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1] || new Set(ring.slice(0,-1).map(p=>p.join(','))).size !== ring.length-1) throw new Error('Building polygon is incomplete');
    const points=ring.map(p=>[p[0]-ring[0][0],p[1]-ring[0][1]]);
    if (Math.abs(points.slice(1).reduce((area,p,i)=>area+points[i][0]*p[1]-p[0]*points[i][1],0))<1e-14) throw new Error('Degenerate building polygon');
    const p = f.properties;
    if (!['heightTag','levelsEstimate','unknown'].includes(String(p.heightSource)) || typeof p.osm !== 'string' || !/^way\/\d+$/.test(p.osm) || seen.has(p.osm) || typeof p.building !== 'string' || !p.building) throw new Error('Building properties are invalid');
    seen.add(p.osm);
    if (p.heightSource === 'unknown' ? p.height !== null : !finite(p.height) || p.height < .5 || p.height > 400) throw new Error('Missing heights must remain unknown');
    if (p.heightSource === 'levelsEstimate' && (!finite(p.levels) || Math.abs((p.height as number) - p.levels * 3) > .001)) throw new Error('Storey height estimate is inconsistent');
    counts[p.heightSource as keyof Omit<typeof counts,'total'>]++;
  }
  if (!record(value.counts) || Object.keys(counts).some(k=>value.counts && (value.counts as Record<string,unknown>)[k] !== counts[k as keyof typeof counts])) throw new Error('Building count accounting is inconsistent');
  return value as unknown as BuildingPack;
}

/** Camera exploration only. This computes no traversable route or evacuation speed. */
export function cameraStep(coord: Coord, heading: number, metres: number): Coord {
  if (![...coord, heading, metres].every(Number.isFinite) || Math.abs(metres)>50) throw new Error('Invalid camera step');
  const rad=Math.PI/180, distance=metres/6371000, bearing=heading*rad, lat=coord[1]*rad, lon=coord[0]*rad;
  const nextLat=Math.asin(Math.sin(lat)*Math.cos(distance)+Math.cos(lat)*Math.sin(distance)*Math.cos(bearing));
  const nextLon=lon+Math.atan2(Math.sin(bearing)*Math.sin(distance)*Math.cos(lat),Math.cos(distance)-Math.sin(lat)*Math.sin(nextLat));
  return [nextLon/rad,nextLat/rad];
}
