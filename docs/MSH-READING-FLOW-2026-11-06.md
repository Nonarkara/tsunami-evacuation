# MSH reading-flow measurement — 6 November 2026

**Release measured:** `8cd218c` · Cloudflare `f3ffddf4-2dc7-4107-a508-dbee9bce6eb4` · https://tsunami.nonarkara.org
**Law:** `/Users/nonarkara/Projects/MSH.md` — *"When you find SH, massacre."*

The 4 November release recorded one open item: *"Research/guide pagination can leave spare
space at indivisible chart boundaries; do not claim every page has no void or that all MSH
debt is resolved."* This is the measurement that settles it — and it adds the dimension the
instrument was blind to.

## What was blind

The MSH collector measured chrome cost, gaps between stacked blocks, stretched siblings,
inflated controls, hierarchy, task visibility and overflow. It never looked **inside** a
paginated reading column. A block that cannot fit in the remaining space of a column moves
whole to the next one, and the space it left is a hole the collector never saw.

The new metric merges every visible block's rectangle inside the visible column, then reports
two different things, because they are different failures:

- **holes** — gaps *between* blocks inside the column, reported when larger than 24px;
- **tail** — the space below the last block of the column, which is the end of the content.

## Found

Measured on the live release, every reading flow at the three widths the law names, page by
page (the collector was driven through every page of every flow):

| Flow | Viewport | Pages | Mid-column holes | Tail below the last block |
|------|----------|-------|------------------|----------------------------|
| Research | 390×844 | 10 | 0 | pages 1–9: 0 · page 10: **231px** (document ends) |
| Research | 1024×768 | 5 | 0 | 0 |
| Research | 1440×900 | 4 | 0 | 0 |
| DDPM evidence | 390×844 | 3 | 0 | pages 1–2: 0 · page 3: **124px** (document ends) |
| DDPM evidence | 1024 / 1440 | 1 | 0 | 0 |
| Drill | 390×844 | 2 | 0 | 84px · 76px |
| Drill | 1024×768 | 1 | 0 | 40px |
| Drill | 1440×900 | 1 | 0 | 172px |
| Plan | 390×844 | 2 | 0 | 128px · 100px |
| Plan | 1024×768 | 1 | 0 | 84px |
| Plan | 1440×900 | 1 | 0 | 240px |

The largest gap *between* blocks anywhere in any flow at any width is **17px** — paragraph
rhythm, below the 24px threshold. There is **no mid-column hole anywhere in the interface.**

**The 4 November note is not reproducible in the current build.** The chart that used to break
at a column boundary now carries `break-inside: avoid`, and the phone rail drops the profile
graphic rather than split it in half. The space the note warned about is gone.

## Changed

- **`tools/viewport/msh-measure.mjs`** now records `columnHoles` and `flowTail` for the
  visible reading column, and `tools/viewport/msh-capture.py` prints both. The dimension is
  measured on every future capture instead of being remembered from one release.
- No interface change was needed: there was no hole to fix. Fixing a hole that is not there
  would have meant moving content to satisfy a grid.

## Verified

- Reading-flow geometry re-measured on the deployed release, every flow, every page, at
  390×844, 1024×768 and 1440×900.
- Workspace geometry on the same release, 15 surfaces: chrome 36+24/28px (7–8%), stacked
  gaps 0, stretched siblings 0, inflated controls 0, document overflow none, map visible on
  the model surface at every width.

## Remaining — stated, not claimed away

- **The tail of a finished flow is the end of the content, not a hole.** Research page 10 of
  10 at 390 ends 231px above the floor because the document ends; the DDPM page 3 of 3 ends
  124px above it for the same reason. The reading surface is a fixed-height workspace by
  project law (100dvh, no document scroll); the content decides how much of it is used.
- **Short forms leave a tail.** The personal plan form ends 240px above the floor at 1440,
  and the drill record 172px. Nothing is placed there to fill it: a spacer or a filler card
  would be exactly the invented spatial demand this law forbids.
- **The instrument measures the visible column.** The capture that produced the table above
  was driven through every page; the collector itself still reports the page it is on, so a
  future capture sees one column per surface unless it is driven the same way.
- Nothing here is a claim that every page is perfectly filled. The tails are named, measured
  and left where the content ends.
