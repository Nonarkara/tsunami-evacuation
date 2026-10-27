import { outcomes, POPULATION, type Condition } from './research';
import { manualLanguage } from './manual-content';

export function OutcomeSummary({ step, condition }: { step: number; condition: Condition }) {
  const o = outcomes(step, condition);
  const language = manualLanguage(location.search,navigator.language);
  const t = (en: string, th: string) => language==='th'?th:en;
  const parts = o.reached===null ? [
    {value:o.affected,label:t('Modeled victims','ผู้ประสบภัยจำลอง'),kind:'victims'},
    {value:100-o.affected,label:t('Not classified as modeled victims','ไม่จัดเป็นผู้ประสบภัยจำลอง'),kind:'unclassified'},
  ] : [
    {value:o.reached,label:t('Reached modeled sites','ถึงจุดที่แบบจำลองกำหนด'),kind:'reached'},
    {value:o.outside!,label:t('Outside affected area','นอกพื้นที่ได้รับผลกระทบ'),kind:'outside'},
    {value:o.affected,label:t('Modeled victims','ผู้ประสบภัยจำลอง'),kind:'victims'},
  ];
  return <section className="outcome-summary" lang={language} aria-label={t('Modeled outcome accounting','การจัดหมวดผลแบบจำลอง')}>
    <div className="outcome-heading"><span>{t('Modeled outcome','ผลแบบจำลอง')} · {POPULATION.toLocaleString('en-US')} {t('agents','ตัวแทน')}</span><span>0–100%</span></div>
    <div className="outcome-strip" role="img" aria-label={parts.map(p=>`${p.label}: ${p.value.toFixed(1)}%`).join('; ')}>{parts.map(p=><span key={p.kind} className={p.kind} style={{width:`${p.value}%`}}/>)}</div>
    <dl className={`outcome-records ${o.reached===null?'partial':''}`}>{parts.map(p=><div key={p.kind}><dt>{p.label}</dt><dd>{p.value.toFixed(1)}%</dd></div>)}</dl>
  </section>;
}
