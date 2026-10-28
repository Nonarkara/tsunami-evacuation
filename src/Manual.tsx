import { cycleDialogFocus } from './dialog-focus';
import { PagedFlow } from './PagedFlow';
import { useEffect, useRef, useState } from 'react';
import { NavSymbol } from './NavSymbol';
import { manualOrder, manualTopics, manualLanguage, type ManualLanguage, type ManualPage } from './manual-content';

export function Manual({ open, page, onClose, onNavigate }: { open: boolean; page: ManualPage; onClose: () => void; onNavigate: (page: ManualPage) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [language, setLanguage] = useState<ManualLanguage>(() => manualLanguage(location.search, navigator.language));
  const previousSearch = useRef(location.search);
  const t = (en: string, th: string) => language === 'th' ? th : en;
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      if (previousSearch.current !== location.search) setLanguage(manualLanguage(location.search, navigator.language));
      previousSearch.current = location.search;
      element.showModal();
      element.querySelector<HTMLButtonElement>('.manual-close')?.focus({ preventScroll: true });
    }
    if (!open && element.open) element.close();
  }, [open]);

  useEffect(()=>{
    function keepFocusInManual(event:KeyboardEvent){
      const element=dialog.current;
      if(element)cycleDialogFocus(element,event);
    }
    document.addEventListener('keydown',keepFocusInManual,true);
    return()=>document.removeEventListener('keydown',keepFocusInManual,true);
  },[]);

  return <dialog ref={dialog} className="user-manual" lang={language} aria-labelledby="manual-title" onClose={onClose}>
    <div className="manual-heading">
      <h2 id="manual-title">{t('How to use Soonami', 'วิธีใช้ Soonami')}</h2>
      <div className="manual-languages" role="group" aria-label="Manual language / ภาษาคู่มือ">
        <button lang="th" aria-pressed={language === 'th'} onClick={()=>setLanguage('th')}>ไทย</button>
        <button lang="en" aria-pressed={language === 'en'} onClick={()=>setLanguage('en')}>English</button>
      </div>
      <button className="manual-close" aria-label="Close manual / ปิดคู่มือ" title={t('Close · Esc', 'ปิด · Esc')} onClick={onClose} autoFocus>×</button>
    </div>
    <PagedFlow label="Manual"><p className="manual-scope">{t('A planning and learning tool. No live warning, wave forecast or approved route guidance.', 'เครื่องมือวางแผนและเรียนรู้ ไม่มีคำเตือนแบบเวลาจริง การพยากรณ์คลื่น หรือคำแนะนำเส้นทางที่ได้รับอนุมัติ')}</p>
    <section aria-labelledby="manual-start-title" className="manual-start">
      <h3 id="manual-start-title">{t('Start here', 'เริ่มตรงนี้')}</h3>
      <ol>
        <li><button onClick={()=>onNavigate('explore')}>{t('Explore the area', 'สำรวจพื้นที่')}</button> — {t('select a region and place; try 2D or 3D.', 'เลือกพื้นที่และสถานที่ แล้วลองมุมมอง 2D หรือ 3D')}</li>
        <li><button onClick={()=>onNavigate('prepare')}>{t('Make a plan', 'จัดทำแผน')}</button> — {t('record locally confirmed routes, destinations and assistance.', 'บันทึกเส้นทาง ปลายทาง และการช่วยเหลือที่ยืนยันในพื้นที่')}</li>
        <li><button onClick={()=>onNavigate('research')}>{t('Check the evidence', 'ตรวจหลักฐาน')}</button> — {t('read sources and limits before using a result.', 'อ่านแหล่งข้อมูลและข้อจำกัดก่อนใช้ผลลัพธ์')}</li>
      </ol>
    </section>
    <div className="manual-topics">
      {[page, ...manualOrder.filter(id=>id !== page)].map(id=>{
        const topic = manualTopics[id];
        return <details key={id}>
          <summary><NavSymbol name={id}/><span>{topic.name[language]}</span></summary>
          <ol>{topic.steps.map((step,i)=><li key={i}>{step[language]}</li>)}</ol>
          <p className="manual-note">{topic.note[language]}</p>
          <button className="manual-go" onClick={()=>onNavigate(id)}>{t('Open this section', 'เปิดส่วนนี้')} →</button>
        </details>;
      })}
    </div>
  </PagedFlow></dialog>;
}
