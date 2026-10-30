import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "./axiom-tokens.css";
import "./style.css";
import "./viewport.css";
import "./banner.css";
import { PagedFlow } from "./PagedFlow";
import { ReadingDialog } from "./ReadingDialog";
import { BannerDock } from "./BannerDock";
import { Manual } from "./Manual";
import { DhakaPanel } from "./DhakaPanel";
import { Drill } from "./Drill";
import { OutcomeSummary } from "./OutcomeSummary";
import { SourceFooter } from "./SourceFooter";
import { formatBangkokTime } from "./orientation";
import { manualLanguage } from "./manual-content";
import { InterventionComparison } from "./InterventionComparison";
import { SatelliteCatalogue as SatelliteIntel } from "./SatelliteCatalogue";
import { NavConsole } from "./NavConsole";
import { ResearchSection } from "./ResearchSection";
import "@fontsource/prompt/thai-400.css";
import "@fontsource/prompt/thai-500.css";
import "@fontsource/prompt/thai-600.css";
import "@fontsource/prompt/thai-700.css";
import { TerrainRehearsal } from "./TerrainRehearsal";
import {
  POPULATION,
  scenarios,
  coastalRegions,
  checklist,
  blankPlan,
  validatePlan,
  walkingMinutes,
  resultFor,
  reduction,
  type Plan,
  type Condition,
} from "./research";

type Tab = "explore" | "prepare" | "drill" | "research" | "satellite" | "dhaka";

function download(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Device wall clock formatted for Bangkok (UTC+7); not an atomic time feed. */
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <time className="masthead-clock" dateTime={now.toISOString()} aria-label="Bangkok device time / เวลาอุปกรณ์ในกรุงเทพฯ" title="Bangkok · UTC+7 · device clock / เวลาอุปกรณ์">{formatBangkokTime(now)}</time>;
}

