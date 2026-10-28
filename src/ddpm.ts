/** Official DDPM links and the dated Phang Nga risk-village snapshot.
 * Sheets stay on tsunami.disaster.go.th. Points are the committed snapshot, never a live query.
 * `Height` is kept in the file and is never treated as inundation depth. */

export const DDPM_LAYER_URL = 'https://gis-portal.disaster.go.th/arcgis/rest/services/DDPM_RISK_TSUNAMI_Merge/MapServer/57';
export const DDPM_VILLAGE_SNAPSHOT = '/data/ddpm-phang-nga-risk-villages-2026-10-28.geojson';
export const DDPM_MAP_CREDIT = {
  th: 'แผนที่อพยพหนีภัยสึนามิ — กรมป้องกันและบรรเทาสาธารณภัย (DDPM), tsunami.disaster.go.th',
  en: 'Tsunami evacuation maps — Department of Disaster Prevention and Mitigation (DDPM), tsunami.disaster.go.th',
} as const;

const SHEET_LABELS = {
  PG_6: {
    en: 'Labels read from the public PDF include Ban Bang Niang, Nang Thong road and Khao Lak.',
    th: 'ป้ายที่อ่านจาก PDF สาธารณะมีบ้านบางเนียง ถนนนางทอง และเขาหลัก',
  },
  PG_7: {
    en: 'Labels read from the public PDF include Wat Khammaniyat (Khuk Khak) and Khao Lak Home Place road.',
    th: 'ป้ายที่อ่านจาก PDF สาธารณะมีวัดคมนียเขต (คึกคัก) และถนนหมู่บ้านเขาหลักโฮมเพลส',
  },
  PG_10: {
    en: 'The readable place label is rural road 2030 in Phang Nga. Ban Bang Niang and Khao Lak were not in the extracted text.',
    th: 'ป้ายสถานที่ที่อ่านได้คือถนน รพช. 2030 ในพังงา ไม่พบชื่อบางเนียงหรือเขาหลักในข้อความที่ดึงได้',
  },
} as const;

export type DdpSheetCode = keyof typeof SHEET_LABELS;
export const ddpmKhaoLakSheets: { code: DdpSheetCode; en: string; th: string }[] = (Object.keys(SHEET_LABELS) as DdpSheetCode[]).map(code => ({ code, ...SHEET_LABELS[code] }));

export function ddpmSheetUrls(code: DdpSheetCode) {
  const stem = `https://tsunami.disaster.go.th/maps/evacuation-maps/phang-nga/${code}`;
  return { pdf600: `${stem}_600.pdf`, pdf1600: `${stem}_1600.pdf`, jpg: `${stem}.jpg` };
}

/** One symbol for every source Risk code. Color does not encode the code. */
export const riskPoint = { fill: '#fafaf7', stroke: '#12354e', strokeWidth: 1.5 } as const;

export type VillageHit = { OBJECTID: number; Village: string; tname: string; aname: string; Risk: number };
export type RiskVillageSnapshot = GeoJSON.FeatureCollection<GeoJSON.Point> & {
  schemaVersion: 1;
  source: string;
  sourceUrl: string;
  query: string;
  tier: 'authority-listed';
  owner: string;
  reviewedAt: string;
  retrievedAt: string;
  validUntil: string;
  featureCount: number;
  crs: 'EPSG:4326';
  serviceResponseSha256: string;
  heightField: { name: 'Height'; meaning: 'undocumented'; display: 'omitted' };
};

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const day = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

export function villageHit(props: unknown): VillageHit | null {
  if (!record(props) || typeof props.Village !== 'string' || !props.Village.trim()) return null;
  const objectId = Number(props.OBJECTID), risk = Number(props.Risk);
  if (!Number.isInteger(objectId) || !Number.isFinite(risk)) return null;
  return {
    OBJECTID: objectId,
    Village: props.Village,
    tname: typeof props.tname === 'string' ? props.tname : '',
    aname: typeof props.aname === 'string' ? props.aname : '',
    Risk: risk,
  };
}

/** Identity line for a listed village. Uses only name, administration, id and the raw Risk code. */
export function villageSummary(hit: VillageHit): string {
  return `${hit.Village} · ${hit.tname} · ${hit.aname} · DDPM id ${hit.OBJECTID} · source Risk ${hit.Risk}`;
}

export function parseRiskVillages(value: unknown): RiskVillageSnapshot {
  if (!record(value) || value.type !== 'FeatureCollection' || value.schemaVersion !== 1 || value.tier !== 'authority-listed' || value.crs !== 'EPSG:4326') throw new Error('Risk-village snapshot schema mismatch');
  if (value.sourceUrl !== DDPM_LAYER_URL || value.query !== "pname='พังงา'" || typeof value.source !== 'string' || typeof value.owner !== 'string' || !value.owner.includes('DDPM')) throw new Error('Risk-village provenance mismatch');
  if (!day(value.reviewedAt) || !day(value.validUntil) || value.validUntil <= value.reviewedAt || typeof value.retrievedAt !== 'string' || !Number.isFinite(Date.parse(value.retrievedAt)) || !value.retrievedAt.includes('+07:00')) throw new Error('Risk-village review dates are invalid');
  if (typeof value.serviceResponseSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.serviceResponseSha256)) throw new Error('Risk-village response hash is missing');
  if (!record(value.heightField) || value.heightField.name !== 'Height' || value.heightField.meaning !== 'undocumented' || value.heightField.display !== 'omitted') throw new Error('Height must stay an undocumented omitted field');
  if (!Array.isArray(value.features) || value.featureCount !== value.features.length || value.features.length < 1 || value.features.length > 5000) throw new Error('Risk-village count mismatch');
  const seen = new Set<number>();
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const feature of value.features) {
    if (!record(feature) || feature.type !== 'Feature' || !record(feature.geometry) || feature.geometry.type !== 'Point' || !Array.isArray(feature.geometry.coordinates) || !record(feature.properties)) throw new Error('Risk-village geometry is invalid');
    const [lon, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    if (!finite(lon) || !finite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) throw new Error('Risk-village coordinate is invalid');
    if (props.pname !== 'พังงา' || !finite(props.X_Long) || !finite(props.Y_Lat) || Math.abs(lon - props.X_Long) > 1e-6 || Math.abs(lat - props.Y_Lat) > 1e-6) throw new Error('Risk-village point does not match the source longitude and latitude');
    if (!finite(props.X) || Math.abs(props.X) <= 180) throw new Error('Projected X was stored where a longitude belongs');
    if (!finite(props.Height)) throw new Error('Height must remain the raw source number');
    if ('inundationDepth' in props || 'depth' in props || 'runup' in props) throw new Error('Snapshot must not add a depth interpretation');
    const hit = villageHit(props);
    if (!hit || seen.has(hit.OBJECTID)) throw new Error('Risk-village identity is invalid');
    seen.add(hit.OBJECTID);
    minLon = Math.min(minLon, lon); minLat = Math.min(minLat, lat); maxLon = Math.max(maxLon, lon); maxLat = Math.max(maxLat, lat);
  }
  const bounds = value.geometryBounds;
  if (!Array.isArray(bounds) || bounds.length !== 4 || bounds.some(item => !finite(item)) || Math.abs(bounds[0] - minLon) > 1e-9 || Math.abs(bounds[1] - minLat) > 1e-9 || Math.abs(bounds[2] - maxLon) > 1e-9 || Math.abs(bounds[3] - maxLat) > 1e-9) throw new Error('Risk-village bounds do not match the points');
  return value as unknown as RiskVillageSnapshot;
}
