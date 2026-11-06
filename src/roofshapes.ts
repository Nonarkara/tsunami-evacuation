/** Roof shapes read from the aerial imagery.
 *
 * A roof shape is a reading of one dated image, not a survey of the built
 * structure. Buildings that were not judged keep a null shape, and the pack
 * records where every judgement came from. The ridge line drawn for a pitched
 * roof is derived from the footprint's long axis: the imagery says the roof
 * is pitched, it does not give the ridge direction.
 *
 * Two kinds of reading live in the pack and are kept apart. A shape the source
 * states outright — an OpenStreetMap `roof:shape` tag on the published
 * snapshot — is recorded with its tag and value. A shape read from a dated
 * aerial image is a judgement. A stated reading wins over a judged one, and
 * the pack records that it did.
 */
import type { BuildingPack, BuildingProperties } from './buildings';

export type RoofShape = 'flat' | 'gable' | 'pitched';
export type RoofImagery = { provider: string; url: string; zoom: number; retrievedAt: string; attribution: string };
export type RoofOsmTag = { provider: string; url: string; sha256: string; retrievedAt: string; attribution: string; tag: string; value: string };
export type RoofRecord = {
  osm: string; shape: RoofShape; method: 'sheet' | 'single' | 'osm-tag'; confidence: 'high' | 'medium' | 'low';
  reason: string; imagery?: RoofImagery; osmTag?: RoofOsmTag; classifiedBy: string; classifiedAt: string;
};
export type RoofPack = {
  schemaVersion: 1; areaId: string; type: 'FeatureCollection';
  features: { type: 'Feature'; properties: Record<string, unknown>; geometry: { type: 'Polygon'; coordinates: number[][][] } }[];
  counts?: Record<string, number>; coverage?: number;
};

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Parse a roof pack against the building pack it claims to describe. */
export function parseRoofShapes(value: unknown, area: string, buildings: BuildingPack): Map<string, RoofRecord> {
  if (!record(value) || value.schemaVersion !== 1 || value.areaId !== area || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
    throw new Error('Roof pack area/schema mismatch');
  }
  const byOsm = new Map(buildings.features.map(f => [f.properties.osm, f]));
  const out = new Map<string, RoofRecord>();
  for (const feature of value.features) {
    if (!record(feature) || feature.type !== 'Feature' || !record(feature.properties) || !record(feature.geometry)) throw new Error('Roof feature is invalid');
    const p = feature.properties;
    if (typeof p.osm !== 'string' || !/^way\/\d+$/.test(p.osm) || out.has(p.osm)) throw new Error('Roof identity is invalid');
    // The footprint must be the building's own geometry, so a roof can never
    // be drawn on a different shape.
    const source = byOsm.get(p.osm);
    if (!source) throw new Error('Roof pack references a building outside the area');
    if (JSON.stringify(feature.geometry.coordinates) !== JSON.stringify(source.geometry.coordinates)) throw new Error('Roof footprint does not match the building');
    if (p.roofShape === null || p.roofShape === undefined) continue;
    if (p.roofShape !== 'flat' && p.roofShape !== 'gable' && p.roofShape !== 'pitched') throw new Error('Roof shape must be flat, gable, pitched or null');
    if (p.roofMethod !== 'sheet' && p.roofMethod !== 'single' && p.roofMethod !== 'osm-tag') throw new Error('Roof method is missing');
    // A stated reading and a judged reading carry different provenance, and a
    // record may carry exactly one of them.
    let imagery: RoofImagery | undefined;
    let osmTag: RoofOsmTag | undefined;
    if (p.roofMethod === 'osm-tag') {
      if (!record(p.roofOsm) || typeof p.roofOsm.provider !== 'string' || typeof p.roofOsm.url !== 'string' || !p.roofOsm.url.startsWith('https://') || typeof p.roofOsm.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(p.roofOsm.sha256) || typeof p.roofOsm.retrievedAt !== 'string' || !Number.isFinite(Date.parse(p.roofOsm.retrievedAt)) || typeof p.roofOsm.attribution !== 'string' || typeof p.roofOsm.tag !== 'string' || typeof p.roofOsm.value !== 'string') throw new Error('Roof source provenance is missing');
      osmTag = { provider: p.roofOsm.provider, url: p.roofOsm.url, sha256: p.roofOsm.sha256, retrievedAt: p.roofOsm.retrievedAt, attribution: p.roofOsm.attribution, tag: p.roofOsm.tag, value: p.roofOsm.value };
    } else {
      if (!record(p.roofImagery) || typeof p.roofImagery.provider !== 'string' || typeof p.roofImagery.url !== 'string' || !p.roofImagery.url.startsWith('https://') || !finite(p.roofImagery.zoom) || typeof p.roofImagery.retrievedAt !== 'string' || !Number.isFinite(Date.parse(p.roofImagery.retrievedAt)) || typeof p.roofImagery.attribution !== 'string') throw new Error('Roof imagery provenance is missing');
      imagery = { provider: p.roofImagery.provider, url: p.roofImagery.url, zoom: p.roofImagery.zoom, retrievedAt: p.roofImagery.retrievedAt, attribution: p.roofImagery.attribution };
    }
    if (typeof p.roofClassifiedBy !== 'string' || !p.roofClassifiedBy || typeof p.roofClassifiedAt !== 'string' || !Number.isFinite(Date.parse(p.roofClassifiedAt))) throw new Error('Roof classification provenance is missing');
    if (typeof p.roofReason !== 'string' || !p.roofReason) throw new Error('Roof reason is missing');
    if (p.roofConfidence !== 'high' && p.roofConfidence !== 'medium' && p.roofConfidence !== 'low') throw new Error('Roof confidence is missing');
    out.set(p.osm, {
      osm: p.osm, shape: p.roofShape, method: p.roofMethod, confidence: p.roofConfidence, reason: p.roofReason,
      imagery, osmTag,
      classifiedBy: p.roofClassifiedBy, classifiedAt: p.roofClassifiedAt,
    });
  }
  return out;
}

