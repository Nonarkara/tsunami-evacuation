# Night Audit Checklist 2026-11-17
Commit b926c43

## Run + Wave Escape Understanding
- [ ] Time-to-endpoint readout appears after start, clamped, hidden before start
- [ ] Thai label เวลาถึงปลายทาง correct
- [ ] Camera decoupled from crowd/water: pause/seek syncs clock+camera+water
- [ ] Route speed and node waits shown in Escape guide match selected walker
- [ ] No console errors on 390x844, 1024x768, 1440x900

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
