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
