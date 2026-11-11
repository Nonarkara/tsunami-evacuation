---
updated: 2026-11-11
drafted_by: antigravity
reviewed: false
---
# Gemini work audit review — 2026-11-10

## Scope
Review of the work started with Gemini, audit completion after token exhaustion, and bring the system to best-current version under AGENTS.md, MSH, anti-slop, and height-truth constraints.

## What is live
- Live: https://tsunami.nonarkara.org
- Main at b2540fe, Cloudflare version 73c2afed-9e9b-40d9-a5b9-6c6f6e34d4c0 (version #62, deployed 2026-11-11)
- Bytes verified byte-identical to local build.

## Gates
- `npm test` — 89 TS + 11 Python pass.
- `npm run build` — clean, no type errors.
- `node scripts/check-contrast.mjs` — body 15.44:1, secondary 6.55:1, masthead 11.47:1, amber nav 5.94:1, action text 8.00:1, active row 13.72:1.
- `node scripts/check-viewport-evidence.mjs` — BOUNDS_PASS 40 viewports, 0 geometry failures.
- `node scripts/check-banner-evidence.mjs` — BANNER_PASS 60 viewports, map top ≤44px.

## Systems reviewed

### Manga walk-through
- In-browser three.js renderer ported from miaoshen Grand Model, fed by baked `public/model/bang-niang.bin.gz` ~31-40KB.
- Controls are loaded lazily, disposed on leave, state saved per session.
- Labels bilingual, canvas role=img, tabIndex 0, hint line updates with mode.
- MSH rectification 2026-11-08: renamed to “Street linework (ink) / เค้าโครงถนน (มังงะ)”, purpose clarified as architectural line-work for ground-level route and landmark recognition, no navigation claim.
- Height truth enforced: all buildings flat ink outlines, no sea, no extrusion.

### Roof shapes / MiniMax work
- `src/roofshapes.ts`, `src/roofshapes.test.ts`, `scripts/classify-roofs.py`, `public/data/roofs-khao-lak-2.json` shipped in 6023e61.
- Batched vision classifier with halving retry, honest roof pack with provenance split: OSM `roof:shape` tags vs dated aerial read.
- Ridge lines drawn in plan because no source height; counts conserved.

### Wave shading and drill protocol
- Wave scale is file-wide via `fileDepthScale`, not per-frame. Verified 100% of water pixels move between frames.
- Drill protocol rendered as single readable column at ~70ch/line, heading and five steps kept together, unchanged page height.

### MSH rectifications
- Masthead status pill restored on desktop, margin-left:auto, shows from 1440px, keeps 1784 on screen.
- Right sidebar void filled with Critical Choke Points card from `bottleneckSummaries`, top-3 highest-wait segments, click-to-focus.
- Map ≥60% first screen, Results void filled, Start on page 1 on short phones, top bar selects field-sizing:content.
- Critical Choke Points card corners squared to the house zero-radius rule, redundant colour fallbacks dropped in the same rule (`src/style.css`, commit b2540fe); live as of Cloudflare version 73c2afed-9e9b-40d9-a5b9-6c6f6e34d4c0. Verified on the live CSS: no `border-radius`, bare custom properties only.

### Anti-regression preservation
- No map, chart, planner, drill protocol, citations or entered data removed.
- No file collapsed >30%.
- No invented GIS, no live safety inference.

## Open items
- Physical-phone touch test at 390×844 remains outstanding; emulation only used so far.
- Community-language reading test of pagination controls in Thai not performed on device.
- Roof coverage ceiling is source-limited: 8 readings for 1,196 buildings; Esri z19 placeholder.

## Verdict
Systems are at their best current version under the constraints. No regressions introduced. No bugs found in code audit. Ready for physical-phone verification and optional roof-coverage expansion if source budget allows.
