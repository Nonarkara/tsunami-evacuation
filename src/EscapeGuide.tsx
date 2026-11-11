import type { ManualLanguage } from './manual-content';
import { WarningLesson } from './WarningLesson';
import { TimeScrubber } from './TimeScrubber';
import { waitClock } from './viz';
import type { ReactNode } from 'react';

export type EscapeGuideProps = {
  language:ManualLanguage; started:boolean; playing:boolean; ready:boolean;
  state:string; remainingM:number; totalM:number; seconds:number; duration:number; rate:number; pace:number;
  finishSeconds:number; queueSeconds:number; groundElevation:number|null; waterLevel:number; peak:number;
  nextTurn:{direction:string;distanceM:number}|null;
  onPlay:()=>void; onReset:()=>void; onSeek:(seconds:number)=>void; onRate:(rate:number)=>void;
  onPlan:()=>void; onReview:()=>void; method?:ReactNode;
  schematic:boolean; onStyle:()=>void;
};

/** No water/ground comparison: this model cannot determine inundation or survival. */
export function EscapeGuide(p:EscapeGuideProps) {
  const t=(en:string,th:string)=>p.language==='th'?th:en;
  const arrived=p.started&&p.state==='arrived';
  const turn=p.nextTurn?.direction;
  const direction=turn?t(`In ${p.nextTurn!.distanceM} m, turn ${turn}`,`อีก ${p.nextTurn!.distanceM} ม. เลี้ยว${turn==='right'?'ขวา':'ซ้าย'}`):t('Continue on the practice line','ตามเส้นแบบฝึกต่อไป');
  const action=!p.started?direction:p.state==='preparing'?t('Exercise delay','เวลารอของแบบฝึก'):p.state==='queued'?t('Waiting at a model node','รอที่จุดคิวจำลอง'):arrived?t('Practice endpoint reached','ถึงปลายทางแบบฝึก'):direction;
  return <section className="escape-guide" lang={p.language} aria-label={t('Escape practice','ฝึกอพยพ')}>
    <WarningLesson language={p.language}/>
    <div className="escape-route-cue">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d={p.state==='queued'&&p.started?'M6 5v22M25 5v22':turn==='left'?'M24 28V13H6m8-8-8 8 8 8':turn==='right'?'M8 28V13h18m-8-8 8 8-8 8':'M16 28V5m-9 9 9-9 9 9'}/></svg>
      <div><strong>{action}</strong><span>{t('Practice route · destination NOT verified','เส้นทางฝึก · ยังไม่ยืนยันปลายทาง')}</span></div>
      <button className="link-button" onClick={p.onPlan}>{t('Confirm plan','ยืนยันแผน')} ↗</button>
    </div>
    <div className="escape-route-progress" aria-label={t('Practice route progress','ความคืบหน้าเส้นทางฝึก')}>
      <div><strong>{Math.round(p.remainingM).toLocaleString()} m</strong> {t('remaining','เหลือ')} · {p.pace.toFixed(1)} m/s {t('model pace','จังหวะจำลอง')}</div>
      <progress max={Math.max(1,p.totalM)} value={Math.max(0,p.totalM-p.remainingM)} aria-label={t('Distance covered','ระยะทางที่ผ่านแล้ว')}/>
      <div className="escape-distance-ticks"><span>0</span><span>{(p.totalM/2000).toFixed(1)}</span><span>{(p.totalM/1000).toFixed(2)} km</span></div>
    </div>
    <TimeScrubber label={t('Practice time since exercise warning','เวลาแบบฝึกหลังสัญญาณ')} duration={p.duration} value={p.seconds} onChange={p.onSeek}/>
    <p className="escape-clock-note">{t('Exercise clock, not time before a wave.','นาฬิกาแบบฝึก ไม่ใช่เวลาก่อนคลื่นมา')}</p>
    {p.started && <p className="escape-time-to-endpoint"><strong>{t('Time to endpoint','เวลาถึงปลายทาง')}</strong> +{waitClock(Math.max(0, p.finishSeconds - p.seconds))}</p>}
    <div className="escape-levels">
      <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 10q3-4 6 0t6 0t6 0M2 16q3-4 6 0t6 0t6 0"/></svg><b>+{p.waterLevel.toFixed(1)} m</b> {t('demo level','ระดับน้ำสาธิต')}</span>
      <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 20 8-15 5 8 3-4 5 11Z"/></svg><b>{p.groundElevation===null?'—':`≈${Math.round(p.groundElevation)} m`}</b> {t('coarse DEM','DEM หยาบ')}</span>
    </div>
    <div className="escape-water-scale"><progress max={p.peak} value={Math.max(0,Math.min(p.peak,p.waterLevel))} aria-label={t('Illustrative water level','ระดับน้ำเพื่อการสาธิต')}/><div className="escape-distance-ticks"><span>0</span><span>{p.peak/2}</span><span>{p.peak} m · {t('chosen peak','ค่าสูงสุดที่ตั้ง')}</span></div></div>
    <p className="escape-water-note">{t('No local wave prediction. Water does not affect walkers. These heights cannot establish safety.','ไม่มีการพยากรณ์คลื่นเฉพาะพื้นที่ น้ำไม่เปลี่ยนการเดิน ค่าความสูงนี้ยืนยันความปลอดภัยไม่ได้')}</p>
    {p.method}
    {arrived&&<div className="escape-review" role="status"><strong>{t('Finished at','สิ้นสุดที่')} +{waitClock(p.finishSeconds)}</strong> · {t('this walker’s total queue wait','เวลารอคิวรวมของตัวแทนนี้')} {waitClock(p.queueSeconds)}<p>{t('Endpoint unapproved. Count everyone at a locally confirmed meeting point in a real drill.','ปลายทางยังไม่รับรอง การซ้อมจริงต้องตรวจนับทุกคนที่จุดนัดหมายซึ่งยืนยันในพื้นที่')}</p><button onClick={p.onReview}>{t('Record a drill','บันทึกการซ้อม')} →</button></div>}
  </section>;
}

