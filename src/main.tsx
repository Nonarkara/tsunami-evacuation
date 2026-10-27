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

      {/* ── §1 Ultra-Compact Command Masthead (1/4 prior size) ── */}
      <header className="compact-header">
        <div className="masthead-left">
          <a
            className="compact-brand"
            href="#explore"
            onClick={(e) => {
              e.preventDefault();
              navigate("explore");
            }}
          >
            <span className="brand-logo">สู้</span>
            <div className="brand-titles">
              <span className="brand-name">
                Soonami<strong>สู้-nami</strong>
              </span>
              <span className="brand-sub">by Dr. Non</span>
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
                  📍 {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="live-status-pill" title="Real-time ocean buoy status">
            <span className="status-dot-pulse" />
            <span>DART 23401: Normal</span>
          </div>
        </div>

        <nav className="compact-nav" aria-label="Main navigation">
          {(
            [
              ["explore", "Explore & Model"],
              ["satellite", "Satellite & Met"],
              ["prepare", "My Plan"],
              ["drill", "Run Drill"],
              ["research", "Dr. Non's Research"],
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

        <div className="masthead-right">
          <button
            className="compact-emergency-btn"
            onClick={() => setEmergency(!emergency)}
            aria-expanded={emergency}
          >
            🚨 1784 Safety
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
            {/* Section 01: Interactive Map & Area Geography */}
            <section className="geography-pane" aria-labelledby="map-pane-title">
              <div className="pane-header">
                <div className="pane-titles">
                  <span className="pane-badge">01 / GEOGRAPHY & GEOMETRY</span>
                  <h2 id="map-pane-title">{region.name}</h2>
                </div>
                <div className="region-meta-strip">
                  <span className="meta-tag risk">{region.riskTier}</span>
                  <span className="meta-tag">ETA: ~{region.waveEtaMin}m</span>
                  <span className="meta-tag">Runup: {region.expectedRunupM}</span>
                </div>
              </div>

              <StudyMap
                region={region}
                selected={selectedPlace}
                onSelect={setSelectedPlace}
              />

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

              <div className="place-directive-card">
                <div className="directive-header">
                  <div>
                    <h3>
                      {region.places[selectedPlace].name}{" "}
                      <span className="thai-name">
                        ({region.places[selectedPlace].thaiName})
                      </span>
                    </h3>
                    <p className="place-desc">
                      {region.places[selectedPlace].description}
                    </p>
                  </div>
                  <div className="place-stats">
                    <span className="stat-pill">
                      Elev: <strong>{region.places[selectedPlace].elevationM}m</strong>
                    </span>
                    <span className="stat-pill">
                      Safe Ridge: <strong>{region.places[selectedPlace].safeDistM}m</strong>
                    </span>
                  </div>
                </div>

                <div className="action-directive">
                  <strong>⚠️ Dr. Non's Actionable Directive:</strong>
                  <span>{region.places[selectedPlace].actionableDirective}</span>
                </div>

                <div className="directive-footer">
                  <button
                    className="plan-shortcut-btn"
                    onClick={() => navigate("prepare")}
                  >
                    Create personal plan for this place →
                  </button>
                  <span className="meta-note">
                    Area markers are orientation references. Actual wave run-up depends on bathymetric focus.
                  </span>
                </div>
              </div>
            </section>

            {/* Section 02: Evidence & Modeling Engine */}
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

              {/* Result Summary HUD */}
              <div className="result-hud" aria-live="polite">
                <div className="hud-primary">
                  <div className="hud-stat">
                    <span className="hud-number">
                      {resultFor(step, condition).toFixed(1)}
                      <small>%</small>
                    </span>
                    <div className="hud-labels">
                      <strong>Casualty rate</strong>
                      <span>
                        {Math.round(
                          (resultFor(step, condition) / 100) * POPULATION,
                        ).toLocaleString("en-US")}{" "}
                        of {POPULATION.toLocaleString("en-US")} modeled agents
                      </span>
                    </div>
                  </div>
                  {step !== 0 ? (
                    <div className="hud-reduction-badge">
                      <span className="reduction-pct">
                        −{reduction(step, condition).toFixed(0)}%
                      </span>
                      <span className="reduction-sub">Casualty drop vs baseline</span>
                    </div>
                  ) : (
                    <div className="hud-baseline-badge">
                      <span>Baseline Gridlock</span>
                    </div>
                  )}
                </div>

                <div className="hud-truth-note">
                  <strong>Dr. Non's Finding: </strong>
                  <span>{scenarios[step].drNonFinding}</span>
                </div>
              </div>

              {/* Scenario comparison table */}
              <div
                className="scenario-table"
                role="region"
                aria-label="Intervention package comparison"
              >
                <div className="scenario-table-header" aria-hidden="true">
                  <span className="col-pkg">Intervention Package</span>
                  <span className="col-scale">Casualty rate (0–25% scale · lower is safer)</span>
                  <span className="col-rate">Casualties</span>
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
                          <span className="step-text">{s.label}</span>
                        </span>
                        <span className="bar-track" aria-hidden="true">
                          <span
                            style={{
                              width: `${(rate / 25) * 100}%`,
                            }}
                          />
                        </span>
                        <span className="rate-wrap">
                          <strong className="rate-num">{rate.toFixed(1)}%</strong>
                          {!isBase ? (
                            <span className="red-pill">−{red.toFixed(0)}%</span>
                          ) : (
                            <span className="base-pill">Base</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actionable item for current step */}
              <div className="actionable-banner">
                <span className="action-tag">ACTIONABLE PROTOCOL</span>
                <p>
                  <strong>For Mayors & Operators: </strong>
                  {scenarios[step].action}
                </p>
              </div>

              {/* Package Details Disclosure */}
              <details className="package-detail">
                <summary>Engine parameters & simulation configuration</summary>
                <h3>{scenarios[step].label}</h3>
                <dl>
                  <div>
                    <dt>Vertical refuges in model</dt>
                    <dd>{scenarios[step].sites} certified structures</dd>
                  </div>
                  <div>
                    <dt>Multilingual route signs</dt>
                    <dd>{scenarios[step].signs} continuous signs</dd>
                  </div>
                  <div>
                    <dt>Vertical evacuation preference</dt>
                    <dd>{scenarios[step].vertical}% agent preference</dd>
                  </div>
                </dl>
              </details>

              {/* 3-Part Outcome Breakdown */}
              <Outcome step={step} condition={condition} />

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

        {/* Tab: Dr. Non's Research Section with Diagrams */}
        <div hidden={tab !== "research"}>
          <ResearchSection onExplore={() => navigate("explore")} />
        </div>
      </main>

      {/* ── §3 Sleek Footer ─────────────────────────────────── */}
      <footer className="compact-footer">
        <span>
          <strong>Soonami (สู้-nami)</strong> · Directed by Dr. Non Arkaraprasertkul
        </span>
        <span>
          Research translation of AIT / Mahidol Autonomous Agent Study (SSRN 7270357)
        </span>
        <span>FloodDash Telemetry Integration</span>
        <button onClick={() => navigate("research")}>
          Research & Diagrams
        </button>
      </footer>
    </>
  );
}

/* ── §4 Outcome Component ──────────────────────────────────── */
function Outcome({ step, condition }: { step: number; condition: Condition }) {
  const o = outcomes(step, condition);
  return (
    <details className="outcome" open={step === 0 || step === 4}>
      <summary>What happened to all 39,041 agents in this scenario?</summary>
      {o.reached === null ? (
        <div className="outcome-content">
          <p>
            The preprint reported exact casualty rates for all five packages, but only published the complete 3-part breakdown (reached site, outside hazard zone, victims) for the <strong>Study baseline</strong> and <strong>Complete package</strong>.
          </p>
          <div className="outcome-partial-meter">
            <div className="meter-header">
              <span>Modeled casualty rate</span>
              <strong>{o.affected.toFixed(1)}%</strong>
            </div>
            <div className="meter-track" aria-hidden="true">
              <span className="meter-bar victims" style={{ width: `${o.affected}%` }} />
              <span className="meter-bar unclassified" style={{ width: `${100 - o.affected}%` }} />
            </div>
            <p className="meta">
              {(100 - o.affected).toFixed(1)}% of agents survived, divided between those reaching designated refuges and those outside the hazard area.
            </p>
          </div>
        </div>
      ) : (
        <div className="outcome-content">
          <p className="outcome-intro">
            Distribution across all {POPULATION.toLocaleString("en-US")} modeled agents at the end of the simulation:
          </p>
          <div
            className="outcome-stacked-bar"
            role="img"
            aria-label={`Outcome distribution: ${o.reached.toFixed(1)}% reached evacuation site, ${o.outside?.toFixed(1)}% outside hazard zone, ${o.affected.toFixed(1)}% victims.`}
          >
            <span
              className="segment-reached"
              style={{ width: `${o.reached}%` }}
              title={`Reached safe site: ${o.reached.toFixed(1)}%`}
            />
            <span
              className="segment-outside"
              style={{ width: `${o.outside}%` }}
              title={`Outside hazard area: ${o.outside?.toFixed(1)}%`}
            />
            <span
              className="segment-victims"
              style={{ width: `${o.affected}%` }}
              title={`Modeled victims: ${o.affected.toFixed(1)}%`}
            />
          </div>
          <div className="outcome-legend">
            <div className="legend-cell">
              <span className="legend-swatch swatch-reached" />
              <div>
                <strong>{o.reached.toFixed(1)}% Reached safe site</strong>
                <span className="meta">Safe at designated vertical refuge or evacuation point</span>
              </div>
            </div>
            <div className="legend-cell">
              <span className="legend-swatch swatch-outside" />
              <div>
                <strong>{o.outside?.toFixed(1)}% Outside hazard area</strong>
                <span className="meta">Beyond the modeled wave inundation zone</span>
              </div>
            </div>
            <div className="legend-cell">
              <span className="legend-swatch swatch-victims" />
              <div>
                <strong>{o.affected.toFixed(1)}% Modeled casualties</strong>
                <span className="meta">Caught by inundation before reaching safety</span>
              </div>
            </div>
          </div>
          <p className="meta outcome-callout">
            Notice that “not a victim” and “reached an evacuation site” are different outcomes. The full intervention package increased safe refuge arrivals from {condition === "baseline" ? "60.7%" : "56.8%"} up to {condition === "baseline" ? "93.6%" : "88.9%"}.
          </p>
        </div>
      )}
    </details>
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

/* ── §6 Dr. Non's Re-written Research Section with Diagrams ─── */
function ResearchSection({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="research-view-wrap">
      <div className="research-hero">
        <span className="eyebrow">A CANDID TRANSLATION OF SSRN 7270357</span>
        <h1>The Science of Tsunami Survival in Khao Lak & Coastal Thailand</h1>
        <p className="lead-byline">
          By <strong>Dr. Non Arkaraprasertkul</strong> · Translating the empirical research of Nattapon Trumikaborworn, Panon Latcharote, and Pennung Warnitchai (AIT / Mahidol, 2024).
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
          Why? Because Highway 4 is a coastal two-lane artery. Within 14 minutes of departure, vehicular traffic reaches total gridlock. Cars cannot move forward; they cannot turn around. When the tsunami wave reaches the shore at T+125 minutes, it sweeps through stagnant lines of automobiles. <strong>In an evacuation, your car is not a shelter; it is a 2-ton metal coffin.</strong>
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
          <span className="meta">Private & On-Device · Dr. Non Protocol</span>
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

        <label>
          Assisted Evacuation (Children, Elderly, Mobility Impaired)
          <textarea
            maxLength={2000}
            value={plan.assistance}
            placeholder="Who needs assistance and who is the designated companion? Medical equipment required."
            onChange={(e) => field("assistance", e.target.value)}
          />
          <span className="print-value">{plan.assistance || "Not entered"}</span>
        </label>

        <div className="toolbar">
          <button className="primary" onClick={save}>
            Save on this device
          </button>
          <button onClick={load}>Load saved plan</button>
          <button
            onClick={() =>
              download(
                "soonami-personal-plan.json",
                JSON.stringify(
                  {
                    system: "Soonami (สู้-nami) Coastal Defense Platform",
                    creator: CREATOR,
                    exportedAt: new Date().toISOString(),
                    plan,
                  },
                  null,
                  2,
                ),
              )
            }
          >
            Download JSON
          </button>
          <button onClick={() => window.print()}>Print plan</button>
        </div>

        <p className="status-message" role="status">
          {message || "Data stays in this browser. Nothing is uploaded to any server."}
        </p>
      </section>

      <aside className="plan-aside">
        <section>
          <div className="section-line">
            <h2>Readiness Checklist</h2>
            <span>
              {plan.checked.filter(Boolean).length}/{checklist.length}
            </span>
          </div>
          <div className="checklist">
            {checklist.map((c, i) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={plan.checked[i]}
                  onChange={(e) => {
                    setPlan((p) => ({
                      ...p,
                      checked: p.checked.map((v, n) =>
                        n === i ? e.target.checked : v,
                      ),
                    }));
                    setMessage("Unsaved changes.");
                  }}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="walking-tool">
          <h2>Rehearsal Time Calculator</h2>
          <div className="field-grid">
            <label>
              Walking Distance (m)
              <input
                type="number"
                min="1"
                max="50000"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </label>
            <label>
              Pace (m/s)
              <select value={speed} onChange={(e) => setSpeed(e.target.value)}>
                <option value="0.5">0.5 · Slower / Elderly / Kids</option>
                <option value="0.8">0.8 · Steady walking pace</option>
                <option value="1.2">1.2 · Brisk walking pace</option>
              </select>
            </label>
          </div>
          <output className="walk-result">
            {minutes === null ? "Enter a positive distance" : `~${minutes} minutes on foot`}
          </output>
          <p className="meta">
            Excludes obstacles, crowds, and stairways. Always walk the route in person.
          </p>
        </section>
      </aside>
    </div>
  );
}

/* ── §8 Run a Drill View ───────────────────────────────────── */
const protocols = [
  {
    phase: "Phase 1: Pre-Drill",
    title: "Verify Unlocked Vertical Access & Brief Team",
    body: "Ensure designated multi-story hotel stairwells are unlocked and illuminated. Brief all participants that this is a simulated exercise.",
    owner: "Safety Director + Facility Warden",
  },
  {
    phase: "Phase 2: Trigger",
    title: "Broadcast Unmistakable Exercise Alarm",
    body: "Transmit 'DRILL / EXERCISE' across all radios and public address systems. Log timestamp of transmission across all zones.",
    owner: "Operations Communications Lead",
  },
  {
    phase: "Phase 3: Evacuate",
    title: "Execute Immediate Foot & Stair Movement",
    body: "Zero vehicles permitted. Time the movement of participants up to the 3rd floor (>15m elevation). Observe choke points and stair congestion.",
    owner: "Route Observers + Assistance Guides",
  },
  {
    phase: "Phase 4: Account",
    title: "Headcount & Roll Call at Refuge Site",
    body: "Account for all staff, guests, and dependents. Verify that no person is unaccounted for before closing the assembly area.",
    owner: "Floor Wardens + Team Leads",
  },
  {
    phase: "Phase 5: Debrief",
    title: "Log Gaps & Corrective Engineering Actions",
    body: "Record bottlenecks, broken emergency lights, locked gates, and assign named owners with a 14-day resolution deadline.",
    owner: "General Manager + Municipal Liaison",
  },
];

function Drill() {
  const [phase, setPhase] = useState(0),
    [team, setTeam] = useState(""),
    [owner, setOwner] = useState(""),
    [date, setDate] = useState(""),
    [notes, setNotes] = useState(""),
    [participants, setParticipants] = useState(""),
    [reached, setReached] = useState(""),
    [assisted, setAssisted] = useState("0"),
    [minutes, setMinutes] = useState(""),
    [message, setMessage] = useState("");

  const log = {
    participants: Number(participants),
    reached: Number(reached),
    assisted: Number(assisted),
    minutes: Number(minutes),
  };

  function exportDrill() {
    if (
      !team.trim() ||
      !owner.trim() ||
      !date ||
      !participants ||
      !reached ||
      !assisted ||
      !minutes ||
      !validateDrill(log)
    ) {
      setMessage("Please complete all required drill fields with valid numbers.");
      return;
    }
    download(
      "soonami-drill-record.json",
      JSON.stringify(
        {
          system: "Soonami (สู้-nami) Exercise Registry",
          recordedAt: new Date().toISOString(),
          team,
          owner,
          reviewDate: date,
          ...log,
          unaccounted: log.participants - log.reached,
          notes,
          protocols,
        },
        null,
        2,
      ),
    );
    setMessage("Exercise record exported successfully.");
  }

  return (
    <div className="drill-grid">
      <section>
        <div className="section-head-compact">
          <h2>Tsunami Evacuation Drill Protocol</h2>
          <span className="meta">Dr. Non Zero-Vehicle Operational Standard</span>
        </div>

        <div className="protocols">
          {protocols.map((p, i) => (
            <button
              key={p.phase}
              aria-pressed={phase === i}
              onClick={() => setPhase(i)}
            >
              <span className="protocol-num">0{i + 1}</span>
              <span>
                <strong>{p.phase}</strong>
                <span>{p.title}</span>
              </span>
              <span>↗</span>
            </button>
          ))}
        </div>

        <article className="protocol-detail" aria-live="polite">
          <p className="eyebrow">
            Step {phase + 1} of {protocols.length}
          </p>
          <h2>{protocols[phase].title}</h2>
          <p>{protocols[phase].body}</p>
          <p className="meta">Responsible: {protocols[phase].owner}</p>
        </article>

        <div className="callout">
          <h3>The Science Behind the Drill</h3>
          <p>
            The AIT/Mahidol study showed that rehearsing vertical evacuation cuts casualties from 3.7% down to 1.3%. If staff and residents don't know which staircase to take, they freeze. Rehearsal saves lives.
          </p>
        </div>
      </section>

      <section className="drill-form">
        <h2>Record & Log the Exercise</h2>
        <label>
          Property / Facility / Community Name
          <input
            maxLength={200}
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="E.g. Bang Niang Beachfront Resort"
          />
        </label>

        <div className="field-grid">
          <label>
            Drill Coordinator
            <input
              maxLength={200}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Name & role"
            />
          </label>
          <label>
            Drill Date
            <input
              type="date"
              value={date}
              onInput={(e) => setDate(e.currentTarget.value)}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Total Participants
            <input
              type="number"
              min="1"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
          </label>
          <label>
            Reached Safe Refuge
            <input
              type="number"
              min="0"
              value={reached}
              onChange={(e) => setReached(e.target.value)}
            />
          </label>
          <label>
            Assisted Individuals
            <input
              type="number"
              min="0"
              value={assisted}
              onChange={(e) => setAssisted(e.target.value)}
            />
          </label>
          <label>
            Elapsed Time (Minutes)
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
        </div>

        <label>
          Gaps, Bottlenecks, and Named Corrective Action Owners
          <textarea
            maxLength={6000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g. North staircase locked; security supervisor assigned to install push-bar panic hardware by Friday."
          />
        </label>

        {participants && reached && validateDrill(log) && (
          <p className="accounting">
            <strong>{log.participants - log.reached}</strong> participants unaccounted for at refuge point.
          </p>
        )}

        <div className="toolbar">
          <button className="primary" onClick={exportDrill}>
            Download Exercise Record
          </button>
          <button onClick={() => window.print()}>Print Protocol & Record</button>
        </div>

        <p className="status-message">{message}</p>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
