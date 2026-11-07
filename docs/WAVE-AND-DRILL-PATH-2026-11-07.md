---
updated: 2026-11-07
drafted_by: mavis
reviewed: false
---
# Wave visualisation and the drill path — 2026-11-07

Two faults, both found by measuring the rendered interface rather than the source.
Both are fixed and live. The release is `54a2793`, Cloudflare version
`04811105-dc1c-44f9-801a-7e7644835965`.

## Found — the wave shading did not move

The depth shading shipped earlier scaled its ramp to the deepest cell **of the frame
in view**. The reasoning was that the frames come from one model run and are not
comparable with each other, so a fixed absolute scale would draw two frames of the
same event as two different events.

That reasoning was wrong about the consequence. A wave deepens almost everywhere at
once, so every cell kept the same *relative* position on the ramp. Measured on the
deployed map, with the same cells at two times:

| | frame 0 | frame 1800 s |
|---|---|---|
| model's depth in the cell | 1.02 m | 2.94 m |
| its position on the ramp | 0.836 | 0.835 |
| painted pixels that moved | — | **0.1 %** of the water region |
| mean change in red | — | **0.08 of a level** |

The map showed a wave that had not changed. The instrument reported the depths
changing correctly — the same features carried `depthM` 1.02 → 2.94 — and the
`fill-color` expression was installed on the layer with the frame's own maximum,
1.22 at frame 0 and 3.52 at frame 1800 s. The mechanism was working. The scale was
the fault.

## Changed — one scale for the whole imported file

The ramp now runs to the deepest cell the model gives in **any frame of the imported
file** (`fileDepthScale`), not the frame in view. The scale is derived from the file
itself and is stated in the map key, so it invents nothing and hides nothing.

Same cells, same two times, after the change:

| | frame 0 | frame 1800 s |
|---|---|---|
| painted pixels that moved | — | **100 %** of the water region |
| mean change in red | — | **−30.97** |
| mean change in green | — | **−27.63** |
| mean change in blue | — | **−22.88** |
| per-pixel spread | — | min −76, max −3, stdev 9.73, 71 distinct values |

Red falls most and blue least, which is the ramp's own direction: shallow
`rgb(179,222,240)` → deep `rgb(10,71,115)`. The spread is the point: the change is
not a global tint, it differs from cell to cell because the depths differ.

The map key now reads *"the depth the model gives for each cell — pale is shallow,
dark is deep, on one scale for the whole file (0–3.5 m), so the water darkens as it
deepens and one moment can be compared with the next. A cell the model gives no
depth for is not shaded at all: unknown, never safe."*

Unchanged on purpose: the user-chosen demonstration level keeps its exact former
colour, because a chosen level has no depth to shade by; and a cell with no depth is
still not drawn at all, so an unknown cell is never shaded as shallow.

## Found — the drill protocol was unreadable

The drill protocol was laid out as five equal columns at 900 px and wider. The
rendered measure, measured on the deployed page:

| viewport | column width | characters a line | heading lines |
|---|---|---|---|
| 1440 × 900 | 132.8 px | **20** | 2 |
| 1024 × 768 | 91.2 px | **14** | 3 |
| 390 × 844 | 374 px | 58 | 1 |

A comfortable reading measure is 45–75 characters. Twenty is not a measure, it is a
crease — and every heading wrapped to two or three lines, which is accidental
wrapping in the law's own list. Five equal blocks side by side also flatten a
sequence into five simultaneous panels, and the law names that shape directly.

The audit of 2026-11-06 records "Prose measure ≤65ch" as satisfied. That claim was
about the stylesheet's declared maximum, not about what the reader got.

## Changed — one path for the protocol

The protocol is one ordered list at a comfortable measure, and it starts in a fresh
reading column so its heading and its five steps are never split across the break.

| viewport | before | after |
|---|---|---|
| 1440 measure | 20 chars | **70 chars** |
| 1024 measure | 14 chars | **70 chars** |
| heading lines | 2–3 | **1** |
| page height | 900 | **900** (unchanged) |
| protocol split across the column break | yes | **no** |

Nothing was removed. The steps, the heading, the "If warnings are real" disclosure
and the source links are all still there; only the geometry changed. The form that
records the drill stays in the first reading column, the protocol in the second, and
both now end within about twenty pixels of each other.

## Verified

- `npm test` — 88 TS + 11 Python pass. The new test asserts the file-scale property
  directly, including the arithmetic that the old per-frame scale hid the deepening:
  `depthRatio(1.02, 1.22)` and `depthRatio(2.94, 3.52)` agree to within 0.01, while
  on one scale for the file the same two cells move by more than half the ramp.
- `npm run build` — clean.
- `node scripts/check-contrast.mjs` — body 15.44:1 · secondary 6.55:1 · masthead
  11.47:1 · amber navigation 5.94:1 · action text 8.00:1 · active row 13.72:1.
- The MSH instrument on every surface at 390, 1024 and 1440: no gaps, no stretched
  siblings, no inflated boxes, no holes inside a reading column, no document
  overflow.
- Live bytes: `assets/index-DbT2eHDH.js` and `assets/index-BEO8iRdV.css` are
  byte-identical to the local build by sha256.
- Live wave proof: the numbers above were re-measured on `tsunami.nonarkara.org`
  and are identical to the local build. Map key carries the ramp and the unknown
  rule; the caption height is unchanged; no console errors; no document overflow.

## Remaining

- No real research replay ships with the app. Every measurement above is against a
  synthetic fixture whose title says it is not hazard evidence. The mechanism is
  proven; the numbers a real model would produce are not known.
- The physical-phone test is still outstanding; the shortest phone used is 320 × 568
  in emulation.
- Roof coverage remains 8 readings for 1,196 buildings, and the roof ridgelines are
  drawn in plan because no source height is known.
