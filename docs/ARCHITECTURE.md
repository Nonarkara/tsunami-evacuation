# Architecture and framework choice

## Decision

A static React 19 + TypeScript + Vite application, Leaflet for geographic orientation. Static assets are built into dist/ and hosted at the canonical hostname through Cloudflare Workers Static Assets. This avoids an always-on server, paid inference, accounts, collection of personal plans and unmaintained data ingestion. It is a planning pilot, not an emergency dispatch platform.

Existing frameworks assessed:

- **Axiom Design Core**: retained the token foundation under MIT. The vendored snapshot is 020f8fb55cc21a672b19be9f474008871e7a7e98. Its global font loader is disabled in favor of self-hosted Jost; project tokens override typography, Palette roles and amber action color. The current workspace law takes precedence over older Axiom defaults. Small semantic native controls avoid coupling to a separate component-package build.
- **Palette**: Plate 002 relationship and source attribution reused; see PALETTE.md. Color is role-based, not hazard coding.
- **Shared earth-observation capability**: available in the workspace but not used. Earthquake observations alone cannot determine local tsunami risk or supply an evacuation order. Adding a feed would create an unsupported inference unless an official alert source and operating responsibility were agreed.
- **Unity ABMS**: original engine described by the paper, not supplied. The browser preserves published scenario outcomes. It does not approximate or claim parity with the author model.
- **Next.js / Vinext**: assessed; not needed for local forms, fixed research results or map browsing. A server would add maintenance without supplying missing authoritative GIS or model outputs.

## Modules

- src/research.ts: transcribed, typed results; outcome accounting; plan validation; walking arithmetic; drill boundary validation.
- src/Map.tsx: interactive Leaflet map, reference area markers, geographic fallback message and keyboard alternative.
- src/main.tsx: four task views, semantic controls, emergency guidance, opt-in local plan persistence, downloads and print representations. Form panes stay mounted when hidden, preserving in-memory entries across tabs.
- src/style.css: responsive compositions, project overrides of Axiom tokens, Palette color roles, reduced motion and print styles.
- src/research.test.ts: source-series fidelity, outcome accounting, corrupt saved-plan rejection, time and drill validation.
- public/: metadata, safe response headers and upstream notices.

## Data paths

Research constants -> scenario selector -> numeric result and proportional bars.
Plan fields -> React memory -> explicit save to localStorage OR JSON download OR print. Nothing is sent to a server.
Drill fields -> validated counts -> JSON download and complete print protocol. No names or contact records are requested for participants.
Map -> OpenStreetMap tile service. No geolocation requested. No routing, shelter recommendation or hazard polygons are fabricated.

## Privacy and network boundary

No backend, analytics, paid API key, user account, personal-data endpoint or background location collection. Browser tile requests expose ordinary network metadata to OpenStreetMap; this is disclosed in the app. Hosting providers may maintain their ordinary access logs. Optional local storage can be read by another person using the same browser profile. The app provides a removal action.

## Build and release

Node 22+, npm ci, npm test, npm run build. The hosting manifest binds the exact opaque Site project ID. Use the supported Sites source workflow to push/package the same commit before saving/deploying. GitHub is the human-facing code mirror; both remotes must point to the released source state. Do not put short-lived credentials into manifests, Git remotes, files, logs or commits.

## Intentional limits

No live alerts; no original simulator; no verified routes/refuges/hazard polygons; no current occupancy or capacity; no promise of personal survival; no synchronized team record store. English working interface plus brief Thai emergency guidance; a full independently reviewed Thai interface remains future work. No offline PWA cache: a stale emergency shell must not quietly masquerade as current information. Print/download plans for use without connectivity.

Canonical deployment moved to native Cloudflare Worker Static Assets because the Sites custom-domain path required unavailable DNS-edit scope. The Sites version remains an explicitly dated snapshot. See DEPLOYMENT.md for the exact release command and synchronization boundary.

## Terrain/crowd addition — 27 October 2026

MapLibre GL JS6.16 renders real Terrarium DEM terrain at1× relief over credited imagery. Its module worker is explicitly bundled via Vite, with same-origin worker policy. Leaflet remains a 2D reference fallback. `TerrainRehearsal.tsx` owns camera and experiment state; `crowd.ts` implements the pure FIFO point-queue exercise and separate static terrain-screening function. Derived OSM paths and a coarse DEM grid are local public snapshots; no person or personal plan is transmitted. Crowd and water experiments do not interact and do not reproduce Unity ABMS outputs. Full method, provenance and missing research inputs are in `TERRAIN-REHEARSAL.md`.