function App() {
  const [tab, setTab] = useState<Tab>(() => {
    const hash = location.hash.slice(1);
    const t = hash.startsWith("research-") || hash.startsWith("source-R") ? "research" : hash;
    return ["explore", "prepare", "drill", "research", "satellite"].includes(t)
      ? (t as Tab)
      : "explore";
  });

  const [regionIdx, setRegionIdx] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState(2);
  const [step, setStep] = useState(4);
  const [condition, setCondition] = useState<Condition>("baseline");
  const [bannerDock,setBannerDock]=useState<HTMLDivElement|null>(null);
  const [modelView,setModelView]=useState("terrain");
  const [manualOpen, setManualOpen] = useState(false);
  const [language, setLanguage] = useState(()=>manualLanguage(location.search,navigator.language));

  const region = coastalRegions[regionIdx];
  const place = region.places[selectedPlace];

  function navigate(t: Tab) {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(()=>document.getElementById('main')?.focus({preventScroll:true}));
  }

  function handleRegionChange(idx: number) {
    setRegionIdx(idx);
    setSelectedPlace(coastalRegions[idx].id === "khao-lak" ? 2 : 0);
  }

  const placeConsole = (
        <div className="console-section" id="console-place">
          <h3>Local context and personal plan · {place.name}</h3>
          <div className="directive-header">
            <div>
              <h4>
                {place.name}{" "}
                <span className="thai-name">({place.thaiName})</span>
              </h4>
              <p className="place-desc">{place.description}</p>
            </div>
            <div className="place-stats"><span className="stat-pill">Local route and refuge validation pending</span></div>
          </div>

          {/* 3 Empirical Evacuation Axioms from Research (Trumikaborworn et al., 2026) */}
          <div className="evacuation-route-waypoints">
            <div className="waypoint-item start">
              <span className="wp-badge">01 IMMEDIATE</span>
              <div>
                <strong>Plan an accessible departure</strong>
                <small>Follow local evacuation instructions and natural warnings. Plan assistance for people who cannot evacuate on foot.</small>
              </div>
            </div>
            <div className="waypoint-item walk">
              <span className="wp-badge">02 PERPENDICULAR</span>
              <div>
                <strong>Walk and verify the designated route</strong>
                <small>Confirm crossings, gates, signs and a backup with the local authority; a straight inland line is not a verified route.</small>
              </div>
            </div>
            <div className="waypoint-item destination">
              <span className="wp-badge">03 REFUGE</span>
              <div>
                <strong>{place.refugeStrategy}</strong>
                <small>Use authority-designated destinations. Neither an elevation threshold nor a floor number certifies safety.</small>
              </div>
            </div>
          </div>

          {/* Actionable Directive & Spatial Context */}
          <div className="action-directive">
            <strong>⚠️ Actionable Evacuation Directive:</strong>
            <span>{place.actionableDirective}</span>
          </div>

          {place.spatialContext && (
            <div className="gridlock-warning-bar">
              <strong>📍 Topographic &amp; Bottleneck Context:</strong>
              <span>{place.spatialContext}</span>
            </div>
          )}

          <div className="directive-footer">
            <button
              className="plan-shortcut-btn"
              onClick={() => navigate("prepare")}
            >
              Draft personal plan for {place.name} →
            </button>
            <span className="meta-note">
              Terrain and exercise are separate from the published Unity model.
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
            <h2>Follow designated evacuation routes to high ground or inland.</h2>
            <p>
              Natural signs: violent ground shaking, sudden sea recession, or a roaring ocean sound. Move immediately when you can do so safely. Follow official guidance and arrange assistance. Do not wait for website updates.
            </p>
            <p lang="th">
              หากรู้สึกถึงแผ่นดินไหวรุนแรง น้ำทะเลลดระดับอย่างรวดเร็ว หรือได้ยินเสียงคำรามจากทะเล ให้อพยพไปยังพื้นที่สูงหรือพื้นที่ด้านในตามเส้นทางที่ทางการกำหนด และช่วยเหลือผู้ที่ต้องการความช่วยเหลือ
            </p>
          </div>
          <div>
            <p>
              Hotline: <strong>DDPM Thailand · 1784</strong> (24/7)
            </p>
            <a href="tel:1784" className="call-btn">
              Call DDPM 1784 Now
            </a>
            <div className="emergency-links">
              <a
                href="https://www.tmd.go.th/en/CAP"
                target="_blank"
                rel="noreferrer"
              >
                TMD Warnings ↗
              </a>{" "}
              ·{" "}
              <a
                href="https://www.disaster.go.th/home"
                target="_blank"
                rel="noreferrer"
              >
                DDPM Portal ↗
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
              title={region.shortName}
              value={regionIdx}
              onChange={(e) => handleRegionChange(Number(e.target.value))}
            >
              {coastalRegions.map((r, i) => (
                <option key={r.id} value={i}>
                  {["Khao Lak · Phang Nga", "Phuket", "Krabi", "Satun/Trang", "Ranong", "Gulf coast"][i]}
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
          <select aria-label="Model view / มุมมอง" title="Terrain or published outcomes" value={modelView} onChange={e=>setModelView(e.target.value)}><option value="terrain">Terrain</option><option value="evidence">Results</option></select>
                <label className="area-selector"><span className="sr-only">Area / พื้นที่</span>
                  <select aria-label="Select coastal area" value={selectedPlace} onChange={e=>setSelectedPlace(Number(e.target.value))}>{region.places.map((p,i)=><option key={p.name} value={i}>{i+1} · {p.name}</option>)}</select>
                  <span>{selectedPlace+1}/{region.places.length}</span>
                </label>        </>}/>}

        <div className="masthead-status">{language==='th'?'งานวิจัยและฝึกซ้อม · ไม่มีคำเตือนสด':'Research & practice · no live warning'}</div>
        <div className="masthead-clock-wrap"><Clock /></div>
        <div className="masthead-action-group">
          <ReadingDialog title="Warning guidance / คำเตือน" triggerLabel="1784" className="emergency-pill-btn">{emergencyGuidance}</ReadingDialog>
        </div>
      </header>

        {tab !== "dhaka" && (
          <Manual open={manualOpen} page={tab} onClose={() => setManualOpen(false)} onNavigate={page => { setManualOpen(false); navigate(page); requestAnimationFrame(() => document.getElementById("main")?.focus({ preventScroll: true })); }} />
        )}

      {/* ── §2 Main Operational Content ──────────────────────── */}
      <main id="main" tabIndex={-1} data-page={tab}>
        {tab === "explore" ? (
          <div className="explore-grid" data-view={modelView}>

            {/* Section 01: 3D Aerial Topography & Water Inundation Simulator */}
            <section hidden={modelView!=="terrain"} className="geography-pane" id="geography-pane" aria-labelledby="map-pane-title">
              <div className="pane-header">
                <div className="pane-titles">
                  <span className="pane-badge">01 / TERRAIN & CROWD REHEARSAL</span>
                  <h2 id="map-pane-title">{region.id==='khao-lak'?'Khao Lak · Phang Nga':region.name}</h2>
                </div>


              </div>

              {/* Interactive 3D Aerial Leaflet Map with Wave Simulation */}
              <TerrainRehearsal
                key={region.id}
                region={region}
                selected={selectedPlace}
                onSelect={setSelectedPlace}
                bannerDock={bannerDock}
                consoleSlot={placeConsole}
                onReview={()=>navigate("drill")}
              />

            </section>


            {/* Section 02: Published evidence and intervention details */}
            <section hidden={modelView!=="evidence"} className="evidence-pane" aria-labelledby="model-pane-title"><PagedFlow label="Published outcomes">
              <div className="pane-header">
                <div className="pane-titles">
                  <span className="pane-badge">02 / MODELING & MITIGATION</span>
                  <h2 id="model-pane-title">Published Khao Lak model</h2><span className="terrain-tier">Preprint · historical scenarios · 39,041 modeled agents · applies to Khao Lak</span>
                </div>
                <div className="condition-toggle-group">
                  <button
                    aria-pressed={condition === "baseline"}
                    onClick={() => setCondition("baseline")}
                  >
                    30-min warning (Baseline)
                  </button>
                  <button
                    aria-pressed={condition === "delayed"}
                    onClick={() => setCondition("delayed")}
                  >
                    45-min warning (Delayed)
                  </button>
                </div>
              </div>

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
                          <strong>Modeled victim share</strong>
                          <span>
                            {Math.round(
                              (resultFor(step, condition) / 100) * POPULATION,
                            ).toLocaleString("en-US")}{" "}
                            of {POPULATION.toLocaleString("en-US")} agents
                          </span>
                        </div>
                      </div>
                      {step !== 0 ? (
                        <div className="hud-reduction-badge">
                          <span className="reduction-pct">
                            −{reduction(step, condition).toFixed(0)}%
                          </span>
                          <span className="reduction-sub">Modeled reduction</span>
                        </div>
                      ) : (
                        <div className="hud-baseline-badge">
                          <span>Baseline Gridlock</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <InterventionComparison step={step} condition={condition} onSelect={setStep} />
                </div>

                {/* Selected package and reported outcome accounting */}
                <div className="split-col-right">
                  {/* Active Package Inspector Card */}
                  <div className="active-package-card">
                    <div className="active-pkg-header">
                      <span className="active-pkg-tag">ACTIVE INTERVENTION</span>
                      <h3>{scenarios[step].label}</h3>
                    </div>

                    <div className="hud-truth-note">
                      <strong>Key Finding: </strong>
                      <span>{scenarios[step].drNonFinding}</span>
                    </div>

                    <div className="actionable-banner">
                      <span className="action-tag">ACTIONABLE PROTOCOL</span>
                      <p>
                        <strong>For Mayors & Operators: </strong>
                        {scenarios[step].action}
                      </p>
                    </div>

                    <dl className="pkg-metrics-grid">
                      <div>
                        <dt>Vertical Refuges</dt>
                        <dd>{scenarios[step].sites} sites</dd>
                      </div>
                      <div>
                        <dt>Signs</dt>
                        <dd>{scenarios[step].signs} signs</dd>
                      </div>
                      <div>
                        <dt>Vertical Pref.</dt>
                        <dd>{scenarios[step].vertical}% agents</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Compact 100% Outcome Breakdown */}
                  <OutcomeSummary step={step} condition={condition} />
                </div>
              </div>


            </PagedFlow></section>
          </div>
        ) : null}

        {/* Tab: Satellite & Meteorological Intel */}
        <div hidden={tab !== "satellite"}>
          <PagedFlow label="Sources & sensors"><SatelliteIntel /></PagedFlow>
        </div>

        {/* Tab: My Plan */}
        <div hidden={tab !== "prepare"}>
          <PagedFlow label="Personal plan"><Prepare /></PagedFlow>
        </div>

        {/* Tab: Run a Drill */}
        <div hidden={tab !== "drill"}>
          <PagedFlow label="Drill record and walkthrough"><Drill language={language} /></PagedFlow>
        </div>

        {/* Tab: Research Section with Diagrams */}
        <div hidden={tab !== "research"}>
          <PagedFlow label="Research"><ResearchSection onExplore={() => navigate("explore")} onLanguageChange={setLanguage} /></PagedFlow>
        </div>

        {/* Tab: Dhaka flood planning (provenance-first demonstrator) */}
        <div hidden={tab !== "dhaka"}>
          <PagedFlow label="Dhaka flood planning"><DhakaPanel language={language} /></PagedFlow>
        </div>
      </main>

      <SourceFooter language={language} onResearch={()=>navigate("research")} />
    </>
  );
}

/* ── §5 Satellite & Meteorological Intel View ──────────────── */
/* ── §6 Research Section with Dynamic Synthesis & Diagrams ─── */
/* ── §7 My Plan View ───────────────────────────────────────── */
function Prepare() {
  const [plan, setPlan] = useState<Plan>(structuredClone(blankPlan)),
    [message, setMessage] = useState(""),
    [distance, setDistance] = useState("1000"),
    [speed, setSpeed] = useState("0.8");
  const minutes = walkingMinutes(Number(distance), Number(speed));

  function field(key: keyof Omit<Plan, "checked">, value: string) {
    setPlan((p) => ({ ...p, [key]: value }));
    setMessage("Unsaved changes.");
  }

  function save() {
    try {
      localStorage.setItem("soonami-plan-v1", JSON.stringify(plan));
      setMessage("Saved on this device. Use Load saved plan when you return.");
    } catch {
      setMessage("Device storage unavailable. Download or print your plan instead.");
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem("soonami-plan-v1");
      if (!raw) {
        setMessage("No saved plan on this device.");
        return;
      }
      const data: unknown = JSON.parse(raw);
      if (!validatePlan(data)) throw Error();
      setPlan(data);
      setMessage("Saved plan loaded.");
    } catch {
      setMessage("Could not load a valid plan. Current entries have been kept.");
    }
  }

  return (
    <div className="planning-grid">
      <section className="plan-form" id="plan-form">
        <div className="section-head-compact">
          <h1>My evacuation plan</h1>
          <span className="meta">Private & On-Device · Actionable Protocol</span>
        </div>
        <p>
          Confirm destinations, routes and assisted transport needs with local authorities before an emergency.
        </p>

        <div className="field-grid">
          {(
            [
              ["place", "Where are you staying?", "Hotel, home or workplace"],
              ["destination", "Locally confirmed destination", "Authority-designated destination and access point"],
              ["backup", "Backup Refuge Destination", "Alternative authority-designated destination"],
              ["contact", "Out-of-Area Contact", "Name and mobile number"],
            ] as const
          ).map(([key, label, placeholder]) => (
            <label key={key}>
              {label}
              <input
                maxLength={2000}
                value={plan[key]}
                placeholder={placeholder}
                onChange={(e) => field(key, e.target.value)}
              />
              <span className="print-value">{plan[key] || "Not entered"}</span>
            </label>
          ))}
        </div>

        <label>
          Walking Route & Landmark Notes
          <textarea
            maxLength={2000}
            value={plan.route}
            placeholder="Confirmed signs, crossings, gates and accessible alternatives"
            onChange={(e) => field("route", e.target.value)}
          />
          <span className="print-value">{plan.route || "Not entered"}</span>
        </label>

        <div className="plan-assistance-timing">
          <label>
            Assistance Needed & Action for Dependents
            <input
              maxLength={2000}
              value={plan.assistance}
              placeholder="E.g., mobility aid, baby carrier, elderly parent assistance"
              onChange={(e) => field("assistance", e.target.value)}
            />
            <span className="print-value">{plan.assistance || "Not entered"}</span>
          </label>

          <div className="calc-block">
            <span className="label">Walking Time Estimate</span>
            <div className="calc-inputs">
              <label>
                Meters
                <input
                  type="number"
                  min="50"
                  max="10000"
                  step="50"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </label>
              <label>
                Speed
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                >
                  <option value="1.0">1.0 m/s</option>
                  <option value="0.8">0.8 m/s</option>
                  <option value="0.5">0.5 m/s · assistance example</option>
                </select>
              </label>
            </div>
            <div className="calc-result" aria-live="polite">
              {minutes !== null ? (
                <span>
                  Estimated time: <strong>~{minutes} minutes</strong> on foot
                </span>
              ) : (
                <span className="error">Enter valid positive numbers</span>
              )}
            </div>
          </div>
        </div>

        <fieldset className="checklist-block">
          <legend>Preparation & Readiness Checklist</legend>
          {checklist.map((item, i) => (
            <label key={item} className="checkbox-label">
              <input
                type="checkbox"
                checked={plan.checked[i]}
                onChange={(e) => {
                  const copy = [...plan.checked];
                  copy[i] = e.target.checked;
                  setPlan((p) => ({ ...p, checked: copy }));
                  setMessage("Unsaved changes.");
                }}
              />
              <span>{item}</span>
            </label>
          ))}
        </fieldset>

        <div className="plan-actions">
          <button className="primary" onClick={save}>
            Save to browser
          </button>
          <button onClick={load}>Load saved plan</button>
          <button
            onClick={() =>
              download(
                "soonami-evacuation-plan.json",
                JSON.stringify(plan, null, 2),
              )
            }
          >
            Export JSON
          </button>
          <button onClick={() => window.print()}>Print plan</button>
        </div>

        {message && (
          <div className="form-message" role="status">
            {message}
          </div>
        )}
      </section>

      <aside className="plan-aside">
        <h3>Four local checks</h3>
        <ul className="axioms-list">
          <li>
            <strong>1. Plan for congestion:</strong> Confirm an accessible departure plan and designated routes with local emergency managers.
          </li>
          <li>
            <strong>2. Confirm refuge access:</strong> Confirm an authority-designated vertical refuge and access before a drill.
          </li>
          <li>
            <strong>3. Rehearse and review:</strong> Rehearse staircases and exit gates before a real event.
          </li>
          <li>
            <strong>4. Help dependents first:</strong> Assign specific buddies for elderly, children, and visitors.
          </li>
        </ul>
      </aside>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
