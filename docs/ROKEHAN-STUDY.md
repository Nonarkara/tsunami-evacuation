---
updated: 2026-11-05
drafted_by: codex/gpt-6
reviewed: false
---

# Rokehan study — manga-style 3D city walk-throughs

**Source:** https://tools.oyasumi-gamedev.com/rokehan/ ("どこでもロケハン", Location Scout)
**Maker:** MIYADAIKU / おやすみゲーム開発部 (Oyasumi Gamedev)
**Engine:** three.js (MIT)
**License for use:** Free in works, commercial and non-commercial. Exported files may not be redistributed or sold as-is. Attribution required on exported images (OSM contributors + elevation source + OpenMapTiles for distant views).

## What it does

Turns a real-world city block (OpenStreetMap buildings/roads/rivers + elevation) into a 3D scene drawn in Japanese manga style: line art with screentone shadowing. You can look at the city from above **and** drop to eye level to see detail all the way to the pavement. Files stay small enough to load quickly. Scenes are generated client-side from OSM / Terrain Tiles / OpenFreeMap; data is remembered in the browser for 7 days.

## Why it fits our walk-throughs

The tsunami app's current walk-through (`src/TerrainRehearsal.tsx`, MapLibre 3D) uses:
- Coarse DEM (~100 m spacing, Mapzen Terrarium)
- Esri satellite imagery draped over terrain
- OSM footprints; only explicit source height tags extrude under the4Novemberowner rule. Unknown and floor-estimated heights stay flat
- 1.65 m eye camera

That gives relief and route context but **no street-level detail** — no pavement, poles, signs, or building fronts. Rokehan supplies a generated illustration, including guessed heights and scene details. It does not fill the missing surveyed pavement, entrances or accessibility evidence. It is reference/illustration only, not surveyed evacuation geometry — which matches our existing boundary ("walk-through is satellite imagery over a coarse DEM; it cannot show street detail, doors, stairs or traversable ground").

## How to use it — URL parameters

The scene is driven by the hash. Example (sourced Bang Niang OSM camera node11707600483):

```
https://tools.oyasumi-gamedev.com/rokehan/
#ll=8.666894%2C98.2529673&s=100&tod=day&far=4&n=Bang+Niang
```

| Param | Meaning | Values |
|-------|---------|--------|
| `ll` | lat,lng (URL-encoded comma) | `8.666894%2C98.2529673` from OSM node11707600483 |
| `s` | scene size | 100 / 200 / 300 / 400 / 600 / 800 m, 1 km |
| `tod` | time of day | 昼 / 夕方 / 夜 / 深夜 (day (`day`), dusk (`dusk`), night (`night`), late night (`late`)) |
| `far` | distant view range | none / 1km / 2km / 4km |
| `n` | place label shown | free text |

Additional UI controls (not all exposed in the URL): lens 24 mm, line/contour weight, eye height 1.55 m, fly speed, season, tree style, people/vehicles density, low-poly / low-spec mode, draw distance, detail distance, building-height redraw for unknown heights.

## How to point it at Khao Lak

