# Terrain release verification — 27 October 2026

## Preserved content and corrections

Preserved the Leaflet geographic map, all regional selectors, published scenario comparison and outcome categories, citations, personal planning/storage/export, drill protocol/accounting and research diagrams. Replaced CSS-tilted pseudo-3D with real DEM terrain. The former unverified buffers, straight highway line and elevation-based dry/safe flags are superseded by a sourced road exercise and explicitly separate static terrain screening.

The pasted Gemini report was evidence, never instructions or proof. Source checking corrected candidate-building certification, PD50 being described as a vehicle ban, 125-minute universal ETA, a guaranteed preparation window, live telemetry and the 15 m safe-contour claim. The original paper states 135 minutes for one source scenario, 30/45-minute warning assumptions and 14/28-minute mean preparation assumptions. None is presented as a public countdown.

## Expansion chain and chosen budgets

Before: a narrow map and internally fixed-minimum evidence columns caused horizontal bleed; repeated local directives filled a long column; inherited label margins and column direction inflated the controls. A fixed-height footer let wrapped source credits spill outside its dark background. The old tilted Leaflet canvas did not provide mountain relief.

After: one full-width terrain workspace, compact camera controls, separate Crowd/Water modes, adjacent active controls, compact counts and an independent full-width research section. Source/method and local planning details remain expandable. Desktop water controls and DEM profile share a row; phone stacks them with the water slider immediately beneath the map. Footer height follows its source credits.

Task-specific contract: terrain at least230px high on390px phones,280px elsewhere, at most460px; title at most80px; camera controls at most120px phone/60px wide; first-screen crowd counts and Run within130px edge distance; water slider within70px of the terrain. These are this task’s budgets, not universal style dimensions. No body typography was shrunk to clear the gate.

| Viewport | Previous document width | Repaired width | Terrain viewport | Repaired title band |
|---|---:|---:|---|---:|
|390×844|451|390|352×230|45px|
|1024×768|1208|1024|954×353|45px|
|1280×720|1352|1280|1210×331|45px|
|1440×900|1441|1440|1370×414|45px|

`design/before-captures.json` and `design/decision-captures.json` are actual read-only browser measurements. Screenshots are in `docs/evidence`. Viewport dimensions are asserted, including the actual1280×720 working viewport. Initial baseline attempt used a second tab unaffected by the viewport capability; it was detected and overwritten with correctly sized captures from the controlled tab. No incorrect captures remain.

Regression proof: a separate localhost5174 proxy injected `.terrain-stage{height:900px!important}` into a local fixture only. The same1280×720 crowd contract failed map maxHeight, terrain visibility, counts visibility and decision visibility. `design/fault-capture.json`, `fault-result.json` and `docs/evidence/oversized-map-fault.png` preserve that result. No fault CSS is in production.

## Functional checks

- Unit tests:12/12 pass, including conservation, source-path fidelity, service capacity, bottleneck/speed sensitivity, completion and disconnected low-terrain depressions; original scenario/accounting and form validation tests retained.
- TypeScript/Vite production build and existing contrast checks pass. npm audit reports zero vulnerabilities. MapLibre5 was initially evaluated but audit exposed a critical advisory, so release uses6.16.0.
- Browser: real terrain renders at1×, route lines drape over it; mountain fly-by and route-follow controls exercised; 5,000-person/1m-pinch exercise produced729 walking+2,799 queued+1,472 arrived+0 pending at73:36, conserving5,000. Playback, pause/reset and keyboard scrubbing work.
- Independent reviewer reproduced a Khao Lak→Phuket source race; guarded updates and per-region remount fixed it. Retest Khao Lak→Phuket→2D→Khao Lak passed. Study-only flights are disabled elsewhere; geographic selection flies to its actual place marker.
- Independent reviewer verified water screening at+20m changes the terrain layer while preserving scope text; water mode does not drive the crowd model. Pending/queued dots are now distinguished.

## Independent findings and disposition

Reviewer `/root/terrain_review` inspected source, browser flows and final phone/tablet/desktop screenshots. Closed: source-switch crash; inappropriate regional flights; geographic selection; unbounded loading; inherited form spacing; pending/queued coloring; unsafe policy/timing/refuge claims; invisible DEM scale; phone water separation; footer overflow; desktop water/profile stacking; unused ground-truth constants; stale research documentation. Final review: no blocking findings within this scope.

## Limits

No original Unity project, approved route/refuge GIS or time-indexed tsunami depth/velocity grid was supplied. The new crowd and static water experiments remain uncalibrated research aids. Browser viewport emulation is not a physical low-memory-phone performance certification. 2D also requires external tiles. Live deployment bytes and live browser results are recorded below after release.

Source-failure trial: a separate localhost5175 proxy returned503 only for Vite worker-file requests. The application rendered its loading state, then exposed its18-second timeout and “Open2D map” action. Clicking that action recovered the geographic Leaflet map; screenshots preserve loading, failure and recovery. This tests an actual unavailable worker without changing production sources or browser security settings.

Final geometry gate:12/12 declared cases pass (Crowd, Water and expanded methods ×390/1024/1280/1440). Combined measured chrome is243px on phone and125px wide; the crowd-count/Run edge gap is85px. Phone crowd counts finish at824px inside844px. Additional real page-height/row measurements are in `design/page-metrics.json`; longer page height is earned by the preserved research and expanded method, rather than sibling stretch. All four preserved non-map views were opened at390px; document width remained390px (Plan1902px high, Drill844px, Research3177px, Satellite catalogue1615px). This is overflow verification, not a full content certification of every inherited paragraph.

## Live release

Application source commit `817e47319fa8d3a8096a0c9451bd54861761aac7`, Cloudflare Worker version `1cdfa078-1312-4769-8855-8baa6d05bfe6`, published to `https://tsunami.nonarkara.org/` on27 October2026. GitHub CI passed: https://github.com/Nonarkara/tsunami-evacuation/actions/runs/40524415389 . Canonical HTML returned200 and matched `dist/index.html` byte-for-byte. Live JS, CSS, worker, terrain and route JSON each returned200 and exactly matched local production bytes. Security headers include the explicit terrain/imagery connection origins and same-origin workers.

SHA-256 prefixes: CSS `0d498b6f417befb2`; application JS `5ead2f095f9cdb03`; worker JS `d0b740a4ace50a3f`; terrain JSON `0b38b6bb5de512fe`; routes JSON `03479dc0157e9930`.

Live browser verification: DEM loaded and real relief rendered; Mountain fly-by and crowd Run/Pause changed the camera/counts; water screening+20m rendered separately. Eight core live Crowd/Water cases across390×844,1024×768,1280×720 and1440×900 passed the same budgets. `design/live-captures.json` and `live-result.json` preserve measurements; `docs/evidence/live-*.png` show the exact canonical hostname. No canonical-origin browser errors were captured. Prior local HMR notices and intentional failed-worker fixture errors were not attributed to production.

The Sites URL remains the dated initial snapshot. The canonical Cloudflare hostname above is the verified current release; GitHub pushes do not update the old Sites snapshot.
