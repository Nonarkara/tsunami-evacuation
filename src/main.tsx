import { lazy, Suspense, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "./axiom-tokens.css";
import "./style.css";
import "./viewport.css";
import "./banner.css";
import "./viz.css";
import { PagedFlow } from "./PagedFlow";
import { ReadingDialog } from "./ReadingDialog";
import { BannerDock } from "./BannerDock";
import { Manual } from "./Manual";
import { OutcomeSummary } from "./OutcomeSummary";
import { SourceFooter } from "./SourceFooter";
import { formatBangkokTime } from "./orientation";
import { manualLanguage } from "./manual-content";
import { localPlaceCopy } from "./place-copy";
import { InterventionComparison } from "./InterventionComparison";
import { NavConsole } from "./NavConsole";
import { TechnicalData } from "./TechnicalData";
import { DdpmRiskPanel } from "./DdpmRiskPanel";
import "@fontsource/prompt/thai-400.css";
import "@fontsource/prompt/thai-500.css";
import "@fontsource/prompt/thai-600.css";
import "@fontsource/prompt/thai-700.css";
import { TerrainLoadBoundary } from "./TerrainLoadBoundary";
import { MangaModel } from "./MangaModel";
import { Sparkline } from "./charts";
import { scenarioThai } from "./research-ledger";
import {
  POPULATION,
  scenarios,
  coastalRegions,
  resultFor,
  reduction,
  type Condition,
} from "./research";

const TerrainRehearsal = lazy(() => import("./TerrainRehearsal").then(module => ({ default: module.TerrainRehearsal })));
const ResearchSection = lazy(() => import("./ResearchSection").then(module => ({ default: module.ResearchSection })));
const Drill = lazy(() => import("./Drill").then(module => ({ default: module.Drill })));
const Prepare = lazy(() => import("./Prepare").then(module => ({ default: module.Prepare })));

type Tab = "explore" | "prepare" | "drill" | "research" | "ddpm";

/** Device wall clock formatted for Bangkok (UTC+7); not an atomic time feed. */
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <time className="masthead-clock" dateTime={now.toISOString()} aria-label="Bangkok device time / เวลาอุปกรณ์ในกรุงเทพฯ" title="Bangkok · UTC+7 · device clock / เวลาอุปกรณ์">{formatBangkokTime(now)}</time>;
}

/** One plain line per published package, paraphrasing the measure and the paper's local-coordinator guidance (research.ts). */
const MEASURE_ACTIONS = [
  { en: 'Start: cars jam the evacuation routes', th: 'จุดเริ่มต้น: รถติดบนเส้นทางอพยพ' },
  { en: 'Walk, not drive; help those who cannot walk', th: 'เดินแทนขับรถ และช่วยผู้ที่เดินไม่ได้' },
  { en: 'Have engineers assess candidate tall buildings', th: 'ให้วิศวกรประเมินอาคารสูงที่อาจใช้หลบภัย' },
  { en: 'Practise going up; check stairs and access', th: 'ซ้อมขึ้นที่สูง ตรวจบันไดและทางเข้า' },
  { en: 'Sign every route to its destination, in several languages', th: 'ติดป้ายบอกทางต่อเนื่องหลายภาษาถึงจุดหมาย' },
] as const;
/** Thai headings built the same way as scenarios[].label (measure, then its study code). */
const PACKAGE_TITLES_TH = ['กรณีฐานของงานวิจัย (รถติด)', 'เพิ่มความต้องการเดินเท้าเป็น 50% (PD50)', 'เพิ่มอาคารแนวดิ่งที่เสนอ 14 แห่ง (VS14)', 'เพิ่มความต้องการอพยพแนวดิ่งเป็น 50% (VE50)', 'มาตรการครบชุด: ป้าย 135 จุด (SG135)'];

