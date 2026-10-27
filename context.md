# Khao Lak Tsunami Preparedness

Task: turn the supplied Khao Lak evacuation preprint into a useful public planning and learning tool, at tsunami.nonarkara.org, with a detailed GitHub repository.

Invariant: published outcomes always retain their scenario, denominator and source; affected + reached site + outside affected area = 100% only where all three outcomes are reported. No computed outcome may masquerade as a Unity ABMS result.

Design Read: a coastal field atlas that lets a visitor locate the study and a planner see which combination of measures changes the published outcome.
Reference: the 1972 Vignelli New York subway diagram for geographic orientation and differentiated line roles; Braun ET66 for the single amber action accent.
Dominance: geographic map on Explore, personal plan on Prepare, protocol sequence on Drill, source ledger on Research. Map and side panel use a 2:1 composition. Map line roles: basemap roads, numbered location markers, solid active place outline; no simulated hazard shapes.

Foundation: React 19 + TypeScript + Vite, Leaflet, self-hosted Jost; vendored Axiom Design Core tokens (MIT), source revision recorded in docs/ARCHITECTURE.md. Neutral map tiles by CARTO, data by OpenStreetMap. Axiom components were assessed; small semantic native controls avoid a component build dependency. No backend or account is needed for personal plans; save is explicit and on-device. No analytics or personal data upload.

Status: research-informed planning pilot, not an alert service, routing engine or port of the Unity simulation. No verified refuge/hazard GIS or original model supplied. Do not publish the full preprint without redistribution permission. Cite and link SSRN.

Commands: npm install; npm test; npm run build; npm run dev.