export function EscapeMethod({language}:{language:ManualLanguage}) {
  const t=(en:string,th:string)=>language==='th'?th:en;
  return <><p>{t('Arrows follow an OSM practice path, not an approved evacuation route. Only explicit source heights extrude; unknown and floor-estimated buildings remain flat. Footprints do not establish entrances. The coarse DEM and chosen water surface have no verified common vertical datum here; their difference is not a flood depth or safety margin.','ลูกศรตามทางฝึกจาก OSM ไม่ใช่เส้นทางอพยพที่รับรอง อาคารสามมิติใช้เฉพาะความสูงที่ต้นทางระบุ ส่วนที่ไม่ทราบหรือประมาณจากชั้นแสดงแบน รูปอาคารไม่ยืนยันทางเข้า ยังไม่ยืนยันระบบอ้างอิงความสูงร่วมของ DEM หยาบกับผิวน้ำที่ตั้งขึ้น ผลต่างจึงไม่ใช่ความลึกน้ำหรือระยะปลอดภัย')}</p><p>{t('Separate research context: in the unreviewed Khao Lak preprint, the PD50 walking-preference package changes modeled victim share from 21.8% to 7.0% among 39,041 synthetic agents under baseline timing (§4.3). This browser exercise does not compute those outcomes.','บริบทงานวิจัยที่แยกกัน: บทความเขาหลักก่อนตีพิมพ์ที่ยังไม่ผ่านการประเมิน รายงานว่าชุด PD50 เปลี่ยนผู้ประสบภัยจำลองจาก 21.8% เป็น 7.0% ในตัวแทนสังเคราะห์ 39,041 ราย ภายใต้เงื่อนไขเวลาฐาน (หัวข้อ 4.3) แบบฝึกในเบราว์เซอร์นี้ไม่ได้คำนวณผลดังกล่าว')} <a href="https://ssrn.com/abstract=7270357">SSRN 7270357 ↗</a></p><p>{t('Stay away from the coast until local officials permit return. The first wave may not be the largest.','อยู่ห่างชายฝั่งจนเจ้าหน้าที่อนุญาตให้กลับ คลื่นแรกอาจไม่ใช่คลื่นใหญ่ที่สุด')}</p></>;
}

/** Remains outside reading pagination so animation can always be paused. */
export function EscapePlayback(p:EscapeGuideProps) {
  const t=(en:string,th:string)=>p.language==='th'?th:en;
  const replay=p.started&&p.state==='arrived'&&!p.playing;
  const loading=!p.ready&&!p.playing&&!p.started;
  return <div className="escape-playback" lang={p.language}>
      <button className="primary" disabled={!p.ready&&!p.playing} onClick={replay?()=>{p.onReset();p.onPlay();}:p.onPlay} aria-label={loading?t('Loading terrain, practice not ready yet','กำลังโหลดภูมิประเทศ ยังเริ่มแบบฝึกไม่ได้'):p.playing?t('Pause escape practice','หยุดแบบฝึกอพยพชั่วคราว'):replay?t('Replay escape practice','เล่นแบบฝึกอพยพใหม่'):t('Play escape practice','เล่นแบบฝึกอพยพ')}><span aria-hidden="true">{loading?'…':p.playing?'Ⅱ':replay?'↺':'▶'}</span> {loading?t('Loading','กำลังโหลด'):p.playing?t('Pause','หยุด'):replay?t('Replay','เล่นใหม่'):p.started?t('Resume','เล่นต่อ'):t('Start','เริ่ม')}</button>
      <button onClick={p.onReset} aria-label={t('Reset escape practice','เริ่มแบบฝึกอพยพใหม่')} title={t('Reset','เริ่มใหม่')}>↺</button>
      <button onClick={p.onStyle} aria-pressed={!p.schematic} aria-label={p.schematic?t('Show imagery context','แสดงบริบทภาพถ่าย'):t('Show simplified terrain','แสดงภูมิประเทศแบบเรียบ')} title={p.schematic?t('Imagery context','บริบทภาพถ่าย'):t('Simplified terrain','ภูมิประเทศแบบเรียบ')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h18v18H3Zm1 14 5-6 4 4 3-3 5 6"/><circle cx="15" cy="8" r="2"/></svg></button>
      <span className="escape-clock">+{waitClock(p.seconds)}</span>
      <select aria-label={t('Practice playback speed','ความเร็วเล่นแบบฝึก')} value={p.rate} onChange={e=>p.onRate(Number(e.target.value))}>{[1,5,30,120].map(v=><option key={v} value={v}>{v}×</option>)}</select>
    </div>;
}
