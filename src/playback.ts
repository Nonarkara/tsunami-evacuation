/** Elapsed simulation time between visible animation frames.
 * A background tab or a long render stall must not teleport a walker ahead. */
export function advancePlayback(seconds: number, elapsedMs: number, rate: number, duration: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 250) return seconds;
  return Math.min(duration, seconds + elapsedMs * rate / 1000);
}

type PlaybackFrames = {
  rate: number;
  duration: number;
  updateWater: boolean;
  isRunning: () => boolean;
  getTime: () => number;
  setTime: (seconds: number) => void;
  drawCamera: () => void;
  readTime: (seconds: number) => void;
  readWater: (seconds: number) => void;
  finish: () => void;
};

export function runPlaybackFrames(options: PlaybackFrames) {
  let last = performance.now(), lastReading = last, lastWater = last;
  let ticket: number;
  const tick = (now: number) => {
    if (!options.isRunning()) return;
    const time = advancePlayback(options.getTime(), now - last, options.rate, options.duration);
    last = now;
    options.setTime(time);
    options.drawCamera();
    if (time >= options.duration) {
      options.finish();
      return;
    }
    if (now - lastReading >= 50) {
      options.readTime(time);
      lastReading = now;
    }
    if (options.updateWater && now - lastWater >= 200) {
      options.readWater(time);
      lastWater = now;
    }
    ticket = requestAnimationFrame(tick);
  };
  ticket = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(ticket);
}
