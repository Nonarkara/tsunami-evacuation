import type { ManualLanguage } from './manual-content';

/** General coastal warning response, never a location-specific forecast or route. */
export function WarningLesson({language}:{language:ManualLanguage}) {
  const t=(en:string,th:string)=>language==='th'?th:en;
  return <section className="warning-lesson" lang={language} aria-label={t('Real coastal warnings','สัญญาณเตือนจริงที่ชายฝั่ง')}>
    <p className="warning-condition">{t('At the coast: if you notice ANY ONE…','ที่ชายฝั่ง: หากพบอย่างใดอย่างหนึ่ง…')}</p>
    <div className="warning-chain">
      <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 6 3-3 2 5-3 3 2 5-3 3M12 3l-2 7 5 3-2 8M19 4l2 4-3 4 3 5-2 4"/></svg>{t('Strong / long shake','สั่นแรง / นาน')}</span>
      <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 16q3-4 6 0t6 0t6 0M5 6h14m-4-4 4 4-4 4"/></svg>{t('Strange sea / roar','ทะเลผิดปกติ / คำราม')}</span>
      <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 16V9a5 5 0 0 1 10 0v7M4 17h16M12 1v2M3 5l2 2m16-2-2 2M9 21h6"/></svg>{t('Official warning','เตือนจากทางการ')}</span>
      <strong><span aria-hidden="true">→</span>{t('Move inland / higher','ไปทางบก / ที่สูง')}</strong>
    </div>
    <p>{t('Protect yourself during shaking. Move as soon as safe; follow local evacuation signs. Don’t wait to see water.','ป้องกันตัวขณะสั่น เคลื่อนที่ทันทีเมื่อทำได้ปลอดภัย ตามป้ายอพยพในพื้นที่ ไม่รอเห็นน้ำ')}</p>
    <div className="warning-source"><span>{t('Children: go with a trusted adult.','เด็ก: ไปกับผู้ใหญ่ที่ไว้ใจ')}</span><a href="https://www.weather.gov/safety/tsunami-during" target="_blank" rel="noreferrer">NWS ↗</a><span>{t('Local instructions first','ยึดคำสั่งในพื้นที่')}</span></div>
  </section>;
}
