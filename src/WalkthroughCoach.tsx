import { ReadingDialog } from './ReadingDialog';
import type { ManualLanguage } from './manual-content';
import { EvacuationGuide } from './EvacuationGuide';

const clock=(s:number)=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
export function WalkthroughCoach({language,state,remainingM,finishSeconds,remainingSeconds,queueSeconds,pace,runner,onReview,full=false}:{language:ManualLanguage;state:string;remainingM:number;finishSeconds:number;remainingSeconds:number;queueSeconds:number;pace:number;runner?:{pace:number;remainingM:number;finishSeconds:number};onReview:()=>void;full?:boolean}) {
  const t=(en:string,th:string)=>language==='th'?th:en;
  const stages={
    preparing:[t('01 / Before departure','01 / ก่อนออกเดิน'),t('Observe the release delay','สังเกตเวลารอก่อนออกเดิน'),t('The selected synthetic walker is waiting for release. In a field drill, record warning receipt, preparation and departure separately; assign assistance before starting.','ตัวแทนที่เลือกยังรอออกเดิน ในการซ้อมจริงให้แยกเวลารับสัญญาณ เตรียมตัว และออกเดิน พร้อมจัดคนช่วยเหลือก่อนเริ่ม')],
    moving:[t('02 / Follow the route','02 / ติดตามเส้นทาง'),t('Check the next decision point','ตรวจจุดตัดสินใจข้างหน้า'),t('Arrows follow this mapped exercise route. Inspect actual crossings, gates, signs and accessible alternatives with local coordinators; the browser cannot verify passage.','ลูกศรตามเส้นทางแบบฝึกบนแผนที่ ให้ตรวจทางข้าม ประตู ป้าย และทางเลือกที่เข้าถึงได้กับผู้ประสานงานในพื้นที่ เบราว์เซอร์ยืนยันการผ่านจริงไม่ได้')],
    queued:[t('03 / Inspect the queue','03 / ตรวจคิว'),t('Waiting at a model node','รอที่จุดในแบบจำลอง'),t('The total is a point queue, not a physical crowd footprint. During a field drill, observe where waiting starts, what blocks movement and who needs assistance.','ยอดรวมเป็นคิวที่จุด ไม่ใช่พื้นที่ฝูงชนจริง ในการซ้อมให้สังเกตจุดเริ่มรอ สิ่งกีดขวาง และผู้ต้องการความช่วยเหลือ')],
    arrived:[t('04 / Review the exercise','04 / ทบทวนแบบฝึก'),t('Reaching this endpoint is not a safety verdict','ถึงปลายทางนี้ไม่ใช่การรับรองความปลอดภัย'),t('This endpoint is unapproved. For a real drill, use the locally confirmed meeting point, reconcile every participant and record one change with an owner and review date.','ปลายทางนี้ยังไม่ได้รับการรับรอง การซ้อมจริงต้องใช้จุดนัดหมายที่ยืนยันในพื้นที่ ตรวจนับทุกคน และบันทึกสิ่งที่ต้องแก้พร้อมผู้รับผิดชอบและวันทบทวน')],
  };
  const stage=stages[state as keyof typeof stages]??stages.preparing;
  return <section className="walkthrough-coach" lang={language} aria-label={t('Guided route rehearsal','แบบฝึกเส้นทางพร้อมคำอธิบาย')}>
    <div className="coach-heading"><span className="eyebrow">{stage[0]}</span><strong>{stage[1]}</strong></div>
    <dl className="coach-metrics"><div><dt>{t('Remaining route','ระยะทางที่เหลือ')}</dt><dd>{Math.round(remainingM).toLocaleString()} m</dd></div><div><dt>{t('This walker’s pace','จังหวะของตัวแทนนี้')}</dt><dd>{pace.toFixed(1)} m/s</dd></div><div><dt>{t('Selected walker finish','เวลาถึงของตัวแทนที่เลือก')}</dt><dd>+{clock(finishSeconds)}</dd></div><div><dt>{t('Exercise time remaining','เวลาแบบฝึกที่เหลือ')}</dt><dd>{clock(remainingSeconds)}</dd></div><div><dt>{t('Total scheduled node wait','เวลารอที่จุดรวมตามแบบฝึก')}</dt><dd>{clock(queueSeconds)}</dd></div>{runner&&<div className="runner-metric"><dt>{t('Runner on the same route','ผู้วิ่งบนเส้นทางเดียวกัน')}</dt><dd>{runner.pace.toFixed(1)} m/s · {Math.round(runner.remainingM).toLocaleString()} m to go · +{clock(runner.finishSeconds)}</dd></div>}</dl>
    <p>{stage[2]}</p><p className="field-note">{t('Clock starts at the exercise warning. Scheduled times include this walker’s modeled queues; they are not wave-arrival margins.','นาฬิกาเริ่มที่สัญญาณแบบฝึก เวลารวมคิวจำลองของตัวแทนนี้ ไม่ใช่เวลาคงเหลือก่อนคลื่นมาถึง')}</p>
    {runner&&<p className="field-note">{t('The runner is the same synthetic person at a run pace. Running is an experiment, not advice, and it is not modelled against any wave time.','ผู้วิ่งคือตัวแทนคนเดียวกันที่เปลี่ยนจังหวะเป็นการวิ่ง การวิ่งเป็นการทดลอง ไม่ใช่คำแนะนำ และไม่ได้เทียบกับเวลาคลื่นใด ๆ')}</p>}
    <div className="coach-next"><button onClick={onReview}>{t('Record a real drill','บันทึกการซ้อมจริง')} →</button>{!full&&<ReadingDialog language={language} title={t('Full field walkthrough','ขั้นตอนลงพื้นที่ทั้งหมด')}><EvacuationGuide language={language} compact/></ReadingDialog>}</div>
    {full&&<EvacuationGuide language={language} compact/>}
  </section>;
}
