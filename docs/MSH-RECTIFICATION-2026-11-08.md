---
updated: 2026-11-08
drafted_by: antigravity
reviewed: false
---
# MSH Rectification — Masthead Balance, Sidebar Choke Points & Architectural Linework

## 1. Measured Faults & Diagnoses

Following Non's Design Scripture ("THE BOOK") and Massacre Spatial Hallucination (MSH) laws, an audit of the explore view identified three distinct layout and functional issues:

1. **Masthead Top Bar Half-Empty on Desktop**:
   - *Cause*: `.soonami-masthead[data-page=explore] .masthead-status { display: none; }` suppressed the masthead status text on the explore page. The left side held navigation buttons and region selector while the right expanse remained completely void between the controls and the clock.
   - *Fix*: In `src/banner.css`, under `@media (min-width: 1200px)`, restored `.masthead-status` with `margin-left: auto`, displaying the research boundaries and practice disclaimers cleanly beside the Bangkok clock without crowding or exceeding the 36px banner height.

2. **Right Sidebar 2/3 Empty on Desktop**:
   - *Cause*: The `PagedFlow` column stretched vertically to 100vh, while the terrain rehearsal cards (pace ladder, profile queue, etc.) occupied ~350px, leaving a massive empty void below on desktop viewports.
   - *Fix*: Extracted network bottleneck summaries from the queue simulation (`bottleneckSummaries` in `src/escape-timing.ts`). Added a responsive `Critical Choke Points` card (`.bottlenecks-card`) directly below the profile queue in `src/TerrainRehearsal.tsx`. It displays the top-3 highest-wait segments in descending order with wait durations, distance along the route, and interactive click-to-focus buttons that fly the camera directly to the pinch point and highlight it on the map.

3. **Manga Model Purpose Ambiguity**:
   - *Cause*: Labeling the view simply as "03 / MANGA STREET MODEL" obscured its functional design utility.
   - *Fix*: Refined the model view option and pane titles in `src/main.tsx` and `src/MangaModel.tsx` to "Street linework (ink) / เค้าโครงถนน (มังงะ)" and "Architectural street recognition / จดจำเค้าโครงถนนบางเนียง". Documented its explicit functional role: high-contrast street-level line-work for ground-level route and landmark recognition without satellite glare, keeping unmeasured buildings flat per Height Truth.

---

## 2. Verification Receipts

- **Tests**:
  - `npm test`: 89 TS tests + 11 Python tests passing (100% green).
  - Includes new unit tests for `bottleneckSummaries` queue extraction and descending wait sort.
- **Build**:
  - `tsc -b && vite build`: Clean build in 3.5s.
- **Audits**:
  - `scripts/check-contrast.mjs`:
    - Body text: 15.44:1 (AA/AAA pass)
    - Secondary: 6.55:1 (AA pass)
    - Masthead: 11.47:1 (AA/AAA pass)
    - Amber nav: 5.94:1 (AA pass)
    - Action text: 8.00:1 (AA pass)
    - Active row: 13.72:1 (AA/AAA pass)
  - `scripts/check-viewport-evidence.mjs`: `BOUNDS_PASS` (40 viewports checked, 0 geometry failures).
  - `scripts/check-banner-evidence.mjs`: `BANNER_PASS` (60 viewports checked, map top ≤ 44px).
