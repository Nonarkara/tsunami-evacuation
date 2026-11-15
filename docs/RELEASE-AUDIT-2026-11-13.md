# Release audit and orchestration — 13 November 2026

This is the second pass over **another agent's** work rather than its own. It follows
the 12 November MSH pass (`docs/MSH-AUDIT-2026-11-12.md`) and the builder's own record
of the measure tour (`docs/MSH-AUDIT-2026-11-13.md`), which ends with the line
*"Not re-audited by a second agent after this pass."* This is that pass.

Three commits landed while the 12 November work was in flight:

| Commit | What it did |
|---|---|
| `6ecac8f` | the guided five-measure tour and the measure ladder on Results, plus five MSH fixes (DDPM legend, Plan buttons, checklist tick, Thai heading, reading measure) |
| `a246004` | one heading scale on the reading pages: 24 / 17 / 13 bold |
| `ce30c02` | hardened headers, CI audit, Dependabot, private temp files, a DDPM re-review flag |

The work is good and it was kept. The tour is user-started, stops on any manual
choice, on a view or tab change and when the document is hidden, and the checklist
now shows its tick only at 6/6 instead of reading "0/6 ✓" as complete. Those are
corrections, not decorations. What follows is what the second pass found.

## Found

### 1. The five published packages carried four different names

The same five packages from §4 of the preprint were named in four ways, in two
languages, across four surfaces:

| Surface | Names |
|---|---|
| `scenarios[].short` (the data) | Baseline · Walking · + Refuges · + VE50 · + Signs |
| `packageNames` (the ledger; Research table, CSV export, chart tooltips) | Study baseline · PD50 · walking preference · + VS14 · candidate buildings · + VE50 · vertical preference · + SG135 · total signs |
| the Research chart | Base · PD50 · +VS14 · +VE50 · +SG135 |
| the Results chart | Base · **Walk** · **+Refuge** · +VE50 · **+Signs** |

The Results chart did not read `scenarios[].short` at all; it wrote its own array, so
two of the paper's own codes — PD50 and VS14 — were hidden behind "Walk" and
"+Refuge", and SG135 was called "+Signs". On top of that the new measure ladder
paraphrased all five packages a fifth time, in plain language, with no package
identity attached to the row at all.

Measured on the live page before the fix: every published value appeared **twice**
(chart and ladder), under two naming systems, and the ladder's rows could not be
matched to the paper's packages without counting from the top.

### 2. The ladder did not say the packages were cumulative

Its own code comment said *"cumulative, so every row up to the selected one is in
effect"*. The page did not. Five rows in sequence, each with a percentage and a tick
for the ones already applied, read as five independent measures — and these are
published **modeled victim shares**. The Research page states the cumulativeness in
plain words ("These are successive cumulative packages (§4.5)"); the Results page,
which is where the numbers are largest, did not.

### 3. The evidence receipts were five releases stale

`docs/evidence/viewport-2026-10-28/live-bytes.json` recorded
`index-DbT2eHDH.js`, captured `2026-11-07T14:14:06Z`. The site was serving
`index-B1UZfzll.js`. **`BOUNDS_PASS` and `BANNER_PASS` were passing against bytes
that were no longer served.** A gate that reads a receipt is only evidence for the
bundle that receipt was taken against; the receipt carries the sha256 for exactly
that reason. Nothing in the gate run reported this, because the gate does not know
what is live.

### 4. The band instrument measured one surface out of five

`tools/viewport/bands.py` read the rendered lines of the Explore surface only. The
heading scale in `a246004` landed on Research and Drill — the two surfaces whose
reading measure was never measured by this instrument.

### 5. The Results geometry evidence had no producer, and was stale for the same reason

`docs/evidence/playback-data-2026-11-12/` holds the receipts the gate
`check-playback-data-evidence.mjs` reads: 16 Results geometry cases, 6 data-dialog
cases and 3 Thai landscape pages. They were produced by a scratch script that was
never kept, so there was no way to refresh them.

`live-assets.json` in that folder records the bundle it was taken against —
`index-DG2lLEsn.js`, commit `c47b077`, 11 November. The site has served five
bundles since. The gate kept reporting **PASS**, because the gate compares a
receipt with itself.

What it was asserting no longer existed: the receipt puts the package inspector
card in the right-hand column of the Results split (`package` at x=732 on a
1440-wide screen). The card now sits in the left column, under the outcome
summary, with the measure ladder above it. The receipt was describing a layout
that has since been restyled.

This is the same fault as finding 3, one gate further from the eye — and it is
worse, because this evidence could never have been refreshed even if someone had
noticed it was old.

## Changed

