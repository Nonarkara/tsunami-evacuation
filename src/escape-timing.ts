/** Exercise timing readouts: modelled pace, modelled arrival, modelled queue.
 *
 * Every number here is a product of the deterministic point-queue exercise over the
 * mapped route. None of it is a wave-arrival margin, a safety verdict or advice:
 * the endpoint is unapproved and the queue model has no slope, mobility or water
 * interaction. The functions are pure so they can be tested directly.
 */
import { distance, type ExerciseRoute, type Rehearsal } from './crowd';

export function routeLength(route: ExerciseRoute): number {
  let sum = 0;
  for (let i = 1; i < route.coordinates.length; i++) sum += distance(route.coordinates[i - 1], route.coordinates[i]);
  return sum;
}

/** Free-flow time to the exercise end at a pace, before any modelled queue. */
export function freeFlowSeconds(route: ExerciseRoute, speed: number): number {
  if (!Number.isFinite(speed) || speed <= 0) throw new Error('Pace must be positive');
  return routeLength(route) / speed;
}

/** Pace needed to cover the route within a target time, before any modelled queue. */
export function speedForSeconds(route: ExerciseRoute, seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Target time must be positive');
  return routeLength(route) / seconds;
}

export type SegmentWait = { chainageM: number; waitSeconds: number; edge: string };

/** Modelled waiting time per route segment: where the queue forms and for how long. */
export function segmentWaits(routeIndex: number, route: ExerciseRoute, model: Rehearsal): SegmentWait[] {
  const chainage: number[] = [];
  let sum = 0;
  for (let i = 0; i < route.coordinates.length; i++) {
    if (i) sum += distance(route.coordinates[i - 1], route.coordinates[i]);
    chainage.push(sum);
  }
  // Longest modelled wait per edge, with the chainage where that edge starts.
  const waits = new Map<string, { wait: number; index: number }>();
  for (const person of model.people) {
    if (person.route !== routeIndex) continue;
    person.legs.forEach((leg, index) => {
      const wait = leg.enter - leg.arrival;
      const current = waits.get(leg.edge);
      if (!current || wait > current.wait) waits.set(leg.edge, { wait, index });
    });
  }
  return [...waits.entries()]
    .map(([edge, { wait, index }]) => ({ edge, waitSeconds: wait, chainageM: Math.round(chainage[index] ?? 0) }))
    .sort((a, b) => a.chainageM - b.chainageM);
}

export type PaceLine = { label: string; pace: number; seconds: number; queuedSeconds: number; run: boolean };

/** The pace ladder shown to the reader: every walking pace, plus the run pace when used. */
export function paceLines(route: ExerciseRoute, model: Rehearsal, walkPaces: number[], runSpeed: number, runCount: number): PaceLine[] {
  const paces = [...new Set(walkPaces.filter(p => p > 0))].sort((a, b) => a - b);
  if (runCount > 0) paces.push(runSpeed);
  return paces.map(pace => {
    const seconds = freeFlowSeconds(route, pace);
    const run = runCount > 0 && pace === runSpeed;
    const queued = model.people.filter(p => p.speed === pace);
    const last = queued.length ? Math.max(...queued.map(p => p.finish)) : seconds;
    return {
      label: run ? `Run ${pace} m/s` : `Walk ${pace} m/s`,
      pace,
      seconds,
      queuedSeconds: last,
      run,
    };
  });
}
