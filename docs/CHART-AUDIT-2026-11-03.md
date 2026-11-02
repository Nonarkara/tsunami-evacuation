# Chart audit — 3 November 2026

Starting source: `5f6b077`. Audit the visualization redesign against the source ledger and rendered Thai/English views. Preserve the map, charts, controls, scientific qualifications and fixed-screen reading model.

## Plan and release budgets

1. Correct chart semantics: calibrated shared percentage scale, both timing changes, rounded-dot disclosure, true province proportions, actual queue maxima, missing/negative terrain and consistent pace units/rounding.
2. Check Thai/English Model, Results, Research, Plan, Drill and DDPM at phone/tablet/desktop. Keep Start with its controls on phone page 1; 36px banner, map at 42–44px, no document scroll. Keep short table records and paragraphs intact across Research columns.
3. Add focused regression checks for incorrect numerical encodings. Close independent findings, run tests/build/contrast, commit/push/deploy and verify canonical assets plus browser flows.

Independent source/code review returned REVISE with eight concrete findings (province proportions, missing/signed terrain, unlabelled scale, incomplete timing labels, dot rounding, zero queue wait, pace consistency, denominator enforcement). Dispositions and measured evidence follow below after verification.

## Verified corrections

All eight independent source/chart findings closed. Province fills now share a fixed track separate from their numbers. DEM nulls break the profile, genuine negative heights remain signed, and absent samples are labelled. Queue clocks retain a true zero and never produce `0:60`. Population stacks reject inconsistent totals. Percentage plots carry 0/intermediate/maximum ticks, both warning and preparation conditions are explicit, dot allocations are labelled rounded, and the planner consistently rounds walking minutes up.

Native Thai additions cover Plan fields, placeholders, status messages and checklist; Results headings, selected package interpretations and local planning actions. Source values and qualifications are unchanged. Derived victim counts now carry an approximation sign. Existing English map/source context is not claimed to have received a complete translation audit.

Two additional composition defects were fixed during the rendered audit:

- Showing the source qualification made the old 300px phone operations budget displace Start onto page 2. At390×844 this old budget failed the actual `inFirstScreen` check. A324px operations budget now keeps the qualification, controls and Start together; the map remains390px high, starting at42px. At desktop, a2:1 map/panel composition prevents new labels pushing the profile onto a second page.
- Phone Results initially used2pages with only the outcome dots on page2. Repeated package/protocol tags and nested container padding/borders were removed, preserving the entire finding, protocol, metrics and outcome. Both language views now fit1page at390×844,1024×768 and1440×900.

Research tables do not split across columns; qualifications sit immediately beside the chart. Paragraph widow/orphan handling yielded no fragmented paragraphs in the recorded36initial-view cases. This is evidence for these cases, not every possible expanded state.

## Evidence and checks

- `docs/evidence/chart-audit-2026-11-03/geometry.json`:36actual browser captures — Model, Results, Plan, Drill, Research and DDPM × Thai/English ×390×844,1024×768,1440×900. No document overflow or scroll. Masthead36px; Model scene top42–44px. Model pages3/2/1 respectively, Start onpage1. Results1page inall6cases.
- `edges.json`:10additional Thai Model cases including320×700,390×600,667×375,1169×674,1280×720,759/760/761px and1099/1100px. No document overflow;36px banner retained. Start onpage1 except the short667×375 landscape viewport, which still uses5explicit reading pages. We do not claim every task fits a single screen at every height.
- `province-proportions.json`:22rows visible at1024×768; measured fill/track ratio differs from source rows/144 by at most0.000076 (subpixel rounding). The prior cell-width-plus-cap encoding saturated the largest values; a separate common track removes that cap.
- `behavior.json`:1001m Plan estimate matches21minutes in its chart and headline, input survives page turns; observed Drill example100participants/97counted yields97%+3% and3notaccounted; delayed full package retains88.9%/8.2%/2.9% and exactly100rounded dots.
- `focus.json`:Research Sources jump reveals/focuses its section without document scroll; Manual Escape returns focus to its button.
-70tests pass (59TypeScript,11Python). Strict build and six text contrast roles pass; whitespace checks clean. Independent scientific/code and screenshot review:PASS, all findings closed, including final bilingual phone Results.

## Limits

Physical-device rendering and native Thai community review remain unverified. Research and detailed rehearsals still use explicit pagination. Coarse terrain and imagery do not become higher-resolution source data through charts. No new wave prediction, validated evacuation route or refuge approval was introduced.

Release receipt follows after canonical deployment.
