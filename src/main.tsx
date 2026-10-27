import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "./axiom-tokens.css";
import "./style.css";
import { Manual } from "./Manual";
import { InterventionComparison } from "./InterventionComparison";
import { SatelliteCatalogue as SatelliteIntel } from "./SatelliteCatalogue";
import { NavSymbol } from "./NavSymbol";
import { ResearchSection } from "./ResearchSection";
import "@fontsource/prompt/thai-400.css";
import "@fontsource/prompt/thai-500.css";
import "@fontsource/prompt/thai-600.css";
import "@fontsource/prompt/thai-700.css";
import { TerrainRehearsal } from "./TerrainRehearsal";
import {
  PAPER,
  CITATION,
  CREATOR,
  POPULATION,
  scenarios,
  coastalRegions,
  checklist,
  blankPlan,
  validatePlan,
  walkingMinutes,
  resultFor,
  reduction,
  outcomes,
  validateDrill,
  type Plan,
  type Condition,
  type CoastalRegion,
} from "./research";

type Tab = "explore" | "prepare" | "drill" | "research" | "satellite";

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
  const [emergency, setEmergency] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const region = coastalRegions[regionIdx];
  const place = region.places[selectedPlace];

  function navigate(t: Tab) {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
    window.scrollTo({ top: 0 });
  }

  function handleRegionChange(idx: number) {
    setRegionIdx(idx);
    setSelectedPlace(coastalRegions[idx].id === "khao-lak" ? 2 : 0);
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      {/* ── §1 Ultra-Compact Command Masthead (Zero Spatial Hallucination) ── */}
      <header className="soonami-masthead">
        <div className="masthead-brand-group">
          <a
            className="soonami-brand"
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
                  {["Khao Lak", "Phuket", "Krabi", "Satun/Trang", "Ranong", "Gulf coast"][i]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Short 1-Word Navigation Tabs */}
        <nav className="masthead-nav" aria-label="Main navigation">
          {(
            [
              ["explore", "Model"],
              ["satellite", "Satellite"],
              ["prepare", "Plan"],
              ["drill", "Drill"],
              ["research", "Research / วิจัย"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              aria-label={label}
              title={`${label} · ${{explore:"แบบจำลอง", satellite:"ดาวเทียม", prepare:"แผน", drill:"ซ้อมอพยพ", research:"งานวิจัย"}[key]}`}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              <NavSymbol name={key} />
            </button>
          ))}
          <button className="manual-trigger" aria-label="Manual / คู่มือ" title="Manual / คู่มือ" aria-haspopup="dialog" onClick={() => setManualOpen(true)}>
            <svg className="nav-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M9.5 8.5a2.5 2.5 0 1 1 4.1 1.9c-1 .7-1.6 1-1.6 2.6"/><circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none"/></svg>
          </button>
        </nav>

        <div className="masthead-action-group">
          <button
            className="emergency-pill-btn"
            onClick={() => setEmergency(!emergency)}
            aria-expanded={emergency}
          >
            🚨 1784
          </button>
        </div>
      </header>

      <Manual open={manualOpen} page={tab} onClose={() => setManualOpen(false)} onNavigate={page => { setManualOpen(false); navigate(page); requestAnimationFrame(() => document.getElementById("main")?.focus({ preventScroll: true })); }} />

      {/* Emergency guidance drawer */}
      {emergency && (
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
            <button
              className="close-emergency-btn"
              onClick={() => setEmergency(false)}
            >
              Close guidance
            </button>
          </div>
        </section>
      )}

      {/* ── §2 Main Operational Content ──────────────────────── */}
      <main id="main" tabIndex={-1}>
        {tab === "explore" ? (
          <div className="explore-grid">
            {/* Section 01: 3D Aerial Topography & Water Inundation Simulator */}
            <section className="geography-pane" aria-labelledby="map-pane-title">
              <div className="pane-header">
                <div className="pane-titles">
                  <span className="pane-badge">01 / TERRAIN & CROWD REHEARSAL</span>
                  <h2 id="map-pane-title">{region.name}</h2>
                </div>

              </div>

              {/* Interactive 3D Aerial Leaflet Map with Wave Simulation */}
              <TerrainRehearsal
                key={region.id}
                region={region}
                selected={selectedPlace}
                onSelect={setSelectedPlace}
              />

              {/* Place selector buttons with elevation badges */}
              <div className="place-selector-bar" aria-label="Select coastal area">
                {region.places.map((p, i) => (
                  <button
                    key={p.name}
                    aria-pressed={selectedPlace === i}
                    onClick={() => setSelectedPlace(i)}
                  >
                    <span className="place-num">{i + 1}</span>
                    <span className="place-text">{p.name}</span>

                  </button>
                ))}
              </div>

              {/* Fly-In Evacuation Route Briefing */}
              <details className="place-directive-card"><summary>Local context and personal plan · {place.name}</summary>
                <div className="directive-header">
                  <div>
                    <h3>
                      {place.name}{" "}
                      <span className="thai-name">({place.thaiName})</span>
                    </h3>
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
              </details>
            </section>

            {/* Section 02: Published evidence and intervention details */}
            <section className="evidence-pane" aria-labelledby="model-pane-title">
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
                  <Outcome step={step} condition={condition} />
                </div>
              </div>

              <div className="evidence-footer">
                <a href={PAPER} target="_blank" rel="noreferrer" className="paper-link">
                  📄 {CITATION} ↗
                </a>
              </div>
            </section>
          </div>
        ) : null}

        {/* Tab: Satellite & Meteorological Intel */}
        <div hidden={tab !== "satellite"}>
          <SatelliteIntel />
        </div>

        {/* Tab: My Plan */}
        <div hidden={tab !== "prepare"}>
          <Prepare />
        </div>

        {/* Tab: Run a Drill */}
        <div hidden={tab !== "drill"}>
          <Drill />
        </div>

        {/* Tab: Research Section with Diagrams */}
        <div hidden={tab !== "research"}>
          <ResearchSection onExplore={() => navigate("explore")} />
        </div>
      </main>

      {/* ── §3 Ultra-Compact Baseline Footer (Single Line 30px) ─── */}
      <footer className="soonami-footer">
        <div className="footer-content">
          <span>
            <strong>Soonami (สู้-nami)</strong> · Inspired by Trumikaborworn et al. (AIT/Mahidol, 2026 · SSRN 7270357) · Directed by Dr. Non
          </span>
          <button className="footer-research-link" onClick={() => navigate("research")}>
            Research Diagrams & Synthesis →
          </button>
        </div>
      </footer>
    </>
  );
}

