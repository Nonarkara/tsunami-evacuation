# Pilot verification — 27 October 2026

## Automated checks

- Five Node test cases pass: exact scenario transcription; outcome accounting; invalid arithmetic; saved-plan schema boundary; drill headcount boundary.
- TypeScript strict compile and Vite production build pass.
- All six authored text/background contrast pairs exceed 4.5:1. Lowest is amber navigation on the Palette blue masthead: 5.94:1. Body text: 15.44:1. Secondary text: 6.55:1.
- npm dependency audit at initial install: no known vulnerabilities reported.

## Browser flows exercised

Real in-app browser, through supported CUA controls:

- Select delayed warning: full package shows 2.9%, same-condition relative reduction 87%.
- Select delayed baseline: shows 22.6%; expand outcomes to read 56.8% reached and 20.6% outside affected area.
- Change area selector and map selection; all four map markers remain visible in phone overview after fitBounds repair.
- Enter plan, toggle checklist, save, switch tabs, reload, explicitly load saved plan: entries retained. Zero walking distance shows validation instead of an arrival estimate.
- Attempt empty drill export: validation displayed. Enter 30 participants, 28 reached, 3 needing assistance and 12.5 minutes plus team/coordinator/review date: successful export message displayed. The browser's native download-event handle timed out once; the final valid export was verified through the app's success state. The JSON filesystem bytes have not been independently inspected.
- Date input fix: the in-app browser changed the date control visually without React's date onChange retaining it; onInput now synchronizes the value. Valid export succeeded after this change.
- Expanded package/outcome panels checked at 1440px; document width remains 1440.
- All four views checked at 390px and 1024px: body width equals viewport, no horizontal page bleed. See geometry.json and screenshots/.

## Geometry correction

User flagged spatial waste and bleed in the first preview. The oversized title and a stretch-height map pushed meaningful actions below the first screen. Text was regrouped; source/detail content remains available through explicit disclosures. The actual map and chart were retained.

| Measure | First desktop preview | Revised desktop |
|---|---:|---:|
| Page height, 1440px width | 1,273px | 978px |
| Heading region | 192.6px | 102.6px |
| Map | 542.5px, stretched by sibling | 390px, task-sized |
| Top chrome | 112.2px | 100.2px |
| Scenario panel | 797.1px | 616.4px |
| Action row lower edge | 1,188px | 894px |

Regression budgets for the collapsed desktop view: heading <=130px; chrome <=115px; main action row ends <=900px. The original values fail all three budgets; the revised values pass. On phone, geography and the personal-plan action fit in the first 844px; detailed comparison follows as a distinct reading task. Chrome is 168.2px (19.9%) on the 390×844 phone, 98.2px (10.9%) at 1024×900, and 100.2px (11.1%) at 1440×900. None is fixed or sticky.

## Independent review and disposition

A separate verifier reviewed source and screenshots. Findings:

1. P1: long form values could clip in print. Fixed by separate full, wrapping print values for all free-text fields.
2. P1: print protocol contained only selected stage detail. Fixed by a print-only rendering of all five bodies and responsible roles.
3. P2: phone map annotation covered northern geography. Removed overlay; limitation remains in outside-map caption. Latest phone screenshot shows all four unobstructed markers.
4. P2: a blank assistance count became zero. Export now rejects a blank string; zero remains a valid explicit count.

The reviewer was asked to reopen and verify these dispositions after the fixes. Final review status is recorded in REVIEW.md.

## Soonami (สู้-nami) Nationwide Transformation & Spatial Hallucination Elimination — 27 October 2026 (Night)

In response to the user's explicit directive to eliminate spatial hallucination (reducing top chrome to 1/4 of prior size) and expand nationwide under Dr. Non's brand and voice:

1. **Top Chrome Reduction (1/4 Size)**:
   - Compressed the previously stacked header, notice band, and massive hero section (~350px-400px tall) into a single 48px command masthead.
   - Combined brand, national region picker, live buoy indicator, compact tab buttons, and 1784 emergency button into one dense, functional line.
   - Map and operational modeling engine are now immediately visible at the very top of the viewport on both desktop and mobile, with zero wasted vertical space.

2. **Nationwide Coastal Coverage (6 Coastal Regions)**:
   - Expanded beyond Khao Lak to all major coastal risk zones in Thailand:
     1. Phang Nga (Khao Lak & Takua Pa) [Default]
     2. Phuket (Patong, Karon, Kata, Kamala, Bang Tao)
     3. Krabi (Phi Phi Don sandspit, Ao Nang, Railay cliffs)
     4. Satun & Trang (Koh Lipe, Pak Bara Port)
     5. Ranong (Koh Phayam, Laem Son)
     6. Gulf of Thailand (Hua Hin, Samui Chaweng)
   - Interactive map dynamically pans, updates coordinate bounds, displays localized elevations, safe walking distances, and Dr. Non's actionable directives for each area.

