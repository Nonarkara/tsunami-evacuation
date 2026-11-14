# Viewport and banner receipts

`measure.mjs` is the read-only collector for the fixed-screen workspace: it records the
document box, the banner, the operating regions, the camera controls and the header
controls. It does not navigate, click, inject styles or collect page text.

`capture.py` drives that collector against the **deployed** site and writes the records
the two gate scripts read:

- `docs/evidence/viewport-2026-10-28/case-<width>-<height>.json` — one record per route
  (`model`, `satellite`, `plan`, `drill`, `research`).
- `docs/evidence/banner-2026-10-28/cases.json` — one row per page per viewport,
  including both sides of the 760px and 1100px breakpoints.
- `docs/evidence/viewport-2026-10-28/live-bytes.json` and `capture-receipt.json` — the
  sha256 of the bytes the host actually served, so a receipt can be tied to one release.

## Run it

```sh
python3 tools/viewport/capture.py https://tsunami.nonarkara.org
```

It needs the Playwright python package and its Chromium build. Then evaluate the
receipts:

```sh
node scripts/check-viewport-evidence.mjs
node scripts/check-banner-evidence.mjs
node scripts/check-served-bytes.mjs https://tsunami.nonarkara.org
```

The third one is the one that catches a stale receipt. On 13 November 2026 the first
two gates both reported PASS against a receipt taken on 7 November, while the site
was serving a bundle five releases newer. A receipt is evidence for the bundle it was
taken against; `check-served-bytes.mjs` hashes what the host is serving now and
compares it with the sha256 in the receipt.

## The band reader

`bands.py` reads the **rendered lines** of a text band: the exact characters on each
line, the measure in characters per line, and whether the last line is a stranded
word. It is the instrument that found the six stranded words in the 12 November
audit, and it covers every surface — explore, prepare, drill, research, ddpm — at
390, 1024 and 1440.

```sh
python3 tools/viewport/bands.py https://tsunami.nonarkara.org out/bands.json
```

It waits for the terrain only on the surface that has one: a hidden terrain never
reports ready, so waiting for it elsewhere only burns the clock.

## What the receipts must carry

- `surface` — the `data-page` of the masthead that was actually measured, and
  `navCurrent` from the banner control. A receipt for one surface is never evidence
  for another; the explore record is not a pass on the drill or research page.
- `terrainState` — `ready`, `flat` or `loading`. The map is waited out before a
  measurement, because a receipt taken while the terrain is loading measures the
  loading state rather than the workspace.
- `failures` — any region that leaves `main`, and `headerControls` whose rectangle
  crosses the viewport edge.

A capture is evidence, not a trusted authority. A stale or handwritten capture is not a
browser test. If the site is mid-deployment the collector will record the bytes that
were served at that moment; compare `live-bytes.json` with the local build before
quoting a receipt as current.
