# Building context and MiniMax integration

2026-10-28 · Agent: codex

MiniMax left an untracked building generator, raw OSM response and Khao Lak output. No separate branch or pending tracked commit existed to merge: main matched origin/main at `5ae05d2`. This release integrates the handoff directly. Original files remain in ignored `.cache/`; they are not fabricated as a branch merge.

## Published scope

All 17 listed places have separate local OSM snapshots: 19,565 footprints, 59 height tags, 1,052 floor-count estimates and 18,454 unknown heights. These are bounded local coverage, not a complete building inventory for each region. Ranong's two places have only six and two mapped footprints. Absence of a footprint does not establish open ground.

Unknown source heights stay null. The owner explicitly chose labelled 3 m visual massing for those buildings. Floor counts assume 3 m per storey; neither those estimates nor source height tags have been surveyed here. Buildings are context, never certified refuges. MapLibre native extrusions share its terrain depth buffer; base zero is relative to native terrain, without adding a second absolute DEM offset. 2D mode retains footprint outlines.

The 1.65 m eye camera follows available native DEM elevation. Source street nodes outside mapped footprints provide generic starting references, not approved evacuation paths. Camera steps and turns explore the scene; there is no collision detection, kerb/door/stair survey, water-person coupling or new route recommendation. Manual panning/zooming exits fixed-eye mode. The Bang Niang route rehearsal, point queues, planner, drill records, research and bilingual manual remain available.

The repaired generator rejects unclosed, incomplete, degenerate and crossing rings instead of inventing closure or joining across missing nodes. It parses supported height units strictly and counts only emitted features. Raw SHA-256, actual retrieval receipts, source URLs, original way IDs, query bounds and geometry bounds remain distinct. Whole source ways can extend beyond query bounds. Unsupported building relations are reported rather than rendered incorrectly. OSM attribution and ODbL links accompany the data.

## Reproduction

Node.js and Python 3 are required. No additional Python packages are needed.

```sh
python3 scripts/collect-buildings.py
python3 scripts/prepare-buildings.py RAW.json --area AREA --retrieved-at ISO_TIMESTAMP --output OUTPUT.json
npm test
npm run build
node scripts/check-contrast.mjs
```

Collection uses the official OSM map API, bounded concurrency, retries and local cache receipts. Verify cache SHA and request URL before reuse. `public/data/buildings-index.json` lists the published packs; `building-areas.json` records collection bounds. The frontend fetches only the selected place and aborts stale requests.

## Audit fixes

Disconnected instruments no longer display invented online readings. The compact Thai/English source catalogue preserves all four source records and their qualifications; the 390 px English page fell from 1,575 to 1,162 px. Overstated evacuation/physics claims were replaced with qualified planning language.

Walkthrough testing found that MapLibre's `easeTo` ignored the elevation returned by `calculateCameraOptionsFromTo`, leaving the hillside camera underground. Both eye alignments now use `jumpTo` and retry when terrain tiles settle. Endpoint markers are hidden in eye mode, circle sizes remain viewport-scaled, and route arrows show only forward chainage. The verified lesson is stored at `Scars/Debug-Logs/2026-10-28-maplibre-eye-camera-must-apply-returned-elevation-with-jumpto.md` in the shared memory vault.

## Verification

- All 31 JavaScript and 10 Python tests passed, including geometry rejection, unit conversion, height provenance, all 17 packs, source street references, queue conservation, hazard boundaries and research accounting.
- Production build and six contrast checks passed. The existing large MapLibre bundle warning remains.
- `design/buildings-all-areas.json`: browser selection trial across all 17 places, each showing its own pack identity.
- `design/buildings-geometry.json`: all 14 unchanged node-contract cases pass, including 360/390/1024/1280/1440 widths, water and expanded qualifications.
- `design/buildings-walk-geometry.json`: 360 px phone map 300 px high, caption 43.6 px, camera controls 50.8 px; 1024 px tablet map 353.3 px, caption 24.8 px, controls 30 px. Neither view overflows.
- Current visual evidence: `evidence/buildings-free-walk-360.png`, `buildings-free-walk-1024.png`, `buildings-phuket-2d-fixed.png`, `buildings-phuket-flyover-fixed.png`, `buildings-walk-endpoint-corrected.png`. Earlier uncorrected images are fault evidence, not passing results.
- Independent reviewer closed all source, camera, provenance and geometry findings. The same current geometry budgets reject the preserved oversized-layout fault with eight violations. Browser trial also exercised camera movement/turning, building off/on and return to 2D. Live release receipt follows below.

Real evacuation guidance and predictions still require validated local hazard fields, surveyed accessible routes, authority-approved destinations and field/user validation. None of those are inferred from building massing or coarse terrain.
