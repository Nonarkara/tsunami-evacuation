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

/** A "nice" axis ceiling: 1, 2, 2.5 or 5 × 10^n at or above `v`. */
export function niceCeil(v: number): number {
  if (!(v > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map(m => m * p).find(n => n >= v)!;
}
