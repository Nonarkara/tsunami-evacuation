# Roof shapes, stated and read — 6 November 2026

**Asked:** *"Roof shapes read from the aerial imagery (gable vs flat) and rendered, because the
scale requires that we see roof details too."*

Two facts set the ceiling before anything was built, both verified again here:

- **Esri World Imagery has no z19 over Khao Lak.** Tiles at z19 and z20 over the exercise area
  are byte-identical (2,521 bytes, sha256 `9eafd300d613…`) — placeholders. z18 is 0.59 m/px and
  z17 is 1.18 m/px. A ten-metre house is about seventeen pixels across at z18, so most roofs
  cannot be read from that picture, and the earlier two-read agreement rule correctly refused
  to guess.
- **The published OpenStreetMap snapshot states some roofs outright.** The same snapshot the
  building pack was collected from carries `roof:shape` on seven ways — five `gabled`, one
  `pyramidal`, one `cone`. Those are source readings, not interpretations, and they are worth
  more than any guess from a 0.59 m/px image.

## Found

- The roof pack existed and the module was tested, but **nothing drew it**: no layer, no
  consumer in the interface. Six readings sat in a file that no page loaded.
- The pack held 60 corridor buildings, of which exactly one had been judged a gable — 1.7%
  coverage of the corridor, 0.08% of the 1,196 buildings in the area.
- The parser accepted only imagery provenance, so a stated source reading had nowhere to go.

## Changed

- **`scripts/harvest-osm-roofs.py`** records the shapes the snapshot states, with the tag, its
  value, the snapshot URL, its sha256 and its retrieval date. It merges into the existing pack,
  keeps the imagery readings, lets a stated reading replace an imagery reading for the same
  building, and is idempotent.
- **`src/roofshapes.ts`** now carries two kinds of provenance and keeps them apart: an imagery
  reading must have its imagery, a stated reading must have its snapshot receipt, and neither
  may borrow the other's. A roof shape may also be *pitched* — a slope with no single ridge,
  which is recorded but draws nothing.
- **`src/TerrainRehearsal.tsx`** loads the roof pack for the area in view and draws the ridge
  lines on the terrain: a dark ink dash with a light halo, so the ridge reads on any imagery
  without competing with the route.
- **The map key** states what the lines are, where the count comes from, and what they are not.

## Verified

- The pack: 67 records — 6 gable (5 stated by the source, 1 read from the aerial image),
  2 pitched, 59 explicitly not judged. Coverage 8 of 1,196 buildings in the area.
- 83 tests pass, 6 of them for the roof module: the two provenance kinds are kept apart, a
  record without its imagery or without its snapshot receipt is refused, a bad shape is
  refused, a footprint that is not the building's own polygon is refused, a reading for a
  building outside the area is refused, and the pack's own counts must agree with the readings
  it holds.
- The rendering, proven by pixels rather than by eye: a temporary build with the ridge layer in
  magenta painted 325 pixels in six strokes across the six gabled footprints, in the row of
  apartment units beside the walk start. The shipped style was then measured on the same
  frames — 1.4→3.0 px ink core with a light halo, dashed, because the ridge *direction* is
  derived from the footprint's long edge and not surveyed.
- The map key dialog keeps its bounds: 366×796 at 390, 900×688 at 1024, 900×688 at 1440, no
  internal scroll, no console errors. It grew by the size of the new paragraph and no more.
- Build clean, contrast all roles AA, and the five gate scripts pass.

## Remaining

- **Coverage is 8 of 1,196 buildings (0.7%).** The imagery cannot supply more at 0.59 m/px and
  the snapshot states only eight roofs. The map key says so in numbers rather than in a
  footnote.
- **The roof is drawn in plan, not in three dimensions.** These buildings have no sourced
  height, so the ridge shows where the ridge would sit seen from above; it is not an extruded
  roof, and the map key says that too.
- **The ridge direction is derived**, not read: the source states the roof shape, not its
  orientation, so the line runs along the footprint's long edge.
- Only the Bang Niang area has a roof pack. Other areas fetch none and draw none; an absent
  pack is not an error and nothing is claimed for them.
- A higher-resolution source would change this. There is none available over Khao Lak today.
