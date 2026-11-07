/** Depth shading for imported research frames.
 *
 * A wave that is one flat colour says nothing about its own depth: a puddle and
 * three metres of inundation look the same. These helpers shade the water by the
 * depth the model gives for each cell, so the structure of the inundation can be
 * read off the surface.
 *
 * The ramp is scaled to the whole imported file — the deepest cell the model
 * gives in any frame of it — not to the frame in view. A per-frame scale was
 * tried and measured: because a wave deepens almost everywhere at once, the
 * relative colour of every cell stayed put and two frames of the same event
 * looked identical. One scale for the file lets a reader watch the water darken
 * as it deepens, and the scale is stated rather than implied.
 *
 * A null cell means unknown, never safe. Only cells the model gives a depth for
 * are drawn at all, so an unknown cell is never shaded as shallow water.
 */

/** The shallow end of the ramp: pale, thin, close to the paper. */
export const WATER_SHALLOW = { rgb: [0.70, 0.87, 0.94], alpha: 0.50 };
/** The deep end of the ramp: dark, saturated water. */
export const WATER_DEEP = { rgb: [0.04, 0.28, 0.45], alpha: 0.76 };

export const WATER_SHALLOW_CSS = 'rgb(179,222,240)';
export const WATER_DEEP_CSS = 'rgb(10,71,115)';

/** The deepest cell in a set of depths. Zero when there are none. */
export function depthScale(depths: (number | null)[]): number {
  let max = 0;
  for (const depth of depths) {
    if (depth === null || !Number.isFinite(depth)) continue;
    if (depth > max) max = depth;
  }
  return max;
}

/** The deepest cell in any frame of an imported file: the scale for the whole file. */
export function fileDepthScale(frames: { depthM: (number | null)[] }[]): number {
  let max = 0;
  for (const frame of frames) {
    const frameMax = depthScale(frame.depthM);
    if (frameMax > max) max = frameMax;
  }
  return max;
}

/** Where a depth sits on the ramp, 0 at the shallow end and 1 at the deep end. */
export function depthRatio(depth: number, max: number): number {
  if (!Number.isFinite(depth) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(1, Math.max(0, depth / max));
}

/** The interpolated colour for a depth, as the renderer and the legend agree on it. */
export function depthColour(depth: number, max: number): string {
  const t = depthRatio(depth, max);
  const channel = (i: number) => Math.round((WATER_SHALLOW.rgb[i] + (WATER_DEEP.rgb[i] - WATER_SHALLOW.rgb[i]) * t) * 255);
  return `rgb(${channel(0)},${channel(1)},${channel(2)})`;
}

/** The shallowest and deepest cells of a frame, for the legend. */
export function depthRange(depths: (number | null)[]): { min: number; max: number } {
  let min = Infinity, max = 0;
  for (const depth of depths) {
    if (depth === null || !Number.isFinite(depth)) continue;
    if (depth < min) min = depth;
    if (depth > max) max = depth;
  }
  return { min: Number.isFinite(min) ? min : 0, max };
}

import type { ExpressionSpecification } from 'maplibre-gl';

/** The map expression that shades a polygon fill by its depth. */
export function depthColourExpression(max: number): ExpressionSpecification {
  return ['interpolate', ['linear'], ['get', 'depthM'], 0, WATER_SHALLOW_CSS, Math.max(max, 0.001), WATER_DEEP_CSS];
}
