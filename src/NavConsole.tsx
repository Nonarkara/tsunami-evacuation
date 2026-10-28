import { useEffect, useRef, useState, type ReactNode } from "react";
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
      { label: "Evidence & data ledger", target: "research-sources", hint: "sources R1–R7" },
      { label: "Validation agenda", target: "research-validation", hint: "proposed, not done" },
    ],
  },
];

/**
 * The masthead console. Each glyph opens a menu with the real contents of its section,
 * so the top bar carries structure instead of five unlabelled icons.
 */
export function NavConsole({
  active,
  onNavigate,
  manual,
}: {
  active: ConsoleKey;
  onNavigate: (key: ConsoleKey) => void;
  manual: ReactNode;
}) {
  const [open, setOpen] = useState<ConsoleKey | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) setOpen(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function go(key: ConsoleKey, target?: string) {
    onNavigate(key);
    setOpen(null);
    if (!target) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(target);
      if (!el) return;
      el.scrollIntoView({ block: "start" });
      history.replaceState(null, "", `#${key}`);
    });
  }

  const entry = CONSOLE.find((e) => e.key === open);

  return (
    <nav className="masthead-nav" aria-label="Main navigation" ref={navRef}>
      {CONSOLE.map((e) => (
        <button
          key={e.key}
          className="console-trigger"
          aria-label={`${e.label} / ${e.thai}`}
          title={`${e.label} · ${e.note}`}
          aria-current={active === e.key ? "page" : undefined}
          aria-expanded={open === e.key}
          aria-haspopup="menu"
          onClick={() => {
            onNavigate(e.key);
            setOpen(open === e.key ? null : e.key);
          }}
        >
          <NavSymbol name={e.key} />
        </button>
      ))}

      {entry && (
        <div className="console-menu" role="menu" aria-label={`${entry.label} menu`}>
          <p className="console-menu-note">{entry.note}</p>
          <ul>
            {entry.items.map((item) => (
              <li key={item.label}>
                <button
                  role="menuitem"
                  onClick={() => go(entry.key, item.target)}
                  title={`${item.label}${item.hint ? ` · ${item.hint}` : ""}`}
                >
                  <span>{item.label}</span>
                  {item.hint && <em>{item.hint}</em>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {manual}
    </nav>
  );
}
