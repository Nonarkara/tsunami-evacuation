> Historical MiniMax audit, preserved and integrated30 October2026. Release IDs, test counts and measurements below refer to their dated passes, not the current build. Footprint lines are ground-level, not roof edges. Current verification: [30 October clarity audit](CLARITY-2026-10-30.md). Draft MSH tools/receipts are diagnostics, not a release gate.

# Independent safety and interface audit — 28–29 October 2026

Reviewer: MiniMax Code (`mcode`). Two passes over the buildings release that shipped as
`a16476d` … `3d4f447`, then over the thin-banner workspace that followed it, then a third
pass on 29 October over the release that carries commit `0de8e7b`. This audit does not
re-do the buildings work; it checks it against the project's own rules in `AGENTS.md`,
`context.md` and `docs/RESEARCH.md`, and records what was changed and what is still true.

Everything below was measured in a real browser against the deployed site
(`https://tsunami.nonarkara.org/`), not against a local build. The receipts name the
surface that was actually reached and the sha256 of the bytes the host served, so a
pass can be tied to one release rather than to a moment.

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
| F13 | **On a 390 px phone the route profile fragmented across the reader's columns and the elevation chart was split in half at the column boundary** — a 772 px box inside a 374 px pane, clipped by the frame | `src/viewport.css` | **Fixed — in two attempts, and the first attempt did not work.** The rule that was meant to drop the analysis block on a phone targeted `.terrain-operations .terrain-secondary`, but the route profile sits under a `display:contents` wrapper, so a child combinator never reached it; the fragment survived the first fix. The working rule applies `break-inside:avoid` to the route-profile block and hides `.profile-chart` inside the operations flow, so the phone keeps the route label, distance and DEM range and drops the chart. The 390 px receipts below were taken after the second fix. |
| F14 | **Building volumes were extruded at 0.88 opacity, so at 1.65 m eye height they read as floating glass slabs rather than buildings** | `src/TerrainRehearsal.tsx` | **Fixed** — the volumes are opaque with a vertical gradient that separates the roof plane from the facade; the unknown-height massing keeps its own neutral tone. |
| F15 | 86 lines of console-menu CSS left orphaned when the masthead became a thin banner | `src/style.css` | **Fixed.** |
| F16 | A further **`.survival-panel` rule set** was left orphaned when the walk-through coach replaced the panel markup | `src/style.css` | **Fixed** in `0de8e7b` — 22 lines removed. A search of `src/` finds no remaining reference to `survival-panel`, so no rule lost its subject. The same commit enabled `noUnusedLocals` / `noUnusedParameters`, which surfaced two genuinely unused imports in `src/main.tsx`; both were removed. |
| F17 | **The release could not be uploaded.** Cloudflare's assets-upload endpoint returned `[code: 10013]` on four consecutive attempts on 28 October, so the repository moved ahead while the live site kept serving the previous build | deployment | **Not a code defect, but a real gap.** The build, the tests and the contrast gate all passed while the upload failed, which is exactly the case where "committed" and "live" mean different things. The upload was retried on 29 October against the same tree and succeeded; version `17058447-6da1-473f-a9ac-24df147fae93` serves the current build, and the sha256 of the served bytes equals the sha256 of the local `dist/`. The lesson is recorded here rather than left in the gap between the repository and the host. |

| F18 | The 29 October release added a **live clock, a sun-azimuth indicator, building footprint outlines and an animated water shimmer** — features that landed outside this audit's earlier surface | `src/main.tsx`, `src/SunIndicator.tsx`, `src/ReplayWaterLayer.ts`, `src/orientation.ts` | **Reviewed, and found honest, with one residual risk.** The clock is the *device* time in `Asia/Bangkok`, labelled "device clock", and is asserted against nothing. The sun indicator shows an **approximate** azimuth for the selected place with "North up · device time · not a compass or evacuation bearing", and the product contains **no directional escape instruction** — a search of `src/` for "go east", "run south", "head east" and "toward the sun" returns nothing, and the ground camera's own caption reads "no route guidance / ไม่ใช่เส้นทางอพยพ". The ground-level footprint outlines change only how a massed volume reads; they alter no height, no provenance and not the 3 m unknown-height rule. The shimmer modulates the demonstration surface's shading only — not its level, not its geometry, not its label — and it is disabled under `prefers-reduced-motion`. The residual risk is recorded under Remaining. |

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

