import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "./axiom-tokens.css";
import "./style.css";
import { StudyMap } from "./Map";
import {
  PAPER,
  CITATION,
  CREATOR,
  POPULATION,
  scenarios,
  coastalRegions,
  satelliteToolkits,
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
    const t = location.hash.slice(1);
    return ["explore", "prepare", "drill", "research", "satellite"].includes(t)
      ? (t as Tab)
      : "explore";
  });

  const [regionIdx, setRegionIdx] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState(0);
  const [step, setStep] = useState(4);
  const [condition, setCondition] = useState<Condition>("baseline");
  const [emergency, setEmergency] = useState(false);

  const region = coastalRegions[regionIdx];
  const place = region.places[selectedPlace];

  function navigate(t: Tab) {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
    window.scrollTo({ top: 0 });
  }

  function handleRegionChange(idx: number) {
    setRegionIdx(idx);
    setSelectedPlace(0);
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
              <span className="brand-sub">inspired by Trumikaborworn et al. (2024)</span>
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
              value={regionIdx}
              onChange={(e) => handleRegionChange(Number(e.target.value))}
            >
              {coastalRegions.map((r, i) => (
                <option key={r.id} value={i}>
                  📍 {r.shortName}
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
              ["research", "Research"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              {label}
            </button>
          ))}
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

      {/* Emergency guidance drawer */}
      {emergency && (
        <section
          className="emergency-panel"
          aria-label="Tsunami safety guidance"
        >
          <div>
            <h2>Move to high ground (&gt;15m) or 3rd floor immediately.</h2>
            <p>
              Natural signs: violent ground shaking, sudden sea recession, or a roaring ocean sound. Leave immediately on foot. Do not use cars. Do not wait for website updates.
            </p>
            <p lang="th">
              หากรู้สึกถึงแผ่นดินไหวรุนแรง น้ำทะเลลดระดับอย่างรวดเร็ว หรือได้ยินเสียงคำรามจากทะเล ให้อพยพทันทีด้วยการเดินเท้าไปยังพื้นที่สูง (&gt;15 เมตร) หรืออาคารคอนกรีตเสริมเหล็กชั้น 3 ขึ้นไป ห้ามใช้รถยนต์เด็ดขาด
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
                  <span className="pane-badge">01 / 3D AERIAL TOPOGRAPHY & WATER REACH</span>
                  <h2 id="map-pane-title">{region.name}</h2>
                </div>
                <div className="region-meta-strip">
                  <span className="meta-tag risk">{region.riskTier}</span>
                  <span className="meta-tag">ETA: ~{region.waveEtaMin}m</span>
                  <span className="meta-tag">Runup: {region.expectedRunupM}</span>
                </div>
              </div>

              {/* Interactive 3D Aerial Leaflet Map with Wave Simulation */}
              <StudyMap
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
                    <span className="place-elev-tag">{p.elevationM}m</span>
                  </button>
                ))}
              </div>

              {/* Fly-In Evacuation Route Briefing */}
              <div className="place-directive-card">
                <div className="directive-header">
                  <div>
                    <h3>
                      {place.name}{" "}
                      <span className="thai-name">({place.thaiName})</span>
                    </h3>
                    <p className="place-desc">{place.description}</p>
                  </div>
                  <div className="place-stats">
                    <span className="stat-pill">
                      Elev: <strong>{place.elevationM}m MSL</strong>
                    </span>
                    <span className="stat-pill safe">
                      Safe Ridge: <strong>{place.safeDistM}m</strong>
                    </span>
                    <span className="stat-pill walk">
                      Contour: <strong>&gt;15m MSL</strong>
                    </span>
                  </div>
                </div>

                {/* 3 Empirical Evacuation Axioms from Research (Trumikaborworn et al., 2024) */}
                <div className="evacuation-route-waypoints">
                  <div className="waypoint-item start">
                    <span className="wp-badge">01 IMMEDIATE</span>
                    <div>
                      <strong>Zero Motor Vehicles · Immediate Foot Departure</strong>
                      <small>Siren or shaking triggers instant pedestrian departure. Leaving cars behind prevents fatal highway gridlock.</small>
                    </div>
                  </div>
                  <div className="waypoint-item walk">
                    <span className="wp-badge">02 PERPENDICULAR</span>
                    <div>
                      <strong>Perpendicular Foot Route ({place.safeDistM}m to Safe Ground)</strong>
                      <small>Evacuate directly inland away from shoreline. Bypass parallel highway corridors on foot.</small>
                    </div>
                  </div>
                  <div className="waypoint-item destination">
                    <span className="wp-badge">03 REFUGE</span>
                    <div>
                      <strong>{place.refugeStrategy}</strong>
                      <small>Empirical defense: upper floors of certified reinforced concrete structures or terrain above 15m MSL.</small>
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
                    Topography calibrated via Copernicus 30m DEM & AIT hydrodynamic run-up model.
                  </span>
                </div>
              </div>
            </section>

            {/* Section 02: Evidence & Modeling Engine (Tight 50/50 Split Cockpit) */}
            <section className="evidence-pane" aria-labelledby="model-pane-title">
              <div className="pane-header">
                <div className="pane-titles">
                  <span className="pane-badge">02 / MODELING & MITIGATION</span>
                  <h2 id="model-pane-title">Empirical Evidence Engine</h2>
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

              {/* ── Balanced Split Cockpit: Scenario Decision Table vs Active Package Directives ── */}
              <div className="modeling-split-grid">
                {/* Column 1: Compact Scenario Decision Table (Fixed-Width Bars, Zero Hallucination) */}
                <div className="split-col-left">
                  <div className="result-hud" aria-live="polite">
                    <div className="hud-primary">
                      <div className="hud-stat">
                        <span className="hud-number">
                          {resultFor(step, condition).toFixed(1)}
                          <small>%</small>
                        </span>
                        <div className="hud-labels">
                          <strong>Casualty Rate</strong>
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
                          <span className="reduction-sub">Casualty Drop</span>
                        </div>
                      ) : (
                        <div className="hud-baseline-badge">
                          <span>Baseline Gridlock</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compact Scenario Selector (Fixed 70px Mini-Bars, Never Stretched) */}
                  <div
                    className="scenario-table-compact"
                    role="region"
                    aria-label="Intervention package selector"
                  >
                    <div className="scenario-table-header" aria-hidden="true">
                      <span className="col-pkg">Intervention Package</span>
                      <span className="col-rate">Casualties (25% Scale)</span>
                    </div>

                    <div className="scenario-list">
                      {scenarios.map((s, i) => {
                        const rate = resultFor(i, condition);
                        const isBase = i === 0;
                        const red = reduction(i, condition);
                        return (
                          <button
                            className={step === i ? "active" : ""}
                            key={s.id}
                            onClick={() => setStep(i)}
                            aria-pressed={step === i}
                          >
                            <span className="scenario-label">
                              <span className="step-num">{isBase ? "—" : `0${i}`}</span>
                              <span className="step-text">{s.short}</span>
                            </span>
                            <div className="scenario-meter-group">
                              <span className="mini-bar-track" aria-hidden="true">
                                <span
                                  style={{
                                    width: `${Math.min((rate / 25) * 100, 100)}%`,
                                  }}
                                />
                              </span>
                              <strong className="rate-num">{rate.toFixed(1)}%</strong>
                              {!isBase ? (
                                <span className="red-pill">−{red.toFixed(0)}%</span>
                              ) : (
                                <span className="base-pill">Base</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Column 2: Active Package Directive & Compact 100% Outcome Breakdown */}
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
            <strong>Soonami (สู้-nami)</strong> · Inspired by Trumikaborworn et al. (AIT/Mahidol, 2024 · SSRN 7270357) · Directed by Dr. Non
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
            <span className="leg-chip victims">● {o.affected.toFixed(1)}% Casualties</span>
            <span className="leg-chip safe">● {(100 - o.affected).toFixed(1)}% Survived</span>
          </div>
        </div>
      ) : (
        <div className="outcome-compact-body">
          <div
            className="compact-stacked-bar"
            role="img"
            aria-label={`Outcome: ${o.reached.toFixed(1)}% reached safe site, ${o.outside?.toFixed(1)}% outside hazard, ${o.affected.toFixed(1)}% casualties.`}
          >
            <span
              className="segment-reached"
              style={{ width: `${o.reached}%` }}
              title={`Safe site: ${o.reached.toFixed(1)}%`}
            />
            <span
              className="segment-outside"
              style={{ width: `${o.outside}%` }}
              title={`Outside zone: ${o.outside?.toFixed(1)}%`}
            />
            <span
              className="segment-victims"
              style={{ width: `${o.affected}%` }}
              title={`Casualties: ${o.affected.toFixed(1)}%`}
            />
          </div>
          <div className="compact-legend-row">
            <span className="leg-chip reached">● {o.reached.toFixed(1)}% Safe Refuges</span>
            <span className="leg-chip outside">● {o.outside?.toFixed(1)}% Outside Hazard</span>
            <span className="leg-chip victims">● {o.affected.toFixed(1)}% Casualties</span>
          </div>
          <p className="outcome-stat-note">
            Safe arrivals increase from {condition === "baseline" ? "60.7%" : "56.8%"} up to {condition === "baseline" ? "93.6%" : "88.9%"}.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── §5 Satellite & Meteorological Intel View ──────────────── */
function SatelliteIntel() {
  return (
    <div className="satellite-view-wrap">
      <div className="section-head">
        <div>
          <span className="eyebrow">EARTH OBSERVATION & SENSOR TELEMETRY</span>
          <h1>Satellite & Meteorological Defense Suite</h1>
        </div>
        <p>
          Derived from FloodDash (flood.nonarkara.org) sensor ingestion networks. Real-time deep-ocean acoustic telemetry, sea-surface tide gauges, and cloud-penetrating synthetic aperture radar.
        </p>
      </div>

      <div className="sensor-grid">
        {satelliteToolkits.map((s) => (
          <article key={s.id} className="sensor-card">
            <div className="sensor-card-top">
              <span className={`sensor-status-badge ${s.status.toLowerCase()}`}>
                ● {s.status}
              </span>
              <span className="sensor-agency">{s.agency}</span>
            </div>
            <h3>{s.name}</h3>
            <div className="sensor-value-box">
              <strong>{s.value}</strong>
              <small>Cadence: {s.updateFreq}</small>
            </div>
            <p>{s.significance}</p>
          </article>
        ))}
      </div>

      <div className="science-explanation-card">
        <h2>How Deep-Ocean Tsunami Physics Defeats Coastal Blindness</h2>
        <p>
          In deep water (&gt;4,000m depth), a tsunami wave travels at over <strong>700 km/h</strong> (the speed of a commercial passenger jet), but has an amplitude of less than 1 meter. Ships in the open ocean cannot even feel it pass beneath them. Only deep-ocean pressure transducers anchored to the seafloor (like <strong>DART Buoy 23401</strong> in the Andaman basin) can measure the microscopic pressure pulse of the entire water column.
        </p>
        <p>
          As the wave hits the shallow continental shelf near Phuket and Phang Nga, wave velocity drops from 700 km/h to 40 km/h. By conservation of energy, the wave height compresses and amplifies into a devastating <strong>8 to 15-meter vertical wall of turbulent water</strong>. The Royal Thai Navy coastal tide stations (Ko Taphao Noi, Similan) provide the final empirical confirmation of shore surge.
        </p>
      </div>
    </div>
  );
}

/* ── §6 Research Section with Dynamic Synthesis & Diagrams ─── */
function ResearchSection({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="research-view-wrap">
      <div className="research-hero">
        <span className="eyebrow">A CANDID TRANSLATION OF SSRN 7270357</span>
        <h1>The Science of Tsunami Survival Across Coastal Thailand</h1>
        <p className="lead-byline">
          Synthesized by <strong>Dr. Non Arkaraprasertkul</strong> from the landmark empirical study by Nattapon Trumikaborworn, Panon Latcharote, and Pennung Warnitchai (Asian Institute of Technology & Mahidol University, 2024).
        </p>
      </div>

      <article className="research-prose">
        <h2>1. The Brutal Truth: Why Cars Kill in a Tsunami</h2>
        <p>
          When the ground stops shaking after a major subduction earthquake in the Andaman Sea, human instinct says: <em>“Get in the car, pick up the family, step on the gas, and drive inland.”</em>
        </p>
        <p>
          The AIT and Mahidol research team put that instinct to a rigorous scientific test. They modeled <strong>39,041 autonomous individual agents</strong> moving through the actual road network, building footprints, and topography of Khao Lak inside the Unity physics engine, coupled with a hydrodynamic tsunami inundation wave model.
        </p>
        <p>
          The baseline result is terrifying: <strong>21.8% to 22.6% of the population died (over 8,500 people)</strong>.
        </p>
        <p>
          Why? Because coastal roads like Highway 4 are two-lane arteries. Within 14 minutes of departure, vehicular traffic reaches total gridlock. Cars cannot move forward; they cannot turn around. When the tsunami wave reaches the shore at T+125 minutes, it sweeps through stagnant lines of automobiles. <strong>In an evacuation, your car is not a shelter; it is a 2-ton metal coffin.</strong>
        </p>

        {/* Diagram 1: The Gridlock Trap vs Walking & Vertical */}
        <div className="diagram-box">
          <div className="diagram-header">
            <span>DIAGRAM 1</span>
            <strong>The Gridlock Trap vs. The Multi-Tier Walk & Vertical Survival Strategy</strong>
          </div>
          <div className="diagram-visual gridlock-vs-walk">
            <div className="diagram-column bad">
              <h4>❌ The Vehicular Baseline (Failure Mode)</h4>
              <div className="diag-step">1. Siren sounds (T=0)</div>
              <div className="diag-step">2. 73% scramble into cars (T+14m)</div>
              <div className="diag-step choke">3. Highway 4 complete gridlock choke (T+25m)</div>
              <div className="diag-step fatal">4. Wave strikes shore (T+125m) ➔ 21.8% Casualties</div>
            </div>
            <div className="diagram-arrow-switch">VS</div>
            <div className="diagram-column good">
              <h4>✅ Soonami Multi-Tier Protocol (Survival Mode)</h4>
              <div className="diag-step">1. Siren sounds ➔ IMMEDIATE ZERO-CAR RULE</div>
              <div className="diag-step">2. 100% foot departure ➔ Casualties drop to 7.0%</div>
              <div className="diag-step">3. 14 Vertical refuges unlocked ➔ Casualties drop to 3.7%</div>
              <div className="diag-step win">4. Drills + 135 signs ➔ 1.2% Casualties (94% Reduction!)</div>
            </div>
          </div>
        </div>

        <h2>2. The Two Game-Changers: Mandatory Walking and 14 Vertical Refuges</h2>
        <p>
          The study demonstrated that you do not need billions of baht in seawalls to save 8,000 lives. You need two immediate spatial decisions:
        </p>
        <ol className="key-takeaways-list">
          <li>
            <strong>Mandatory Walking on Foot (PD50):</strong> Shifting the population from cars to foot immediately drops casualties from <strong>21.8% down to 7.0%</strong>. A pedestrian cannot be gridlocked by an empty car. Pedestrians bypass road choke points, cross grassy medians, and maintain continuous egress.
          </li>
          <li>
            <strong>Designating 14 Vertical Refuges (VS14):</strong> You don’t need every tourist to hike 2 kilometers inland into the mountains. If you designate 14 engineered, reinforced-concrete hotel and school buildings within 200–400 meters of the beach, people can reach the 3rd floor in under 10 minutes. This drops casualties further from <strong>7.0% to 3.7%</strong>.
          </li>
        </ol>

        {/* Diagram 2: Cumulative Mitigation Waterfall */}
        <div className="diagram-box">
          <div className="diagram-header">
            <span>DIAGRAM 2</span>
            <strong>The Cumulative Casualty Reduction Waterfall (39,041 Modeled Agents)</strong>
          </div>
          <div className="waterfall-bars">
            <div className="waterfall-row">
              <span className="wf-label">Baseline (Cars)</span>
              <div className="wf-track"><span className="wf-fill c-base" style={{ width: "87.2%" }}>21.8% Victims (8,511 lost)</span></div>
            </div>
            <div className="waterfall-row">
              <span className="wf-label">+ Promote Walking</span>
              <div className="wf-track"><span className="wf-fill c-walk" style={{ width: "28%" }}>7.0% (−68%)</span></div>
            </div>
            <div className="waterfall-row">
              <span className="wf-label">+ 14 Vertical Refuges</span>
              <div className="wf-track"><span className="wf-fill c-refuge" style={{ width: "14.8%" }}>3.7% (−83%)</span></div>
            </div>
            <div className="waterfall-row">
              <span className="wf-label">+ Vertical Drills</span>
              <div className="wf-track"><span className="wf-fill c-practice" style={{ width: "5.2%" }}>1.3% (−94%)</span></div>
            </div>
            <div className="waterfall-row">
              <span className="wf-label">+ Complete (135 Signs)</span>
              <div className="wf-track"><span className="wf-fill c-signs" style={{ width: "4.8%" }}>1.2% (−94% total drop)</span></div>
            </div>
          </div>
        </div>

        <h2>3. The Final 2.5%: Why Drills and Multilingual Signs Matter</h2>
        <p>
          Why wasn’t vertical evacuation alone enough to reach 1.2%? The authors discovered that even with certified vertical refuges available, <strong>agents who had never rehearsed walking into the building hesitated or got lost</strong>.
        </p>
        <p>
          Foreign tourists in Khao Lak, Patong, or Phi Phi cannot read Thai road signs and have zero mental map of the back alleys. When <strong>135 high-contrast multilingual signs</strong> were added and vertical drills simulated, casualties plummeted to <strong>1.2% under baseline timing and 2.9% under delayed timing</strong>.
        </p>

        {/* Diagram 3: Wave Timeline vs Warning Latency */}
        <div className="diagram-box">
          <div className="diagram-header">
            <span>DIAGRAM 3</span>
            <strong>Timeline of an Andaman Subduction Tsunami: The Critical Foot Gate</strong>
          </div>
          <div className="timeline-visual">
            <div className="timeline-node t0">
              <strong>T = 0 min</strong>
              <span>M8.5+ Subduction Quake in Andaman Trench</span>
            </div>
            <div className="timeline-arrow">➔ 15 min ➔</div>
            <div className="timeline-node t15">
              <strong>T + 15 min</strong>
              <span>DART Buoy 23401 Triggers Alert</span>
            </div>
            <div className="timeline-arrow">➔ 15 min ➔</div>
            <div className="timeline-node t30">
              <strong>T + 30 min</strong>
              <span>TMD Sirens Sound on Coastal Towers</span>
            </div>
            <div className="timeline-arrow">➔ CRITICAL ➔</div>
            <div className="timeline-node t45 critical">
              <strong>T + 30 to 50 min</strong>
              <span>MUST BE ON FOOT MOVING TO REFUGES</span>
            </div>
            <div className="timeline-arrow">➔ Inundation ➔</div>
            <div className="timeline-node t125 wave">
              <strong>T + 125 min</strong>
              <span>First Crest Hits Shoreline (8-15m Runup)</span>
            </div>
          </div>
        </div>

        <h2>4. Action Framework: What the System Shows vs. What You Must Do Today</h2>
        <div className="action-matrix">
          <div className="matrix-card">
            <h4>🏢 For Hotel General Managers & Resort Owners</h4>
            <ul>
              <li><strong>What the data shows:</strong> Your guests cannot outrun a wave in vehicles. Leaving guests to drive causes 21.8% mortality.</li>
              <li><strong>Actionable item:</strong> Formally certify your top 3 floors / roof deck as a Vertical Evacuation Refuge. Install automatic fail-open panic hardware on rooftop stair doors so they never lock during sirens.</li>
            </ul>
          </div>
          <div className="matrix-card">
            <h4>🏛️ For Mayors, Municipal Engineers & DDPM</h4>
            <ul>
              <li><strong>What the data shows:</strong> Two existing evacuation sites are catastrophically inadequate. 14 certified vertical sites are mandatory.</li>
              <li><strong>Actionable item:</strong> Sign structural access MOUs with commercial concrete buildings. Install bilingual route signage every 100 meters along beach corridors.</li>
            </ul>
          </div>
          <div className="matrix-card">
            <h4>👨‍👩‍👧 For Residents & Visitors</h4>
            <ul>
              <li><strong>What the data shows:</strong> You have between 30 and 45 minutes of preparation before departing on foot. Every minute spent searching for car keys is fatal.</li>
              <li><strong>Actionable item:</strong> Keep slip-on walking shoes and emergency meds beside the bed. Identify your nearest 3-story concrete building today.</li>
            </ul>
          </div>
        </div>

        <div className="research-action-row">
          <button className="primary" onClick={onExplore}>
            Return to Operational Model →
          </button>
        </div>
      </article>
    </div>
  );
}

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
          Confirm destinations and routes locally. Never rely on vehicles during a tsunami alert.
        </p>

        <div className="field-grid">
          {(
            [
              ["place", "Where are you staying?", "Hotel, home or workplace"],
              ["destination", "Primary Vertical / High-Ground Refuge", "Name and access point (>15m)"],
              ["backup", "Backup Refuge Destination", "Alternative 3+ story building"],
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
            <strong>1. Cars are fatal:</strong> Highway 4 and beach arteries gridlock in 14 minutes. Walk on foot.
          </li>
          <li>
            <strong>2. Vertical saves time:</strong> A 3rd-floor reinforced hotel is safer than running 2 km inland.
          </li>
          <li>
            <strong>3. Practice removes panic:</strong> Rehearse staircases and exit gates before a real event.
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
          Hotels and schools should conduct drills unannounced to simulate authentic warning conditions.
        </p>
        <div className="target-pill">
          <strong>Target: 100% of participants on foot at safe refuge &lt; 15 minutes.</strong>
        </div>
      </aside>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}