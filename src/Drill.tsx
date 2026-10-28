import { useState } from 'react';
import { validateDrill } from './research';
import { parseDrillArchive, type DrillRecord } from './drill-log';
import { EvacuationGuide } from './EvacuationGuide';
import type { ManualLanguage } from './manual-content';

export function Drill({language}:{language:ManualLanguage}) {
  const t=(en:string,th:string)=>language==='th'?th:en;
  const [draft,setDraft]=useState({participants:'',reached:'',assisted:'',minutes:''});
  const [route,setRoute]=useState(''),[review,setReview]=useState(''),[message,setMessage]=useState('');
  const [archive,setArchive]=useState(()=>{
    try {const raw=localStorage.getItem('soonami-drills-v1');return raw?parseDrillArchive(JSON.parse(raw)):{records:[],invalid:0};}
    catch{return{records:[],invalid:1};}
  });
  const counts={participants:Number(draft.participants),reached:Number(draft.reached),assisted:Number(draft.assisted),minutes:Number(draft.minutes)};
  const complete=Object.values(draft).every(v=>v.trim()!=='');
  const valid=complete&&validateDrill(counts)&&counts.participants<=5000&&counts.minutes<=180;
  const missing=valid?counts.participants-counts.reached:null;
  function record():DrillRecord{return{...counts,route,review,recordedAt:new Date().toISOString()};}
  function exportRecords(records:DrillRecord[]){
    const url=URL.createObjectURL(new Blob([JSON.stringify(records,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='soonami-drill-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function save(){
    if(!valid||archive.invalid)return;
    const records=[record(),...archive.records];
    try{localStorage.setItem('soonami-drills-v1',JSON.stringify(records));setArchive({records,invalid:0});setMessage(t('Saved on this device.','บันทึกในอุปกรณ์นี้แล้ว'));}
    catch{setMessage(t('Storage unavailable. Export the current record instead; your entries remain.','พื้นที่จัดเก็บไม่พร้อม ส่งออกบันทึกปัจจุบันแทน ข้อมูลที่กรอกยังอยู่'));}
  }
  return <article className="drill-workspace" lang={language}>
    <header className="task-heading"><span className="eyebrow">{t('Practice / record / improve','ซ้อม / บันทึก / ปรับปรุง')}</span><h1>{t('Review an evacuation drill','ทบทวนการซ้อมอพยพ')}</h1><p>{t('Record what happened on a locally agreed route. Reconcile people before comparing times.','บันทึกสิ่งที่เกิดขึ้นบนเส้นทางที่ตกลงในพื้นที่ ตรวจนับคนให้ครบก่อนเปรียบเทียบเวลา')}</p></header>
    <div className="drill-task-grid">
      <section className="drill-form" id="drill-form" aria-labelledby="drill-record-title">
        <h2 id="drill-record-title">{t('1 / Record observed counts','1 / บันทึกจำนวนที่สังเกตจริง')}</h2>
        <label className="drill-route">{t('Route / meeting point (optional)','เส้นทาง / จุดนัดหมาย (ถ้ามี)')}<input maxLength={300} value={route} onChange={e=>setRoute(e.target.value)}/></label>
        <div className="drill-counter-grid">{([
          ['participants',t('Participants','ผู้เข้าร่วม')],['reached',t('Counted at meeting point','นับได้ที่จุดนัดหมาย')],['assisted',t('People assisted','ผู้ได้รับความช่วยเหลือ')],['minutes',t('Elapsed minutes','เวลาที่ใช้ (นาที)')],
        ] as const).map(([key,label])=><label key={key}>{label}<input inputMode={key==='minutes'?'decimal':'numeric'} type="number" min={key==='participants'?1:0} max={key==='participants'?5000:key==='minutes'?180:counts.participants||5000} step={key==='minutes'?'any':1} value={draft[key]} onChange={e=>setDraft(p=>({...p,[key]:e.target.value}))}/></label>)}</div>
        <p className="field-note">{t('Assisted people are part of the group, not an extra headcount. A meeting-point count does not certify refuge safety.','ผู้ได้รับความช่วยเหลือเป็นส่วนหนึ่งของกลุ่ม ไม่ใช่จำนวนที่ต้องบวกเพิ่ม การนับถึงจุดนัดหมายไม่รับรองความปลอดภัยของจุดอพยพ')}</p>
        <div className="drill-reconciliation" aria-live="polite"><strong>{missing===null?'—':missing}</strong><span>{missing===null?t('Enter all four observations.','กรอกข้อมูลที่สังเกตทั้งสี่ช่อง'):missing>0?t('not yet accounted for — reconcile with the coordinator','คนที่ยังตรวจนับไม่ครบ — ประสานผู้ควบคุมการซ้อม'):t('all participants counted at the meeting point','ตรวจนับผู้เข้าร่วมครบที่จุดนัดหมาย')}</span></div>
        {complete&&!valid&&<p className="error" role="alert">{t('Check whole-person counts, totals within participants and a positive time up to180 minutes.','ตรวจจำนวนคนเป็นจำนวนเต็ม ไม่เกินผู้เข้าร่วม และเวลามากกว่า0ไม่เกิน180นาที')}</p>}
        <label className="drill-review">{t('2 / What needs changing before the next drill?','2 / ต้องปรับอะไรบ้างก่อนซ้อมครั้งต่อไป?')}<textarea rows={2} maxLength={1000} value={review} onChange={e=>setReview(e.target.value)} placeholder={t('Obstacle, owner and review date','ปัญหา ผู้รับผิดชอบ และวันทบทวน')}/></label>
        <div className="drill-actions"><button className="primary" disabled={!valid||archive.invalid>0} onClick={save}>{t('Save drill record','บันทึกผลการซ้อม')}</button><button disabled={!valid} onClick={()=>exportRecords([record()])}>{t('Export current','ส่งออกบันทึกนี้')}</button></div>
        <p className="field-note">{t('On this device only. No participant names are needed.','เก็บในอุปกรณ์นี้เท่านั้น ไม่ต้องระบุชื่อผู้เข้าร่วม')}</p>
        {message&&<p role="status">{message}</p>}
        {archive.invalid>0&&<p className="error" role="alert">{t('Some stored records cannot be read. Original storage is preserved; export the current record instead of overwriting it.','บางบันทึกเดิมอ่านไม่ได้ ระบบเก็บข้อมูลเดิมไว้ ส่งออกบันทึกนี้แทนการเขียนทับ')}</p>}
        <details className="drill-history"><summary>{t('Saved records','บันทึกที่เก็บไว้')} ({archive.records.length})</summary>{archive.records.length===0?<p>{t('No saved drill records.','ยังไม่มีบันทึกการซ้อม')}</p>:<><button onClick={()=>exportRecords(archive.records)}>{t('Export saved records','ส่งออกบันทึกที่เก็บไว้')}</button><ol>{archive.records.map((d,i)=><li key={i}><strong>{d.reached}/{d.participants}</strong> {t('counted','คนที่นับได้')} · {d.assisted} {t('assisted','คนที่ได้รับความช่วยเหลือ')} · {d.minutes} {t('min','นาที')}{d.recordedAt&&<time dateTime={d.recordedAt}> · {t('recorded','บันทึกเมื่อ')} {d.recordedAt.slice(0,10)}</time>}{d.route&&<p>{d.route}</p>}{d.review&&<p>{d.review}</p>}</li>)}</ol></>}</details>
      </section>
      <aside className="drill-guide"><EvacuationGuide language={language}/></aside>
    </div>
  </article>;
}