1. **One canonical name per published package.** `scenarios[].short` now carries the
   paper's own code — `Baseline`, `PD50`, `+VS14`, `+VE50`, `+SG135` — with a Thai
   companion (`ฐาน` for the baseline). The Results chart, the Research chart and both
   screen-reader labels read that field instead of writing their own arrays. Nothing
   names a package twice now, and every surface names it the same way.

2. **The ladder carries the package's identity.** Each row now reads
   `PD50 · Walk, not drive; help those who cannot walk   7.0%` — the published code
   first, so a row can be matched to the paper, the chart and the inspector card
   without counting.

3. **The ladder says what it is.** One line above it: *"The five published packages,
   cumulative: each row adds to the rows above."* (Thai: *"ห้าชุดมาตรการที่ตีพิมพ์
   สะสมกัน: แต่ละแถวเพิ่มจากแถวก่อนหน้า"*) The list can no longer be misread as five
   independent measures.

4. **The band instrument now reads every surface** — explore, prepare, drill,
   research, ddpm — at 390, 1024 and 1440, and it waits for the terrain only on the
   surface that has one.

5. **The receipts were re-taken against the served bytes**, and the receipt records
   the sha256 of what the host actually served for the release under audit.

6. **The Results geometry evidence has a producer again.**
   `scripts/capture-playback-evidence.py` drives a built site in Chromium and writes
   the three receipts the gate reads, plus the served bytes it measured them against.
   It was run against the live site, so the evidence now describes the release that
   is actually published.

7. **One gate now covers every receipt that records bytes.**
   `scripts/check-served-bytes.mjs` reads the viewport capture receipt *and* the
   playback receipt, hashes what the host serves now, and fails if either receipt
   describes a different bundle. It also checks the four data files the app
   fetches at runtime, because a receipt measured against one set of data says
   nothing about the interface against another.

   It was run against the stale receipts before they were re-taken, and it failed
   on both — naming the bundle each receipt was taken against. A gate that has
   never been seen to fail is not known to work.

## Verified

- **Live naming, measured in the browser on the deployed build** (English and Thai):
  every package appears exactly twice on the Results page — once in the ladder, once
  in the chart — under the same code in both places; the inspector card carries the
  descriptive label with the code in parentheses; the old names "Walk", "+Refuge",
  "+Signs", "Walking" and "+ Refuges" no longer appear.
- **Suites:** 91 TypeScript tests and 11 Python tests pass; the build is clean; the
  contrast gate passes on all six roles.
- **Reading measure:** measured on every surface at 390, 1024 and 1440 — see the
  receipt in `docs/evidence/` and the per-surface output of
  `tools/viewport/bands.py`.
- **Security headers are served** (HSTS, COOP, `upgrade-insecure-requests`,
  `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`, nosniff, a
  Permissions-Policy that disables geolocation, camera and microphone). The CSP's
  `img-src` and `connect-src` cover exactly the hosts the app calls at runtime —
  `server.arcgisonline.com` for imagery and `s3.amazonaws.com` for the elevation
  tiles. The OSM host that appears in the bundle is a provenance string in the
  building snapshot, never a request, so it needs no CSP entry.
- **Live bytes** match the local build by sha256.

## Remaining

Named plainly. A clean pass may not be claimed while these stand.

1. **The WebKit gap on the Thai phone Results page is still open** — about 180 px
   empty on page 1 because WebKit fragments the PagedFlow content differently from
   Chromium. It needs Safari or a real device; it must not be "fixed" with an
   unverifiable WebKit-specific rule.
2. **The physical-phone touch test at 390×844 is outstanding.** Every width in the
   record is an emulated viewport.
3. **The Thai pagination reading test is outstanding.** The Thai strings are shorter
   in characters but not in rendered width.
4. **The Plan and Drill pages end about 250 px above the footer at 1440.** That is a
   short page, not a fault: no content exists to fill it and inventing some is
   banned. It is recorded, not fixed.
5. **Roof coverage is still 8 readings against 1,196 buildings.** The imagery source
   has not lifted.
6. **No real research replay ships with the app.** The schema, the import path and
   the synthetic fixtures exist; the published frames do not.
7. **The Rokehan embed still needs one line changed by that tool's author**
   (`frame-ancestors 'self' https://oyasumi-gamedev.com https://tsunami.nonarkara.org`).
   It must not be framed, proxied or header-rewritten from this side.

## A note on the commit trail

`6ecac8f` and `ce30c02` carry a `Co-Authored-By` trailer that `AGENTS.md` does not
use. Their history is published and is not rewritten; the rule is honoured from the
next commit onward.

## 15 November: release close-out (Claude, after GLM 5.3's CSO audit)

The CSO audit's one yellow finding was right: the receipts were stale. Closing it turned up three more things.