Measured in headless Chromium against `https://tsunami.nonarkara.org/` after release, with the
repository's own collector (`tools/viewport/measure.mjs`) driven by `tools/viewport/capture.py`.

| Viewport | Document height | Viewport | Horizontal overflow | Banner | Surface reached |
|---|---|---|---|---|---|
| 1440 × 900 | 900 | 900 | none | 36 px | all five routes |
| 1280 × 720 | 720 | 720 | none | 36 px | all five routes |
| 1169 × 674 | 674 | 674 | none | 36 px | all five routes |
| 1024 × 768 | 768 | 768 | none | 36 px | all five routes |
| 667 × 375 | 375 | 375 | none | 36 px | all five routes |
| 390 × 844 | 844 | 844 | none | 36 px | all five routes |
| 390 × 600 | 600 | 600 | none | 36 px | all five routes |
| 320 × 700 | 700 | 700 | none | 36 px | all five routes |

- **Zero scroll** at every width: for all 40 records the document box equals the viewport box, so
  the hero, the controls, the counts and the profile are all on one screen.
- **No bleed**: no record reports a region outside `main`, no header control crosses the viewport
  edge, and every camera control is both inside the toolbar and clear of anything overlapping it.
- **Banner**: one 36 px band holds identity, geography, navigation and the scene tools. The map
  starts at 42–44 px including main padding, and the banner rows below it were checked at both
  sides of the 760 px and 1100 px breakpoints.
- **The surface measured is the surface reached.** Each record carries the `data-page` of the
  masthead that was measured, the `aria-current` state of its navigation control and the terrain
  state. All 40 records report the expected surface; all 12 explore receipts were taken with the
  terrain in `ready`, not with the map half-loaded. Four receipts taken in `loading` state were
  discarded and re-captured rather than kept.
- **Safety strings absent** from the rendered page: "Vertical refuge option", "certified reinforced
  concrete", "reaches safety first" and "+15m (Max)" all return no match.
- **No console errors** on the explore tab at any width.
- **Receipts are tied to the release by bytes**, not by assertion:
  `docs/evidence/viewport-2026-10-28/live-bytes.json` records the sha256 of `/`, of the JavaScript
  bundle and of the stylesheet as the host served them; all three equal the local `dist/`.

| Gate | Result |
|---|---|
| `node scripts/check-viewport-evidence.mjs` | `BOUNDS_PASS` — 40 records, no failures |
| `node scripts/check-banner-evidence.mjs` | `BANNER_PASS` — 60 rows, no failures |
| `npm test` | 35 TypeScript tests and 10 Python tests pass |
| `npm run build` | strict TypeScript compile and the Vite production build pass |
| `node scripts/check-contrast.mjs` | all authored pairs pass AA (5.94:1 – 15.44:1) |

Cloudflare Workers version `17058447-6da1-473f-a9ac-24df147fae93` on `tsunami.nonarkara.org`,
serving `index-CkLqhA7l.js` and `index-D7L3g3sU.css`.

The receipts can be re-made at any time:

```sh
python3 tools/viewport/capture.py https://tsunami.nonarkara.org
node scripts/check-viewport-evidence.mjs
node scripts/check-banner-evidence.mjs
```

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
  symbols rather than names. The **sun glyph is the sharpest case**: during a walk-through it sits
  in the terrain caption with the direction in words beside it, and the words say it is not a
  bearing — but a symbol read at a glance in an emergency is exactly the kind of thing that gets
  mistaken for "head that way". It states its disclaimer in the tooltip and the accessible name,
  not in the caption body.
- The clock is device time. A phone with a wrong clock shows a wrong clock, and the interface does
  not say so where the time is read at a glance. Nothing in the application compares that clock to a
  wave time, so the failure mode is presentational rather than a safety claim.
- The receipts cover the fixed screen, the banner and the camera controls. They do **not** cover
  the paged reader's inner scroll, the walk-through's mid-run camera states, the modal's focus
  containment, or the empty and loading states of the map. Those remain verified by hand, not by
  these files, and should not be described as covered by this audit.
- The other stored captures under `design/` and `docs/evidence/` — the decision-geometry budgets,
  the compact-contract captures and the screenshots — predate this layout work and have not been
  re-made with the current build. The viewport and banner receipts in this document are current;
  the rest are not.
- Actual printer/PDF output of the plan and drill pages remains unverified, as recorded before.
