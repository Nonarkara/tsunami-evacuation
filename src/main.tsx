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
  POPULATION,
  scenarios,
  places,
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
} from "./research";
type Tab = "explore" | "prepare" | "drill" | "research";
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
    return ["explore", "prepare", "drill", "research"].includes(t)
      ? (t as Tab)
      : "explore";
  });
  const [selected, setSelected] = useState(2),
    [step, setStep] = useState(4),
    [condition, setCondition] = useState<Condition>("baseline"),
    [emergency, setEmergency] = useState(false);
  function navigate(t: Tab) {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
    window.scrollTo({ top: 0 });
  }
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="header">
        <a
          className="brand"
          href="#explore"
          onClick={(e) => {
            e.preventDefault();
            navigate("explore");
          }}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M3 26h26M8 20 16 7l8 13M16 8v17" />
          </svg>
          <span>
            Khao Lak<strong>Tsunami preparedness</strong>
          </span>
        </a>
        <nav aria-label="Main navigation">
          {(
            [
              ["explore", "Explore"],
              ["prepare", "My plan"],
              ["drill", "Run a drill"],
              ["research", "The research"],
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
        <button
          className="emergency-link"
          onClick={() => setEmergency(!emergency)}
          aria-expanded={emergency}
        >
          Tsunami safety ↗
        </button>
      </header>
      <section className="notice">
        <span className="status-dot" />
        <strong>Preparedness pilot</strong>
        <span>Live tsunami alerts are not connected.</span>
        <a href="https://www.tmd.go.th/en/CAP" target="_blank" rel="noreferrer">
          Official warnings ↗
        </a>
      </section>
      {emergency && (
        <section
          className="emergency-panel"
          aria-label="Tsunami safety guidance"
        >
          <div>
            <h2>Move to high ground or inland.</h2>
            <p>
              If you receive an evacuation order or notice natural warning
              signs, leave the hazard zone immediately. Follow local evacuation
              signs and official instructions. Do not wait for this website.
            </p>
            <p lang="th">
              หากได้รับคำสั่งอพยพ หรือพบสัญญาณเตือนภัยตามธรรมชาติ
              ให้ออกจากพื้นที่เสี่ยงทันที ไปยังที่สูงหรือห่างจากชายฝั่ง
              ตามป้ายอพยพและคำแนะนำของเจ้าหน้าที่ อย่ารอข้อมูลจากเว็บไซต์นี้
            </p>
          </div>
          <div>
            <p>
              Walk if you can do so safely. Use the assistance arrangement you
              made in advance. Stay away until authorities give the all-clear.
            </p>
            <a href="tel:1784">Call DDPM · 1784</a>
            <p className="meta">
              <a
                href="https://www.weather.gov/safety/tsunami-during"
                target="_blank"
                rel="noreferrer"
              >
                Safety guidance: NOAA/NWS ↗
              </a>{" "}
              ·{" "}
              <a
                href="https://www.disaster.go.th/home"
                target="_blank"
                rel="noreferrer"
              >
                Thai DDPM ↗
              </a>
            </p>
            <button onClick={() => setEmergency(false)}>Close guidance</button>
          </div>
        </section>
      )}
      <main id="main" tabIndex={-1}>
        {tab === "explore" ? (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">Khao Lak, Phang Nga · Thailand</p>
                <h1>Evacuation measures</h1>
              </div>
              <p>Choose a place. Compare the study. Make a plan.</p>
            </div>
            <div className="explore-grid">
              <section className="geography" aria-labelledby="map-title">
                <div className="section-line">
                  <h2 id="map-title">01 / Know the place</h2>
                </div>
                <StudyMap selected={selected} onSelect={setSelected} />
                <div className="place-selector" aria-label="Select an area">
                  {places.map((p, i) => (
                    <button
                      key={p.name}
                      aria-pressed={selected === i}
                      onClick={() => setSelected(i)}
                    >
                      <span>{i + 1}</span>
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="place-detail">
                  <div>
                    <h3>{places[selected].name}</h3>
                    <p>{places[selected].description}</p>
                  </div>
                  <button
                    className="text-action"
                    onClick={() => navigate("prepare")}
                  >
                    Make my plan →
                  </button>
                </div>
                <p className="map-source meta">
                  Area markers are approximate, not safe destinations. Hazard
                  boundaries and approved routes are not available.
                </p>
              </section>
              <section className="evidence" aria-labelledby="evidence-title">
                <div className="section-line">
                  <h2 id="evidence-title">02 / Test the measures</h2>
                  <span className="meta">Published results</span>
                </div>
                <div
                  className="condition"
                  aria-label="Study warning conditions"
                >
                  <button
                    aria-pressed={condition === "baseline"}
                    onClick={() => setCondition("baseline")}
                  >
                    Baseline timing (30 min warning)
                  </button>
                  <button
                    aria-pressed={condition === "delayed"}
                    onClick={() => setCondition("delayed")}
                  >
                    Delayed warning (45 min warning)
                  </button>
                </div>
                <p className="condition-note meta">
                  Study timing: warning at {condition === "baseline" ? 30 : 45}{" "}
                  min · mean preparation {condition === "baseline" ? 14 : 28}{" "}
                  min after receipt.
                </p>
                <div className="result-card" aria-live="polite">
                  <div className="result-card-top">
                    <div className="big-stat">
                      <span className="big-number">
                        {resultFor(step, condition).toFixed(1)}
                        <small>%</small>
                      </span>
                      <div className="stat-label">
                        <strong>Modeled victim rate</strong>
                        <span>
                          {Math.round(
                            (resultFor(step, condition) / 100) * POPULATION,
                          ).toLocaleString("en-US")}{" "}
                          of {POPULATION.toLocaleString("en-US")} study agents
                        </span>
                      </div>
                    </div>
                    {step !== 0 && (
                      <div className="reduction-badge">
                        <span className="reduction-value">
                          −{reduction(step, condition).toFixed(0)}%
                        </span>
                        <span className="reduction-label">fewer victims vs baseline</span>
                      </div>
                    )}
                  </div>
                  <p className="result-context">
                    {step === 0 ? (
                      "The study baseline exposes the severe cost of vehicle evacuation gridlock."
                    ) : (
                      <>
                        <strong>
                          {reduction(step, condition).toFixed(0)}% fewer
                        </strong>{" "}
                        modeled victims than the {resultFor(0, condition).toFixed(1)}% study baseline.
                      </>
                    )}
                  </p>
                </div>
                <div className="scenario-table" role="region" aria-label="Intervention package comparison">
                  <div className="scenario-table-header" aria-hidden="true">
                    <span className="col-pkg">Package</span>
                    <span className="col-scale">Casualty rate (0–25% scale · lower is safer)</span>
                    <span className="col-rate">Result</span>
                  </div>
                  <div
                    className="scenario-list"
                    aria-label="Choose a published intervention package"
                  >
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
                              <span className="base-pill">Baseline</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="cumulative meta">
                  Cumulative packages · reported Unity results, not a new
                  simulation.
                </p>
                <details className="package-detail">
                  <summary>Package details & next steps</summary>
                  <h3>{scenarios[step].label}</h3>
                  <dl>
                    <div>
                      <dt>Vertical sites in model</dt>
                      <dd>{scenarios[step].sites}</dd>
                    </div>
                    <div>
                      <dt>Route signs in model</dt>
                      <dd>{scenarios[step].signs}</dd>
                    </div>
                    <div>
                      <dt>Vertical preference</dt>
                      <dd>{scenarios[step].vertical}%</dd>
                    </div>
                  </dl>
                  <p>{scenarios[step].action}</p>
                </details>
                <Outcome step={step} condition={condition} />
                <p className="source-note meta">
                  <a href={PAPER} target="_blank" rel="noreferrer">
                    SSRN 7270357 ↗
                  </a>{" "}
                  · {scenarios[step].reference}. Preprint; not peer reviewed.
                  Study results, not individual risk.
                </p>
              </section>
            </div>
            <section className="next-actions">
              <h2>03 / Put the evidence to work</h2>
              <button onClick={() => navigate("prepare")}>
                <strong>Residents & visitors</strong>
                <span>Confirm a destination. Prepare your plan. →</span>
              </button>
              <button onClick={() => navigate("drill")}>
                <strong>Hotels & local teams</strong>
                <span>Assign roles. Practise. Record gaps →</span>
              </button>
            </section>
          </>
        ) : null}
        <div hidden={tab !== "prepare"}>
          <Prepare />
        </div>
        <div hidden={tab !== "drill"}>
          <Drill />
        </div>
        <div hidden={tab !== "research"}>
          <Research onExplore={() => navigate("explore")} />
        </div>
      </main>
      <footer>
        <span>Khao Lak · Research into preparedness</span>
        <span>Study: Trumikaborworn, Latcharote & Warnitchai</span>
        <a
          href="https://github.com/Nonarkara/tsunami-evacuation"
          target="_blank"
          rel="noreferrer"
        >
          Source & methods ↗
        </a>
        <button onClick={() => navigate("research")}>
          Data limits & credits
        </button>
      </footer>
    </>
  );
}
function Outcome({ step, condition }: { step: number; condition: Condition }) {
  const o = outcomes(step, condition);
  return (
    <details className="outcome" open={step === 0 || step === 4}>
      <summary>What happened to all 39,041 agents in this scenario?</summary>
      {o.reached === null ? (
        <div className="outcome-content">
          <p>
            The preprint reported exact victim percentages for all five packages, but only published the complete 3-part breakdown (reached site, outside hazard zone, victims) for the <strong>Study baseline</strong> and <strong>Complete package</strong>.
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
                <strong>{o.reached.toFixed(1)}% Reached site</strong>
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
                <strong>{o.affected.toFixed(1)}% Modeled victims</strong>
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
      localStorage.setItem("khao-lak-plan-v1", JSON.stringify(plan));
      setMessage("Saved on this device. Use Load saved plan when you return.");
    } catch {
      setMessage(
        "Device storage unavailable. Download or print your plan instead.",
      );
    }
  }
  function load() {
    try {
      const raw = localStorage.getItem("khao-lak-plan-v1");
      if (!raw) {
        setMessage("No saved plan on this device.");
        return;
      }
      const data: unknown = JSON.parse(raw);
      if (!validatePlan(data)) throw Error();
      setPlan(data);
      setMessage("Saved plan loaded.");
    } catch {
      setMessage(
        "Could not load a valid plan. Current entries have been kept.",
      );
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Before an emergency</p>
          <h1>My evacuation plan</h1>
        </div>
        <p>
          Build this with your hotel or local authority.{" "}
          <br />
          Your entries stay in this browser.
        </p>
      </div>
      <div className="planning-grid">
        <section className="plan-form">
          <div className="section-line">
            <h2>Your evacuation plan</h2>
            <span className="meta">User-entered · unverified</span>
          </div>
          <p>
            Confirm destinations and routes locally. This form does not certify
            a building, route or arrival time.
          </p>
          <div className="field-grid">
            {(
              [
                [
                  "place",
                  "Where are you staying or starting?",
                  "Hotel, home or workplace",
                ],
                [
                  "destination",
                  "Locally designated destination",
                  "Name and access point",
                ],
                [
                  "backup",
                  "Backup destination",
                  "If the primary route is blocked",
                ],
                [
                  "contact",
                  "Contact outside the area",
                  "Name and phone number",
                ],
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
                <span className="print-value">
                  {plan[key] || "Not entered"}
                </span>
              </label>
            ))}
          </div>
          <label>
            Route notes
            <textarea
              maxLength={2000}
              value={plan.route}
              placeholder="Landmarks, signs, crossings, gates and alternative access"
              onChange={(e) => field("route", e.target.value)}
            />
            <span className="print-value">{plan.route || "Not entered"}</span>
          </label>
          <label>
            Who needs assistance, and who will help?
            <textarea
              maxLength={2000}
              value={plan.assistance}
              placeholder="Mobility, children, medication, language and agreed assistance"
              onChange={(e) => field("assistance", e.target.value)}
            />
            <span className="print-value">
              {plan.assistance || "Not entered"}
            </span>
          </label>
          <div className="toolbar">
            <button className="primary" onClick={save}>
              Save on this device
            </button>
            <button onClick={load}>Load saved plan</button>
            <button
              onClick={() =>
                download(
                  "khao-lak-my-plan.json",
                  JSON.stringify(
                    {
                      type: "Khao Lak preparedness plan",
                      status: "User-entered; not authority-validated",
                      exportedAt: new Date().toISOString(),
                      plan,
                    },
                    null,
                    2,
                  ),
                )
              }
            >
              Download plan
            </button>
            <button onClick={() => window.print()}>Print plan</button>
          </div>
          <p className="status-message" role="status">
            {message ||
              "Saving is optional. Personal details are never uploaded."}
          </p>
          <button
            className="text-action"
            onClick={() => {
              try {
                localStorage.removeItem("khao-lak-plan-v1");
                setMessage("Saved copy removed. Current form entries remain.");
              } catch {
                setMessage("Device storage unavailable.");
              }
            }}
          >
            Remove saved copy from this device
          </button>
        </section>
        <aside className="plan-aside">
          <section>
            <div className="section-line">
              <h2>Readiness checklist</h2>
              <span>
                {plan.checked.filter(Boolean).length}/{checklist.length}
              </span>
            </div>
            <p className="meta">A preparation record, not a safety score.</p>
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
            <h2>Rehearsal time estimate</h2>
            <p>
              Use a measured walking-route distance. Distance ÷ speed excludes
              crowds, stairs, stops, terrain and assistance delays.
            </p>
            <div className="field-grid">
              <label>
                Route distance (metres)
                <input
                  type="number"
                  min="1"
                  max="50000"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </label>
              <label>
                Walking speed (m/s)
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                >
                  <option value="0.5">0.5 · slower pace</option>
                  <option value="0.8">0.8 · steady pace</option>
                  <option value="1.2">1.2 · brisk pace</option>
                </select>
              </label>
            </div>
            <output className="walk-result">
              {minutes === null
                ? "Enter a positive distance"
                : `About ${minutes} minutes of walking`}
            </output>
            <p className="meta">
              Illustrative pace choices, not the study’s agent speeds. Time the
              actual route with everyone who will use it. This is not a tsunami
              arrival countdown.
            </p>
          </section>
          <section className="safety-note">
            <h2>Recognise the warning</h2>
            <p>
              Strong or prolonged shaking, a sudden sea-level change or an
              unusual ocean roar can be natural warnings. Evacuate immediately
              on natural warnings or an official order. Do not investigate at
              the beach.
            </p>
            <a
              href="https://www.weather.gov/safety/tsunami-before"
              target="_blank"
              rel="noreferrer"
            >
              NOAA/NWS preparedness guidance ↗
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}
const protocols = [
  {
    phase: "Before the drill",
    title: "Agree the plan and check access",
    body: "Coordinate with local authorities. Confirm approved destinations, capacity, route condition and accessible assistance. Tell participants this is an exercise.",
    owner: "Lead coordinator + destination liaison",
  },
  {
    phase: "Trigger",
    title: "Send an unmistakable exercise message",
    body: "Say “DRILL / EXERCISE” in every message. Test agreed warning channels and language coverage. Log when each group receives the message.",
    owner: "Communications lead",
  },
  {
    phase: "Move",
    title: "Practise the actual evacuation",
    body: "Start the clock. Observe departure delays, blocked crossings, congestion, missed signs and assistance needs. Do not use public warning sirens without authorisation.",
    owner: "Route observers + assistance team",
  },
  {
    phase: "Account",
    title: "Count people at the destination",
    body: "Use the agreed attendance method. Record people reached and unaccounted for; an observer reports gaps to the coordinator. A checklist does not replace a headcount.",
    owner: "Destination wardens",
  },
  {
    phase: "Review",
    title: "Fix the gaps and repeat",
    body: "Compare receipt, departure and arrival times. Assign each gap an owner and a review date. Rehearse again after corrective work.",
    owner: "Coordinator + all team leads",
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
      setMessage(
        "Enter a team, coordinator, review date and valid drill counts. Reached and assistance counts cannot exceed participants; time must be positive.",
      );
      return;
    }
    download(
      "khao-lak-drill-record.json",
      JSON.stringify(
        {
          type: "Exercise record — not a real incident",
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
    setMessage("Exercise record downloaded. Review the actions in your notes.");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">For hotels, communities & local teams</p>
          <h1>Plan and record a drill</h1>
        </div>
        <p>
          Work through the protocol.{" "}
          <br />
          Record what happened. Give each gap an owner.
        </p>
      </div>
      <div className="drill-grid">
        <section>
          <div className="section-line">
            <h2>Exercise protocol</h2>
            <span className="meta">Template · local approval required</span>
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
          <div className="print-protocols">
            {protocols.map((p) => (
              <article key={p.phase}>
                <h3>
                  {p.phase}: {p.title}
                </h3>
                <p>{p.body}</p>
                <p>Responsible: {p.owner}</p>
              </article>
            ))}
          </div>
          <div className="callout">
            <h3>The research changes what you test.</h3>
            <p>
              Include walking routes, assistance, vertical refuge access and
              signs. The preprint found these measures worked together. A faster
              departure alone did not resolve persistent road congestion.
            </p>
            <a href={PAPER} target="_blank" rel="noreferrer">
              Read §4.3–4.5 of the study ↗
            </a>
          </div>
        </section>
        <section className="drill-form">
          <h2>Record the exercise</h2>
          <p>
            Use aggregate counts. Keep participant names and personal needs in
            your organisation’s approved records.
          </p>
          <label>
            Team or property
            <input
              maxLength={200}
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="Community or hotel name"
            />
            <span className="print-value">{team || "Not entered"}</span>
          </label>
          <div className="field-grid">
            <label>
              Coordinator
              <input
                maxLength={200}
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
              <span className="print-value">{owner || "Not entered"}</span>
            </label>
            <label>
              Action review date
              <input
                type="date"
                value={date}
                onInput={(e) => setDate(e.currentTarget.value)}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Participants
              <input
                type="number"
                min="1"
                step="1"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
              />
            </label>
            <label>
              Reached destination
              <input
                type="number"
                min="0"
                step="1"
                value={reached}
                onChange={(e) => setReached(e.target.value)}
              />
            </label>
            <label>
              Participants needing assistance
              <input
                type="number"
                min="0"
                step="1"
                value={assisted}
                onChange={(e) => setAssisted(e.target.value)}
              />
            </label>
            <label>
              Elapsed exercise time (minutes)
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
            Gaps, actions and named owners
            <textarea
              maxLength={6000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. locked gate — property manager to resolve before next drill"
            />
            <span className="print-value">{notes || "Not entered"}</span>
          </label>
          {participants && reached && validateDrill(log) && (
            <p className="accounting">
              <strong>{log.participants - log.reached}</strong> participants
              unaccounted for at the destination. Reconcile with observers
              before closing.
            </p>
          )}
          <div className="toolbar">
            <button className="primary" onClick={exportDrill}>
              Download exercise record
            </button>
            <button onClick={() => window.print()}>
              Print protocol & record
            </button>
          </div>
          <p role="status" className="status-message">
            {message ||
              "Nothing is uploaded. Download the record before leaving this page."}
          </p>
        </section>
      </div>
    </>
  );
}
function Research({ onExplore }: { onExplore: () => void }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Evidence, assumptions & missing data</p>
          <h1>Research and sources</h1>
        </div>
        <p>
          A transparent bridge from a preprint{" "}
          <br />
          to a planning tool.
        </p>
      </div>
      <div className="research-grid">
        <article className="research-main">
          <h2>
            Agent-Based Modeling and Simulation for Identifying Effective
            Measures on Tsunami Evacuation in Khao Lak, Thailand
          </h2>
          <p>
            Nattapon Trumikaborworn, Panon Latcharote and Pennung Warnitchai.
            Asian Institute of Technology / Mahidol University.
          </p>
          <p>
            <a
              className="primary link-button"
              href={PAPER}
              target="_blank"
              rel="noreferrer"
            >
              Read the original preprint ↗
            </a>
          </p>
          <p>
            The supplied document is a preprint and has not been peer reviewed.
            It models evacuation in Unity using local survey preferences,
            building-derived population estimates and a time-dependent tsunami
            inundation model. Results describe the specified study conditions.
          </p>
          <h2>What the browser can tell you</h2>
          <p>
            Compare five published, cumulative intervention packages under
            baseline or delayed-warning conditions. The comparison uses fixed
            reported results. It cannot evaluate arbitrary new combinations,
            rerun the original agent model or predict an individual’s outcome.
          </p>
          <table>
            <caption>
              Source ledger · supplied SSRN preprint, transcribed 27 October
              2026
            </caption>
            <thead>
              <tr>
                <th>Input / result</th>
                <th>Source</th>
                <th>Meaning here</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>39,041 agents; 61% locals, 39% tourists</td>
                <td>Table 1; §4.1</td>
                <td>Modeled population, not a current census</td>
              </tr>
              <tr>
                <td>30 / 45 min warning; 14 / 28 min mean preparation</td>
                <td>§4.1–4.2</td>
                <td>Study assumptions, not current warning performance</td>
              </tr>
              <tr>
                <td>21.8 → 7.0 → 3.7 → 1.3 → 1.2%</td>
                <td>§4.1, §4.3, §4.5</td>
                <td>Victim shares; baseline timing</td>
              </tr>
              <tr>
                <td>22.6 → 10.6 → 5.6 → 3.4 → 2.9%</td>
                <td>§4.2, §4.5</td>
                <td>Victim shares; delayed conditions</td>
              </tr>
              <tr>
                <td>2 existing + 14 candidate sites; 64 → 135 signs</td>
                <td>§3.1; §4.5</td>
                <td>Model inventory, not verified facilities</td>
              </tr>
            </tbody>
          </table>
          <h2>A detail for author clarification</h2>
          <p>
            Table 3 and the discussion contain inconsistent
            pedestrian-preference values. Table 3 lists 25% in several
            intervention columns, while §4.3 discusses a baseline of 27% and
            calls the walking promotion PD50. This tool preserves the authors’
            scenario names and reported outcomes. It does not infer exact
            subgroup behavior from those labels.
          </p>
          <h2>Model boundaries matter</h2>
          <p>
            The shore arrival time of 135 minutes in §4.1 belongs to the paper’s
            specific earthquake scenario. It is excluded from personal planning
            calculations. A real tsunami can arrive on a different timescale.
            The study says application elsewhere requires locally calibrated
            geography and behavior.
          </p>
          <button onClick={onExplore}>Return to scenario comparison →</button>
        </article>
        <aside className="research-aside">
          <h2>Before operational use</h2>
          <ol>
            <li>
              <strong>Author data handover.</strong> Obtain the Unity project,
              survey documentation, scenario configurations and reproducible run
              outputs.
            </li>
            <li>
              <strong>Verified local GIS.</strong> Obtain licensed inundation
              polygons, approved routes and designated destinations, with dates
              and responsible agencies.
            </li>
            <li>
              <strong>Refuge assessment.</strong> Verify structural suitability,
              capacity, ownership and accessible opening arrangements.
            </li>
            <li>
              <strong>Field trials.</strong> Test with residents, visitors,
              older people and people with disabilities. Review Thai and
              visitor-language wording.
            </li>
            <li>
              <strong>Operating responsibility.</strong> Agree who maintains
              records and approves published local guidance.
            </li>
          </ol>
          <h2>Sources & credits</h2>
          <p>
            <a
              href="https://www.weather.gov/safety/tsunami-before"
              target="_blank"
              rel="noreferrer"
            >
              NOAA/NWS · Before a tsunami ↗
            </a>
            <br />
            <a
              href="https://www.weather.gov/safety/tsunami-during"
              target="_blank"
              rel="noreferrer"
            >
              NOAA/NWS · During a tsunami ↗
            </a>
            <br />
            <a
              href="https://www.disaster.go.th/home"
              target="_blank"
              rel="noreferrer"
            >
              Thai DDPM · official information / 1784 ↗
            </a>
            <br />
            <a
              href="https://www.tmd.go.th/en/CAP"
              target="_blank"
              rel="noreferrer"
            >
              Thai Meteorological Department · warnings ↗
            </a>
          </p>
          <p>
            Safety sources checked 27 October 2026. Local authority instructions
            take priority. No official alert feed is connected.
          </p>
          <p>
            Maps: OpenStreetMap contributors and tile service. Place markers are
            approximate labels. Your browser sends tile requests to
            OpenStreetMap while the map is open.
          </p>
          <p>
            Foundation:{" "}
            <a
              href="https://github.com/Nonarkara/Axiom-Design-Core"
              target="_blank"
              rel="noreferrer"
            >
              Axiom Design Core ↗
            </a>{" "}
            (MIT), React, Vite and Leaflet. Jost is self-hosted.
          </p>
          <h2>Your data</h2>
          <p>
            Plan storage is opt-in and local to this browser. Personal plans and
            exercise records have no upload endpoint. Anyone using the same
            browser profile may load a saved plan. Remove it in My plan.
          </p>
        </aside>
      </div>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
