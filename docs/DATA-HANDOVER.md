# Author and authority data handover

The published PDF is enough to build a comparison and preparation tool. The following inputs are required to operate a verified evacuation system or reproduce the model.

| Dataset | Minimum fields / files | Acceptance |
|---|---|---|
| Unity model | Unity version, packages, assets, source, scenario config, random seed handling, run commands | Reproduce baseline and delayed package runs; document aggregation and run variation |
| Study environment | CRS, licensed GeoJSON/GeoPackage for roads, sidewalks, crossings, buildings and bottlenecks | Geometry validated; sources and acquisition dates recorded; known closures/access constraints |
| Hazard model | Source earthquake, model version, timed inundation grids, vertical datum, uncertainty and license | Author and authority review; never substitute an OSM coastline for flood extent |
| Approved destinations | id, official name, geometry, horizontal/vertical type, authority, approved date, capacity, owner/access agreement, opening arrangements | Responsible agency validates every public record; candidates remain clearly separated |
| Routes | origin zone, approved destination, connected walking geometry, surface/grade/steps, crossings, closures, assistance constraints, review date | Walked in the field by local users; no straight-line routing used as evacuation guidance |
| Warning infrastructure | tower points, coverage method, channel, last test date, responsible operator | Verify rather than assume a circular 1km service area |
| Signs | id, point, direction, destination, languages, visibility/access check, photograph rights, audit date | Validate continuity with a first-time visitor, day and night |
| Survey parameters | anonymized distributions, weighting, sampling dates, consent/license limits | No respondent identifiers; clarify Table 3 vs §4.3 pedestrian percentages |
| Simulation outputs | run id, scenario id, seed, elapsed time, counts in each outcome state, definition of “victim” | Counts reconcile to population; parameters and model revision accompany each result |

## Admission rule

Each imported record carries source, tier, owner, reviewedAt and validUntil where appropriate. Operational records require authority approval and provenance. Missing, proposed and stale are distinct states. No record becomes an approved destination merely because an OSM feature, paper figure or model candidate exists.

## Integration order

First reproduce the author's results; then import validated local GIS; then validate public wording and routes with field participants; finally agree maintenance and official warning integration. This prevents a persuasive map from being mistaken for certified guidance.
