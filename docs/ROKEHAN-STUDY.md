---
updated: 2026-11-04
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

The scene is driven by the hash. Example (Shibuya Crossing):

```
https://tools.oyasumi-gamedev.com/rokehan/
#ll=35.659500%2C139.700500&s=100&tod=late&far=4&n=Shibuya+Crossing%2C+Tokyo
```

| Param | Meaning | Values |
|-------|---------|--------|
| `ll` | lat,lng (URL-encoded comma) | `8.669%2C98.265` for Bang Niang |
| `s` | scene size | 100 / 200 / 300 / 400 / 600 / 800 m, 1 km |
| `tod` | time of day | 昼 / 夕方 / 夜 / 深夜 (day (`day`), dusk (`dusk`), night (`night`), late night (`late`)) |
| `far` | distant view range | none / 1km / 2km / 4km |
| `n` | place label shown | free text |

Additional UI controls (not all exposed in the URL): lens 24 mm, line/contour weight, eye height 1.55 m, fly speed, season, tree style, people/vehicles density, low-poly / low-spec mode, draw distance, detail distance, building-height redraw for unknown heights.

## How to point it at Khao Lak

Bang Niang area ≈ `8.669, 98.265`; inland exercise endpoint ≈ `8.6726929, 98.2839914`. A ready link:

```
https://tools.oyasumi-gamedev.com/rokehan/
#ll=8.669%2C98.265&s=100&tod=late&far=4&n=Bang+Niang%2C+Khao+Lak
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

1. Add a "Detailed street view (manga)" link/button in `src/TerrainRehearsal.tsx` pointing at Rokehan with the selected place's `ll`, `s=100`, `tod=late`, `far=4`.
2. Open in a new tab (`target="_blank" rel="noopener"`).
3. Add the OSM/elevation/OpenMapTiles credit line adjacent to the link or in the terrain caption.
4. Verify at 390/1024/1440 that the button is intrinsic-sized and doesn't overflow the 36 px masthead / 42–44 px map start.
5. Record the geometry check in `design/` and run `npm test && npm run build && node scripts/check-contrast.mjs`.

##4November2026 primary-source/browser recheck

The live tool explicitly guesses missing building heights from use/area and can re-roll them. Our sourced OSM node11707600483 at8.666894,98.2529673 loaded as BangNiang with11buildings, all11guessed heights. This confirms illustration capability, not a surveyed street scene. Daylight is `tod=day`; the earlier `late` example means late night, not late afternoon. Search text behavior is described as local by the current tool; do not promise Nominatim forwarding. No Rokehan content is embedded or exported in Soonami. The external action lives beside source limitations in the on-demand settings dialog, preserving the map and banner. Its coordinates come from the selected pack’s existing OSM camera node, not the approximate example centre.

Source inspected4November2026: https://tools.oyasumi-gamedev.com/rokehan/ (building-height explanation, export/ODbL terms, terrain sources). three.js is MIT; that does not establish an MIT licence for the entire Rokehan application or its exports. External imagery/geometry does not certify an entrance, access, refuge or evacuation route.
