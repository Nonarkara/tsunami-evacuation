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
- [ ] Outcome hero leads on 320x700, 390x600, 390x844, 667x375, 1024x768, 1280x720, 1440x900 EN/TH
- [ ] .evidence-pane padding-bottom 14px clearance holds
- [ ] No bottom slop, no scroll beyond 100dvh on fixed routes
- [ ] Data & sources dialog opens, focus returns on Escape, Tab containment works

## Thai Pagination & Reading Surfaces
- [ ] Heading scale 24/17/13 bold on Drill/Research/DDPM
- [ ] Chrome 92/844 px ≤11%
- [ ] Thai landscape pagination: package ladder whole on page 2, button X consistent
- [ ] Manual ? dialog opens without permanent reading band, state preserved

## Map Composition & MSH
- [ ] Single 36px banner, map starts 42-44px
- [ ] Flat mode map top ≤44.5px for all banner viewports
- [ ] Buildings: unknown heights flat, explicit tags extrude only
- [ ] Rokehan permalink carries OSM node, sun band, camera scale, Thai UI

## Performance & Accessibility
- [ ] 390x844 phone simulation: GPU frame pacing, no layout thrash on seek
- [ ] Reduced-motion respected
- [ ] Keyboard walkthrough passes
- [ ] Contrast roles match PALETTE.md

Status: Gates PASS, manual checks pending owner sign-off
