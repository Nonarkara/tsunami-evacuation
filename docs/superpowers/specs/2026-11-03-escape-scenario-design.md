# Escape Scenario — cel-shaded walkthrough with water-vs-crowd tension

**Date**: 2026-11-03
**Status**: Approved by Dr Non
**Ground truth**: point-queue model (`crowd.ts`), research outcomes (`research.ts`), OSM building snapshots

## Problem

Users find the system unintuitive and the graphics hard to understand. The 3D walkthrough is a passive camera; the water demonstration is disconnected from the crowd clock. The research says "walking beats driving, vertical refuge beats sprinting, leaving now beats waiting" — but the interface doesn't let anyone *feel* that.

## Goal

An interactive first-person escape scenario where the user walks the mapped route at eye level while illustrative water rises behind them. The tension is real: the clock runs, the queue forms at the pinch point, and the water creeps up. The outcome — arrived, delayed, or overtaken — comes from the existing simulation, not invented.

## Design decisions

### Art direction: flat cel-shade, not satellite

- Replace the aerial raster with a flat-color ground plane (single muted tone, no imagery)
- Buildings: solid pastel fill-extrusions with dark outline edges (ground-level footprint outlines already exist)
- Add a ground-level shadow polygon per building (offset dark fill at 15% opacity)
- Water: existing translucent blue surface, opacity increases with depth
- Agents: white filled circles (walking), amber (queued), hollow rings (running) — already correct

### Escape mode: a third experiment tab

- Joins "Rehearsal" and "Water level" as a third mode
- Activating it:
  1. Switches camera to walk-through at 1.65m
  2. Starts the exercise clock at 0
  3. Enables water rise synced to the exercise clock (not a separate clock)
  4. Shows the objective line: "Reach the endpoint before the water reaches you"
  5. Shows live status: distance remaining, current pace, water level MSL, queue state
- Outcome panel when the walker arrives or water reaches their ground elevation:
  - Arrival time (mm:ss from warning)
  - Queue wait at the pinch point
  - Water level at arrival
  - Research context: "In the published model, walking preference cuts victim share from 21.8% to 7.0%"
- Escape mode always uses the selected preparation delay and pace

### Water-crowd sync

- In escape mode, `waterSeconds` is replaced by `seconds` — one clock, not two
- Water peak defaults to +10m MSL (the 2004 reference level) at 30-minute rise
- The user can change peak and rise duration in Scenario settings as before

### What stays honest

- Water level is labeled "illustrative" — not a wave arrival prediction
- The endpoint is labeled unapproved
- No survival rate is shown — only arrival time and queue wait
- Running is an experiment parameter, not advice
- The scenario never says "you are safe" — only what the model computed

### What is NOT built (scope cut)

- No Three.js engine
- No particle effects
- No sound
- No score/points/badges
- No multiplayer
- No day/night cycle

## Files changed

| File | Change |
|---|---|
| `src/TerrainRehearsal.tsx` | Add 'escape' mode, sync water to exercise clock, outcome panel |
| `src/style.css` | Flat-color ground, building shadow layer, escape HUD styles |
| `src/CameraSymbol.tsx` | Add "escape" symbol |
| `src/ReplayWaterLayer.ts` | Minor: accept opacity from depth (visual only) |

## Testing

- Escape mode produces the same simulation output as Rehearsal mode (conservation test)
- Water level in escape mode matches `demonstrationLevel(seconds, peak, rise)` (sync test)
- Outcome panel appears only after arrival or water-over
- Existing 59 TS + 11 Python tests still pass
