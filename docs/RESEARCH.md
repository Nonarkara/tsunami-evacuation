# Soonami (สู้-nami) — Research Extraction & Dr. Non's Translation

Conceived and directed by **Dr. Non Arkaraprasertkul (Dr. Non)**, Senior Urban Disaster Resilience & Smart City Specialist.

- **Soo (สู้)**: Fight, persist, actively reject complacency and fatalism.
- **Soon**: An earthquake in the Andaman subduction zone can rupture at any moment—readiness must be constant.

Source research paper:
*Trumikaborworn, N., Latcharote, P., & Warnitchai, P. (2024). Agent-Based Modeling and Simulation for Identifying Effective Measures on Tsunami Evacuation in Khao Lak, Thailand. Asian Institute of Technology & Mahidol University. SSRN 7270357.* Link: https://ssrn.com/abstract=7270357

## Dr. Non's Executive Scientific Translation

1. **The Brutal Truth About Cars**: Standard vehicular evacuation caused 21.8% to 22.6% casualties (over 8,500 people dead out of 39,041 modeled agents). Highway 4 reaches complete gridlock within 14 minutes. In an evacuation, a private automobile is a two-ton metal trap.
2. **The Immediate 68% Win**: Banning cars and shifting to mandatory walking drops casualties to 7.0%. Pedestrians cannot be jammed by stationary cars and maintain continuous lateral movement.
3. **Vertical Evacuation Refuges (VS14)**: Designating 14 reinforced multi-story buildings within 200–400m drops casualties to 3.7%.
4. **Drills & Multilingual Signs (VE50 + SG135)**: Rehearsing stair access and installing 135 continuous route signs closes the survival gap, cutting casualties to 1.2% (a 94% overall reduction).

## Nationwide Expansion

Soonami expands the empirical Khao Lak findings across all vulnerable coastal zones in Thailand:
1. **Phang Nga (Khao Lak & Takua Pa)**: High wave run-up (8–15m), ETA 125m, Highway 4 choke point.
2. **Phuket (West Coast Beaches)**: Extreme tourist density (Patong, Karon, Kata, Kamala, Bang Tao). Mandatory stair dispersal into hotel high-rises.
3. **Krabi (Phi Phi & Ao Nang / Railay)**: Ton Sai sandspit dual-wave hazard; zero-vehicle rule; immediate climb to Viewpoints 1 & 2 (>100m).
4. **Satun & Trang (Ko Lanta & Tarutao Archipelago)**: Island central high-ground egress (>25m).
5. **Ranong (Laem Son & Koh Phayam)**: Northern Andaman subduction direct line.
6. **Gulf of Thailand (Hua Hin, Samui, Pattaya, Songkhla)**: Secondary/distant seismic surge (Manila Trench origin), 8–12 hours warning time, shallow Sunda shelf damping.

## FloodDash Sensor & Meteorological Telemetry

Ingested via the FloodDash architecture (`flood.nonarkara.org`):
- **DART Buoy 23401 (Andaman Sea)**: Deep ocean bottom pressure recorder for pre-shelf wave train detection.
- **RTN Tide Gauge Network**: Ko Taphao Noi (Phuket), Similan, Tarutao, Hua Hin.
- **Copernicus 30m Coastal DEM**: Identifies the 15-meter safe elevation contour line.
- **Sentinel-1 SAR Radar**: Cloud-penetrating all-weather coastal flood envelope mapping.

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
