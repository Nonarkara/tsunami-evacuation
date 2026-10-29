/** Elapsed simulation time between visible animation frames.
 * A background tab or a long render stall must not teleport a walker ahead. */
export function advancePlayback(seconds: number, elapsedMs: number, rate: number, duration: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 250) return seconds;
  return Math.min(duration, seconds + elapsedMs * rate / 1000);
}