function App() {
  const [tab, setTab] = useState<Tab>(() => {
    const hash = location.hash.slice(1);
    const t = hash.startsWith("ddpm-") ? "ddpm" : hash.startsWith("research-") || hash.startsWith("source-R") || hash === "satellite" ? "research" : hash;
    return ["explore", "prepare", "drill", "research", "ddpm"].includes(t)
      ? (t as Tab)
      : "explore";
  });

  const [regionIdx, setRegionIdx] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState(2);
  const [step, setStep] = useState(4);
  // Guided tour of the five published packages: user-started, one step every 2.6 s, stops on any manual choice, view change or hidden tab.
  const [touring, setTouring] = useState(false);
  useEffect(() => {
    if (!touring) return;
    const stop = () => setTouring(false);
    const id = setTimeout(() => step >= 4 ? stop() : setStep(step + 1), 2600);
    document.addEventListener('visibilitychange', stop);
    return () => { clearTimeout(id); document.removeEventListener('visibilitychange', stop); };
  }, [touring, step]);
  const [condition, setCondition] = useState<Condition>("baseline");
  const [bannerDock,setBannerDock]=useState<HTMLDivElement|null>(null);
  const [modelView,setModelView]=useState("terrain");
  useEffect(()=>setTouring(false),[modelView,tab]);
  // Narrow phones and phones on their side: a 160px chart cannot sit whole on a 163px landscape page.
  const COMPACT_RESULTS = '(max-width: 760px), (max-height: 440px)';
  const [compactResults, setCompactResults] = useState(() => matchMedia(COMPACT_RESULTS).matches);
  useEffect(() => {
    const query = matchMedia(COMPACT_RESULTS);
    const resize = () => setCompactResults(query.matches);
    query.addEventListener('change', resize);
    return () => query.removeEventListener('change', resize);
  }, []);
  const [manualOpen, setManualOpen] = useState(false);
  const [language, setLanguage] = useState(()=>manualLanguage(location.search,navigator.language));
  useEffect(()=>{document.documentElement.lang=language;},[language]);
  const t = (en: string, th: string) => language === 'th' ? th : en;

  const region = coastalRegions[regionIdx];
  const place = region.places[selectedPlace];
  const placeText=localPlaceCopy(place,language);

  function navigate(to: Tab | "satellite") {
    // Sensor catalogue now lives in Research › Sources.
    const t: Tab = to === "satellite" ? "research" : to;
    setTab(t);
    history.replaceState(null, "", to === "satellite" ? "#research-sources" : `#${t}`);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(()=>document.getElementById('main')?.focus({preventScroll:true}));
  }

  function handleRegionChange(idx: number) {
    setModelView('terrain');
    setRegionIdx(idx);
    setSelectedPlace(coastalRegions[idx].id === "khao-lak" ? 2 : 0);
  }

  const placeConsole = (
        <div className="console-section" id="console-place">
          <div className="directive-header">
            <div>
              <h4>
                {t(place.name,place.thaiName)}{" "}
                <span className="thai-name">({t(place.thaiName,place.name)})</span>
              </h4>
              <p className="place-desc">{placeText.description}</p>
            </div>
            <div className="place-stats"><span className="stat-pill">{t('Local route and refuge validation pending','ยังไม่ยืนยันเส้นทางและจุดอพยพในพื้นที่')}</span></div>
          </div>

          {/* 3 Empirical Evacuation Axioms from Research (Trumikaborworn et al., 2026) */}
          <div className="evacuation-route-waypoints">
            <div className="waypoint-item start">
              <span className="wp-badge">01</span>
              <div>
                <strong>{t('Plan an accessible departure','วางแผนการออกเดินทางที่ทุกคนใช้ได้')}</strong>
                <small>{t('Follow local evacuation instructions and natural warnings. Plan assistance for people who cannot walk.','ปฏิบัติตามคำแนะนำและสัญญาณจากทางการ วางแผนช่วยคนที่เดินไม่ไหว')}</small>
              </div>
            </div>
            <div className="waypoint-item walk">
              <span className="wp-badge">02</span>
              <div>
                <strong>{t('Walk and verify the route','เดินและตรวจสอบเส้นทาง')}</strong>
                <small>{t('Confirm crossings, gates, signs and a backup with the local authority.','ยืนยันทางข้าม ประตู ป้าย และทางสำรองกับทางการท้องถิ่น')}</small>
              </div>
            </div>
            <div className="waypoint-item destination">
              <span className="wp-badge">03</span>
              <div>
                <strong>{t('Refuge','ที่หลบภัย')}</strong>
                <small>{placeText.refugeStrategy}</small>
              </div>
            </div>
          </div>

          {/* Actionable Directive & Spatial Context */}
          <div className="action-directive">
            <strong>{t('Actionable directive','คำแนะนำที่ปฏิบัติได้')}</strong>
            <span>{placeText.actionableDirective}</span>
          </div>

          {place.spatialContext && (
            <div className="gridlock-warning-bar">
              <strong>{t('Topographic & Bottleneck Context','บริบทภูมิประเทศและคอขวด')}</strong>
              <span>{placeText.spatialContext}</span>
            </div>
          )}

          <div className="directive-footer">
            <button
              className="plan-shortcut-btn"
              onClick={() => navigate("prepare")}
            >
              {t(`Draft personal plan for ${place.name}`,`จัดทำแผนส่วนบุคคลสำหรับ${place.thaiName}`)} →
            </button>
            <span className="meta-note">
              {t('Terrain and exercise are separate from the published Unity model.','ภูมิประเทศและแบบฝึกนี้แยกจากแบบจำลอง Unity ในบทความ')}
            </span>
          </div>
        </div>
  );

  const emergencyGuidance=(
        <section
          className="emergency-panel"
          aria-label="Tsunami safety guidance"
        >
          <div>
            <h2>{t('Follow official routes to high ground or inland.','อพยพไปที่สูงหรือพื้นที่ด้านในตามเส้นทางทางการ')}</h2>
            <p>
              {t('Natural signs: strong shaking, sea recession, roaring ocean. Move immediately when safe. Follow official guidance and assist others.','สัญญาณจากธรรมชาติ: แผ่นดินไหวรุนแรง น้ำทะเลลดระดับ หรือเสียงคำรามจากทะเล อพยพทันทีเมื่อปลอดภัย ปฏิบัติตามคำแนะนำจากทางการและช่วยเหลือผู้อื่น')}</p>
            <p lang="th">
              {t('หากรู้สึกถึงแผ่นดินไหวรุนแรง น้ำทะเลลดระดับอย่างรวดเร็ว หรือได้ยินเสียงคำรามจากทะเล ให้อพยพไปยังพื้นที่สูงหรือพื้นที่ด้านในตามเส้นทางที่ทางการกำหนด และช่วยเหลือผู้ที่ต้องการความช่วยเหลือ','หากรู้สึกถึงแผ่นดินไหวรุนแรง น้ำทะเลลดระดับอย่างรวดเร็ว หรือได้ยินเสียงคำรามจากทะเล ให้อพยพไปยังพื้นที่สูงหรือพื้นที่ด้านในตามเส้นทางที่ทางการกำหนด และช่วยเหลือผู้ที่ต้องการความช่วยเหลือ')}</p>
          </div>
          <div>
            <p>
              <strong>{t('Hotline: DDPM Thailand · 1784 (24/7)','สายด่วน: DDPM ไทย · 1784 (24 ชม.)')}</strong>
            </p>
            <a href="tel:1784" className="call-btn">
              {t('Call DDPM 1784 Now','โทร 1784 ตอนนี้')}
            </a>
            <div className="emergency-links">
              <a
                href="https://www.tmd.go.th/en/CAP"
                target="_blank"
                rel="noreferrer"
              >
                {t('TMD Warnings','คำเตือน TMD')} ↗
              </a>{" "}
              ·{" "}
              <a
                href="https://www.disaster.go.th/home"
                target="_blank"
                rel="noreferrer"
              >
                {t('DDPM Portal','ประตูสู่ DDPM')} ↗
              </a>
            </div>

          </div>
        </section>
  );

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      {/* One application banner: identity, geography, navigation and scene tools. */}
      <header className="soonami-masthead" data-page={tab}>
        <div className="masthead-brand-group">
          <a
            className="soonami-brand"
            aria-label="Soonami"
            href="#explore"
            onClick={(e) => {
              e.preventDefault();
              navigate("explore");
            }}
          >
            <span className="brand-logo" aria-hidden="true">สู้</span>
            <div className="brand-titles">
              <span className="brand-name">Soonami</span>
              <span className="brand-sub">inspired by Trumikaborworn et al. (2026)</span>
            </div>
          </a>

          {/* Whole Country Coastal Region Selector */}
          <div className="region-picker-wrap">
            <label htmlFor="region-select" className="sr-only">
              Select Coastal Region
            </label>
            <select
              id="region-select"
              className="region-select"
              title={t(region.shortName,region.thaiName)}
              value={regionIdx}
              onChange={(e) => handleRegionChange(Number(e.target.value))}
            >
              {coastalRegions.map((r, i) => (
                <option key={r.id} value={i}>
                  {t(["Khao Lak", "Phuket", "Krabi", "Satun/Trang", "Ranong", "Gulf coast"][i],["เขาหลัก","ภูเก็ต","กระบี่","สตูล/ตรัง","ระนอง","อ่าวไทย"][i])}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section console: each glyph opens the real contents of its section */}
        <NavConsole
          active={tab}
          onNavigate={key => navigate(key)}
          manual={
            <button className="manual-trigger" aria-label="Manual / คู่มือ" title="Manual / คู่มือ" aria-haspopup="dialog" onClick={() => setManualOpen(true)}>
              <svg className="nav-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M9.5 8.5a2.5 2.5 0 1 1 4.1 1.9c-1 .7-1.6 1-1.6 2.6"/><circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none"/></svg>
            </button>
          }
        />

        {tab==='explore'&&<BannerDock scene={modelView==='terrain'} onDock={setBannerDock} context={<>
          <select aria-label="Model view / มุมมอง" title="Terrain, published outcomes or street linework" value={modelView} onChange={e=>{const view=e.target.value;if(view==='manga'){setRegionIdx(0);setSelectedPlace(2);}setModelView(view);}}><option value="terrain">{t('Terrain','ภูมิประเทศ')}</option><option value="evidence">{t('Results','ผลลัพธ์')}</option><option value="manga">{t('Street linework (ink)','เค้าโครงถนน (มังงะ)')}</option></select>
                <label className="area-selector"><span className="sr-only">Area / พื้นที่</span>
                  <select aria-label={t('Select coastal area','เลือกพื้นที่ชายฝั่ง')} value={selectedPlace} onChange={e=>{setSelectedPlace(Number(e.target.value));if(modelView==='manga')setModelView('terrain');}}>{region.places.map((p,i)=><option key={p.name} value={i}>{i+1} · {t(p.name,p.thaiName)}</option>)}</select>
                  <span>{selectedPlace+1}/{region.places.length}</span>
                </label>        </>}/>}

        <div className="masthead-status">{language==='th'?'งานวิจัยและฝึกซ้อม · ไม่มีคำเตือนสด':'Research & practice · no live warning'}</div>
        <div className="masthead-clock-wrap"><Clock /></div>
        <div className="masthead-action-group">
          <ReadingDialog title="Warning guidance / คำเตือน" triggerLabel="1784" className="emergency-pill-btn">{emergencyGuidance}</ReadingDialog>
        </div>
      </header>

      <Manual open={manualOpen} page={tab} onClose={() => setManualOpen(false)} onNavigate={page => { setManualOpen(false); navigate(page); requestAnimationFrame(() => document.getElementById("main")?.focus({ preventScroll: true })); }} />

      {/* ── §2 Main Operational Content ──────────────────────── */}
      <main id="main" tabIndex={-1} data-page={tab}>
        {tab === "explore" ? (
          <div className="explore-grid" data-view={modelView}>

            {/* Section 01: 3D Aerial Topography & Water Inundation Simulator */}
            <section hidden={modelView!=="terrain"} className="geography-pane" id="geography-pane" aria-labelledby="map-pane-title">
              <div className="pane-header">
                <div className="pane-titles">
                  <span className="pane-badge">01 / TERRAIN & CROWD REHEARSAL</span>
                  <h2 id="map-pane-title">{t(region.id==='khao-lak'?'Khao Lak · Phang Nga':region.name,region.thaiName)}</h2>
                </div>


              </div>

              <TerrainLoadBoundary language={language}>
                <Suspense fallback={<p role="status">{t('Loading terrain…','กำลังโหลดภูมิประเทศ…')}</p>}>
              <TerrainRehearsal
                key={region.id}
                active={modelView==='terrain'&&!manualOpen}
                region={region}
                selected={selectedPlace}
                onSelect={setSelectedPlace}
                bannerDock={bannerDock}
                consoleSlot={placeConsole}
                finding={region.id==='khao-lak' ? <div className="panel-finding">
                  <div className="finding-head" title={t('Preprint · Khao Lak scenarios, not a forecast','งานก่อนตีพิมพ์ · สถานการณ์จำลองเขาหลัก ไม่ใช่การพยากรณ์')}><strong>{t('Modeled victims % / 39,041','ผู้ประสบภัยจำลอง % / 39,041')}</strong><button className="link-button" onClick={()=>setModelView('evidence')}>{t('Results','ผลลัพธ์')} →</button></div>
                  <InterventionComparison condition={condition} step={step} height={64} onSelect={i=>{setStep(i);setModelView('evidence');}} />
                  {/* Phone: the same finding as one line, so the map keeps 60% and Start stays on page 1. */}
                  <p className="finding-line"><Sparkline values={scenarios.map(s=>condition==='baseline'?s.affected:s.delayed)} /><b>{scenarios[0][condition==='baseline'?'affected':'delayed'].toFixed(1)}% → {scenarios[4][condition==='baseline'?'affected':'delayed'].toFixed(1)}%</b> <span>{t('modeled victims of 39,041 · preprint, not a forecast','ผู้ประสบภัยจำลองจาก 39,041 · งานก่อนตีพิมพ์ ไม่ใช่การพยากรณ์')}</span><button className="link-button" onClick={()=>setModelView('evidence')}>{t('Results','ผลลัพธ์')} →</button></p>
                  <small>{t('Preprint · Khao Lak scenarios, not a forecast','งานก่อนตีพิมพ์ · ฉากทัศน์เขาหลัก ไม่ใช่การพยากรณ์')}</small>
                </div> : undefined}
                onReview={()=>navigate("drill")}
                onPlan={()=>navigate("prepare")}
              />
                </Suspense>
              </TerrainLoadBoundary>
            </section>

            {/* Section 01b: Manga street model — the owner's miaoshen engine over the Bang Niang bake */}
            <section hidden={modelView!=="manga"} className="geography-pane manga-pane" aria-labelledby="manga-pane-title">
              <div className="pane-header">
                <div className="pane-titles">
                  <span className="pane-badge">{t('03 / STREET LINEWORK (INK)','03 / ลายเส้นผังเมือง (มังงะ)')}</span>
                  <h2 id="manga-pane-title">{t('Bang Niang street recognition','จดจำเค้าโครงถนนบางเนียง')}</h2>
                  <span className="terrain-tier">{t('High-contrast architectural line-work for ground-level route & landmark recognition without satellite glare · buildings without source heights stay flat ink outlines · flat ground, sea not drawn · not for navigation','ลายเส้นสไตล์มังงะคอนทราสต์สูง ช่วยจดจำผังถนนและจุดสังเกตระดับสายตาโดยไม่มีแสงสะท้อนจากดาวเทียม · อาคารที่ไม่มีความสูงจากแหล่งข้อมูลวาดเป็นเส้นขอบแบน · ไม่ระบุความสูงหรือระดับน้ำ · ไม่ใช้สำหรับนำทาง')}</span>
                </div>
              </div>
              {modelView==='manga' && <MangaModel language={language} />}
              <div className="manga-caption"><span>{t('Bang Niang · architectural ink plan · not for navigation or elevation','บางเนียง · ผังลายเส้นผังเมือง · ไม่ใช้สำหรับนำทางหรือวัดระดับความสูง')}</span>
              <ReadingDialog compact language={language} className="manga-note" title={t('Sources and limits','แหล่งข้อมูลและข้อจำกัด')}>
                <p>{t('Only mapped centreline coordinates are sourced. Display widths are schematic. Light is artistic; free camera movement is not proof of access or a route.','พิกัดเส้นกลางมาจากแผนที่ ความกว้างที่แสดงเป็นสัญลักษณ์ ไม่แสดงทางเดินเท้าและทะเล แสงเป็นภาพประกอบ การเลื่อนกล้องไม่ยืนยันการเข้าถึงหรือเส้นทางเดิน')}</p>

                <p>{t('Drawn from the same published OpenStreetMap snapshots as the rest of this app: 1,196 building footprints from the 27 October 2026 snapshot, plus streets, waterways, water bodies and parks from the same snapshot. Height truth applies: none of these buildings carries an explicit source height, so every one is drawn as a flat ink outline — the town reads as a line-drawn plan from above and from eye level. One gable-roof reading from Esri imagery (4 November 2026) is recorded in the roof pack. The ground is flat; sea and pedestrian paths are not drawn. Road and waterway widths are schematic, not measured. Light is artistic, not a real sun direction. Free camera movement does not establish traversability. Rendered with three.js (MIT). This model is an illustration, not a survey: do not navigate by it, and it shows no refuge, route safety or water depth.','วาดจากชุดข้อมูล OpenStreetMap ที่เผยแพร่แล้วชุดเดียวกับทั้งแอป: อาคาร 1,196 แปลนจากสแนปช็อต 27 ตุลาคม 2026 พร้อมถนน ทางน้ำ แหล่งน้ำ และสวนจากสแนปช็อตเดียวกัน กฎความจริงของความสูงมีผล: อาคารเหล่านี้ไม่มีความสูงที่ระบุชัดจากแหล่งข้อมูลเลย ทุกหลังจึงวาดเป็นเส้นขอบแบน — เมืองอ่านเป็นแผนผังลายเส้นทั้งจากมุมสูงและระดับสายตา การอ่านหลังคาจากภาพถ่ายดาวเทียม Esri (4 พฤศจิกายน 2026) มี 1 หลังบันทึกไว้ในชุดข้อมูลหลังคา พื้นราบและไม่วาดทะเล แสดงผลด้วย three.js (MIT) แบบจำลองนี้เป็นภาพประกอบ ไม่ใช่งานสำรวจ อย่าใช้นำทาง และไม่แสดงที่หลบภัย ความปลอดภัยของเส้นทาง หรือความลึกของน้ำ')}</p>
              </ReadingDialog>
              <p className="terrain-credits manga-credits">© <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://www.esri.com/">Esri</a> · <a href="https://threejs.org/">three.js</a></p></div>
            </section>


            {/* Section 02: Published evidence and intervention details */}
            <section hidden={modelView!=="evidence"} className="evidence-pane" aria-labelledby="model-pane-title">
              <div className="pane-header">
                <div className="pane-titles">
                  <span className="pane-badge">{t('02 / MODELING & MITIGATION','02 / แบบจำลองและการลดผลกระทบ')}</span>
                  <div className="results-title-line">
                    <h2 id="model-pane-title">{t('Published Khao Lak model','แบบจำลองเขาหลักที่รายงาน')}</h2>
                    <TechnicalData language={language} />
                  </div>
                  <span className="terrain-tier">{t('Preprint · historical scenarios · 39,041 modeled agents · applies to Khao Lak','งานก่อนตีพิมพ์ · ฉากทัศน์ในงานวิจัย · 39,041 ตัวแทนจำลอง · เฉพาะเขาหลัก')}</span>
                </div>
                <div className="condition-toggle-group">
                  <button
                    aria-pressed={condition === "baseline"}
                    onClick={() => setCondition("baseline")}
                  >
                    {t('Warn 30 min · prep 14 min','เตือน 30 นาที · เตรียม 14 นาที')}
                  </button>
                  <button
                    aria-pressed={condition === "delayed"}
                    onClick={() => setCondition("delayed")}
                  >
                    {t('Warn 45 min · prep 28 min','เตือน 45 นาที · เตรียม 28 นาที')}
                  </button>
                </div>
              </div>

              <PagedFlow label={t("Published outcomes","ผลจากบทความ")}>
              {/* Compare intervention packages and inspect the selected result */}
              <div className="modeling-split-grid">
                {/* Shared-scale comparison of the two published timing conditions */}
                <div className="split-col-left">
                  <div className="result-hud" aria-live="polite">
                    <div className="hud-primary">
                      <div className="hud-stat">
                        <span className="hud-number">
                          {resultFor(step, condition).toFixed(1)}
                          <small>%</small>
                        </span>
                        <div className="hud-labels">
                          <strong>{t('Modeled victim share','สัดส่วนผู้ประสบภัยจำลอง')}</strong>
                          <span>
                            ≈ {Math.max(1, Math.round(resultFor(step, condition)))} {t('in every 100','ในทุก 100 คน')} · {Math.round(
                              (resultFor(step, condition) / 100) * POPULATION,
                            ).toLocaleString("en-US")}{" "}
                            {t('of','จาก')} {POPULATION.toLocaleString("en-US")} {t('agents','ตัวแทน')}
                          </span>
                        </div>
                      </div>
                      {step !== 0 ? (
                        <div className="hud-reduction-badge">
                          <span className="reduction-pct">
                            −{reduction(step, condition).toFixed(0)}%
                          </span>
                          <span className="reduction-sub">{t('Relative reduction vs baseline','ลดสัมพัทธ์เทียบกรณีฐาน')}</span>
                        </div>
                      ) : (
                        <div className="hud-baseline-badge">
                          <span>{t('Baseline gridlock','จราจรติดขัดกรณีฐาน')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Outcome leads the screen: who was affected / did they make it, then what the packages did. */}
                  <OutcomeSummary step={step} condition={condition} />
                  {/* The five published packages as what each asks people to do; cumulative, so every row up to the selected one is in effect. */}
                  <p className="ladder-note">{t('The five published packages, cumulative: each row adds to the rows above.','ห้าชุดมาตรการที่ตีพิมพ์ สะสมกัน: แต่ละแถวเพิ่มจากแถวก่อนหน้า')}</p>
                  <ol className="measure-ladder" aria-label={t('The five published packages and what each asks people to do','ห้าชุดมาตรการที่ตีพิมพ์ และสิ่งที่แต่ละชุดขอให้ผู้คนทำ')}>
                    {MEASURE_ACTIONS.map((m, i) => <li key={i} data-state={i < step ? 'applied' : i === step ? 'current' : 'later'}>
                      <button type="button" aria-pressed={i === step} onClick={() => { setTouring(false); setStep(i); }}>
                        <span className="ladder-do"><b className="ladder-code">{language === 'th' ? scenarios[i].shortTh : scenarios[i].short}</b> {language === 'th' ? m.th : m.en}</span>
                        <span className="ladder-val">{resultFor(i, condition).toFixed(1)}%</span>
                      </button>
                    </li>)}
                  </ol>
                  {/* Active Package Inspector Card */}
                  <div className="active-package-card">
                    <div className="active-pkg-header">
                      <h3>{language === "th" ? PACKAGE_TITLES_TH[step] : scenarios[step].label}</h3>
                    </div>

                    <div className="hud-truth-note">
                      <strong>{t("Finding: ","ข้อค้นพบ: ")}</strong>
                      <span>{language === "th" ? scenarioThai[step].finding : scenarios[step].drNonFinding}</span>
                    </div>

                    <div className="actionable-banner">
                      <p>
                        <strong>{t("For local coordinators: ","สำหรับผู้ประสานงานในพื้นที่: ")}</strong>
                        {language === "th" ? scenarioThai[step].action : scenarios[step].action}
                      </p>
                    </div>

                    <dl className="pkg-metrics-grid">
                      <div>
                        <dt>{t('Vertical Refuges','ที่หลบภัยแนวดิ่ง')}</dt>
                        <dd>{scenarios[step].sites} {t('sites','จุด')}</dd>
                      </div>
                      <div>
                        <dt>{t('Signs','ป้าย')}</dt>
                        <dd>{scenarios[step].signs} {t('signs','ป้าย')}</dd>
                      </div>
                      <div>
                        <dt>{t('Vertical Pref.','ความนิยมขึ้นสูง')}</dt>
                        <dd>{scenarios[step].vertical}% {t("agents","ตัวแทน")}</dd>
                      </div>
                    </dl>
                  </div>

                </div>

                {/* Compare packages directly above the selected package details. */}
                <div className="split-col-right">
                  <button type="button" className="tour-button" aria-pressed={touring} onClick={() => { if (touring) setTouring(false); else { setStep(0); setTouring(true); } }}>{touring ? <>❚❚ {t('Pause','หยุด')}</> : <>▶ {t('Play the five measures','เล่นทีละมาตรการ')}</>}</button>
                  <InterventionComparison step={step} condition={condition} onSelect={i => { setTouring(false); setStep(i); }} height={compactResults ? 96 : innerWidth >= 1024 ? Math.max(160, innerHeight - 340) : 160} />
                </div>
              </div>


            </PagedFlow></section>
          </div>
        ) : null}

        {/* Tab: My Plan */}
        <div hidden={tab !== "prepare"}>
          <PagedFlow label="Personal plan"><Prepare language={language} /></PagedFlow>
        </div>

        {/* Tab: Run a Drill */}
        <div hidden={tab !== "drill"}>
          <PagedFlow label="Drill record and walkthrough"><Drill language={language} /></PagedFlow>
        </div>

        {/* Tab: Research Section with Diagrams */}
        <div hidden={tab !== "research"}>
          <PagedFlow label="Research">
            <Suspense fallback={<p role="status">Loading research…</p>}>
              <ResearchSection onDdpm={()=>navigate("ddpm")} onExplore={() => navigate("explore")} onLanguageChange={setLanguage} />
            </Suspense>
          </PagedFlow>
        </div>

        {/* Tab: DDPM tsunami-risk evidence (provenance-first demonstrator) */}
        <div hidden={tab !== "ddpm"}>
          <PagedFlow label="DDPM tsunami-risk evidence" className="ddpm-pages"><DdpmRiskPanel language={language} onResearch={()=>navigate("research")} /></PagedFlow>
        </div>

        {/* Tab: My Plan */}
        <div hidden={tab !== "prepare"}>
          <PagedFlow label="My Plan">
            <Suspense fallback={<p role="status">Loading plan…</p>}>
              <Prepare language={language} />
            </Suspense>
          </PagedFlow>
        </div>

        {/* Tab: Run a Drill */}
        <div hidden={tab !== "drill"}>
          <PagedFlow label="Drill record and walkthrough">
            <Suspense fallback={<p role="status">Loading drill…</p>}>
              <Drill language={language} />
            </Suspense>
          </PagedFlow>
        </div>
      </main>

      <SourceFooter language={language} onResearch={()=>navigate("research")} />
    </>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
