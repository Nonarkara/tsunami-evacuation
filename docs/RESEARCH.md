# Soonami (สู้-nami) — Research Extraction & Dr. Non's Translation

Bibliographic correction, checked 27 October 2026: SSRN lists this preprint as posted 12 August 2026, with authors Trumikaborworn, Warnitchai and Latcharote. Earlier site versions incorrectly used 2024. The supplied manuscript is explicitly not peer reviewed. The bilingual research section and review record are documented in [BILINGUAL-RESEARCH.md](BILINGUAL-RESEARCH.md).

Conceived and directed by **Dr. Non Arkaraprasertkul (Dr. Non)**, Senior Urban Disaster Resilience & Smart City Specialist.

- **Soo (สู้)**: Fight, persist, actively reject complacency and fatalism.
- **Soon**: An earthquake in the Andaman subduction zone can rupture at any moment—readiness must be constant.

Source research paper:
*Trumikaborworn, N., Warnitchai, P., & Latcharote, P. (2026). Agent-Based Modeling and Simulation for Identifying Effective Measures on Tsunami Evacuation in Khao Lak, Thailand. Asian Institute of Technology & Mahidol University. SSRN 7270357.* Link: https://ssrn.com/abstract=7270357

## Dr. Non's Executive Scientific Translation

1. **Congestion in the source model**: The baseline victim shares are 21.8% and 22.6% under baseline and delayed timing. These are modeled outcomes, not a count of observed deaths or a prediction for an individual.
2. **PD50**: Increased pedestrian preference to 50% yields 7.0% baseline modeled victims. PD50 does not mean 100% walking or a universal ban on assisted transport.
3. **VS14**: The authors evaluate 14 additional candidate reinforced concrete buildings. They are not certified public refuges; adding candidates yields 3.7% in the cumulative baseline package.
4. **VE50 + SG135**: Increased vertical preference and 135 signs yield 1.2% baseline / 2.9% delayed modeled victims. Actual drills, signs and accessible assistance need local planning.

## Geographic scope

The original model covers Khao Lak. Other regional markers provide geographic orientation only; the paper does not validate evacuation routes, travel times, refuges or nationwide warning times for those areas.
1. **Phang Nga**: Original study region. Its modeled shore arrival is 135 minutes in one earthquake scenario, not a real-event countdown.
2. **Phuket**: Geographic context; local routes and destinations need authority confirmation.
3. **Krabi**: Geographic context; island routes and refuge access need field verification.
4. **Satun & Trang**: Geographic context; no validated local simulation is supplied.
5. **Ranong**: Geographic context; no local hazard envelope or approved refuge inventory is supplied.
6. **Gulf of Thailand**: Geographic context; no warning-time guarantee is inferred from basin geography.

## Instrument catalogue and terrain sources

The Satellite tab is an integration catalogue, not connected telemetry. It provides no current buoy observation, tide reading, SAR flood extent or live warning.
- **Buoys and tide gauges** require verified instrument identity, timestamps, units and a working adapter before live display.
- **SAR** is a possible flood-mapping source, not a connected current observation here.
- **Terrain** now uses Mapzen Terrain Tiles, with source attribution, at 1× relief. The local static screening grid is sampled at roughly 100 m; it is not a Copernicus survey or the authors’ hydrodynamic model.
- **No safe contour**: A 15 m contour, floor count or nearest concrete building cannot establish safety. Earlier unsupported contour/certification/ETA claims have been superseded by this correction.

The new crowd rehearsal is a separate deterministic point-queue exercise on an OSM snapshot, not a port of the original Unity model. See [terrain and crowd method](TERRAIN-REHEARSAL.md).

Transcription date: 27 October 2026. Data tier: historical modeled results, not observations, current warning performance or individual probability.

## Published cumulative outcomes

| Package | Baseline timing: victims % | Delayed conditions: victims % | Source |
|---|---:|---:|---|
| Study baseline | 21.8 | 22.6 | §4.1–4.2 |
| PD50 | 7.0 | 10.6 | §4.3; §4.5 |
| PD50 + VS14 | 3.7 | 5.6 | §4.5 |
| PD50 + VS14 + VE50 | 1.3 | 3.4 | §4.5 |
| PD50 + VS14 + VE50 + SG135 | 1.2 | 2.9 | §4.5 |

PD50 = authors' pedestrian-promotion scenario. VS14 = 14 additional candidate vertical buildings on top of two existing sites. VE50 = 50% vertical preference scenario. SG135 = a total of 135 signs, up from 64. These are source scenario names, not independently validated parameter settings.

Population: 39,041 modeled agents, 61% local, 39% tourist. Estimated from building footprints/types (Table 1); not a current census. Baseline warning issuance = 30 minutes after modeled earthquake and mean preparation = 14 minutes. Delayed variant = 45 and 28 minutes. Outside modeled tower coverage, the paper adds a 15-minute warning delay (§3.1.1). The browser does not simulate this spatial variation.

## Accounting

At baseline: 60.7% reach a site, 21.8% are victims and 17.5% remain outside the affected area without reaching a site. With all measures: 93.6% reach a site, 1.2% victims, residual 5.2% outside affected area. Delayed baseline: 56.8%, 22.6%, residual 20.6%; delayed full package: 88.9%, 2.9%, residual 8.2%. Residuals are computed by subtraction to one decimal place, following the categories described in §4.1. No invented complete breakdown is offered for intermediate packages.

Relative reduction is arithmetic on the reported rates: 1 - package victim share / same-condition baseline victim share. It is not a new simulation or causal guarantee for future events.

## Author clarification needed

Table 3 places 25% pedestrian preference in several intervention columns. §4.3 gives 27% as the baseline and defines PD50. The browser uses named packages and does not expose a continuous pedestrian slider or infer unreported combinations. Confirm exact parameter files and population-weighting with the authors before reproducing the simulation.

The paper's 135-minute shore arrival is specific to its source earthquake/inundation scenario. The personal walking tool never uses it as a deadline. Local social preferences/geography require calibration before transferring the model to another community (§5).

## Public safety references checked

- https://www.weather.gov/safety/tsunami-before
- https://www.weather.gov/safety/tsunami-during
- https://www.disaster.go.th/home
- https://www.tmd.go.th/en/CAP

Checked 27 October 2026. General guidance is attributed; Thai authority instructions take priority. Links are not a connected real-time alert feed.