1. **`e141488` was committed but never deployed.** The live site still served `index-8bWpod1g.js`, which carried the 320 px masthead clip. The fresh viewport receipt failed on it (`model/320x700: header control clipped`) until the fix was deployed.
2. **The playback producer could not finish a run.** On a phone width it took a handle to the `⋯` map-controls trigger. The dock then re-rendered that trigger, and the stale handle never became clickable, so every run timed out on the first phone case. It now clicks through a re-resolving locator.
3. **A stale receipt had hidden a gate failure since `6ecac8f`.** Once the evidence was current, `check-playback-data-evidence` failed on every phone case. The new measure ladder (five `aria-pressed` package buttons, the same five as the chart) had become the phone package control, and the chart moved behind it. The gate still named the chart. Worse, at 390×600 and 320×700 the ladder was **split across two pages**, half of a control on each. Fixes:
   - `.measure-ladder` gets `break-inside: avoid`, so it always sits whole on one page. At 390×844 that page is the opening page, beside the outcome. On shorter phones the ladder starts page 2.
   - The gate now checks the control that is actually there: the chart on desktop, the ladder on phone. It requires the control to be whole on one page, and on the opening page wherever the viewport is at least 800 px tall. A mutation check (a ladder widened across two columns) fails the gate.

The release-time check scripts (contrast, viewport, banner, manga, resume, orchestration, playback-data, served-bytes) all pass against receipts captured from the live origin for this release.

## 15 November, second pass: the open items, tested in WebKit

There is no full Xcode on this machine, so the iOS Simulator is unavailable and no physical phone was used. Every check below ran in **Playwright WebKit**, Safari's engine. The touch test used the iPhone 15 profile, which gives real touch events and a mobile viewport. That is the closest stand-in available here. It is **not** a substitute for a real iPhone, so the physical-device test stays open.

| Item | Finding | Fix |
|---|---|---|
| Empty boxed strip above the page turner (phones) | `.pkg-metrics-grid` (border + tint) split, so only its top edge sat at the foot of page 2 | `break-inside: avoid` |
| Thai phone Results gap in Safari (the ~180 px gap from the 13 Nov audit) | **Reproduced in WebKit**: 163–174 px empty on page 1. `.active-package-card` is a flex column, which WebKit will not fragment across columns, so the whole card jumped to page 2. | `display: block` inside the paged flow. WebKit page-1 gap 163 → 58 px (Chromium 57). Every other paged surface now matches between engines. |
| Ladder moved under the reader's finger | Choosing a package made its row bold. The text wrapped one more line, the ladder grew 17 px, and at 393×659 (Thai) the whole ladder jumped to page 2 right after the tap. | The current row is marked by the amber bar and tint only. Ladder height is now constant across all five choices, in both engines. |
| Chart split in phone landscape | At 844×390 and 932×430 the 160 px chart (~210 px with legend and axis) could never fit a 163 px page, so it spanned 2–3 columns across pages. | The compact chart height (96 px) also applies to short screens: `(max-width: 760px), (max-height: 440px)`. |
| Page-turner buttons 28 px tall | Below the 32 px house floor for touch text controls | 32 px on the phone layout. Desktop stays 28 px for the mouse. |
| Thai pagination reading | Swept every page of every surface in both engines for text cut at a page edge. The only cuts were 1–4 px line-box overhangs (glyphs confirmed whole at 3×) and text inside *closed* `<details>`. With every section open, nothing is hidden in Chromium, and one line is cut by 7 px in WebKit English at 390×600. | none needed |
| Touch | iPhone 15 profile, en + th: map controls, ladder rows, Previous/Next, Data & sources and all six masthead icons each respond to a tap | none needed |

| Ladder straddled two pages in Thai phone landscape (844×390, WebKit) | The five 33 px rows (166 px) were taller than the 159–163 px landscape column. Whether the ladder stayed on one page depended on where it started, and that shifted with the chosen package. | On screens under 440 px tall, row descriptions are truncated to one line (full text stays in the button's accessible name and in the package card below), and rows are 30 px. **This is a deliberate deviation from the 32 px house floor, landscape-only.** It stays above the 24 px WCAG floor, and each row is about 380 px wide. **Owner ruling, 15 November 2026: keep 30 px.** The one-page guarantee wins over the floor here. |

Kept as-is: the masthead icons measure 27–28 × 30 px. The owner's single 36 px banner rule caps them, and they are recorded here rather than enlarged.

New guard: `scripts/check-results-pagination.py` runs at release time in Chromium **and** WebKit, en + th, across seven phone, landscape and tablet sizes, through every package choice. It fails if the ladder or the chart spans pages, or if the ladder moves when a package is chosen. Before this pass, nothing in the gate set rendered in WebKit.

Still open: a physical iPhone test (needs a device, or full Xcode for the Simulator), and the one 7 px WebKit cut inside an opened Research section at 390×600.
