# Fixed-screen release verification

Owner request: contain every route in one screen without vertical document scrolling, enlarge the operating view and replace unused space with relevant information. This supersedes the earlier map maximum-height and document-flow design contracts. Long reading is retained through explicit pages and section jumps; it is not all displayed simultaneously at phone sizes.

## Composition

A44px masthead has readable desktop navigation labels, region selection and a research/practice status. The full-height scene sits beside controls, current counts and a calibrated terrain profile. Controls/profile and the detailed walkthrough are named task views. Published outcomes have a separate Model workspace; the comparison, both timing conditions, package selection and all source qualifications remain available. Research, Satellite, Plan and Drill use readable columns with explicit page controls only where needed. Manual, map key, credits, settings and warning guidance use native bounded reading dialogs or disclosures. No input archive or source dataset was removed.

The old canonical1280x720 document measured1216px tall. The revised document is720px tall, with scene height494px versus302px previously. The available scene at1440x900 is1050x674. The bottom-right region now holds a larger DEM profile with distance/height axes and non-scaling strokes, using existing sampled elevation data. No new flood forecast is implied.

## Rendered evidence

`docs/evidence/viewport-2026-10-28/case-*.json` contains40 actual route/viewport records: five routes at390x844,1024x768,1280x720,1440x900,1169x674,667x375,390x600 and320x700. Every document equals its viewport dimensions; scrollY stays0; active workspace/page controls fit main; camera controls stay in their toolbar without obstruction. `node scripts/check-viewport-evidence.mjs` reports BOUNDS_PASS and proves the previous document-height fault fails the same requirement. The script assesses captured evidence, not a new rendering. `screens.json` is an earlier intermediate35-case capture; final case files take precedence.

All five routes have390/1024/1440 screenshots. Fresh `walk-1440.png` shows the completed profile; `guide-1440.png` shows stage guidance. Independent reviewer bilingual_research_review inspected the route captures, refreshed profile/source, modal/keyboard evidence and all40 receipts, and closed findings with no release blocker. Geometry is scoped to these recorded states, not a universal design certification.

## Functional trials

- Plan on390px: Tab through fields automatically reveals page2 and its checklist/actions without vertical movement. Unsaved synthetic input survived Drill→Plan navigation; it was cleared before screenshots.
- Drill on isolated localhost5188:25 participants,24 counted,2 assisted,8 minutes saved and survived reload. Existing user storage on5173 and production was untouched.
- Research: sourceR1 opens its actual page; filtering to candidates then returning toR1 restores the full ledger and focuses the record. All final research pages are reachable. Source results/CSV/citation data and both timing conditions were preserved.
- Manual: all five topics expanded; reached the last of four reading pages. Forward/reverse keyboard traversal stayed inside; Escape returned focus to Manual.
- Sources dialog:32 forward/reverse Tab observations stayed inside; Escape restored its opener. Native browser behavior had previously escaped to BODY, so a shared modal Tab cycle now handles every Tab.
- Walkthrough→2D restores Controls. The shared guide-availability predicate also covers flat fallback and unavailable model/schedule states, preventing a blank sidebar.
- Warning guidance uses the same native reading-dialog mechanism. Source language is explicitly carried into portaled Thai credits/guide titles.
- Corrected an inherited Research paragraph that falsely described connected DART/tide telemetry. Both languages now agree with the disconnected source catalogue.

## Release gates and limits

35 JavaScript and10 Python tests passed, including an independent rerun. Final TypeScript/Vite build and contrast check required before deployment. Native Thai/English human comprehension review, local route/refuge approval and validated hazard timing remain unverified. The1.65m view and labelled3m unknown-height massing remain exploratory. Physical crowd spillback and water-agent interaction remain unmodeled.

Release receipt will follow canonical asset and browser verification.

## Canonical release receipt

Application commit e2c0a9b pushed to origin/main. `npm run deploy` reran all45 tests, TypeScript/Vite build and all six contrast checks successfully. Cloudflare version a0cc4b42-2b82-48f1-bad2-c2adc0c1360c serves tsunami.nonarkara.org. Canonical HTML plus referenced JS/CSS match local dist byte-for-byte (`live-bytes.json`). Live browser navigation across all five routes measured1280x720 documents inside the1280x720 viewport with no bounds failures (`live-routes.json`). Live walkthrough captured in `live-walk.png`; no captured console errors. Warning guidance was additionally exercised at1024x450: dialog988x386 inside the viewport, no document overflow, Escape closed it. Local5173 also responds200; the separate5188 test service is stopped after verification. Native human/field validation limits above remain unchanged.
