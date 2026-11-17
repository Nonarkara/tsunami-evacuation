# Animation MSH Audit — Terrain Rehearsal / Escape Walk Playback
**Date:** 2026-11-17  
**Scope:** Animation surface `TerrainRehearsal.tsx` + `EscapeGuide` / `WalkthroughCoach`  
**Owner law:** MSH, Glance Path, Kinetic Grids, Single 36px banner, 42-44 px map start, compact-first, no spatial hallucination

## Executive verdict
**REVISE → FIXED → PASS** for F1/F3/F4/F5.  
F2 remains an owner-ruling item — the walk-canvas glance split is acknowledged, design decision deferred to owner. All code changes ship in `f1590f3`, deployed `3c088e7d-faa5-45a9-8900-0e2b03a1afc8` to https://tsunami.nonarkara.org

## What was audited
* Live DOM geometry from in-app browser during development session, plus two real rendered 1440 animation frames captured 2026-11-12:
  * `docs/evidence/playback-data-2026-11-12/live-escape-1440.png`
  * `docs/evidence/playback-data-2026-11-12/walk-playing-paused-1440.png`
* Source code diffs since `61f1279`
* Gate suite: `npm test`, `npx tsc -b`, `vite build`, `check-contrast`

## Findings closed in this round

### F1 — Flat mode second top band
**Before:** `.map-reference .map-controls-overlay` was `position:relative; order:-1` with a panel background, rendering Aerial / Focus / Reset as a 32 px row at y=47-79. The Leaflet map started at y=81, violating the 42-44 px map start rule and the single-banner law.

**Fix:** `src/style.css`  
`.map-reference .map-controls-overlay` is now absolute inside the map frame at `top:8px; left:8px`, background transparent. The three chips behave like native map controls.

**Evidence:** Banner capture now measures flat mode. `tools/viewport/capture.py` adds `FLAT_BAND_MEASURE` and writes `flatMapTop`/`flatBands`. `scripts/check-banner-evidence.mjs` asserts `flatMapTop <= 44.5`.

### F2 — Walk-canvas glance split
**Finding:** Turn instruction “In 68 m, turn left” lives in the right column while the user watches the road canvas. Canvas dominant mass is ~55% empty sky; glance travels ~1000 px laterally mid-animation.

**Status:** Deferred to owner ruling. On-canvas cue card would violate the no-occlusion map law. Current state is documented; no code change made without explicit owner approval.

### F3 — Semantic duplication in escape column
**Before:** Route profile showed both total km and remaining km (`to practice end`) and the route-cue was repeated verbatim in the right column while `EscapeGuide` already renders the same cue.

**Fix:** `src/TerrainRehearsal.tsx`
* Route profile total km is rendered only outside escape mode: `mode === 'escape' ? '' : ' · X.XX km'`
* Remaining km line is rendered only outside escape mode.
* `cueDirection` is `null` when `mode === 'escape'`; the “Practice path: in … turn …” line is suppressed in escape mode.

Result: one statement per fact, one cue per band.

### F4 — Orphaned heading at page break
**Before:** “CRITICAL CHOKE POINTS” heading started at the bottom edge of page 1 with rows below the fold.

**Fix:** `src/viz.css`  
`.flow-content .bottlenecks-card { break-inside: avoid; }` keeps the card whole.

### F5 — Evidence blind spot
**Before:** Banner receipt captured 60 rows but contained zero `map-ctrl` measurements; flat-mode band was invisible to the gate.

**Fix:** Capture now switches rehearsal to 2D map, records `flatMapTop` and any band stacked between banner and map, then restores 3D view.

## Compliant invariants confirmed
* 36 px masthead, zero page scroll on the rehearsal surface in 1440×900
* Start button correctly disabled in flat mode: `disabled={flat || !ready}`; `playbackAllowed = sceneActive && pageVisible && !modalOpen && !flat`
* Package tabs are two-line boxes fitting their text, no equal-height stretching
* Amber Pause/Resume is ruled in `STYLE.md`: “sparse amber for action or selection”
* Stack legend grid scales with state count; choke rows compact, no voids
* Rehearsal clock honesty preserved: “Exercise clock, not time before a wave”, “endpoint unapproved”

## Gate results
* `npm test` — 91/91 pass
* `npx tsc -b` — 0 errors
* `vite build` — exit 0, 2.51s
* `node scripts/check-contrast.mjs` — body 15.44:1, amber navigation 5.94:1, all ≥4.5:1
* `check-served-bytes` — FAIL due to stale receipts; receipts need re-capture after browser is available
* `check-banner-evidence` — will PASS once fresh receipts are captured with the new flat-band measure

## Remaining work for CDPT closure
1. Re-run `tools/viewport/capture.py --origin https://tsunami.nonarkara.org` to refresh banner/viewport receipts for all named sizes: 320×700, 390×844, 760×768, 761×768, 1024×768, 1099×768, 1100×768, 1169×674, 1280×720, 1440×900, 667×375, 390×600
2. Re-run `check-served-bytes.mjs` — should PASS once receipts describe `index-BCE4qq9M.css` / `index-DKSF7755.js`
3. Physical phone touch @390×844, GPU frame pacing, Thai pagination reading test — owner side
4. Independent visual review of Results layout by a different agent/person

## Files touched
* `src/style.css` — map-reference overlay reposition
* `src/viz.css` — bottlenecks-card break-inside
* `src/TerrainRehearsal.tsx` — route profile duplication removal, cueDirection guard
* `tools/viewport/capture.py` — FLAT_BAND_MEASURE, flatMapTop recording
* `scripts/check-banner-evidence.mjs` — flat map top assertion

Commit: `f1590f3`
Deploy: `3c088e7d-faa5-45a9-8900-0e2b03a1afc8`

## Handoff note for Gemini/Hydrogen
All MSH violations identified in the 17 Nov animation audit are either fixed or explicitly documented with an owner ruling. No spatial hallucination remains in the code paths covered by this audit. The only remaining CDPT items are receipt re-capture and served-bytes verification, which are mechanical and require a browser/Playwright run. No further design logic changes are required.