The selected pack records OSM camera node [11707600483](https://www.openstreetmap.org/node/11707600483), longitude98.2529673/latitude8.666894. This is a mapped street/path camera reference, not a surveyed entrance or approved evacuation destination. A source-linked illustration:

```
https://tools.oyasumi-gamedev.com/rokehan/
#ll=8.666894%2C98.2529673&s=100&tod=day&far=4&n=Bang+Niang
```

Open in a new tab. The user can then switch to eye height and walk the scene. Export options on the tool: PNG (2400/3600/4800 px), SVG line art, GLB / FBX / OBJ 3D models (with or without distant view).

## Data & attribution (binding)

- OpenStreetMap contributors (ODbL) — buildings, roads, rivers
- Elevation: 国土地理院 for Japan; Terrain Tiles (AWS) elsewhere — Thailand uses AWS Terrain Tiles
- Distant view: OpenFreeMap © OpenMapTiles
- Place search: Nominatim; some names from GeoNames (CC BY 4.0)

Any exported image or embedded scene must carry the credit line near the image or in the work's colophon. Thailand coverage is real OSM data but building heights are estimated where untagged — treat as illustrative, not surveyed.

## miaoshen.nonarkara.org/#model/

That is the user's existing Rokehan use (Shanghai scene). It loads a title card; the model view itself is the Rokehan scene. Confirms the pattern: a dedicated tab/section opens a detailed manga walk-through of a real place.

## Integration options for tsunami.nonarkara.org

### Option A — Link out (recommended first step)

Add one small action in the terrain rehearsal: "Detailed street view (manga)" that opens Rokehan at the selected Khao Lak place in a new tab.

- Zero bundle impact, no Three.js/MapLibre conflict
- No attribution burden on our build (Rokehan carries its own credit)
- Respects "no invented GIS" — Rokehan is real OSM data; we label it reference only, not safety-certified
- Fits the fixed-screen rule: it's a separate tab, not chrome inside our 100dvh viewport

Placement: alongside the existing Walk-through / Fly-by / Overview camera symbols, or as a text link in the terrain caption. One accent (amber `#f59e0b`), zero border-radius, intrinsic-sized symbol/button, never an oversized card.

### Option B — Export GLB and load in-app

Export a GLB of the Khao Lak block from Rokehan and load it with Three.js / a MapLibre custom layer for an in-app detailed walk-through.

- Higher complexity; bundle size; ToS restricts redistributing raw exported files as-is
- Would need scheduled re-exports to stay current
- Not recommended as step one

### Option C — Manga post-processing on MapLibre

Apply line-art + screentone shading to our existing MapLibre terrain via custom shaders/layers.

- Most complex; fights the existing Esri+DEM pipeline
- Not recommended

## Constraints to respect (workspace law)

- **MSH / anti-slop:** one symbol or text link, not a banner or card; zero border-radius; zero gradients; zero drop-shadows; accent amber `#f59e0b` only; the existing product Jost + Prompt, as recorded in STYLE.md; max 3 text sizes per page
- **Fixed screen:** 100dvh, no vertical document scroll; map starts at 42–44 px
- **No invented hazard/route/refuge GIS:** Rokehan scene is illustrative reference; never classify safe/unsafe from it
- **Attribution:** keep OSM + elevation + OpenMapTiles credit visible where the scene appears
- **Thai:** first person `ผม`; non-looped Thai fonts (Prompt (existing product face))
- **Never call the browser a Unity simulator**

## Recommended next step

1. Add a "Detailed street view (manga)" link/button in `src/TerrainRehearsal.tsx` pointing at Rokehan with the selected place's `ll`, `s=100`, `tod=day`, `far=4`.
2. Open in a new tab (`target="_blank" rel="noopener"`).
3. Add the OSM/elevation/OpenMapTiles credit line adjacent to the link or in the terrain caption.
4. Verify at 390/1024/1440 that the button is intrinsic-sized and doesn't overflow the 36 px masthead / 42–44 px map start.
5. Record the geometry check in `design/` and run `npm test && npm run build && node scripts/check-contrast.mjs`.

##4November2026 primary-source/browser recheck

The live tool explicitly guesses missing building heights from use/area and can re-roll them. Our sourced OSM node11707600483 at8.666894,98.2529673 loaded as BangNiang with11buildings, all11guessed heights. This confirms illustration capability, not a surveyed street scene. Daylight is `tod=day`; the earlier `late` example means late night, not late afternoon. Search text behavior is described as local by the current tool; do not promise Nominatim forwarding. No Rokehan content is embedded or exported in Soonami. The external action lives beside source limitations in the on-demand settings dialog, preserving the map and banner. Its coordinates come from the selected pack’s existing OSM camera node, not the approximate example centre.

Source inspected4November2026: https://tools.oyasumi-gamedev.com/rokehan/ (building-height explanation, export/ODbL terms, terrain sources). three.js is MIT; that does not establish an MIT licence for the entire Rokehan application or its exports. External imagery/geometry does not certify an entrance, access, refuge or evacuation route.

## 5 November 2026 — the tool cannot be framed; the integration is a state-matched permalink

**The embed mode does not work from this site, and that is the tool's own policy, not a bug here.**
The tool ships an embed mode (`?embed=1&render=1`), but it only activates inside a frame
(`RK_EMBED` requires `window.parent !== window`), and the served page refuses framing from
anywhere else. Response header, read 5 November 2026:

```
content-security-policy: default-src 'self'; …; frame-ancestors 'self' https://oyasumi-gamedev.com
```

Chrome enforces it. A parent page on another origin, serving the embed URL, recorded:

```
error: Framing 'https://tools.oyasumi-gamedev.com/' violates the following Content Security
Policy directive: "frame-ancestors 'self' https://oyasumi-gamedev.com". The request has been blocked.
```

The frame URL became `chrome-error://chromewebdata/`. So an in-page Rokehan frame would be a
dead panel on this domain. Nothing here proxies, mirrors or rewrites the tool's headers —
the framing rule is the author's deliberate choice and it stays intact.

**What the permalink actually accepts**, read from the tool's own source rather than guessed:
`ll` is latitude,longitude at six decimals; `s` is the near-area radius **in metres**;
`far` is the surroundings distance **in kilometres** (`far` × 1000 on read, `OPT.far/1000` on
write); `tod` is one of `day`, `dusk`, `night`, `late`; `n` is the place label. `?lang=th`
selects the tool's Thai interface, which the tool already ships. `tod=day` is dropped from the
hash on load because it is the default.

**What is now built** (`src/scene-reference.ts`, `src/TerrainRehearsal.tsx`, ledger R11):

- The action sits in the terrain caption, where the place is being read, not buried in a
  collapsed disclosure: "Rokehan scene ↗" / "ฉาก Rokehan ↗".
- It carries the app's own state: the sourced OSM camera node, the sun at that place mapped
  onto the tool's four bands, and the camera in use (`walk` → 100 m / 1 km, `route` → 300 m /
  2 km, `overview` → 600 m / 4 km — all of them the tool's own menu values).
- The Thai interface of the tool is requested when the app reads Thai.
- The map key states what it is and is not, and carries the camera node as a source link.

**Receipt, browser, 5 November 2026.** The generated permalink
`…/#ll=8.666894%2C98.252967&s=600&tod=late&far=4&n=Bang+Niang` opened the tool on **Bang
Niang** — the tool's status bar read "near area 600m, surroundings 4km", its time-of-day
control read **Late night**, its camera control read **Overview (whole area)**, and the scene
reported "176 buildings (169 guessed heights) · 41 roads · 677 trees · elevation 6 m". The
drawings are the tool's estimates: 169 of 176 building heights are guessed, which is the
reason it stays labelled an illustration.

**Layout cost, measured not eyeballed.** The caption band is unchanged at every width —
52 px at 390×844, 30 px at 1024×768 and 30 px at 1440×900, before and after — with zero
horizontal and vertical document overflow and no console errors. At 1024 the attribution line
moves to the row below, inside the band that already had room for it; the link itself stays
grouped with the other caption actions.

**What is left open.** A true in-page embed needs one line changed by the tool's author:
`frame-ancestors 'self' https://oyasumi-gamedev.com https://tsunami.nonarkara.org`. Until
then the action opens a new tab, and this document records why. The tool's own terms still
apply: free to use with attribution, exported files may not be redistributed or sold as-is,
and no Rokehan output is embedded or exported in Soonami.
