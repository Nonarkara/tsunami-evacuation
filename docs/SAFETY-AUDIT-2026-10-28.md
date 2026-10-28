# Independent safety and interface audit — 28 October 2026

Reviewer: MiniMax Code (`mcode`), an independent pass over the buildings release that shipped as
`a16476d` … `3d4f447`, plus the interface redesign that followed it. This audit does not re-do the
buildings work; it checks it against the project's own rules in `AGENTS.md`, `context.md` and
`docs/RESEARCH.md`, and records what was changed.

Scope: the 3D building massing, the 1.65 m walk-through, the departure-timing comparison, the 2D
fallback map, the walk-through readout, and the top-of-page console. Verified against the
production build served by `vite preview` and, after release, against
`https://tsunami.nonarkara.org/`.

## Found

| # | Finding | Where | Why it matters |
|---|---|---|---|
| F1 | The walk-through offered a "Vertical refuge option" computed as the **nearest OSM building** to the exercise end, with a "Climb ~3 min vs ~30-min inland sprint" note | `src/TerrainRehearsal.tsx` survival panel | `AGENTS.md`: "Never infer live tsunami safety from … a nearest OSM building". A nearest-mapped-building suggestion is exactly that inference, hedged but still presented as an option to take. |
| F2 | The same building was marked on the map with an **amber action-coloured point** and no legend entry | `refuge-marker` layer | Amber is this project's action colour. An unexplained amber point at "the nearest building" reads as *go here*. |
| F3 | The timing benchmark was hard-coded with no attribution, was scored as a pass/fail verdict, and **contradicted the app's own data table** | `src/TerrainRehearsal.tsx`, `src/research.ts` | The 135-minute figure is the source model's shore arrival for its scenario (`docs/RESEARCH.md`, `docs/TERRAIN-VERIFICATION.md`), so it is traceable — but the component showed it unlabelled, coloured it green/red, and `research.ts` still carried a **125-minute** value for this region, a figure the project had already corrected away. Two numbers, one region. |
| F4 | That verdict was coloured **green `#14532d` / red `#991b1b`** | `src/style.css` `.survival-ok` / `.survival-risk` | A red/green safety verdict on a comparison against an unapproved exercise endpoint, with no validated model behind it. |
| F5 | The comparison panel was headed "who reaches **safety** first" and its note asserted what happens "when the wave arrives" | `src/TerrainRehearsal.tsx` compare panel | The endpoint is explicitly unapproved; reaching it is a timing fact, not a safety outcome. |
| F6 | The research axioms described VS14 as "14 **certified** reinforced concrete hotel buildings" | `src/ResearchSection.tsx` | `docs/RESEARCH.md` says the opposite: "They are not certified public refuges", and the same component's own definition list says the same. The card also claimed a site "saves lives" and that signage "eliminates" confusion — absolute claims from a model. |
| F7 | The 2D fallback map carried an entire **simulated run-up HUD** — a "Simulate" play button, a +0–15 m water slider and a status pill — plus a "Place references: ON/OFF" toggle that toggled nothing | `src/Map.tsx` | All of it was unreachable (`referenceOnly` was always true), but it was live code that would misrepresent tsunami behaviour the moment it was exposed. It also duplicated the 3D water experiment. |
| F8 | The same file kept two empty Leaflet layer groups and a `mode-tilted` transform with no trigger | `src/Map.tsx`, `src/style.css` | Dead code and dead CSS shipped in a public tool. |
| F9 | The "Surge" selector labelled its illustration levels "+10m (2004)" and "+15m (Max)" | `src/TerrainRehearsal.tsx` | A user-chosen terrain-screening level was dressed as the 2004 run-up and as a maximum. It is neither: it is an illustration. |
| F10 | The 2D fallback map showed only a satellite raster and four markers — no building context at all | `src/Map.tsx` | The fallback lost the built environment that makes the walk-through legible. |
| D1 | The masthead's five glyphs navigated but carried no structure, and the toolbar was a flat row of nine words | `src/main.tsx`, `src/TerrainRehearsal.tsx` | "Top bars … supposed to have menus, functions, and a console structure. Now it looks like there's nothing there." |
| D2 | The page ended in three collapsed disclosure rows — each an empty band with a rule above it | `src/TerrainRehearsal.tsx`, `src/main.tsx` | Three rows of nothing read as an unfinished bottom half. |
| D3 | The area selector sat in a row of its own below the map, and the page needed scrolling to see the whole exercise pane | `src/main.tsx` | The brief: "everything that comes after the bottom half … can actually be moved up to fit the screen without needing to scroll at all." |
| D4 | The camera group and the experiment group sat at opposite ends of the toolbar row, leaving a ~1100 px void between two icon clusters | `src/TerrainRehearsal.tsx` | A void is a spatial hallucination: space occupied by no decision. |

## Changed

### Safety and honesty

- **F1** The row is now *Nearest mapped building · ≈ N m from the exercise end*, with the explicit
  statement that structure, height, access, capacity and refuge status are unverified and that it
  is **not a destination recommendation**. The VE50 climb comparison was removed from this panel; it
  stays in the research section, where it is a published model result rather than a place-specific
  instruction.
- **F2** The marker is now a hollow neutral ring in the building colour family, and the map key
  states what it is: "Hollow ring: the mapped building nearest the exercise end — a footprint
  reference, not a refuge."
