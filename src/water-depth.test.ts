import { test } from 'node:test';
import assert from 'node:assert/strict';
import { depthColour, depthColourExpression, depthRange, depthRatio, depthScale, WATER_DEEP_CSS, WATER_SHALLOW_CSS } from './water-depth';

test('the ramp runs from the shallow colour to the deep colour', () => {
  assert.equal(depthColour(0, 4), 'rgb(179,222,240)');
  assert.equal(depthColour(4, 4), 'rgb(10,71,115)');
  assert.equal(depthColour(2, 4), 'rgb(94,147,177)');
  assert.equal(depthRatio(1, 4), 0.25);
  assert.equal(depthRatio(-1, 4), 0);
  assert.equal(depthRatio(9, 4), 1);
});

test('a frame with no depth keeps the shallow colour rather than guessing a depth', () => {
  assert.equal(depthScale([]), 0);
  assert.equal(depthScale([null, null]), 0);
  assert.equal(depthScale([0, 0]), 0);
  assert.equal(depthColour(2, 0), 'rgb(179,222,240)');
});

test('unknown cells are never counted as depth', () => {
  assert.equal(depthScale([null, 2, null, 5]), 5);
  assert.deepEqual(depthRange([null, 0, 3, null]), { min: 0, max: 3 });
  assert.deepEqual(depthRange([null, null]), { min: 0, max: 0 });
});

test('the map expression shades by the depth property against the frame scale', () => {
  const expression = depthColourExpression(3) as unknown[];
  assert.equal(expression[0], 'interpolate');
  assert.deepEqual(expression[2], ['get', 'depthM']);
  assert.equal(expression[3], 0);
  assert.equal(expression[4], WATER_SHALLOW_CSS);
  assert.equal(expression[5], 3);
  assert.equal(expression[6], WATER_DEEP_CSS);
  // A frame with nothing in it still gets a usable scale, never a zero divisor.
  assert.equal((depthColourExpression(0) as unknown[])[5], 0.001);
});
