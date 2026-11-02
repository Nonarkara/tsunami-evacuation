import test from 'node:test';
import assert from 'node:assert/strict';
import { largestRemainder, stackShares, niceCeil } from './viz';
import { outcomes, scenarios } from './research';

test('dot grid always draws exactly 100 people for every fully reported outcome', () => {
  for (const i of scenarios.keys()) for (const c of ['baseline', 'delayed'] as const) {
    const o = outcomes(i, c);
    const parts = o.reached === null ? [o.affected, 100 - o.affected] : [o.reached, o.outside!, o.affected];
    const dots = largestRemainder(parts, 100);
    assert.equal(dots.reduce((a, b) => a + b, 0), 100);
    dots.forEach((d, k) => assert.ok(Math.abs(d - parts[k]) < 1, `dot count ${d} strays from ${parts[k]}%`));
  }
});

test('largest remainder breaks ties by order and handles empty input', () => {
  assert.deepEqual(largestRemainder([1, 1, 1], 100), [34, 33, 33]);
  assert.deepEqual(largestRemainder([0, 0], 10), [0, 0]);
});

test('stacked shares conserve the population and never divide by zero', () => {
  const s = stackShares([1500, 0, 0, 0]);
  assert.equal(s[0], 100);
  assert.deepEqual(stackShares([0, 0]), [0, 0]);
  assert.ok(Math.abs(stackShares([3, 7, 11, 13]).reduce((a, b) => a + b, 0) - 100) < 1e-9);
});

test('nice axis ceilings', () => {
  assert.equal(niceCeil(21.8), 25);
  assert.equal(niceCeil(96), 100);
  assert.equal(niceCeil(0), 1);
});
