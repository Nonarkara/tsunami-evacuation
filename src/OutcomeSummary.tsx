import { outcomes, POPULATION, type Condition } from './research';
import { manualLanguage } from './manual-content';
import { DotGrid } from './charts';

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
    <DotGrid parts={parts} caption={<>{t('1 dot = 1% of','1 จุด = 1% ของ')} {POPULATION.toLocaleString('en-US')} {t('modeled agents','ตัวแทนจำลอง')}{o.reached===null?t(' · arrival split not reported for this package',' · ไม่ได้รายงานการแยกผลสำหรับมาตรการนี้'):''}</>} />
  </section>;
}
