# CDPT Completion Plan — 6-7 hour single execution
**Goal:** Close the Tsunami Evacuation release cycle so `npm test && npm run build && check-contrast && check-viewport-evidence && check-banner-evidence && check-playback-data-evidence && check-served-bytes` all PASS and live URL is byte-identical.

## Current state
* Code changes for MSH animation audit shipped `f1590f3`, deployed `3c088e7d`
* Audit report `docs/AUDIT-ANIMATION-MSH-2026-11-17.md` committed `c3ddd9c`
* Non-visual gates PASS: tests 91/91, tsc 0 errors, build OK, contrast OK
* Receipts stale: `check-served-bytes` reports `index-BCE4qq9M.css` / `index-DKSF7755.js` served but not recorded; old receipts reference `index-BBxGSupR.js`
* Banner capture now measures flat mode; needs fresh capture
* Local CSO audit commit `dc51ac5` unpushed to avoid race

## Phase 1 — Stabilise repo 0:15
1. `git fetch origin && git status`
2. Rebase local main onto origin/main
3. Ensure `docs/AUDIT-ANIMATION-MSH-2026-11-17.md` is on main

## Phase 2 — Receipt re-capture 1:00-3:00
Run Playwright capture for all named viewports via `tools/viewport/capture.py`
Viewports: 320×700, 390×844, 760×768, 761×768, 1024×768, 1099×768, 1100×768, 1169×674, 1280×720, 1440×900, 667×375, 390×600
Pages: explore, prepare, drill, research, ddpm
Artifacts:
* `docs/evidence/banner-2026-10-28/cases.json`
* `docs/evidence/viewport-2026-10-28/*.json`
* `docs/evidence/playback-data-2026-11-12/*.png` re-captured if needed

If Playwright times out, fall back to browser tool manual capture for 390×844, 1024×768, 1440×900:
* open tab, set viewport via browser.resize? Not available. Use evaluate to measure geometry and screenshot.

## Phase 3 — Gates 3:00-4:00
Run sequential:
* `npm test`
* `npx tsc -b`
* `npx vite build`
* `node scripts/check-contrast.mjs`
* `node scripts/check-banner-evidence.mjs`
* `node scripts/check-viewport-evidence.mjs`
* `node scripts/check-playback-data-evidence.mjs`
* `node scripts/check-served-bytes.mjs`

All must PASS.

## Phase 4 — Security posture 4:00-4:30
* Push CSO audit commit `dc51ac5` now that release is stable
* Verify `docs/security/cso-audit-2026-11-14.md` trend log is present
* Confirm headers in `app/public/_headers`, CI audit, Dependabot active

## Phase 5 — Visual verification 4:30-5:30
* Independent visual review of Results layout by different agent/person
* Phone-size animation audit: 390×844 touch targets, GPU frame pacing, Thai pagination reading test
* Document findings in `docs/MAINTENANCE-PLAN.md`

## Phase 6 — Final ship 5:30-6:00
* `git log --oneline -5`, verify commit trail
* `npm run deploy` → confirm live version ID
* Compare `dist/` hashes to live assets via `check-served-bytes`
* Update conversation checkpoint in Obsidian via `capture_coding_session`
* Produce final handoff note stating “nothing left for next agent”

## Risks
* Browser/Playwright timeouts → fallback to manual measurements and note limitation
* Safari-only 180px empty page 1 on Thai phone Results → document as known, not invented
* Roof coverage source ceiling 8/1196 buildings → no action unless source lifts

## Success criteria
* All CDPT gates green
* `check-served-bytes` PASS with byte-identical live URL
* Banner evidence shows flatMapTop ≤44.5 for all viewports
* MSH audit closed, no spatial hallucination in animation surface
* CSO audit pushed, maintenance plan current
