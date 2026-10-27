# Use comparison space for evidence

2026-10-28 · Agent: codex

The owner identified the large gap between package names and fixed 70 px mini-bars. The selector now uses its available middle column for paired, zero-based bars covering both published timing conditions. Five packages show ten source values on one labelled 0–25% axis with five-point divisions. Direct 30/45-minute row labels retain series identity without relying on color. Numeric values, relative reductions for the selected condition, five native selection buttons, the active-package inspector, denominator, source citation and historical-model qualifications remain intact.

This comparison is not an isolated warning-delay experiment: warning time changes 30→45 minutes and mean preparation changes 14→28 minutes. Both assumptions are named beside the chart and in accessible row descriptions. VE50 is labelled as vertical-evacuation preference, rather than a measured drill effect; the source scenario label and inspector now agree. The adjacent HUD calls its derived reduction modeled rather than observed casualties. Published percentages are unchanged. Thai and English chart copy follow the existing language preference.

## Geometry and behavior

Task budgets: all five rows at most 48 px high, complete comparison at most 300 px, plot width at least 110 px, all ten bars present and no overflow. The graph must use available width rather than separate labels from a small fixed-width decoration. Actual results in `design/intervention-comparison.json`: rows43 px; total268.8–287.6 px; plot128/158/182.8/349.2 px at360/390/1024/1440 viewport widths. The extra row line carries a second source result and its direct label. No content was invented to occupy space.

The previous canonical DOM, read without mutation, had five70 px mini-bars: `design/intervention-comparison-before.json` fails the new bar-count and minimum-plot-width criteria. `design/intervention-map-geometry.json` passes all14 unchanged map/task cases. Current source qualifiers and complete package details remain available.

Browser trial selected all five packages under both timing conditions, confirming the corresponding HUD values and detail headings. Recorded in `design/intervention-comparison-behavior.json`; the original trial preceded the final wording correction from Practice to vertical preference. Final source and visual review check that correction separately. Screenshot evidence: `evidence/intervention-comparison-360.png`, `-390.png`, `-1024.png`, `-1440.png`, and native Thai `-th-390.png`. Viewport sizes were asserted before captures to avoid accepting a fixed working tab as a responsive result.

Validation:31 JavaScript and10 Python tests, production build and six contrast checks passed. Independent reviewer closed all scientific, source and visual findings, checked phone/tablet/desktop/Thai screenshots, independently reran all14 map geometry cases and nine relevant research tests. Final VE50 inspector/Thai accessible-name proof: `design/intervention-ve50-label.json`. Canonical release receipt follows after deployment.
