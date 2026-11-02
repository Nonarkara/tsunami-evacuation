/** Pure helpers behind the chart kit. Each one conserves its total so a chart can never
 * show more or fewer people than the source number it draws. */

/** Integer allocation of `total` units in proportion to `values` (largest-remainder). Sum is always `total`. */
export function largestRemainder(values: number[], total: number): number[] {
  const sum = values.reduce((a, b) => a + Math.max(0, b), 0);
  if (sum <= 0 || total <= 0) return values.map(() => 0);
  const raw = values.map(v => (Math.max(0, v) / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return out;
}

/** Percentage widths for a stacked bar; zero total gives zero widths, never NaN. Widths sum to 100 (or 0). */
export function stackShares(values: number[]): number[] {
  const sum = values.reduce((a, b) => a + Math.max(0, b), 0);
  return sum > 0 ? values.map(v => (Math.max(0, v) / sum) * 100) : values.map(() => 0);
}

/** Refuse to normalize a mismatched headcount into an apparently complete group. */
export function reconciledShares(values: number[], total: number): number[] | null {
  if (!Number.isFinite(total) || total < 0 || values.some(v => !Number.isFinite(v) || v < 0)) return null;
  if (Math.abs(values.reduce((a, b) => a + b, 0) - total) > 1e-6) return null;
  return total ? values.map(v => v / total * 100) : values.map(() => 0);
}

export function waitClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** Missing DEM samples break the line; signed source heights remain signed. */
export function profileRuns(chainage: number[], heights: (number | null)[]): { distance: number; height: number }[][] {
  const runs: { distance: number; height: number }[][] = [];
  let run: { distance: number; height: number }[] = [];
  heights.forEach((height, i) => {
    if (height === null || !Number.isFinite(height) || !Number.isFinite(chainage[i])) {
      if (run.length) runs.push(run);
      run = [];
    } else run.push({ distance: chainage[i], height });
  });
  if (run.length) runs.push(run);
  return runs;
}

/** A "nice" axis ceiling: 1, 2, 2.5 or 5 × 10^n at or above `v`. */
export function niceCeil(v: number): number {
  if (!(v > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map(m => m * p).find(n => n >= v)!;
}
