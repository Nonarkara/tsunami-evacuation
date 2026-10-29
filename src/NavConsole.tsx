import type { ReactNode } from "react";
import { NavSymbol } from "./NavSymbol";

export type ConsoleKey = "explore" | "satellite" | "prepare" | "drill" | "research";

type ConsoleItem = {
  label: string;
  /** Document id the item scrolls to once its section is open. */
  target: string;
  hint?: string;
};

type ConsoleEntry = {
  key: ConsoleKey;
  label: string;
  thai: string;
  note: string;
  items: ConsoleItem[];
};

const CONSOLE: ConsoleEntry[] = [
  {
    key: "explore",
    label: "Model",
    thai: "แบบจำลอง",
    note: "Terrain, crowd and timing on real ground",
    items: [
      { label: "3D terrain & rehearsal", target: "geography-pane", hint: "hero map" },
      { label: "Rehearsal controls", target: "rehearsal-controls", hint: "people, pace, surge" },
      { label: "Sources, settings & coverage", target: "exercise-console", hint: "method, data, limits" },
    ],
  },
  {
    key: "satellite",
    label: "Satellite",
    thai: "ดาวเทียม",
    note: "Instrument catalogue — nothing is connected live",
    items: [
      { label: "Buoys & tide gauges", target: "catalogue-physics", hint: "candidates" },
      { label: "SAR & flood extent", target: "catalogue-physics", hint: "candidates" },
      { label: "Elevation sources", target: "catalogue-physics", hint: "Mapzen Terrarium" },
    ],
  },
  {
    key: "prepare",
    label: "Plan",
    thai: "แผน",
    note: "Your own route, timing and checklist",
    items: [
      { label: "Personal plan form", target: "plan-form", hint: "arrival, route, household" },
      { label: "Validation rules", target: "plan-form", hint: "what must be confirmed" },
    ],
  },
  {
    key: "drill",
    label: "Drill",
    thai: "ซ้อมอพยพ",
    note: "Record a real practice, then check it",
    items: [
      { label: "Drill log", target: "drill-form", hint: "date, headcount, route" },
      { label: "Drill validation", target: "drill-form", hint: "what a good record needs" },
    ],
  },
  {
    key: "research",
    label: "Research",
    thai: "งานวิจัย",
    note: "The preprint, its limits and its ledger",
    items: [
      { label: "Reported scenario results", target: "research-results", hint: "21.8% → 1.2%" },
      { label: "Two models, two purposes", target: "research-methods", hint: "paper vs browser" },
      { label: "Evidence & data ledger", target: "research-sources", hint: "sources R1–R10" },
      { label: "Validation agenda", target: "research-validation", hint: "proposed, not done" },
    ],
  },
];

/** Direct section navigation. Detailed instructions remain in each page and the manual. */
export function NavConsole({
  active,
  onNavigate,
  manual,
}: {
  active: ConsoleKey;
  onNavigate: (key: ConsoleKey) => void;
  manual: ReactNode;
}) {
  return (
    <nav
      className="masthead-nav"
      aria-label="Main navigation"
    >
      {CONSOLE.map((entry) => (
        <button
          key={entry.key}
          type="button"
          className="console-trigger"
          aria-label={`${entry.label} / ${entry.thai}`}
          aria-description={
            entry.items
              .map(item => item.label)
              .join('; ')
          }
          title={`${entry.label} · ${entry.thai} · ${entry.note}`}
          aria-controls={
            entry.items
              .map(item => item.target)
              .join(' ')
          }
          aria-current={active === entry.key ? 'page' : undefined}
          onClick={() => onNavigate(entry.key)}
        >
          <NavSymbol name={entry.key} /><span className="nav-caption">{entry.label}</span>
        </button>
      ))}
      {manual}
    </nav>
  );
}
