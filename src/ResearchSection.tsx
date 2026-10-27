import { useState } from 'react';
import { scenarios, POPULATION } from './research';
import { bi, bibtex, evidenceCsv, glossary, packageNames, paperCitation, reviewedOn, sourceRows, type ResearchLanguage } from './research-ledger';

export function ResearchSection({ onExplore, onLanguageChange }: { onExplore: () => void; onLanguageChange: (language: ResearchLanguage) => void }) {
  const [language, setLanguage] = useState<ResearchLanguage>(() => {
    const requested = new URLSearchParams(location.search).get('lang');
    return requested === 'th' || requested === 'en' ? requested : navigator.language.startsWith('th') ? 'th' : 'en';
  });
  const [filter, setFilter] = useState('all');
  const t = (en: string, th: string) => language === 'th' ? th : en;
  function changeLanguage(next: ResearchLanguage) {
    setLanguage(next);
    const url = new URL(location.href); url.searchParams.set('lang', next);
    history.replaceState(null, '', url);
    onLanguageChange(next);
  }
  function save(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a'); link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const timing = [
    [bi('Warning after earthquake', 'แจ้งเตือนหลังแผ่นดินไหว'), '30', '45'],
    [bi('Mean preparation', 'เวลาเตรียมตัวเฉลี่ย'), '14', '28'],
    [bi('Modeled shore arrival', 'คลื่นถึงฝั่งในฉากทัศน์'), '135', '135'],
  ] as const;
  return <article className="research-dossier" lang={language} aria-labelledby="research-title">
    <header className="research-heading">
      <div><span className="eyebrow">{t('Research / Khao Lak', 'งานวิจัย / เขาหลัก')}</span><h1 id="research-title">{t('Evidence, methods & limits', 'หลักฐาน วิธีวิจัย และข้อจำกัด')}</h1></div>
      <div className="research-language" role="group" aria-label="Research language / ภาษางานวิจัย">
        <button lang="th" aria-pressed={language === 'th'} onClick={() => changeLanguage('th')}>ไทย</button><button lang="en" aria-pressed={language === 'en'} onClick={() => changeLanguage('en')}>English</button>
      </div>
    </header>
    <p className="research-scope">{t('One unreviewed Khao Lak preprint and our browser methods. No live forecast or approved routes.', 'ผลจากบทความเขาหลักที่ยังไม่ผ่านการประเมิน และวิธีของแบบฝึกในเบราว์เซอร์ ไม่ใช่การพยากรณ์แบบเวลาจริงหรือเส้นทางที่ได้รับอนุมัติ')}</p>
    <nav className="research-index" aria-label={t('Research sections','หัวข้องานวิจัย')}>{[
      ['results',t('Results','ผลการศึกษา')],['methods',t('Methods','วิธีวิจัย')],['sources',t('Sources','แหล่งข้อมูล')],['validation',t('Validation','แผนตรวจสอบ')],['reproduce',t('Reproduce & cite','ทำซ้ำและอ้างอิง')],
    ].map(([id,label])=><a key={id} href={`#research-${id}`}>{label}</a>)}</nav>

    <section id="research-results" aria-labelledby="results-title">
      <div className="research-section-head"><h2 id="results-title">{t('01 / Reported scenario results','01 / ผลลัพธ์ของฉากทัศน์ที่รายงาน')}</h2><a href="#source-R1" onClick={e=>{ e.preventDefault(); setFilter("all"); requestAnimationFrame(()=>{ document.getElementById("source-R1")?.scrollIntoView(); history.replaceState(null,"","#source-R1"); }); }}>{t('Source [R1] · §4.1–4.5','แหล่ง [R1] · หัวข้อ 4.1–4.5')}</a></div>

      <figure className="research-results-figure">
        <figcaption>{t('Modeled victim share (%) · cumulative packages · bars 0–25%','ผู้ประสบภัยตามเกณฑ์แบบจำลอง (%) · มาตรการสะสม · กราฟ 0–25%')}</figcaption>
        <table className="research-results-table"><thead><tr><th scope="col">{t('Package','ชุดมาตรการ')}</th><th scope="col">{t('Baseline','ฐาน')}</th><th scope="col">{t('Delayed','ล่าช้า')}</th></tr></thead>
          <tbody>{scenarios.map((s,i)=><tr key={s.id}><th scope="row">{packageNames[i][language]}</th>{(['baseline','delayed'] as const).map(c=><td key={c} className={`research-value ${c}`}>{(c==='baseline'?s.affected:s.delayed).toFixed(1)}%<span className="research-bar-track" aria-hidden="true"><span style={{width:`${(c==='baseline'?s.affected:s.delayed)/25*100}%`}} /></span></td>)}</tr>)}</tbody>
        </table>
      </figure>
      <p className="research-qualification">{t('Population is estimated, not a current census. “Victims” means trapped agents in cells with water deeper than 0.5 m under the source rule (§3.2.5, pp. 15–16). These are not observed deaths, individual probabilities or independently reproduced predictions.', 'จำนวนประชากรเป็นค่าประมาณ ไม่ใช่สำมะโนปัจจุบัน “ผู้ประสบภัย” หมายถึงตัวแทนที่ติดอยู่ในกริดซึ่งมีน้ำลึกเกิน 0.5 เมตร ตามเกณฑ์ของต้นฉบับ (หัวข้อ 3.2.5 หน้า 15–16) ไม่ใช่จำนวนผู้เสียชีวิตจริง ความน่าจะเป็นรายบุคคล หรือการพยากรณ์ที่ทำซ้ำโดยอิสระแล้ว')}</p>
      <div className="research-axioms-card">
        <h3>{t('Four Physical Axioms: Why the casualty rate falls from 21.8% to 1.2%', '4 สัจพจน์เชิงประจักษ์: เหตุใดตัวเลขความสูญเสียจึงลดลงจาก 21.8% สู่ 1.2%')}</h3>
        <div className="research-axiom-grid">
          <div className="axiom-box">
            <span className="axiom-tag">01 / {t('Vehicular Gridlock', 'กับดักยานพาหนะ')}</span>
            <strong>{t('Highway 4 becomes a trap', 'ทางหลวงหมายเลข 4 กลายเป็นคอขวดมรณะ')}</strong>
            <p>{t(
              'Attempting to flee by car chokes Highway 4 into standstill gridlock within 6–8 minutes. Switching 50% to foot evacuation (PD50) clears arterial jams and cuts victim share from 21.8% to 7.0%—a 68% drop achieved by walking alone.',
              'การพยายามหนีด้วยรถยนต์ทำให้ทางหลวงหมายเลข 4 กลายเป็นอัมพาตภายใน 6–8 นาที ผู้หนีภัยติดค้างในรถเมื่อคลื่นมาถึง การเปลี่ยนให้เดินเท้า 50% (PD50) ช่วยปลดล็อกคอขวดบนถนนสายหลัก ลดผู้ประสบภัยจาก 21.8% เหลือ 7.0% (ลดลงถึง 68% จากการเดินเท้าเพียงอย่างเดียว)'
            )}</p>
          </div>
          <div className="axiom-box">
            <span className="axiom-tag">02 / {t('Vertical Refuge', 'อาคารหลบภัยแนวดิ่ง')}</span>
            <strong>{t('TVEBs within 200–400m save lives', 'อาคารหลบภัยในระยะ 200–400 ม. ชี้ขาดรอดชีวิต')}</strong>
            <p>{t(
              'Khao Lak’s hills sit 1.5–2.5 km inland—too far for vulnerable pedestrians to reach in time. Designating 14 certified reinforced concrete hotel buildings (VS14) and directing 50% vertically (VE50) plummets victim share to 1.3%, replacing a 30-minute flat sprint with a 3-minute stair climb.',
              'เนินเขาของเขาหลักอยู่ลึกเข้าไป 1.5–2.5 กม. ซึ่งไกลเกินกว่ากลุ่มเปราะบางจะเดินเท้าถึงได้ทัน การกำหนดอาคารคอนกรีตเสริมเหล็กริมหาด 14 แห่ง (VS14) และนำคน 50% ขึ้นชั้น 3 ขึ้นไป (VE50) ลดผู้ประสบภัยเหลือ 1.3% เปลี่ยนการวิ่งหนี 30 นาที เป็นการขึ้นที่สูงในเวลาเพียง 3 นาที'
            )}</p>
          </div>
          <div className="axiom-box">
            <span className="axiom-tag">03 / {t('Signage Multiplier', 'พลังทวีคูณของป้าย')}</span>
            <strong>{t('135 signs resolve intersection hesitation', 'ป้ายบอกทาง 135 จุด ขจัดความลังเลที่ทางแยก')}</strong>
            <p>{t(
              'Installing 135 bilingual wayfinding signs along perpendicular foot corridors eliminates intersection confusion and wrong-way fleeing, driving casualties down to 1.2% (baseline) and 2.9% (delayed)—a 94.5% cumulative reduction.',
              'การติดตั้งป้ายนำทาง 2 ภาษา 135 จุด ตลอดเส้นทางเดินตั้งฉากกับชายหาด ช่วยขจัดความสับสน ณ ทางแยก ลดผู้ประสบภัยเหลือ 1.2% (กรณีฐาน) และ 2.9% (กรณีล่าช้า) บรรลุการลดทอนความสูญเสียสะสมถึง 94.5%'
            )}</p>
          </div>
          <div className="axiom-box">
            <span className="axiom-tag">04 / {t('Warning Buffer', 'เวลาเตือนภัย')}</span>
            <strong>{t('15 minutes delay doubles the casualties', 'ความล่าช้า 15 นาที เพิ่มผู้ประสบภัยกว่าเท่าตัว')}</strong>
            <p>{t(
              'A 15-minute delay in broadcasting the siren (30m vs 45m post-earthquake) more than doubles casualties in the optimal package (1.2% → 2.9%). Early automated detection and immediate foot departure without waiting for confirmation are non-negotiable.',
              'การแจ้งเตือนช้าไปเพียง 15 นาที (จาก 30 นาที เป็น 45 นาทีหลังแผ่นดินไหว) ทำให้ยอดผู้ประสบภัยเพิ่มขึ้นกว่าเท่าตัวแม้ใช้มาตรการสูงสุด (1.2% → 2.9%) การเตือนภัยอัตโนมัติที่รวดเร็วและการออกเดินเท้าทันทีจึงเป็นเรื่องที่ประนีประนอมไม่ได้'
            )}</p>
          </div>
        </div>
      </div>
      <p>{t('Question: under the study’s assumptions, how do cumulative walking, refuge, preference and signage measures change modeled victim share among 39,041 agents?', 'คำถาม: ภายใต้สมมติฐานของงานวิจัย การเพิ่มมาตรการเดินเท้า จุดอพยพ ความนิยมเลือกอพยพขึ้นอาคาร และป้ายบอกทางแบบสะสม เปลี่ยนสัดส่วนผู้ประสบภัยตามเกณฑ์ของแบบจำลองในตัวแทน 39,041 รายอย่างไร?')}</p>
      <details className="research-definitions"><summary>{t('Read package definitions and outcome accounting','อ่านนิยามมาตรการและการจัดหมวดผลลัพธ์')}</summary>
        <dl>{[
          ['PD50',bi('50% pedestrian preference; not everyone walking or a ban on assisted transport.','ความนิยมเลือกอพยพด้วยการเดิน 50% ไม่ใช่ให้ทุกคนเดินหรือห้ามการเดินทางที่ต้องมีผู้ช่วย')],
          ['VS14',bi('14 additional candidate buildings, beyond two existing sites. Structural suitability and emergency access are not certified here.','อาคารที่เสนอเป็นจุดอพยพแนวดิ่งเพิ่ม 14 แห่ง จากจุดเดิม 2 แห่ง ระบบนี้ไม่ได้รับรองโครงสร้างหรือการเข้าถึงยามฉุกเฉิน')],
          ['VE50',bi('50% vertical-evacuation preference. This is not a measured effect of real community drills.','ความนิยมเลือกอพยพขึ้นอาคาร 50% ไม่ใช่ผลที่วัดจากการซ้อมอพยพของชุมชนจริง')],
          ['SG135',bi('135 signs in total, up from 64; not 135 additional signs or a universal spacing rule.','ป้ายรวม 135 จุด จากเดิม 64 จุด ไม่ใช่เพิ่มอีก 135 จุด และไม่ใช่เกณฑ์ระยะห่างที่ใช้ได้ทุกพื้นที่')],
        ].map(([term,definition])=><div key={term as string}><dt>{term as string}</dt><dd>{typeof definition==='string'?definition:definition[language]}</dd></div>)}</dl>
        <p>{t('At baseline timing: 60.7% reach a site, 21.8% are modeled victims and 17.5% remain outside the affected area. With all measures: 93.6%, 1.2% and 5.2%. “Reached a site” and “outside the affected area” are separate outcomes. Residuals use 100 − reached − victims; intermediate packages do not have an invented complete breakdown.', 'ในเงื่อนไขเวลาฐาน: ถึงจุดอพยพ 60.7% เป็นผู้ประสบภัยตามเกณฑ์แบบจำลอง 21.8% และอยู่นอกพื้นที่ได้รับผลกระทบ 17.5% เมื่อใช้ครบทุกมาตรการเป็น 93.6%, 1.2% และ 5.2% ตามลำดับ “ถึงจุดอพยพ” กับ “อยู่นอกพื้นที่ได้รับผลกระทบ” เป็นคนละหมวด ค่าส่วนที่เหลือคำนวณจาก 100 − ผู้ถึงจุดอพยพ − ผู้ประสบภัย และไม่สร้างรายละเอียดครบทุกหมวดขึ้นเองสำหรับมาตรการระหว่างทาง')}</p>
        <p>{t('Relative reduction = 1 − package share / same-condition baseline share. The change 21.8% → 1.2% is 20.6 percentage points, or about 94.5% relative reduction; these are different quantities. Table 3 and §4.3 differ on baseline pedestrian preference (25% vs 27%); original parameter files are needed to resolve this.', 'การลดลงสัมพัทธ์ = 1 − สัดส่วนของชุดมาตรการ / สัดส่วนกรณีฐานภายใต้เงื่อนไขเดียวกัน การเปลี่ยนจาก 21.8% เป็น 1.2% คือ 20.6 จุดร้อยละ หรือการลดลงสัมพัทธ์ประมาณ 94.5% ซึ่งเป็นคนละปริมาณ ตาราง 3 กับหัวข้อ 4.3 ระบุความนิยมเดินเท้ากรณีฐานต่างกัน (25% กับ 27%) ต้องใช้ไฟล์พารามิเตอร์ต้นฉบับเพื่อยืนยัน')}</p>
      </details>
    </section>

    <section id="research-methods" aria-labelledby="methods-title">
      <h2 id="methods-title">{t('02 / Two models, different purposes','02 / แบบจำลองสองชุด วัตถุประสงค์ต่างกัน')}</h2>
      <div className="research-method-pair">
        <div><h3>{t('Published Unity ABMS [R1]','แบบจำลอง Unity ABMS ในบทความ [R1]')}</h3><p>{t('Environment + synthetic population → departure and mode choice → road/refuge movement → inundation-based outcome. The source estimates 39,041 people from 8,707 building units digitized from 2019 imagery and occupancy assumptions (Table 1, §3.2.1). Hazard cells are 30 × 30 m, updated every minute.', 'สภาพแวดล้อมและประชากรสังเคราะห์ → เวลาออกเดินทางและวิธีเดินทาง → การเคลื่อนที่ตามถนนและจุดอพยพ → ผลลัพธ์ตามน้ำท่วม ต้นฉบับประมาณประชากร 39,041 รายจากอาคาร 8,707 หน่วยที่ดิจิไทซ์จากภาพปี 2019 และสมมติฐานการใช้พื้นที่ (ตาราง 1 หัวข้อ 3.2.1) กริดน้ำท่วมมีขนาด 30 × 30 เมตร อัปเดตทุกนาที')}</p></div>
        <div><h3>{t('Browser point-queue rehearsal','แบบฝึกคิวบนโครงข่ายในเบราว์เซอร์')}</h3><p>{t('OSM paths + selected population, speed, width and preparation delay → FIFO link queues → route-following points and node totals. It has no physical crowd storage, collision, spillback, mobility mix, slope-speed response or water interaction. It does not reproduce the published victim rates.', 'เส้นทาง OSM และค่าจำนวนคน ความเร็ว ความกว้าง และเวลาเตรียมตัวที่เลือก → คิวบนช่วงทางแบบมาก่อนได้ก่อน → จุดเคลื่อนที่ตามทางและยอดรวมที่จุดคิว ไม่มีพื้นที่เก็บฝูงชนจริง การชน คิวล้นย้อนกลับ กลุ่มการเคลื่อนไหวที่หลากหลาย ผลความชันต่อความเร็ว หรือปฏิสัมพันธ์กับน้ำ และไม่ได้คำนวณสัดส่วนผู้ประสบภัยของบทความซ้ำ')}</p></div>
      </div>
      <div className="research-platform-card">
        <h3>{t('How Soonami Builds on the Research', 'Soonami ต่อยอดและยกระดับงานวิจัยอย่างไร')}</h3>
        <p>{t(
          'The 2026 SSRN preprint modeled a synthetic population in Khao Lak inside a standalone Unity environment. Soonami transforms these empirical insights into an active nationwide decision platform: expanding across 6 coastal regions in Thailand, integrating NOAA DART buoy 23401 deep-water pressure sensors and Royal Thai Navy tide gauge telemetry, rendering 3D digital elevation models with street-level walking networks, and offering interactive personal evacuation planners and community drill logs.',
          'บทความวิจัยปี 2026 จำลองประชากรสังเคราะห์ในเขาหลักด้วยระบบปิดของ Unity แต่ Soonami นำข้อค้นพบเชิงประจักษ์นี้มายกระดับเป็นแพลตฟอร์มการตัดสินใจระดับประเทศ: ขยายขอบเขตครอบคลุม 6 ภูมิภาคชายฝั่งทั่วไทย, เชื่อมโยงทุ่นเตือนภัยน้ำลึก NOAA DART 23401 และสถานีวัดระดับน้ำกองทัพเรือ, แสดงผลภูมิประเทศ 3 มิติพร้อมโครงข่ายทางเดินจริง, และมอบเครื่องมือวางแผนการอพยพรายบุคคลรวมถึงบันทึกการซ้อมอพยพของชุมชน'
        )}</p>
      </div>
      <figure className="research-timing"><figcaption>{t('Study timing (minutes): warning/shore arrival from earthquake; preparation is a duration [R1, §4.1–4.2; §3.2.3.1]','เวลาในงานวิจัย (นาที): คำเตือน/คลื่นถึงฝั่งนับจากแผ่นดินไหว ส่วนการเตรียมตัวเป็นระยะเวลา [R1 หัวข้อ 4.1–4.2 และ 3.2.3.1]')}</figcaption><table><thead><tr><th>{t('Assumption','สมมติฐาน')}</th><th>{t('Baseline','ฐาน')}</th><th>{t('Delayed','ล่าช้า')}</th></tr></thead><tbody>{timing.map(([label,a,b])=><tr key={label.en}><th scope="row">{label[language]}</th><td>{a}</td><td>{b}</td></tr>)}</tbody></table></figure>
      <p>{t('Preparation values are population-weighted means of distributions, not identical delays for everyone. Outside modeled warning-tower coverage, the paper assumes 15 more minutes of warning delay. The 135-minute shore arrival belongs to one earthquake scenario. The browser clock instead starts at the exercise warning; do not mix the time origins or use either clock as permission to wait.', 'เวลาเตรียมตัวเป็นค่าเฉลี่ยถ่วงน้ำหนักประชากรจากการแจกแจง ไม่ใช่ให้ทุกคนรอเท่ากัน พื้นที่นอกระยะหอเตือนภัยที่จำลองไว้ถูกสมมติให้ได้รับคำเตือนช้าเพิ่ม 15 นาที ส่วนคลื่นถึงฝั่งที่ 135 นาทีเป็นของฉากทัศน์แผ่นดินไหวหนึ่งกรณีเท่านั้น นาฬิกาในเบราว์เซอร์เริ่มที่คำเตือนของแบบฝึก ห้ามสับสนจุดเริ่มเวลาและห้ามใช้เวลาใดเป็นเหตุผลให้รอ')}</p>
      <details><summary>{t('Uncertainty, repeatability and interpretation','ความไม่แน่นอน การรันซ้ำ และการตีความ')}</summary><p>{t('The baseline was run 15 times. Reported SD/mean is 0.31% for evacuated agents and 0.44% for victims; subsequent scenarios use single runs (§4.1). This is repeatability under fixed settings, not external validation or uncertainty across earthquake sources, terrain, occupancy and behavior. Confidence intervals for the full scenario ensemble are not available in this browser. Cumulative packages do not identify each measure’s independent causal effect.', 'กรณีฐานรัน 15 ครั้ง ค่า SD/ค่าเฉลี่ยที่รายงานคือ 0.31% สำหรับผู้ที่อพยพได้ และ 0.44% สำหรับผู้ประสบภัย ส่วนฉากทัศน์ถัดไปใช้การรันครั้งเดียว (หัวข้อ 4.1) ข้อมูลนี้แสดงความคงเส้นคงวาภายใต้ค่าตั้งเดียวกัน ไม่ใช่การตรวจสอบกับข้อมูลอิสระหรือความไม่แน่นอนจากแหล่งกำเนิดแผ่นดินไหว ภูมิประเทศ การใช้อาคาร และพฤติกรรม เบราว์เซอร์นี้ไม่มีช่วงความเชื่อมั่นของชุดฉากทัศน์ทั้งหมด และมาตรการสะสมไม่สามารถแยกผลเชิงสาเหตุของแต่ละมาตรการได้')}</p></details>
    </section>

    <section id="research-sources" aria-labelledby="sources-title"><div className="research-section-head"><h2 id="sources-title">{t('03 / Evidence & data ledger','03 / บัญชีหลักฐานและข้อมูล')}</h2><label>{t('Show','แสดง')} <select aria-label={t('Filter research sources','กรองแหล่งข้อมูลวิจัย')} value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">{t('All sources','ทุกแหล่ง')}</option><option value="used">{t('Used here','ที่ใช้ในระบบ')}</option><option value="candidate">{t('Candidates','ที่เสนอเพิ่มเติม')}</option><option value="method">{t('Reporting method','แนวทางรายงาน')}</option></select></label></div>
      <p>{t('Source records checked 27 October 2026. A reference date is not the acquisition date of every underlying measurement. No listed source provides a connected live warning in this system.', 'ตรวจระเบียนแหล่งข้อมูลเมื่อ 27 ตุลาคม 2026 วันที่ตรวจเอกสารไม่ใช่วันที่เก็บข้อมูลทุกชุดที่อยู่เบื้องหลัง และไม่มีแหล่งใดในรายการที่เชื่อมเป็นคำเตือนสดในระบบนี้')}</p>
      <ol className="research-ledger">{sourceRows.filter(s=>filter==='all'||s.kind===filter).map(s=><li key={s.id} id={`source-${s.id}`}><div><a href={s.url} target="_blank" rel="noreferrer">[{s.id}] {s.name[language]}</a><span>{s.locator[language]}</span></div><div><strong>{s.status[language]}</strong><p>{s.use[language]}</p>{s.id==='R3'&&<a href="https://www.esri.com/en-us/legal/terms/data-attributions" target="_blank" rel="noreferrer">{t('Esri imagery attribution','ที่มาภาพ Esri')}</a>}</div></li>)}</ol>
      {filter!=='all'&&<p>{t('Showing a filtered ledger. Choose All sources to resolve every reference ID.','กำลังแสดงรายการที่กรอง เลือกทุกแหล่งเพื่อดูรหัสอ้างอิงทั้งหมด')}</p>}
    </section>

    <section id="research-validation" aria-labelledby="validation-title"><h2 id="validation-title">{t('04 / Validation agenda · proposed, not completed','04 / แผนตรวจสอบ · ข้อเสนอที่ยังไม่เสร็จสิ้น')}</h2>
      <ol className="research-validation">{[
        [bi('Reproduce the source model','ทำซ้ำแบบจำลองต้นฉบับ'),bi('Obtain versioned code, parameter files, hazard grids, random seeds and run logs. Reproduce reported outcomes and document unresolved discrepancies before claiming equivalence.','ขอโค้ดที่ระบุรุ่น ไฟล์พารามิเตอร์ กริดภัย ค่าเริ่มต้นการสุ่ม และบันทึกการรัน ทำซ้ำผลที่รายงานและบันทึกความคลาดเคลื่อนก่อนอ้างว่าเทียบเท่าต้นฉบับ')],
        [bi('Hindcast the physical hazard','ทดสอบภัยกับเหตุการณ์ในอดีต'),bi('Reconcile horizontal/vertical datums, tide and time origins. Compare withheld gauge series, arrival times, runup and inundation extents; report bias, error and missing-data coverage. Agree acceptance criteria before calibration.','ปรับระบบพิกัด ระบบอ้างอิงความสูง น้ำขึ้นลง และจุดเริ่มเวลาให้ตรงกัน เปรียบเทียบกับอนุกรมสถานีวัด เวลาถึง ระดับน้ำขึ้นฝั่ง และขอบเขตน้ำท่วมที่กันไว้ทดสอบ รายงานอคติ ค่าคลาดเคลื่อน และข้อมูลที่ขาด กำหนดเกณฑ์ยอมรับก่อนปรับเทียบ')],
        [bi('Survey routes and candidate refuges','สำรวจเส้นทางและอาคารที่เสนอ'),bi('Local authorities and qualified engineers verify access, capacity, structure, signage, barriers and accessibility. Terrain elevation or floor count alone cannot certify safety.','ให้หน่วยงานท้องถิ่นและวิศวกรที่มีคุณสมบัติตรวจการเข้าถึง ความจุ โครงสร้าง ป้าย สิ่งกีดขวาง และการเข้าถึงของทุกกลุ่ม ระดับภูมิประเทศหรือจำนวนชั้นเพียงอย่างเดียวรับรองความปลอดภัยไม่ได้')],
        [bi('Test behavior and language in the field','ทดสอบพฤติกรรมและภาษาในพื้นที่'),bi('Use consented drills to compare observed departure, route choice, queues and comprehension across residents, visitors, older people and people needing assistance. Native Thai/English review and community participation remain required; translation is not evidence of comprehension.','ใช้การซ้อมที่ผู้เข้าร่วมให้ความยินยอม เปรียบเทียบเวลาออกเดินทาง การเลือกทาง คิว และความเข้าใจของคนในพื้นที่ นักท่องเที่ยว ผู้สูงอายุ และผู้ที่ต้องการความช่วยเหลือ ต้องมีผู้ใช้ภาษาไทยและอังกฤษเป็นภาษาแม่ตรวจทานร่วมกับชุมชน การแปลไม่ใช่หลักฐานว่าเข้าใจแล้ว')],
        [bi('Stress-test and publish the failures','ทดสอบภาวะวิกฤตและเผยแพร่กรณีที่ล้มเหลว'),bi('Vary source scenarios, preparation, occupancy, speed, blocked paths and route capacity. Publish ensembles, uncertainty and failure cases, protect participant data, and obtain independent review before operational use.','เปลี่ยนฉากทัศน์แหล่งกำเนิด เวลาเตรียมตัว จำนวนคน ความเร็ว เส้นทางปิด และความจุทางเดิน เผยแพร่ผลหลายชุด ความไม่แน่นอน และกรณีที่ล้มเหลว คุ้มครองข้อมูลผู้เข้าร่วม และให้ผู้ตรวจอิสระทบทวนก่อนใช้ปฏิบัติการจริง')],
      ].map(([title,body])=><li key={title.en}><h3>{title[language]}</h3><p>{body[language]}</p></li>)}</ol>
      <p>{t('Our interpretation: the study motivates testing a combined mitigation package locally. It does not prove that the same percentages will transfer to another beach. New observations or an independent replication that changes the ranking would require revising this interpretation.', 'ข้อสังเคราะห์ของระบบ: งานวิจัยสนับสนุนให้ทดสอบมาตรการร่วมกันในพื้นที่ ไม่ได้พิสูจน์ว่าร้อยละเดียวกันใช้ได้กับหาดอื่น หากข้อมูลสังเกตใหม่หรือการทำซ้ำโดยอิสระเปลี่ยนลำดับผลของมาตรการ ต้องปรับข้อสังเคราะห์นี้')}</p>
    </section>

    <section id="research-reproduce" aria-labelledby="reproduce-title"><h2 id="reproduce-title">{t('05 / Reproduce, inspect & cite','05 / ทำซ้ำ ตรวจสอบ และอ้างอิง')}</h2>
      <p>{t('The browser code, tests and snapshot provenance are public. Passing software tests verifies selected implementation properties; it does not validate evacuation safety. No survey participants’ personal records are published.', 'โค้ดเบราว์เซอร์ ชุดทดสอบ และที่มาของข้อมูลที่เก็บไว้เปิดให้ตรวจสอบ การผ่านชุดทดสอบยืนยันการทำงานเฉพาะส่วน ไม่ได้ยืนยันความปลอดภัยในการอพยพ และไม่เผยแพร่ข้อมูลส่วนบุคคลของผู้ตอบแบบสำรวจ')}</p>
      <div className="research-downloads"><button onClick={()=>save('khao-lak-reported-results.csv',evidenceCsv(),'text/csv;charset=utf-8')}>{t('Download results CSV','ดาวน์โหลดผล CSV')}</button><button onClick={()=>save('khao-lak-citation.bib',bibtex,'application/x-bibtex;charset=utf-8')}>{t('Download BibTeX','ดาวน์โหลด BibTeX')}</button><a href="https://github.com/Nonarkara/tsunami-evacuation" target="_blank" rel="noreferrer">{t('Code & tests','โค้ดและชุดทดสอบ')}</a><a href="/data/hazard-replay.schema.json">{t('Replay JSON schema','โครงสร้าง JSON สำหรับเล่นซ้ำ')}</a></div>
      <details><summary>{t('Replication record and author questions','บันทึกการทำซ้ำและคำถามสำหรับผู้วิจัย')}</summary><p>{t('Record code revision, dependency lockfile, source versions, CRS/datum, cell size, time origin, parameter values, random seeds, run counts and preprocessing steps. Compare conservation, network trajectories, queues and no-data handling before outcome comparisons. [R7] informs reporting; it does not certify this model.', 'บันทึกรุ่นโค้ด ไฟล์ล็อกแพ็กเกจ รุ่นแหล่งข้อมูล ระบบพิกัดและความสูง ขนาดกริด จุดเริ่มเวลา ค่าพารามิเตอร์ ค่าเริ่มต้นการสุ่ม จำนวนรัน และขั้นตอนเตรียมข้อมูล ตรวจยอดจำนวนคน เส้นทางการเคลื่อนที่ คิว และการจัดการข้อมูลที่ขาดก่อนเทียบผลลัพธ์ ใช้ [R7] เป็นแนวทางรายงาน ไม่ใช่การรับรองแบบจำลองนี้')}</p><p>{t('Request original Unity and hydrodynamic inputs, exact PD50/VE50 settings, refuge screening criteria, warning-coverage geometry and complete ensemble outputs. The 25%/27% discrepancy and transferability remain open questions.', 'ขอไฟล์ Unity และข้อมูลพลศาสตร์น้ำต้นฉบับ ค่าตั้ง PD50/VE50 ที่แน่นอน เกณฑ์คัดกรองอาคาร ขอบเขตการได้ยินคำเตือน และผลการรันครบทุกชุด ความต่าง 25%/27% และการใช้ข้ามพื้นที่ยังเป็นคำถามเปิด')}</p></details>
      <p className="research-citation" lang="en">{paperCitation}</p>
      <p>{t('Bibliographic correction: SSRN lists 12 August 2026 and the author order above. The earlier site incorrectly used 2024. Peer-review status and manuscript revisions must be rechecked before scholarly submission. System design and synthesis: Dr. Non Arkaraprasertkul; source research belongs to its authors.', 'แก้ไขข้อมูลบรรณานุกรม: SSRN ระบุวันที่ 12 สิงหาคม 2026 และลำดับผู้แต่งตามข้างต้น เว็บไซต์รุ่นก่อนระบุปี 2024 ผิด ต้องตรวจสถานะการประเมินและรุ่นต้นฉบับอีกครั้งก่อนส่งผลงานวิชาการ ออกแบบระบบและสังเคราะห์โดย Dr. Non Arkaraprasertkul งานวิจัยต้นฉบับเป็นผลงานของผู้วิจัย')}</p>
      <details><summary>{t('Thai / English terminology','คำศัพท์ไทย / อังกฤษ')}</summary><dl>{glossary.map(([term,meaning])=><div key={term.en}><dt>{term[language]}</dt><dd>{meaning[language]}</dd></div>)}</dl></details>
      <p className="research-review-date">{t('Evidence review','ทบทวนหลักฐาน')} {reviewedOn} · {POPULATION.toLocaleString('en-US')} {t('modeled agents [R1]','ตัวแทนในแบบจำลอง [R1]')}</p><button className="primary" onClick={onExplore}>{t('Open terrain rehearsal','เปิดแบบฝึกภูมิประเทศ')} →</button>
    </section>
  </article>;
}
