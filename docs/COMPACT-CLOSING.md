# Compact closing, area selection and direct research comparison

2026-10-28 · Agent: codex

Three owner findings were handled together: the outcome/citation/footer repeated reading bands; place tabs wrapped into an orphan row; research timing buttons emphasized one of two already reported series and implied a needless click.

## Changes

- `OutcomeSummary` preserves the actual composition strip, quarter divisions, 0–100% scale, denominator and direct percentages. Labels distinguish reached modeled sites, outside the affected area and modeled victims. Intermediate packages retain only the reported victim share and its complement, explicitly not classified as modeled victims; site/outside shares remain unknown. No safety categories were inferred.
- A 33 px source footer replaces the repeated citation and credit bands. The direct SSRN and Research actions remain visible. Native Study & credits details retain the complete citation, author/creator credits, AIT/Mahidol context and the published start/end site-arrival comparison. These are source-reading details, not information required to interpret the visible percentages.
- One native 32 px area select preserves every place, selection callback and map control without a three-plus-one tab wrap. All 17 places were exercised against their actual building-pack identities.
- Research shows baseline and delayed values/bars together at full opacity. The timing emphasis state and buttons are removed; the semantic table, every source value, definitions, source links, qualifications and exports remain. The Explore warning selector still controls the selected package result.
- Thai outcome/footer wrappers have language tags, Prompt and 1.6 line-height. English citation runs retain English language tags and Jost. Research locale changes notify parent state so the footer updates immediately without remounting forms. The manual describes direct comparison and the new citation location.

## Measured result

At390×844, the previous English-only closing path occupied308.9 px: outcome111.5, full citation61.6, footer80.8 and a49 px closing gap. The new English path occupies113 px: outcome61, footer33 and gap19. This is63.4% smaller, **not80%**. The new native Thai path is139 px, including 1.6 line-height; its labels were not compressed to force the requested percentage. Wide-view totals include the neighboring paired-comparison column's genuine content below the outcome summary, rather than stretched blank panels.

`design/closing-final-geometry.json` records eight actual EN/TH viewports:360×800,390×844,1024×768,1440×900. Budgets: outcome at most75 px EN/95 px TH, footer/area at most36 px, closed path at most145 px phone/180 px wide; no overflow. All pass. The preserved old canonical DOM in `closing-before.json` fails the same outcome/footer/phone-path budgets. `compact-ending-map-geometry.json` passes all14 unchanged map cases. `area-select-trial.json` records all17 working area choices. Current captures are `evidence/closing-after-en-390.png`, `closing-after-th-390.png`, `closing-credits-th-expanded.png`, and `research-both-visible-en.png` / `-th.png`.

## Verification and limits

Browser trials confirmed all10 research values remain visible with zero timing toggles and all bars at opacity1; EN↔TH immediately updates footer language; Enter opens/closes source details; the complete citation remains; partial outcome accounting shows7.0% modeled victims plus93.0% not classified as modeled victims. Numeric baselines align despite different Thai label lengths. All17 area choices preserve sourced pack identity. Independent review closed source, locale, Thai typography, interaction and geometry findings, independently rerunning14 geometry cases and10 relevant tests.

Full31 JavaScript and10 Python tests, production build and contrast checks are required before release. Native human/field validation remains unverified. No new predictions or approved destinations are introduced. The verified React locale lesson is recorded in the shared memory vault under `Scars/Debug-Logs/2026-10-28-url-locale-changes-must-notify-react-siblings.md`.

Canonical release receipt follows after deployment.
