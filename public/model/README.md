# Bang Niang ink model

`bang-niang.bin.gz` is a versioned local illustration built from the published `data/buildings-khao-lak-2.json` and the matching historical OSM map snapshot. Its compressed header records the snapshot URL, retrieval date, SHA256 and sources. OSM data © OpenStreetMap contributors, ODbL. No satellite imagery or Rokehan exports are copied.

Rebuild: `npx tsx scripts/bake-manga-model.ts`. This requires the matching historical `.cache/buildings-khao-lak-2.raw.json` and receipt, not a silently refreshed live OSM response. The script verifies the raw checksum against both receipt and building pack. A fresh clone can use the committed binary; do not claim an exact historical rebuild without the archived raw snapshot.

Coordinates are a local geographic approximation, quantized to0.25m storage increments; this resolution is not positional accuracy. Decode as bbox minimum + integer×q. Source heights alone may draw volume; all1196current footprints lack explicit heights and remain flat outlines. Roof readings retain separate dated provenance and do not supply altitude. Ground is flat. Sea/pedestrian paths are omitted. Road/waterway widths and lighting are schematic. Free camera movement is not a walkability, navigation, refuge or hazard model.
