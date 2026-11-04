import { useState } from 'react';
import { ReadingDialog } from './ReadingDialog';
import { ProvenancePanel } from './ProvenancePanel';
import type { ManualLanguage } from './manual-content';
import { DDPM_MAP_CREDIT, ddpmKhaoLakSheets, ddpmSheetUrls, riskVillageEvidence, villageHit, villageSummary, type RiskVillageSnapshot } from './ddpm-maps';

/** External official sheets and a source inventory; never an emergency route recommendation. */
export function DdpmMaps({ snapshot, shown, onShown, error, onShowPoint, language='en' }: {
  snapshot: RiskVillageSnapshot | null;
  shown: boolean;
  onShown: (shown: boolean) => void;
  error: string;
  onShowPoint: (feature: GeoJSON.Feature<GeoJSON.Point>) => void;
  language?:ManualLanguage;
}) {
  const t=(en:string,th:string)=>language==='th'?th:en;
  const [query,setQuery]=useState('');
  const [selectedId,setSelectedId]=useState('');
  const [inventoryOpen,setInventoryOpen]=useState(false);
  const villages=[...(snapshot?.features??[])].filter(feature=>villageSummary(villageHit(feature.properties)!,language).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a,b)=>villageSummary(villageHit(a.properties)!).localeCompare(villageSummary(villageHit(b.properties)!),'th'));
  const evidence=snapshot?riskVillageEvidence(snapshot):null;
  const chosen=villages.find(feature=>String(villageHit(feature.properties)!.OBJECTID)===selectedId)??villages[0];
  return <ReadingDialog language={language} className="terrain-map-key ddpm-maps-trigger" title={t('DDPM evacuation maps','แผนที่อพยพ ปภ.')} triggerLabel={t('DDPM maps','แผนที่ ปภ.')}>
    <section className="ddpm-maps-content">
      <div hidden={inventoryOpen}>
      <p><strong>{DDPM_MAP_CREDIT[language]}</strong></p>
      <p>{t('Files open on DDPM’s site. These published sheets are separate from the practice lines drawn here; current access and local instructions need confirmation.','เปิดไฟล์บนเว็บไซต์ ปภ. แผ่นเผยแพร่เหล่านี้แยกจากเส้นแบบฝึกที่วาดในระบบ ต้องยืนยันการเข้าถึงปัจจุบันและคำสั่งในพื้นที่')}</p>
      {ddpmKhaoLakSheets.map(sheet=>{const urls=ddpmSheetUrls(sheet.code);return <section className="ddpm-sheet" key={sheet.code}>
        <h3>{sheet.code}</h3><p>{sheet[language]}</p><div className="ddpm-links"><a href={urls.pdf600} target="_blank" rel="noreferrer">PDF · 600 ↗</a><a href={urls.pdf1600} target="_blank" rel="noreferrer">PDF · 1600 ↗</a><a href={urls.jpg} target="_blank" rel="noreferrer">JPEG ↗</a></div>
      </section>;})}
      </div>
      <details className="ddpm-point-source" open={inventoryOpen} onToggle={event=>setInventoryOpen(event.currentTarget.open)}><summary>{inventoryOpen?t('Back to DDPM map sheets','กลับไปแผ่นแผนที่ ปภ.'):t('Phang Nga village inventory','บัญชีหมู่บ้านพังงา')} · {snapshot?.featureCount??'—'}</summary>
        <h3>{t('Phang Nga village inventory','บัญชีหมู่บ้านพังงา')}</h3>
        <label className="ddpm-map-toggle"><input type="checkbox" checked={shown} disabled={!snapshot} onChange={event=>onShown(event.target.checked)}/>{t('Show inventory points','แสดงจุดในบัญชี')}</label>
        {error&&<p role="status">{error}</p>}
        {snapshot&&evidence&&<>
          <p>{t('Source EPSG:4326 points; placement method and accuracy unknown. Height and Risk meanings remain undocumented. Undated population/household counts are omitted. These points are not inundation, routes, refuges or live warnings.','จุดจากต้นทาง EPSG:4326 ยังไม่ทราบวิธีวางจุดและความแม่นยำ ความหมาย Height และ Risk ยังไม่ระบุ ไม่แสดงจำนวนคนหรือบ้านที่ไม่มีวันที่ จุดเหล่านี้ไม่ใช่เขตน้ำท่วม เส้นทาง ที่หลบภัย หรือคำเตือนสด')}</p>
          <ProvenancePanel compact language={language} showLimitations={false} evidence={{...evidence,license:t('Not stated in layer metadata; reuse terms unverified','คำอธิบายชั้นข้อมูลไม่ระบุ ยังไม่ยืนยันเงื่อนไขใช้ซ้ำ')}}/>
          <p>{t('Snapshot review','ตรวจภาพข้อมูล')} {snapshot.reviewedAt} · {t('Repository re-review by','ทบทวนในโครงการภายใน')} {snapshot.validUntil}. {t('This is not an official expiry date.','ไม่ใช่วันหมดอายุจากหน่วยงาน')}</p>
          <label className="ddpm-village-search">{t('Find a listed village','ค้นหมู่บ้านในบัญชี')}<input type="search" value={query} onChange={event=>setQuery(event.target.value)}/></label>
          <p role="status">{villages.length} / {snapshot.featureCount} {t('records','ระเบียน')}</p>
          <div className="ddpm-village-choice"><label>{t('Listed village','หมู่บ้านในบัญชี')}<select value={chosen?String(villageHit(chosen.properties)!.OBJECTID):''} onChange={event=>setSelectedId(event.target.value)}>{!villages.length&&<option value="">{t('No matching records','ไม่พบระเบียน')}</option>}{villages.map(feature=>{const hit=villageHit(feature.properties)!;return <option key={hit.OBJECTID} value={String(hit.OBJECTID)}>{villageSummary(hit,language)}</option>;})}</select></label><button type="button" disabled={!chosen} onClick={event=>{if(chosen)onShowPoint(chosen);event.currentTarget.closest('dialog')?.close();}}>{t('Locate','ดูจุด')}</button></div>
        </>}
      </details>
    </section>
  </ReadingDialog>;
}
