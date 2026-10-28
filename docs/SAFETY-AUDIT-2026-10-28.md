# Independent safety and interface audit — 28 October 2026

Reviewer: MiniMax Code (`mcode`). Two passes over the buildings release that shipped as
`a16476d` … `3d4f447`, then over the thin-banner workspace that followed it. This audit does not
re-do the buildings work; it checks it against the project's own rules in `AGENTS.md`,
`context.md` and `docs/RESEARCH.md`, and records what was changed and what is still true.

Everything below was measured in a real browser against the deployed site
(`https://tsunami.nonarkara.org/`), not against a local build.

## Found and changed

| # | Finding | Where | Disposition |
|---|---|---|---|
| F1 | The walk-through offered a "Vertical refuge option" computed as the **nearest OSM building**, with a "Climb ~3 min vs ~30-min inland sprint" note | `src/TerrainRehearsal.tsx` | **Fixed, then removed.** `AGENTS.md`: "Never infer live tsunami safety from … a nearest OSM building". The row became "Nearest mapped building" with an explicit "not a destination recommendation", the map marker became a neutral ring with a map-key entry, and the whole nearest-building feature was later removed from the product. The prohibited inference is no longer reachable. |
| F2 | The nearest building was drawn as an **amber action point** with no legend entry | `refuge-marker` layer | **Fixed** — neutral hollow ring, named in the map key; then removed with the feature. |
| F3 | The timing benchmark was hard-coded with no attribution and was scored as a pass/fail verdict, while `research.ts` still carried a **corrected-away 125-minute** figure for this region | `src/TerrainRehearsal.tsx`, `src/research.ts` | **Fixed.** The benchmark now reads `region.waveEtaMin`; the study region was corrected from 125 to the source model's 135 minutes, with a comment recording where the number comes from and that the earlier 125 was a corrected error. |
| F4 | That verdict was coloured **green `#14532d` / red `#991b1b`** | `src/style.css` | **Fixed.** The green/red classes are deleted. The walk-through now states timing in neutral ink and, in the shipped product, compares **nothing** against a wave time: the coach says the clock "is not a wave-arrival margin" and that reaching the endpoint "is not a safety verdict". |
| F5 | The comparison panel was headed "who reaches **safety** first" and asserted what happens "when the wave arrives" | `src/TerrainRehearsal.tsx` | **Fixed** — "exercise end", and the note states both rows use the exercise clock and an unapproved endpoint. |
| F6 | The research axioms described VS14 as "14 **certified** reinforced concrete hotel buildings", said a site "saves lives" and that signage "**eliminates**" confusion | `src/ResearchSection.tsx` | **Fixed.** The card now says the 14 buildings are "evaluated in the model, not certified as refuges", the heading is "Vertical sites change the outcome", "eliminates" became "reduces", the 68 % figure is named as a relative reduction on the published rates, and both languages were updated together. This now agrees with `docs/RESEARCH.md` and with the definitions list in the same component. |
| F7 | The 2D fallback map carried an entire **simulated run-up HUD** — a "Simulate" play button, a +0–15 m water slider, a status pill — plus a "Place references: ON/OFF" toggle that toggled nothing | `src/Map.tsx` | **Fixed.** All of it was unreachable, but it was live code that would misrepresent tsunami behaviour the moment it was exposed, and it duplicated the 3D water experiment. `src/Map.tsx` was rewritten around what the fallback actually does: **−107 lines of source.** |
| F8 | Two empty Leaflet layer groups and a `mode-tilted` transform with no trigger | `src/Map.tsx`, `src/style.css` | **Fixed** — with 100 lines of matching dead CSS (`.map-water-hud`, `.hud-play-btn`, `.hud-slider*`, `.hud-status-pill`, `.chip-*`, `.mode-tilted`). |
| F9 | The "Surge" selector labelled its illustration levels "+10m (2004)" and "+15m (Max)" | `src/TerrainRehearsal.tsx` | **Fixed** — plain levels, and the boundary text carries the caveat. The shipped control is "Water demo". |
| F10 | The 2D fallback map showed only a satellite raster and four markers | `src/Map.tsx` | **Fixed** — the fallback now draws the same OSM building snapshot as outlines, and the building source note appears in fallback mode too. |
| F11 | The page ended in three collapsed disclosure rows, each an empty band with a rule above it, and the whole exercise pane needed scrolling | `src/TerrainRehearsal.tsx`, `src/main.tsx` | **Fixed.** The three rows became one documentation console; the area selector moved into the title band; the explore tab is a two-column dashboard that fits one screen. |
| F12 | The camera group and the experiment group sat at opposite ends of the toolbar row, leaving a ~1100 px void between two icon clusters | `src/TerrainRehearsal.tsx` | **Fixed** — the toolbar is icon-led and grouped by rule, and the masthead became a single thin labelled banner with no dead space. |
| F13 | **On a 390 px phone the route profile fragmented across the reader's columns and the elevation chart was split in half at the column boundary** — a 772 px box inside a 374 px pane, clipped by the frame | `src/viewport.css` | **Fixed.** The rule that was meant to drop the analysis block on a phone targeted `.terrain-operations .terrain-secondary`, but the block is a child of the flow content, so it never matched. |
| F14 | **Building volumes were extruded at 0.88 opacity, so at 1.65 m eye height they read as floating glass slabs rather than buildings** | `src/TerrainRehearsal.tsx` | **Fixed** — the volumes are opaque with a vertical gradient that separates the roof plane from the facade; the unknown-height massing keeps its own neutral tone. |
| F15 | 86 lines of console-menu CSS left orphaned when the masthead became a thin banner | `src/style.css` | **Fixed.** |

