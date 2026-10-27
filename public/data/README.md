# Rehearsal data provenance

Accessed 27 October 2026. No personal data.

- `rehearsal-routes.json`: derived walking paths, node and way IDs from OpenStreetMap API0.6. © OpenStreetMap contributors. Derived route database licensed under Open Data Commons Open Database License (ODbL)1.0: https://opendatacommons.org/licenses/odbl/1-0/ . Attribution: https://www.openstreetmap.org/copyright . API query and method in docs/TERRAIN-REHEARSAL.md; regenerate with scripts/prepare-rehearsal.py. Access and endpoint suitability unverified.
- `terrain.json`: grid sampled from Mapzen Terrain Tiles on AWS, Terrarium z12, not an author-supplied inundation model. Registry: https://registry.opendata.aws/terrain-tiles/ . Source-specific credits/license details: https://github.com/tilezen/joerd/blob/master/docs/attribution.md . This area uses the global elevation mosaic; do not attribute it solely to Copernicus or GISTDA. Regenerate with scripts/prepare-terrain.py.

No elevation threshold or route in these files certifies tsunami safety. Static low-terrain screening is not a modeled inundation extent.