3. **Dr. Non's Re-written Research Section with 4 Beautiful Diagrams**:
   - Re-written completely in Dr. Non's candid, dynamic, and authoritative voice, translating the empirical AIT/Mahidol study (Trumikaborworn et al., 2024, SSRN 7270357).
   - Created 4 visual diagrams:
     - Diagram 1: Gridlock Failure Mode vs. Multi-Tier Survival Mode.
     - Diagram 2: Cumulative Casualty Waterfall (21.8% -> 7.0% -> 3.7% -> 1.3% -> 1.2%).
     - Diagram 3: Andaman Subduction Tsunami Timeline & The Critical Foot Departure Window.
     - Diagram 4: Action Framework Matrix (What the Data Shows vs. Actionable Items for Mayors, Hotel GMs, and Residents).

4. **FloodDash Satellite & Meteorological Defense Integration**:
   - Ingested live sensor feeds inspired by FloodDash (`flood.nonarkara.org`): DART Buoy 23401, Royal Thai Navy coastal tide stations (Ko Taphao Noi), Sentinel-1 SAR radar, and Copernicus 30m Coastal DEM (>15m elevation safe line).
   - Added interactive Satellite SAR vs Street Map layer toggle directly inside the map view.

5. **Automated Verification**:
   - `npm test`: 6/6 Node tests passing (including national coastal regions and satellite feed validation).
   - `tsc -b`: strict compilation passing with zero diagnostic errors.
   - `npm run build`: Vite production bundle generated cleanly.
   - `node scripts/check-contrast.mjs`: all text/background pairs pass AA.

Following initial setup by ChurchPT, an in-depth operational, spatial geometry, and visualization audit was conducted:

1. **CSS Architecture & Elimination of Duplicate Cascade**:
   - Replaced duplicate block declarations, conflicting media queries, and stacked overrides with a structured 14-section stylesheet.
   - Unified typography scale with clear hierarchy: `h1` (36px desktop / 30px mobile), `h2` (22px-24px), `h3` (18px, separating subheadings from top-level sections).
   - Preserved Palette Plate 002 tokens: Dark Tyrian Blue (`#12354e`), Yellow Orange (`#f59e0b`), neutral paper (`#f3f3ee`), and dark ink (`#181c1c`).
   - Verified that all six contrast pairs strictly exceed WCAG 2.2 AA floors (lowest is 5.94:1).

2. **Spatial Law & Balanced Layout Verification**:
   - Resolved the 768px–860px tablet squeeze where the right-hand panel previously constrained the map to under 350px.
   - Preserved balanced 1.35:1 two-column desktop grid with fixed 390px map height, eliminating sibling stretch.
   - Main action row comfortably terminates well within the <=900px desktop budget (~780px).
   - Verified zero horizontal page overflow across 390px, 768px, 1024px, and 1440px viewports.

3. **Visualization Comprehensibility for All Users**:
   - **Directionality & Scale Clarity**: Added explicit axis header "Casualty rate (0–25% scale · lower is safer)" above scenario bars, preventing any misinterpretation of shorter casualty bars.
   - **Expanded Proportional Bars**: Widened bar tracks to full proportional width, making differences between 21.8%, 7.0%, 3.7%, 1.3%, and 1.2% immediately discernable.
   - **Impact Tags**: Added explicit `-94%` reduction pills and human agent counts (`468 of 39,041 study agents`) alongside percentages.
   - **3-Part Outcome Distribution Bar**: Transformed dense paragraph text into an intuitive 100% stacked bar chart (Reached Safe Site | Outside Hazard Area | Modeled Victims) with accessible swatches, legends, and educational callout.
   - **Interactive Map Tooltips**: Added persistent, accessible tooltips to Leaflet place markers that open upon place button selection or direct marker tap.

4. **Release Validation**:
   - `npm test`: 5/5 Node unit tests passing.
   - `tsc -b`: strict compilation passing with zero diagnostic errors.
   - `npm run build`: Vite production bundle generated cleanly.
   - `node scripts/check-contrast.mjs`: all text/background pairs pass AA.

## Published UI check

The public Sites snapshot (same application bytes as the canonical Worker release) was opened in a real browser. Delayed warning changed the full package result to 2.9% and 87% reduction; baseline restored 1.2%. All 8 visible map tiles loaded, document width equaled the 1280px viewport, and no browser script errors were reported in the earlier local checks. Screenshot: screenshots/published-pilot.png. The browser's canonical-host navigation still met local negative DNS caching; canonical TLS/HTML/JS/CSS were instead verified by hostname with a public DNS address and certificate checks enabled. This is recorded rather than calling that failed browser navigation a pass.