/** The ridge of a pitched roof, along the footprint's long axis. */
export function ridgeLine(ring: number[][]): number[][] {
  const points = ring.slice(0, -1);
  if (points.length < 3) return [];
  const lat0 = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  const metres = points.map(p => [p[0] * 111320 * Math.cos(lat0 * Math.PI / 180), p[1] * 110574]);
  const centre = metres.reduce((acc, p) => [acc[0] + p[0] / metres.length, acc[1] + p[1] / metres.length], [0, 0]);
  // The longest edge gives the direction a simple gable would sit along.
  let best = { dx: 1, dy: 0, length: 0 };
  for (let i = 0; i < metres.length; i++) {
    const a = metres[i], b = metres[(i + 1) % metres.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
    if (length > best.length) best = { dx, dy, length };
  }
  const ux = best.dx / (best.length || 1), uy = best.dy / (best.length || 1);
  let min = Infinity, max = -Infinity;
  for (const p of metres) {
    const along = (p[0] - centre[0]) * ux + (p[1] - centre[1]) * uy;
    min = Math.min(min, along); max = Math.max(max, along);
  }
  const start = [centre[0] + ux * min, centre[1] + uy * min];
  const end = [centre[0] + ux * max, centre[1] + uy * max];
  const toLonLat = (p: number[]) => [p[0] / (111320 * Math.cos(lat0 * Math.PI / 180)), p[1] / 110574];
  return [toLonLat(start), toLonLat(end)];
}

/** Attach the roof reading to the buildings it belongs to. */
export function applyRoofShapes<T extends GeoJSON.Feature<GeoJSON.Polygon, BuildingProperties>>(
  features: T[], roofs: Map<string, RoofRecord>,
): (T & { properties: T['properties'] & { roofShape: RoofShape | null } })[] {
  return features.map(feature => {
    const roof = roofs.get(feature.properties.osm);
    return { ...feature, properties: { ...feature.properties, roofShape: roof ? roof.shape : null } };
  });
}

/** The ridge segments for the pitched roofs, as a line feature collection. */
export function roofRidges(
  features: (GeoJSON.Feature<GeoJSON.Polygon, BuildingProperties> & { properties: { roofShape: RoofShape | null } })[],
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const out: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  for (const feature of features) {
    if (feature.properties.roofShape !== 'gable') continue;
    const line = ridgeLine(feature.geometry.coordinates[0]);
    if (line.length !== 2) continue;
    out.push({ type: 'Feature', properties: { osm: feature.properties.osm, roofShape: 'gable' }, geometry: { type: 'LineString', coordinates: line } });
  }
  return { type: 'FeatureCollection', features: out };
}
