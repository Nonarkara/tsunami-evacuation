import { ReadingDialog } from './ReadingDialog';
import { DDPM_MAP_CREDIT, ddpmKhaoLakSheets, ddpmSheetUrls, villageHit, villageSummary, type RiskVillageSnapshot } from './ddpm';

export function DdpmMaps({ snapshot, shown, onShown, error, onShowPoint }: {
  snapshot: RiskVillageSnapshot | null;
  shown: boolean;
  onShown: (shown: boolean) => void;
  error: string;
  onShowPoint: (feature: GeoJSON.Feature<GeoJSON.Point>) => void;
}) {
  const villages = [...(snapshot?.features ?? [])].sort((a, b) => villageSummary(villageHit(a.properties)!).localeCompare(villageSummary(villageHit(b.properties)!), 'th'));
  return (
    <ReadingDialog className="terrain-map-key ddpm-maps-trigger" title="DDPM evacuation maps / แผนที่อพยพ ปภ." triggerLabel="DDPM maps">
      <p lang="th"><strong>{DDPM_MAP_CREDIT.th}</strong></p>
      <p lang="en">{DDPM_MAP_CREDIT.en} The files stay on that site. This page does not copy them or redraw them as routes.</p>
      <label><input type="checkbox" checked={shown} disabled={!snapshot} onChange={event => onShown(event.target.checked)} /> Show Phang Nga risk-village points / แสดงจุดหมู่บ้านเสี่ยงของพังงา</label>
      {error && <p role="status">{error}</p>}
      {snapshot && <p>Snapshot {snapshot.reviewedAt} · {snapshot.featureCount} points · tier {snapshot.tier} · owner {snapshot.owner}. Re-review by {snapshot.validUntil}; that date is this repository’s horizon, not an official expiry. The source field Height is undocumented and is omitted. Source Risk is an integer whose legend text was not published. Population and house counts are undated and omitted. These points are not inundation depth, a route, a refuge, coverage, or a live warning.</p>}
      {ddpmKhaoLakSheets.map(sheet => {
        const urls = ddpmSheetUrls(sheet.code);
        return <section className="ddpm-sheet" key={sheet.code}><h3>{sheet.code}</h3><p lang="en">{sheet.en}</p><p lang="th">{sheet.th}</p><div className="ddpm-links"><a href={urls.pdf600} target="_blank" rel="noreferrer">PDF · 600</a><a href={urls.pdf1600} target="_blank" rel="noreferrer">PDF · 1600</a><a href={urls.jpg} target="_blank" rel="noreferrer">JPEG</a></div></section>;
      })}
      <h3>Listed villages / หมู่บ้านในบัญชี</h3>
      <ul className="ddpm-village-index">{villages.map(feature => {
        const hit = villageHit(feature.properties)!;
        return <li key={hit.OBJECTID}><span>{villageSummary(hit)}</span><button type="button" onClick={() => onShowPoint(feature)}>Show point</button></li>;
      })}</ul>
    </ReadingDialog>
  );
}
