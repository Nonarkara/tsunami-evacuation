# Khao Lak Tsunami Preparedness

Task: turn the supplied Khao Lak evacuation preprint into a useful public planning and learning tool, at tsunami.nonarkara.org, with a detailed GitHub repository.

Invariant: published outcomes always retain their scenario, denominator and source; affected + reached site + outside affected area = 100% only where all three outcomes are reported. No computed outcome may masquerade as a Unity ABMS result.

Design Read: a coastal field atlas that lets a visitor locate the study and a planner see which combination of measures changes the published outcome.
Reference: the 1972 Vignelli New York subway diagram for geographic orientation and differentiated line roles; Braun ET66 for the single amber action accent.
Dominance: geographic map on Explore, personal plan on Prepare, protocol sequence on Drill, source ledger on Research. Map and side panel use a 2:1 composition. Map line roles: basemap roads, numbered location markers, solid active place outline; no simulated hazard shapes.

Foundation: React 19 + TypeScript + Vite, Leaflet, self-hosted Jost; vendored Axiom Design Core tokens (MIT), source revision recorded in docs/ARCHITECTURE.md. OpenStreetMap tiles and data with neutral rendering. Axiom components were assessed; small semantic native controls avoid a component build dependency. No backend or account is needed for personal plans; save is explicit and on-device. No analytics or personal data upload.

Status: research-informed planning pilot, not an alert service, routing engine or port of the Unity simulation. No verified refuge/hazard GIS or original model supplied. Do not publish the full preprint without redistribution permission. Cite and link SSRN.

## Dhaka panel design read (2026-10-30)
Provenance-first flood planning demonstrator for Dhaka: imported features (OSM network, FFWC river stations, DDM shelter inventory) are shown unlocated until geometry is verified; every feature carries source, retrieval date, licence, geometry method, verification status and limitations. Timing and queue analysis run only as labelled exercise scenarios over unvalidated mapped features — "time to destination" is the claim, "time to safety" is not.

Reference: Braun ET66 for the single amber action accent; Sanzo Wada Plate 002 (Yellow Orange #f99d1b dominant, Dark Tyrian Blue #12354e counter) for field/rule roles; house signal accent amber #f59e0b reserved for live signal only. No new invented colours — new Dhaka CSS reuses existing style.css tokens only.

Dominance: provenance panel and shelter readiness register on the Dhaka tab, one dominant element per section, no 50/50 splits. Line weights differ by role: 1px rules for provenance lists, 2px for section headers, no uniform hairline grid.

Commands: npm install; npm test; npm run build; npm run dev.

Canonical deployment: Cloudflare Worker Static Assets at https://tsunami.nonarkara.org/; see docs/DEPLOYMENT.md. Sites remains the explicitly dated initial public snapshot. Use npm run deploy for canonical releases.
