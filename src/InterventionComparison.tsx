import { scenarios, reduction, type Condition } from './research';
import { manualLanguage } from './manual-content';

export function InterventionComparison({ step, condition, onSelect }: { step: number; condition: Condition; onSelect: (step: number) => void }) {
  const language = manualLanguage(location.search, navigator.language);
  const t = (en: string, th: string) => language === 'th' ? th : en;
  const names = scenarios.map((s,i)=>t(i===3?'+ VE50':s.short,['กรณีฐาน','เดินเท้า','+ อาคาร','+ VE50','+ ป้าย'][i]));
  return <div className="scenario-table-compact comparison-selector" role="region" aria-label="Intervention package selector" lang={language}>
    <p className="comparison-heading">{t('Modeled victim share (%)','ผู้ประสบภัยจำลอง (%)')} <span>{t('Warning 30/45 · mean prep 14/28 min','เตือน 30/45 · เตรียมตัวเฉลี่ย 14/28 นาที')}</span></p>
    <div className="comparison-axis" aria-hidden="true"><span>{t('Package · cumulative','มาตรการสะสม')}</span><span className="comparison-axis-ticks">{[0,5,10,15,20,25].map(n=><span key={n} style={{left:`${n*4}%`}}>{n}</span>)}</span><span>%</span></div>
    <div className="scenario-list">
      {scenarios.map((s,i)=><button key={s.id} className={step===i?'active':''} aria-pressed={step===i} onClick={()=>onSelect(i)} title={i===3?t('VE50 · vertical-evacuation preference 50%','VE50 · ความต้องการอพยพแนวดิ่ง 50%'):s.label} aria-label={t(`${i===3?'VE50 · vertical-evacuation preference50%':s.label}: warning30/mean preparation14 minutes ${s.affected.toFixed(1)}%, warning45/mean preparation28 minutes ${s.delayed.toFixed(1)}% modeled victims. ${i===0?'Reference package':`${reduction(i,condition).toFixed(0)}% reduction versus reference under the selected timing condition`}.`,`${i===3?'VE50 ความต้องการอพยพแนวดิ่ง50%':names[i]}: เตือน30/เตรียมตัวเฉลี่ย14นาที ${s.affected.toFixed(1)}%, เตือน45/เตรียมตัวเฉลี่ย28นาที ${s.delayed.toFixed(1)}% ผู้ประสบภัยจำลอง ${i===0?'กรณีฐาน':`ลดลง${reduction(i,condition).toFixed(0)}%จากฐานตามเงื่อนไขที่เลือก`}`)}>
        <span className="comparison-package"><span><span className="step-num">{i===0?'—':`0${i}`}</span> {names[i]}</span><small>{i===0?t('Reference','กรณีอ้างอิง'):`−${reduction(i,condition).toFixed(0)}% ${t('vs base','จากฐาน')}`}</small></span>
        <span className="comparison-bars" aria-hidden="true"><span className="comparison-bar baseline" style={{width:`${s.affected*4}%`}}/><span className="comparison-bar delayed" style={{width:`${s.delayed*4}%`}}/></span>
        <span className="comparison-values" aria-hidden="true"><span className={condition==='baseline'?'current':''}>30′ {s.affected.toFixed(1)}</span><span className={condition==='delayed'?'current':''}>45′ {s.delayed.toFixed(1)}</span></span>
      </button>)}
    </div>
  </div>;
}
