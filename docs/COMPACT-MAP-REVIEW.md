# Clear map and compact controls —27 October2026

The user correctly rejected the previous release’s large placename banners, map legend, expanded attribution panel and oversized parameter boxes. Prior whole-task geometry checks passed but did not catch internal map occlusion or excessive field area. Those checks were insufficient for this defect.

## Changes

- Place markers are small points with24px keyboard/pointer targets and accessible names. The selected name appears below the map, not in a banner across it. Native titles remain available on hover. Selecting a marker does not also trigger a terrain-height click.
- Crowd/Water and camera actions sit outside the terrain as compact text controls, with an underline for selection. Zoom/compass and the scale remain on the map.
- Esri/contributor, Mapzen and OSM credit links remain visible below the map. Full credit/legend explanation opens in the Map key disclosure below the terrain, without overlaying it. The key distinguishes3D study layers from other regions/2D reference.
- Parameter labels and native selects share intrinsic-width rows. The short Run action fits its label; it no longer spans a phone. Full parameter names remain accessible; pace options retain units. Model qualification remains beside the resulting counts.
- Phone place selectors also fit their labels rather than forming two filled columns. The elevation SVG spans its distance axis consistently with endpoint labels.

## Measured result

At390×844, parameters decreased from180.6px to77px, the timeline from66.8px to40px, and Run from352×42px to a label-sized32px-high action. The terrain viewport increased from352×230px to352×300px while releasing the former overlay area. Readable font sizes were retained.

At1024/1280/1440 widths the parameters occupy41px. Routine legend/mode/attribution overlays inside the terrain: zero. Place buttons contain no placename text; visible credit links lie below the terrain at all four widths. Existing map, crowd, camera, terrain-water, comparison, planning and drill behavior is preserved.

`design/compact-contract.json` adds explicit parameter-height, Run-width and marker-size budgets. These supplement whole-task first-screen checks. Captures and screenshots use the real browser at390×844,1024×768,1280×720 and1440×900. A separate localhost5176 fixture restores the old wide form cells/full-width Run and placename boxes; the same budgets must fail. No regression styling is deployed.

Independent reviewer `/root/compact_review` inspected all four default screenshots and source changes. Hero/control repair passes; follow-up findings for intrinsic phone place selectors, profile alignment and contextual Map key wording were applied.

The exercise remains an uncalibrated synthetic point-queue model and static terrain-water experiment, not approved evacuation routing or a tsunami flood forecast.

The final compact Water control uses one checkbox/value/slider row. An initial phone measurement caught73.8px map-to-slider separation after relocating credits; regrouping the redundant heading and controls fixed the existing70px budget without loosening it. All14 declared crowd/water/expanded-method cases pass. The local regression fixture fails parameter height175px>90px, Run352×42px>145×36px and placename banner86×32px>24×24px, as well as first-screen visibility.

The2D fallback also keeps routine credits and camera/layer controls outside its geographic canvas, with no automatic selected-place tooltip. Credit links remain immediately below it. The fallback controls use the same compact neutral treatment instead of colored floating boxes.

Final independent follow-up inspected the refreshed default phone,2D and expanded-key screenshots: visual findings closed, no visual blockers. Its final copy correction was applied: the DEM-click instruction is shown only in3D, where that interaction exists. The model and data assumptions did not change. Tests12/12, strict build, contrast and the14-case compact geometry gate pass.

An additional360px panel check exposed a third parameter row with the repeated “Run rehearsal” label. The visible action now says “Run”/“Pause” with its full accessible name retained, keeping the narrow phone parameters in two rows.

Final narrow-action measurements: label-sized Run retains its full accessible name. The complete refreshed14-case contract includes360×800 Crowd/Water cases, with all counts and actions inside the first screen.

## Live verification

Final application commit `314ce5865a98738086c53065a6de684af38e9835`; Worker version `5d514ba4-11a9-4997-b45e-d70bde79e888`. Canonical HTML, JavaScript `index-jLbt-Umd.js` and CSS `index-DwfeN__M.css` returned200 and matched local production bytes exactly. GitHub CI passed: https://github.com/Nonarkara/tsunami-evacuation/actions/runs/40529590455 .

The live360×800 crowd case passes the same compact contract: parameters77px, Run47.37×32px, counts finish at794.67px, no routine mode/key/attribution panels inside the terrain. The live DEM loaded and Run→Pause playback changed the counts. `design/compact-live-360.json` and `docs/evidence/compact-live-360.png` preserve the live result. Restoring the normal in-app browser size showed the same compact treatment in the actual narrow browser panel.
