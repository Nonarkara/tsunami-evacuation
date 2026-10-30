import { ddpmDatasetEvidence, ddpmInspection as data, provinceNamesEn } from './ddpm';
import { ProvenancePanel } from './ProvenancePanel';
import type { ManualLanguage } from './manual-content';

/** A dated inspection of the entire source CSV. No mapped/operational layer is implied. */
export function DdpmRiskPanel({ language, onResearch }: { language: ManualLanguage; onResearch:()=>void }) {
  const t = (en: string, th: string) => language === 'th' ? th : en;
  const limits = [
    t('All coordinates populated; two pairs repeat. Placement method, CRS and accuracy unverified.', 'ทุกแถวมีช่องพิกัด แต่มีคู่พิกัดซ้ำสองคู่ ยังไม่ยืนยันวิธีวางจุด ระบบพิกัด หรือความแม่นยำ จึงไม่ยืนยันศูนย์กลางหมู่บ้านหรือที่หลบภัย'),
    t('257 blanks in each population/household field; 248 missing village codes. Rows are not unique villages.', 'ช่องประชากรและครัวเรือนขาดข้อมูลช่องละ 257 แถว รหัสหมู่บ้านขาด 248 แถว จำนวนแถวไม่ใช่จำนวนหมู่บ้านที่ไม่ซ้ำ'),
    t('Observation dates and update frequency unknown. Catalog dates do not establish current conditions.', 'ไม่ทราบวันที่สังเกตข้อมูลและรอบปรับปรุง วันที่ในบัญชีทั้งสามแบบไม่ยืนยันสภาพปัจจุบัน'),
  ];
  return <section className="ddpm-panel" lang={language} aria-label={t('DDPM source inspection','ตรวจข้อมูลต้นทาง ปภ.')}>
    <header className="ddpm-head">
      <button className="ddpm-back" onClick={onResearch}>← {t('Research','งานวิจัย')}</button>
      <h2>{t('DDPM · full CSV inspection','ปภ. · ผลตรวจ CSV ทั้งไฟล์')}</h2>
      <p className="ddpm-facts"><strong>{data.rows.toLocaleString()} {t('rows','แถว')}</strong> · <strong>{data.provinces.length} {t('provinces','จังหวัด')}</strong> · {t('Includes Phang Nga and Phuket','รวมพังงาและภูเก็ต')}</p>
      <p>{t('Dated CSV audit; records are not mapped or used by the rehearsal.', 'ผลตรวจต้นทาง ณ วันที่ระบุ ยังไม่ได้นำระเบียนเหล่านี้ลงแผนที่หรือเชื่อมกับแบบฝึก')}</p>
    </header>

    <section className="ddpm-fields" id="ddpm-fields">
      <h3>{t('What the full file contains','ข้อมูลที่พบในไฟล์ทั้งหมด')}</h3>
      <p>{t('Height (raw)','Height: ช่วงค่าดิบ')} <strong>{data.heightRaw.min}–{data.heightRaw.max}</strong> · {t('unit/meaning unverified','ยังไม่ยืนยันหน่วยและความหมาย')}</p>
      <p>{t('Risk code → rows','รหัส Risk → จำนวนแถว')}: {Object.entries(data.riskCodes).map(([code,count])=><span key={code} className="ddpm-code">{code} → <strong>{count.toLocaleString()}</strong></span>)}</p>
      <p>{t('Codes are labels, not verified severity or probability.', 'แสดงรหัสตามต้นฉบับ โดยไม่กำหนดระดับความรุนแรง โอกาสเกิด หรือความปลอดภัย')}</p>
    </section>

    <section className="ddpm-limitations" id="ddpm-limitations">
      <h3>{t('How to interpret it','วิธีอ่านข้อมูล')}</h3>
      <ul>{limits.map(lim=><li key={lim}>{lim}</li>)}</ul>
      <p><strong>{t('Not used for inundation, routing, refuge approval or live warnings.', 'ไม่ใช้ไฟล์นี้สร้างเขตน้ำท่วม เส้นทางอพยพ การรับรองที่หลบภัย หรือคำเตือนสด')}</strong></p>
    </section>

    <section className="ddpm-source" id="ddpm-source">
      <h3>{t('Source and inspection receipt','แหล่งข้อมูลและหลักฐานการตรวจ')}</h3>
      <p><a href={data.csvUrl}>{t('Download original CSV','ดาวน์โหลด CSV ต้นฉบับ')}</a> · <a href={data.datasetUrl}>{t('DDPM catalog','บัญชีข้อมูล ปภ.')}</a></p>
      <ProvenancePanel compact language={language} showLimitations={false} evidence={{...ddpmDatasetEvidence,limitations:limits}} />
      <dl className="ddpm-dates">
        <div><dt>{t('Stated data update','วันที่ปรับปรุงข้อมูลที่ระบุ')}</dt><dd>{data.statedDataUpdated}</dd></div>
        <div><dt>{t('CSV resource modified','วันที่แก้ไขทรัพยากร CSV')}</dt><dd>{data.resourceModified.slice(0,10)}</dd></div>
        <div><dt>{t('Catalog metadata modified','วันที่แก้ไขคำอธิบายบัญชี')}</dt><dd>{data.catalogModified.slice(0,10)}</dd></div>
      </dl>
      <p className="ddpm-hash">SHA-256 · CSV <code>{data.csvSha256}</code></p>
      <p>{t('Catalog licence label: Creative Commons Attributions; version and licence URL are not supplied.', 'บัญชีระบุสัญญาอนุญาต Creative Commons Attributions แต่ไม่ระบุรุ่นหรือลิงก์สัญญาอนุญาต')}</p>
    <p className="ddpm-summary">{t('Inspection is reproducible from the original CSV and catalog metadata. A source inventory is separate from a validated local evacuation plan.', 'ตรวจซ้ำได้จาก CSV ต้นฉบับและคำอธิบายบัญชีข้อมูล บัญชีต้นทางเป็นคนละส่วนกับแผนอพยพในพื้นที่ที่ผ่านการยืนยัน')}</p>
    </section>

    <section className="ddpm-provinces" id="ddpm-coverage">
      <h3>{t('Province coverage · record counts','พื้นที่ครอบคลุม · จำนวนระเบียน')}</h3>
      <p>{t('Grouped by numeric pcode. PV abbreviations are reused across provinces and are not unique identifiers.', 'จัดกลุ่มตาม pcode ตัวเลข อักษรย่อ PV ซ้ำข้ามจังหวัด จึงใช้เป็นรหัสเฉพาะไม่ได้')}</p>
      <table><caption>{t('Province names translated from the Thai source','คงชื่อจังหวัดตามต้นฉบับภาษาไทย')}</caption>
        <thead><tr><th scope="col">pcode</th><th scope="col">{t('Province','จังหวัด')}</th><th scope="col">{t('Rows','แถว')}</th></tr></thead>
        <tbody>{data.provinces.map(p=><tr key={p.pcode}><td>{p.pcode}</td><th scope="row" lang={language} title={p.nameTh}>{language==='th'?p.nameTh:provinceNamesEn[p.pcode]??p.nameTh}</th><td>{p.rows}</td></tr>)}</tbody>
      </table>
    </section>

  </section>;
}