- **F3** The benchmark now reads `region.waveEtaMin`, and the study region's value was corrected
  from the stale **125** to the source model's **135** minutes, with a comment recording where the
  number comes from and that the earlier 125 was a corrected-away error. The panel labels it the
  *published scenario shore arrival for this coast* and keeps "a scenario number, not a live
  arrival time".
- **F4** The green/red classes are deleted. The readout states a timing comparison ("Ahead of the
  benchmark" / "Behind the benchmark") in neutral ink. No colour implies safety.
- **F5** The heading is now "who reaches the **exercise end** first", and the note says the
  endpoint is unapproved so the panel compares timing only.
- **F6** The axiom card now reads "Its 14 candidate reinforced concrete buildings (VS14) are
  evaluated in the model, **not certified as refuges**", the "saves lives" heading became
  "Vertical sites change the outcome", "eliminates" became "reduces", the 68 % figure is named as a
  relative reduction on the published rates, and the grid is framed as the manuscript's scenario
  results rather than local instruction. Both languages were updated together.
- **F9** The selector is now plain "Off / +5 m / +10 m / +15 m" and the existing "(illustrative)"
  boundary text carries the caveat.

### Dead code and the 2D fallback

- **F7/F8** `src/Map.tsx` was rewritten around what the fallback actually does. The simulated
  run-up HUD, the no-op place-reference toggle, the tilt transform, the two empty layer groups and
  the `referenceOnly` prop are gone — with 100 lines of matching dead CSS
  (`.map-water-hud`, `.hud-play-btn`, `.hud-slider*`, `.hud-status-pill`, `.chip-*`,
  `.mode-tilted`). Net: **−107 lines of source, −100 lines of CSS.**
- **F10** The 2D fallback now draws the **same OpenStreetMap building snapshot** as outlines over
  the imagery, and the building source note is shown in fallback mode too.

### Interface

- **D1** The five masthead glyphs are now a **console**: each opens a menu with a one-line
  statement of what the section is, and real items that navigate *and* scroll to a named target
  (`geography-pane`, `rehearsal-controls`, `exercise-console`, `catalogue-physics`, `plan-form`,
  `drill-form`, `research-results`, `research-methods`, `research-sources`, `research-validation`).
  The manual stays a dialog; the emergency number stays a right-hand action.
- **D1** The rehearsal toolbar is **icon-led**: experiment, camera and comparison groups are
  symbols with accessible names and hover tooltips, separated by rules so the groups read as
  groups. Text is no longer occupying a row of its own.
- **D2** The three empty disclosure rows became **one console**: "Sources, assumptions, settings &
  coverage", opening three labelled sections — sources and assumptions, scenario settings and
  coverage, and the local personal plan, which moved into the same console instead of standing
  alone.
- **D3** The area selector moved up into the title band beside the region title, and the hero map
  now takes the room the rest of the pane leaves over (`calc(100vh - 430px)`, clamped), so the
  whole exercise pane fits one screen without scrolling.
- **D4** The toolbar's two groups sit together on the left; the void between them is gone.

### What was deliberately not changed

- The building packs, the 19,565-footprint coverage, the height provenance rules, the 3 m labelled
  massing, the eye camera and the queue model were reviewed and found sound. Unknown heights stay
  `null` in the data and are only massed at render time; `src/buildings.test.ts` proves the parser
  rejects a fabricated height for an unknown building.
- The terrain is left at 1× relief, and the 3 m massing is **not** vertically exaggerated. A
  stretched building would be a bigger spatial hallucination than a small one.
- The right-hand evidence column still scrolls. It is the published research, and it is meant to be
  read at length; only the exercise pane is now a single screen.

## Verified

- `npm test` — all JavaScript and Python tests pass.
- `npm run build` — TypeScript strict compile and the Vite production build pass.
- `node scripts/check-contrast.mjs` — all authored pairs pass AA.
- Browser measurement at 1440×900, 1280×800, 1024×768 and 390×844 with the rebuilt bundle:
  - the geography pane's bottom edge lands inside the viewport at every desktop size, and the page
    reports **no horizontal overflow** at any width (`scrollWidth == clientWidth`, zero elements
    crossing the viewport edge);
  - the masthead menu opens, lists its real items and navigates;
  - the documentation console opens with its three sections;
  - the walk-through readout shows the 135-minute benchmark, no green/red verdict, and the
    "not a destination recommendation" statement.
- Live release: the canonical hostname served the new bytes and the console menus worked there.

## Remaining

- The walk-through compares **route timing** against a published scenario shore arrival. It does
  not and cannot answer whether a given person survives; the endpoint is unapproved and the queue
  model has no slope, mobility or water interaction. It stays an experiment.
- Building massing is context. No building in this application is a verified refuge, and the
  nearest-building marker is not a recommendation. Authoritative destinations still have to come
  from the responsible authority.
- Coverage is a bounded local OSM snapshot per place. Absence of a footprint is not open ground.
- Icon-only controls trade a visible word for a tooltip. Every one carries an `aria-label` and a
  `title`, and the groups are separated by rules, but a first-time visitor who does not hover will
  read symbols rather than names.
- Actual printer/PDF output of the plan and drill pages remains unverified, as recorded before.
