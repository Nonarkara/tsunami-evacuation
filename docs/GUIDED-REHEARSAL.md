# Guided terrain rehearsal

27 October 2026. This release adds one warning-relative clock to the existing Bang Niang network exercise, route arrows, aerial following and an approximate eye-height terrain camera. 2D and 3D share their layers and playback. A selected preparation delay shifts release without losing people. The direction cue follows sourced route chainage; it does not choose a safe route. The endpoint remains unapproved. Moving points stay on the modeled network; waiting totals remain at exact nodes, with no invented physical crowd footprint.

The map remains independent of the evidence/profile height. Controls, warning clock and counts remain adjacent. Palette Plate 002 is retained. Walk-through is satellite imagery draped over a coarse DEM: it cannot show street detail, doors, stairs or traversable ground. Fly-by follows the first synthetic walker on the selected route; other people may still be en route when that walker arrives.

## Water and scientific boundary

The optional animated water rise is a user-chosen, smooth illustrative MSL level over connected low terrain. It is not a tsunami wave, arrival forecast, hydrodynamic solver or evacuation deadline. Agents do not respond to water. Depth, absolute surface elevation and crest-to-trough wave height are separate quantities. No gauge wave height is inferred from the terrain or a slider.

A local JSON research replay can supply time-indexed inundation depths, ground levels and an explicitly defined wave-height gauge. The file is read on the device; it is not uploaded or automatically saved. Imported material is visibly unverified. Null is unknown, never dry or safe. Exact sample times retain their own known values even when adjacent samples are unknown; interpolation requires two known endpoints. Outside the supplied time range there is no frame. Without model ground levels, only the depth footprint is displayed; a 3D absolute surface is not fabricated from an unrelated DEM.

## Add another area

Register an area in `src/rehearsal.ts` with its ID, bounds, source, and optional routes/terrain/hazard URLs. The current walking network covers Bang Niang only. Other geographic selections retain their terrain view and do not inherit Bang Niang directions. Routes, destination approval and hazard coverage must be supplied independently for each location. The registry currently cannot certify a destination: its status is explicitly unapproved.

Use [the JSON schema](../public/data/hazard-replay.schema.json), runtime parser and tests as the interchange contract. Fields include area ID, title, HTTPS source reference, model, license, warning-relative seconds, EPSG:4326 cell-edge bounds, north-to-south rows, MSL datum and depths in metres. Ground elevation must come from the same model and datum. A gauge needs its location and crest-to-trough definition. Convert earthquake-relative outputs using the documented warning offset before import. Current limits: 10MB input, 16,384 cells, 120 frames, seven days; subset and resample larger scientific outputs without inventing precision. See [data handover](DATA-HANDOVER.md) for original-model and approval requirements.

## Public-source expansion

- [GeoClaw tsunami data guidance](https://www.clawpack.org/tsunamidata.html): terrain/bathymetry, earthquake deformation and observation sources. Running and validating a solver is separate work; GeoClaw is not running in this browser.
- [GEBCO gridded bathymetry](https://www.gebco.net/data-products/gridded-bathymetry-data): public global bathymetry is useful for model preparation, but does not replace surveyed local terrain or shoreline validation.
- [NOAA historical tsunami observations](https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/tsunamis): historical runup and gauge evidence can support hindcast validation; it is not a live forecast.

These are candidate integrations, not connected feeds. Public data can broaden coverage; claims of better predictions require hindcasts, uncertainty assessment and independent comparison with observations.

[FLUX.1-schnell](https://huggingface.co/black-forest-labs/FLUX.1-schnell) is a text-to-image model. Its model card says it is not intended or able to provide factual information. It can support explicitly illustrated learning material, but must not supply factual coastlines, inundation geometry, routes or forecast images. This release does not duplicate Claude's download or introduce generative imagery into the geographic simulation.

## Verification

23 automated tests passed, including preparation delay, forward arrows, route-following/queued cameras, data-region isolation, strict replay input and exact-time no-data regression. Production compilation/build and all six contrast roles passed. Real-browser checks exercised Walk-through → 2D → Queue, local import/removal using an explicitly synthetic format-only file (not shipped), and warning-relative water rise with moving agents. Screenshots in `docs/evidence/guide-*.png` record phone, 2D, walk and water states.

Independent reviewer `guided_rehearsal_review` closed the exact-time missing-data bug, 2D Overview/Queue camera tilt and paused-walk terrain readiness retry. Code and four saved screenshot reviews found no remaining blockers. The coarse walk-camera qualification must remain. Geometry results and canonical live verification are recorded with the release receipt.

All 14 current geometry cases passed unchanged `design/node-contract.json` budgets, including 360×800, 390×844, 1024×768, 1280×720 and 1440×900 with expanded source states. Actual DOM measurements are in `design/guide-captures.json`; the result is `design/guide-result.json`. Re-evaluating the preserved old oversized-layout fault against the current same budgets still fails (eight violations; `design/guide-fault-result.json`). No budgets were widened. The warning-start browser trial with a 60-second preparation delay showed all 1,500 people awaiting release, zero walking and a shifted last-arrival time.

## Canonical release receipt

Source commit `17ad580`; Worker version `87a82993-389b-46f2-acbc-e1739bddd6d9`. `npm run deploy` passed 23 tests, TypeScript/Vite build and six contrast checks, then published to https://tsunami.nonarkara.org/. The HTML, main JavaScript, CSS, MapLibre worker, JSON schema, route pack and terrain grid matched local production SHA-256 bytes through normal TLS (`design/guide-live-assets.json`). Python urllib received an HTTP 403; ordinary curl and the real browser succeeded without bypassing security protections.

The public browser exercised Walk-through, 2D Overview, start/pause playback and 3D illustrative water rise under production CSP. No console errors were captured. Live screenshots: `guide-live-walk.png` and `guide-live-water.png`. The local region-switch trial confirmed Phuket shows terrain-only coverage and no Bang Niang route/destination pack. No physical flood solver or approved evacuation guidance was added, and no original Unity result was recomputed. The only shipped area network remains Bang Niang. Existing large MapLibre bundle warning remains a performance limitation, especially on cheap phones.

Three additional real-browser canonical checks passed at 390×844, 1024×768 and 1440×900 (`design/guide-live-geometry.json`). These check the declared task budgets; the independent visual review remains separately recorded above.
