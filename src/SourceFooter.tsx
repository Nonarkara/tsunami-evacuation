import { CITATION, CREATOR, PAPER } from './research';
import type { ManualLanguage } from './manual-content';

export function SourceFooter({onResearch,language}:{onResearch:()=>void;language:ManualLanguage}) {
  const t=(en:string,th:string)=>language==='th'?th:en;
  return <footer className="soonami-footer source-footer" lang={language}>
    <div className="source-footer-row"><details className="source-credits"><summary>{t('Study & credits','ที่มาและผู้จัดทำ')}</summary>
      <div className="source-credit-text"><p lang="en"><a href={PAPER} target="_blank" rel="noreferrer">{CITATION}</a></p><p lang="en">{CREATOR}. AIT / Mahidol. Soonami (สู้-nami).</p><p>{t('Reported site arrivals: baseline package 60.7% → complete package 93.6% under baseline timing; 56.8% → 88.9% under delayed timing. These historical modeled outcomes are not certified refuge arrivals or live predictions.','สัดส่วนถึงจุดที่แบบจำลองกำหนด: กรณีฐาน60.7% → ชุดครบ93.6% ภายใต้เวลาฐาน และ56.8% → 88.9% ภายใต้เวลาล่าช้า เป็นผลจำลองในฉากทัศน์ ไม่ใช่จุดอพยพที่ได้รับการรับรองหรือการพยากรณ์สด')}</p></div>
    </details><a className="source-short-link" href={PAPER} target="_blank" rel="noreferrer">SSRN 7270357 ↗</a><button className="footer-research-link" onClick={onResearch}>{t('Research','งานวิจัย')} →</button></div>
  </footer>;
}
