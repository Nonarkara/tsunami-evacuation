# Soonami — Project Index (chipability quick reference)

Use this file to orient yourself before touching any code. Full rules: `AGENTS.md`, `context.md`. Design law: MSH (anti-spatial-hallucination) + anti-slop-design. One accent: amber `#f59e0b`. Zero `border-radius` except true circles. Zero gradients except dark photo overlays. Zero drop-shadows except inset hairlines and focus rings.

## Where everything lives

| What | File | Purpose |
|------|------|---------|
| App shell + 5 tabs | `src/main.tsx` | Masthead, emergency drawer, manual dialog, tab router (explore/satellite/prepare/drill/research), source footer |
| 3D terrain & crowd | `src/TerrainRehearsal.tsx` | MapLibre 3D DEM terrain, camera views, experiment controls, water demo, building massing, hazard replay import |
| Leaflet 2D map | `src/Map.tsx` | 2D geographic reference, area markers, fallback when 3D unavailable |
| Research data | `src/research.ts` | Scenario outcomes, 6 coastal regions, plan/drill validation, walking arithmetic, satellite toolkits |
| Bilingual research UI | `src/ResearchSection.tsx` | Results table, 4 physical axioms, platform section, methods, sources, validation, reproduce & cite |
| Source ledger | `src/research-ledger.ts` | Bilingual source rows, package names, glossary, CSV/BibTeX exports |
| Intervention comparison | `src/InterventionComparison.tsx` | Shared-scale cumulative package selector with proportional bars |
| Outcome breakdown | `src/OutcomeSummary.tsx` | 100% modeled outcome strip + label/value records |
| Manual dialog | `src/Manual.tsx` + `src/manual-content.ts` | On-demand bilingual manual, Escape focus return, Tab containment |
| Satellite catalogue | `src/SatelliteCatalogue.tsx` | Disconnected DART buoy, tide gauge, SAR, DEM source list |
| Source footer | `src/SourceFooter.tsx` | Citation, creator, outcome context |
| Nav symbols | `src/NavSymbol.tsx` | SVG symbols for masthead tabs and manual topics |
| Styles | `src/style.css` | All layout, typography, breakpoints, reduced motion, print |
| Axiom tokens | `src/axiom-tokens.css` | Vendored Axiom Design Core tokens (MIT) |
| Crowd simulation | `src/crowd.ts` | Pure FIFO point-queue, frame sampling, terrain elevation, water screening |
| Route & replay | `src/rehearsal.ts` | Chainage, along-route, walker progress, arrows, hazard replay parsing |
| Buildings | `src/buildings.ts` | OSM building snapshot parsing, 1.65m eye camera, 3m unknown massing |
| Water surface | `src/ReplayWaterLayer.ts` | Custom MapLibre WebGL water surface layer |
| Time scrubber | `src/TimeScrubber.tsx` | min:sec time range input |

## Tests

| File | What it checks |
|------|---------------|
| `src/research.test.ts` | Scenario series fidelity, outcome accounting, corrupt plan rejection, drill validation |
| `src/crowd.test.ts` | Count conservation, trajectory fidelity, pinch-point behavior, terrain screening |
| `src/rehearsal.test.ts` | Route camera/arrows, preparation state, walker progress, water rise bounds, hazard replay validation |
| `src/buildings.test.ts` | 17-place building snapshots, count conservation, boundary rules, eye-height/massing constants |
| `src/manual-content.test.ts` | Manual language detection and fallback |
| `scripts/test_*.py` | 10 Python building massing tests |

Run: `npm test` (TypeScript + Python).

## Data paths

- `public/data/rehearsal-routes.json` — OSM walking routes for Bang Niang exercise
- `public/data/terrain.json` — sampled DEM grid
- `public/data/buildings-*.json` — per-place OSM building snapshots (17 places)
- `public/data/hazard-replay.schema.json` — imported inundation frame schema
- `public/vendor/` — Axiom and Palette notices

## Commands

- `npm install` / `npm ci` — install dependencies
- `npm test` — run all TypeScript + Python tests
- `npm run build` — TypeScript check + Vite production build
- `npm run dev` — local dev server
- `npm run preview` — serve built output locally
- `npm run deploy` — test → build → contrast check → wrangler deploy

## Key invariants (never break these)

1. **No invented hazard/route/refuge GIS.** `elevationM` and `safeDistM` in `research.ts` are legacy placeholders — never display as measured.
2. **No physical crowd footprint.** Waiting agents aggregate at exact network nodes; never jitter/spiral/offset.
3. **Unknown building heights stay `null`.** 3m visual massing only, explicitly labelled, never certified safety.
4. **No Unity ABMS claims.** The browser preserves published outcomes; it does not run or replace the Unity model.
5. **Outcomes retain scenario, denominator, source.** `affected + reached + outside = 100%` only where all three reported.
6. **Thai first person is `ผม` only.** Non-looped Thai fonts (Prompt, IBM Plex Sans Thai, Kanit). Never Sarabun.
7. **One accent: `#f59e0b` amber.** Never Tailwind blue `#3B82F6`.
8. **Masthead ≤ 48px, single row.** Brand + region + 5 nav symbols + manual button + emergency pill.
9. **No live warning feed.** All satellite/tide/buoy sources are `NOT_CONNECTED`; a missing feed is a gap, not an all-clear.

## Docs to read next

- `AGENTS.md` — project rules (anti-regression, MSH, design non-negotiables)
- `context.md` — task, design read, reference, foundation, status
- `ARCHITECTURE.md` — full module inventory and data paths
- `RESEARCH.md` — research extraction, published outcomes, accounting
- `TERRAIN-REHEARSAL.md` — terrain/crowd method and limits
- `PALETTE.md` — Palette Plate 002 color roles
- `DEPLOYMENT.md` — Cloudflare Worker release command
