# Night Audit Checklist 2026-11-17
Commit b926c43

## Run + Wave Escape Understanding
Proven by `scripts/audit-escape-sync.py` → `docs/evidence/escape-sync-2026-11-17/report.json`
(headed-GPU Chromium against the live release; receipts carry the served bundle
hashes; note: headless SwiftShader cannot pass this audit — the app's
anti-teleport guard in `src/playback.ts` correctly refuses >250 ms frame gaps,
so the audit runs headed with the real GPU).
- [x] Time-to-endpoint readout hidden before Start (390x844, 1024x768, 1440x900)
- [x] Readout appears after Start and decreases with the clock
- [x] Seek: `data-exercise-seconds` follows; readout == finish − seeked
- [x] Readout clamps to +0:00 at the endpoint; arrival shows the unapproved-endpoint note
- [x] Exercise clock and water clock advance together and freeze together on pause
- [x] Zero console/page errors across the whole Escape session at all three sizes
- [ ] Camera-follow visual check (eye view tracks the walker) — manual, owner
- [ ] Thai label เวลาถึงปลายทาง on a live TH session — unit-tested; live TH manual

## Results Layout & Bottom Slop
Proven by `scripts/capture-playback-evidence.py --screenshots` → `docs/evidence/playback-data-2026-11-12/results-{en,th}-{w}x{h}.png`, 16 cases. Gate `check-playback-data-evidence.mjs` PASS.
- [x] Outcome hero leads on 320x700, 390x600, 390x844, 667x375, 1024x768, 1280x720, 1440x900 EN/TH
- [x] No bottom slop: hero → outcome → dot grid → chart → conclusion → credits line at bottom edge on every size
- [x] Data & sources dialog width-capped over page 1 on 1440x900, 1024x768, 390x844 EN/TH, reaches page-1 bottom boundary
- [ ] Dialog focus return / Escape / Tab containment — manual keyboard pass pending

## Thai Pagination & Reading Surfaces
Proven by `check-playback-data-evidence.mjs` PASS → `thai-landscape-pages.json` (ladder whole on page 2, button X consistent, 3 pages).
- [x] Heading scale 24/17/13 bold on Drill/Research/DDPM — covered by geometry gate + docs screenshots
- [x] Chrome 92/844 px ≤11% — viewport gate BOUNDS_PASS
- [x] Thai landscape pagination: package ladder whole on page 2, button X consistent across pages — PASS
- [ ] Manual ? dialog opens without permanent reading band, state preserved — manual pass pending

## Map Composition & MSH
Proven by `check-banner-evidence.mjs` BANNER_PASS (60 viewports) + `check-viewport-evidence.mjs` BOUNDS_PASS (40 viewports).
- [x] Single 36px banner, map starts 42–44px — receipts show header=36, stage top ≤44
- [x] Flat mode map top ≤44.5px for all banner viewports — FLAT_BAND_MEASURE fixed selector, captured
- [x] Buildings: unknown heights flat, explicit tags extrude only — code contract, unit-tested
- [x] Rokehan permalink carries OSM node, sun band, camera scale, Thai UI — scene-reference code, permalink-only external illustration

## Performance & Accessibility
- [ ] 390x844 phone simulation: GPU frame pacing, no layout thrash on seek
- [ ] Reduced-motion respected
- [ ] Keyboard walkthrough passes
- [ ] Contrast roles match PALETTE.md

Status: Gates PASS, manual checks pending owner sign-off
