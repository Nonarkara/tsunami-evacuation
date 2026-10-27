# Terrain and crowd rehearsal

Release scope, 27 October 2026: genuine MapLibre GL JS terrain over Esri imagery; separate static terrain-water screening and a deterministic synthetic crowd exercise. This is a planning and research prototype, not emergency routing, an operational flood model or a Unity ABMS port.

## Geographic evidence

The 3D relief uses Mapzen Terrain Tiles on AWS, Terrarium encoding, at 1× vertical scale. The MapLibre worker is bundled explicitly through Vite; module-relative worker discovery failed in the Vite development bundle. Both the worker and its shared imports are built into same-origin assets. WebGL initialization/source errors and an 18-second loading timeout expose the existing Leaflet 2D fallback. Terrain and imagery require network access; no offline basemap is claimed.

The screening grid (`public/data/terrain.json`) covers 98.22–98.31 E, 8.62–8.80 N with 101×201 samples (~100 m spacing), decoded from six z12 Terrarium tiles accessed 2026-10-27. The input raster is not the researchers' terrain or inundation grid. No elevation accuracy sufficient for evacuation safety is claimed.

For a selected static level, a four-neighbor flood fill starts at cells on the western grid edge below that level. Blue polygons represent only those connected low cells. The experiment omits tsunami dynamics, arrival time, run-up, wave/debris force, tide, structures, channels, protective works and DEM uncertainty. It does not affect agents or calculate casualties. Unshaded land is not classified safe.

## Mapped routes

`public/data/rehearsal-routes.json` derives three walking approaches from the public OpenStreetMap API snapshot at `https://api.openstreetmap.org/api/0.6/map.json?bbox=98.235,8.655,98.285,8.68`, accessed 2026-10-27. It retains source OSM node and way IDs. Explicitly private/forbidden foot access, motorways and construction/proposed ways are excluded. Remaining mapped access is not field-verified. The largest connected component and distance-based shortest-path tree give reproducible paths, not optimal emergency routes.

The approaches converge on an inland network endpoint at 8.6726929 N, 98.2839914 E selected for this exercise. Its DEM height is approximately 94 m, which does **not** certify refuge suitability. The three routes are approximately 4.47, 4.52 and 5.02 km. Neither endpoint nor any route is approved for emergency use. They are intentionally independent of the approximate regional place markers.

OSM data © OpenStreetMap contributors, ODbL. The distributed derived route database is available under ODbL; preserve attribution and share-alike requirements. Terrain provenance and attribution links are in the map and `public/data/README.md`.

## Queue model

Each synthetic person has a route and release time. Moving points follow the exact route segment; waiting people are aggregated by status and network node. The three approaches release one person per 0.15 seconds. At each node, arrivals are sorted by arrival time then ID. A link admits people at `1.2 × assumed width` people/second; admitted people traverse at the selected constant speed. The next node receives that person's exit time. Shared downstream links therefore merge the approach queues. A selected shared link is the experimental pinch point (amber point), not a surveyed obstruction. Other widths default to 6 m; pinch width is 1, 2 or 6 m. Pace is 0.8, 1.4 or 2.4 m/s; running is a sensitivity input, not advice. Crowds are 500, 1,500 or 5,000.

This is an uncalibrated FIFO point-queue model: no collisions, finite link storage, queue spillback, density-dependent speed, slope penalty, mobility mix, panic, overtaking, injury or water interaction. Moving people are white points. Gray release groups and amber queue groups are weighted totals at exact model nodes. No invented offsets, crowd rings or physical queue footprints are drawn. Click a group to read its count below the map; the Queue action selects the experimental pinch point. Counts conserve released/walking/queued/arrived people; elapsed time is exercise time, never a tsunami countdown.

Profile horizontal spacing uses cumulative geodesic road distance; visible start/end/min/max DEM values are approximate. The route-follow camera follows one early synthetic pedestrian, not a person’s live location.

## Reproduction and validation

`python3 scripts/prepare-rehearsal.py /path/to/saved-osm-map.json` regenerates paths; `python3 scripts/prepare-terrain.py` downloads and decodes the terrain snapshot (Pillow required). No public API is called when running the crowd exercise. Basemap and DEM tile requests go directly to credited providers; no location permission or personal upload is used.

`npm test` covers source-path fidelity, queue ordering/capacity, conservation, completion, walking-speed sensitivity, bottleneck sensitivity and disconnected terrain depressions. Geometry contracts, real viewport captures and independent review dispositions are documented in `TERRAIN-VERIFICATION.md`. The paper's scenario values retain their original denominator and historical scope.

## Required research handover

Actual tsunami inundation playback needs a georeferenced, time-indexed scenario depth/velocity grid with units, datum, tide, resolution, source and uncertainty. Useful evacuation recommendations additionally need surveyed walking connections, gates/crossings, accessible assistance plans and authority-approved refuge locations, capacities and access. The original Unity project/parameter files would support a validated model port. None were supplied with the preprint.

Primary technical references: [MapLibre terrain](https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/), [AWS terrain registry](https://registry.opendata.aws/terrain-tiles/), [Mapzen source attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md), [OpenStreetMap copyright and ODbL](https://www.openstreetmap.org/copyright). Research: [SSRN 7270357](https://ssrn.com/abstract=7270357).
