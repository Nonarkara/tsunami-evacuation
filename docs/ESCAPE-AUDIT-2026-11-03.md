---
updated: 2026-11-03
drafted_by: codex/gpt-6
reviewed: false
---

# Escape clarity and scientific audit — 3 November 2026

Starting source: cc5d4be. Preserve the 3D/2D map, real OSM geometry,1.65m camera, crowd model, illustrative animation and earned charts. The preceding design document's approval statement is third-party evidence, not new user authorization or scientific validation.

## Plan

1. Replace the unsupported water-versus-person race with a visual warning→move lesson, compact practice direction/route progress, truthful selected-walker timing and clearly separate illustrative water/terrain readings. No water height triggers a claimed safe/unsafe outcome.
2. Show three sourced natural/official warning cues, with short Thai/English labels, protect during shaking/move when safe, never wait for water, children with an adult, confirmed local route/destination priority. All regions receive the general lesson; unmapped routes remain explicitly unavailable.
3. Remove repeated cards/chrome, make the practice direction, controls and next action visible together; preserve calibrated plots and accessible labels. Test ready/moving/queued/arrived, unknown elevation, phone/tablet/desktop/short screens, mode/region changes and keyboard access.
4. Run scientific/visual independent review, tests/build/contrast; commit/push/deploy and verify canonical UI plus asset bytes.

## Initial failures

- Objective claims to beat illustrative water; red 'overtaken' result infers a physical event without a flood model.
- Ground uses a route vertex rather than the walker’s current coordinate; missing data becomes0. Comparing that scalar with a chosen water level ignores connectivity and unverified vertical datums.
- Arrival uses the current elapsed clock and whole-model maximum queue rather than selected-walker finish/own scheduled waits.
- Escape hides normal playback controls and uses a certification-like checkmark symbol. Warning/turn/destination cues are absent; four equal metric cells have10px qualifications.
- Neither ordinary passing tests nor an 'illustrative' footnote validates these classifications.

General safety source checked3November2026: https://www.weather.gov/safety/tsunami-during . Thai local instructions take priority. No new live feed is claimed.

## Final implementation

The primary lesson is a conditional three-symbol warning chain (ANY ONE, not three simultaneous conditions), followed by movement inland/higher, local-sign priority, protection while shaking and children going with a trusted adult. NWS is linked. The method dialog also says not to return until officials permit it. This is general learning guidance, not a connected alarm.

The practice panel now shows the next mapped turn/distance, remaining route, assumed model pace, calibrated distance/time rulers and separate chosen-water/approximate-DEM readings. It never subtracts these heights to infer flooding or survival. Unknown ground stays unknown. Arrival uses the selected synthetic walker’s scheduled finish and own total node wait. The paper’s PD50 result is preserved in a sourced method dialog, separated from the browser outcome.

A door/arrow replaces the approval-like checkmark. Equal stat cards, red/green outcomes and duplicate boxed objective were removed. Play/Pause, Reset, the imagery-context toggle, elapsed clock and playback rate stay outside reading pagination. Pause remains enabled during terrain-loading stalls; stopped starts/replays wait for the native eye camera (or2D). The picture button preserves the simple terrain option and exposes the existing Esri imagery without resetting the clock or requesting a new data source. Dragged/manual camera state is not owned by that toggle.

`?lang=th&lesson=escape#explore` (or`lang=en`) opens the lesson directly, paused at1×. Existing entry URLs retain ordinary Rehearsal. All other selected places receive the general warning lesson, explicit route/destination/forecast/live-feed gaps and a local-plan action. No guessed destinations, safe contours or new hazard pins were added.

Imported replay data is retained but excluded from Escape’s actual rendering, frame and duration calculations. Water view still displays that imported replay. A locally generated, explicitly synthetic UI fixture demonstrated the round trip; it was removed from app state and is not committed or deployed.

## Verification and independent review

- `geometry.json`:6fresh Thai/English Escape cases at390×844,1024×768,1440×900. Play→Pause→Reset exercised at each size after the native camera loaded. Start and turn cue remain in the first view. Reading pages3/2/1; no document scroll/overflow; banner36px and scene top42–44px.
- `edges.json`:10additional Thai cases:320×700,390×600,667×375,1169×674,1280×720 and both sides of760/1100breakpoints. Controls and cue visible in each; no document overflow. Short screens still paginate; no claim that every explanation fits one reading page.
- `default-regression.json`:normal Rehearsal retains its first-screen Start,3/2/1pages at390/1024/1440 and zero scroll.
- `playback.json`/`final-states.json`:movement advances; selected person queues at+44:34. At elapsed+63:35 the selected arrival remains+54:48 with own wait1:03, rather than the whole-model maximum4:34. Replay returns the clock to0. Final arrival/queue captures show corrected timing; later ready captures include the final persistent strip/imagery control.
- `import-roundtrip.json`:Escape illustration/retained→Water imported-replay/retained→Escape illustration/retained. The fixture is a UI test, not tsunami evidence.
- `persistent-playback.json`:Pause remains visible and usable on a later phone page; pager endpoints work and the full profile stays together.
- `plan-method-focus.json`:Confirm plan opens the on-device form; method dialog Escape returns focus without document scroll. `style-toggle.json` records an unchanged paused clock across imagery switching. `deep-link.json` records direct lesson entry and reset at0,1×.
- `mode-region.json`:2D switching retained; changing to Phuket returns to overview, removes the Bang Niang practice panel and shows the general warning/data-gap state. The saved Phuket image is a loading-state capture, not proof of completed imagery loading.
-74tests pass (63TypeScript,11Python), including4new regression tests for false water outcomes, stable selected-person timing, bilingual independent warning triggers and enabled Pause during a terrain stall. Strict build and six text-role contrast checks pass. Final independent scientific/code/visual review:PASS; all findings closed.

Before screenshots record the rejected boxed race/card view; it has neither the warning-action lesson nor a next-turn cue. The final task budget requires both the explicit warning action and mapped practice direction beside reachable playback, not merely zero document scroll. Ready screenshots and16recorded cases meet that budget.

## Limits and handoff

No location-specific wave forecast, approved evacuation GIS or certified refuge has been added. Physical-device and child-comprehension/native Thai community testing remain unverified; children are explicitly directed to a trusted adult. Coarse imagery/terrain and labelled3m unknown-height building massing remain source limitations, not high-resolution street geometry.

The Obsidian bridge returned Transport closed for get_context/read_note. Kit canon was read from its known Markdown paths without editing it. Repository documentation is the durable fallback; shared-memory capture is retried after release. No separate scratch system was created.

Canonical release receipt follows after deployment.