/* ── §4 Compact Outcome Component (Zero Spatial Hallucination) ─── */
function Outcome({ step, condition }: { step: number; condition: Condition }) {
  const o = outcomes(step, condition);
  return (
    <div className="outcome-compact-card">
      <div className="outcome-compact-head">
        <span className="outcome-tag">SIMULATION OUTCOME</span>
        <strong>{POPULATION.toLocaleString("en-US")} Modeled Agents</strong>
      </div>
      {o.reached === null ? (
        <div className="outcome-compact-body">
          <div className="compact-meter-track" aria-hidden="true">
            <span className="meter-bar victims" style={{ width: `${o.affected}%` }} />
            <span className="meter-bar unclassified" style={{ width: `${100 - o.affected}%` }} />
          </div>
          <div className="compact-legend-row">
            <span className="leg-chip victims">● {o.affected.toFixed(1)}% Modeled victims</span>
            <span className="leg-chip safe">● {(100 - o.affected).toFixed(1)}% Not classified as modeled victims</span>
          </div>
        </div>
      ) : (
        <div className="outcome-compact-body">
          <div
            className="compact-stacked-bar"
            role="img"
            aria-label={`Outcome: ${o.reached.toFixed(1)}% reached modeled site, ${o.outside?.toFixed(1)}% outside hazard, ${o.affected.toFixed(1)}% modeled victims.`}
          >
            <span
              className="segment-reached"
              style={{ width: `${o.reached}%` }}
              title={`Modeled site: ${o.reached.toFixed(1)}%`}
            />
            <span
              className="segment-outside"
              style={{ width: `${o.outside}%` }}
              title={`Outside zone: ${o.outside?.toFixed(1)}%`}
            />
            <span
              className="segment-victims"
              style={{ width: `${o.affected}%` }}
              title={`Modeled victims: ${o.affected.toFixed(1)}%`}
            />
          </div>
          <div className="compact-legend-row">
            <span className="leg-chip reached">● {o.reached.toFixed(1)}% Reached modeled sites</span>
            <span className="leg-chip outside">● {o.outside?.toFixed(1)}% Outside Hazard</span>
            <span className="leg-chip victims">● {o.affected.toFixed(1)}% Modeled victims</span>
          </div>
          <p className="outcome-stat-note">
            Modeled site arrivals increase from {condition === "baseline" ? "60.7%" : "56.8%"} up to {condition === "baseline" ? "93.6%" : "88.9%"}.
          </p>
        </div>
      )}
    </div>
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
      <section className="plan-form">
        <div className="section-head-compact">
          <h2>My Coastal Evacuation Plan</h2>
          <span className="meta">Private & On-Device · Actionable Protocol</span>
        </div>
        <p>
          Confirm destinations, routes and assisted transport needs with local authorities before an emergency.
        </p>

        <div className="field-grid">
          {(
            [
              ["place", "Where are you staying?", "Hotel, home or workplace"],
              ["destination", "Primary Vertical / High-Ground Refuge", "Authority-designated destination and access point"],
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
            placeholder="Landmarks, pedestrian bridges, stairs, unlocked gates, and vertical refuge stairways"
            onChange={(e) => field("route", e.target.value)}
          />
          <span className="print-value">{plan.route || "Not entered"}</span>
        </label>

        <div className="field-grid">
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
                  <option value="1.0">1.0 m/s (Fast adult)</option>
                  <option value="0.8">0.8 m/s (Brisk walk)</option>
                  <option value="0.5">0.5 m/s (Assisting elderly/kids)</option>
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
        <h3>Evacuation Core Axioms</h3>
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

/* ── §8 Run a Drill View ───────────────────────────────────── */
function Drill() {
  const [log, setLog] = useState({
    participants: 25,
    reached: 24,
    assisted: 2,
    minutes: 8,
  });
  const [saved, setSaved] = useState<typeof log[]>(() => {
    try {
      const raw = localStorage.getItem("soonami-drills-v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const valid = validateDrill(log);

  function saveDrill() {
    if (!valid) return;
    const next = [log, ...saved];
    setSaved(next);
    try {
      localStorage.setItem("soonami-drills-v1", JSON.stringify(next));
    } catch {
      // storage unavailable
    }
  }

  return (
    <div className="drill-grid">
      <section className="drill-form">
        <div className="section-head-compact">
          <h2>Tsunami Evacuation Drill Logger</h2>
          <span className="meta">Rehearse Walking & Vertical Routes</span>
        </div>
        <p>
          Simulate a real-time foot evacuation. Log participants, arrival times, and dependents assisted to measure community readiness.
        </p>

        <div className="drill-inputs-grid">
          <label>
            Total Participants
            <input
              type="number"
              min="1"
              max="5000"
              value={log.participants}
              onChange={(e) =>
                setLog({ ...log, participants: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Reached Refuge Safely
            <input
              type="number"
              min="0"
              max={log.participants}
              value={log.reached}
              onChange={(e) =>
                setLog({ ...log, reached: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Dependents / Assisted
            <input
              type="number"
              min="0"
              max={log.participants}
              value={log.assisted}
              onChange={(e) =>
                setLog({ ...log, assisted: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Elapsed Time (Minutes)
            <input
              type="number"
              min="1"
              max="180"
              value={log.minutes}
              onChange={(e) =>
                setLog({ ...log, minutes: Number(e.target.value) })
              }
            />
          </label>
        </div>

        <div className="drill-actions">
          <button
            className="primary"
            disabled={!valid}
            onClick={saveDrill}
          >
            Record Drill Result
          </button>
        </div>

        {saved.length > 0 && (
          <div className="drill-history">
            <h3>Recent Drill Rehearsals</h3>
            <table className="drill-table">
              <thead>
                <tr>
                  <th>Participants</th>
                  <th>Reached Safely</th>
                  <th>Assisted</th>
                  <th>Time</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {saved.map((d, i) => (
                  <tr key={i}>
                    <td>{d.participants}</td>
                    <td>{d.reached}</td>
                    <td>{d.assisted}</td>
                    <td>{d.minutes} min</td>
                    <td>
                      <strong>
                        {((d.reached / d.participants) * 100).toFixed(0)}%
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="drill-aside">
        <h3>Drill Standards</h3>
        <p>
          Agree drill timing, assistance and accessible participation with local coordinators. Use observed completion and headcount gaps to revise the plan.
        </p>
        <div className="target-pill">
          <strong>Set a locally agreed drill target; reconcile every participant and assistance need.</strong>
        </div>
      </aside>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