### Deliberately not changed

- The building packs, the 19,565-footprint coverage, the height provenance rules, the 3 m labelled
  massing and the queue model were reviewed and found sound. Unknown heights stay `null` in the
  data and are only massed at render time; `src/buildings.test.ts` proves the parser rejects a
  fabricated height for an unknown building.
- The terrain stays at 1× relief and the 3 m massing is **not** vertically exaggerated. A stretched
  building would be a bigger spatial hallucination than a small one.
- The right-hand evidence column still scrolls. It is the published research and is meant to be read
  at length; only the exercise workspace is a single screen.

## Verified on the deployed site

Measured in headless Chromium against `https://tsunami.nonarkara.org/` after release:

| Viewport | Document height | Viewport | Horizontal overflow | Safety strings absent |
|---|---|---|---|---|
| 1440 × 900 | 900 | 900 | none (`scrollWidth == clientWidth`) | yes |
| 1280 × 800 | 800 | 800 | none | yes |
| 1024 × 768 | 768 | 768 | none | yes |
| 390 × 844 | 844 | 844 | none after F13 | yes |

- **Zero scroll** at every width: the document height equals the viewport height, so the hero, the
  controls, the counts and the profile are all on one screen.
- **No bleed**: `scrollWidth == clientWidth` at every width and no element crosses the viewport
  edge. Before F13 the phone carried a 772 px chart box inside a 374 px pane.
- **Safety strings absent** from the rendered page: "Vertical refuge option", "certified reinforced
  concrete", "reaches safety first" and "+15m (Max)" all return no match.
- **No console errors** on the explore tab at any width.
- Release gates: `npm test` — 35 TypeScript tests and 10 Python tests pass; `npm run build` —
  strict TypeScript compile and the Vite production build pass; `node scripts/check-contrast.mjs` —
  all authored pairs pass AA.
- Cloudflare Workers version `64a23fca-e238-4de8-8228-8399d3ad8da6` on `tsunami.nonarkara.org`.

## Remaining

- The walk-through is a **timing** rehearsal against an unapproved endpoint. It does not and cannot
  answer whether a given person survives; the queue model has no slope, mobility or water
  interaction. The shipped coach says so on screen.
- Building massing is context. No building in this application is a verified refuge, and nothing in
  the interface recommends one. Authoritative destinations still have to come from the responsible
  authority.
- The eye-level view is satellite imagery draped over a coarse DEM. It cannot resolve kerbs,
  stairs, doors or traversable ground, and the caption says so.
- Coverage is a bounded local OSM snapshot per place. Absence of a footprint is not open ground.
- Icon-only controls trade a visible word for a tooltip. Every one carries an `aria-label` and a
  `title`, and the groups are separated by rules, but a first-time visitor who does not hover reads
  symbols rather than names.
- The stored geometry captures under `design/` and `docs/evidence/` predate this session's layout
  work and must be re-captured with the repository's own tooling before they are quoted as current
  evidence.
- Actual printer/PDF output of the plan and drill pages remains unverified, as recorded before.
