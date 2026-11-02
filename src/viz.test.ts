import test from 'node:test';
import assert from 'node:assert/strict';
import { largestRemainder, stackShares, niceCeil, reconciledShares, waitClock, profileRuns } from './viz';
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

test('a false full-population stack is rejected rather than renormalized', () => {
  assert.deepEqual(reconciledShares([20, 80], 100), [20, 80]);
  assert.equal(reconciledShares([20, 70], 100), null);
  assert.equal(reconciledShares([20, 90], 100), null);
  assert.equal(reconciledShares([-1, 101], 100), null);
  assert.equal(reconciledShares([NaN], 100), null);
  assert.deepEqual(reconciledShares([0, 0], 0), [0, 0]);
});

test('queue clock preserves a true zero and never produces 60 in the seconds field', () => {
  assert.equal(waitClock(0), '0:00');
  assert.equal(waitClock(59.9), '0:59');
  assert.equal(waitClock(60), '1:00');
  assert.equal(waitClock(274.99), '4:34');
});

test('terrain profile keeps negative heights and breaks at unavailable samples', () => {
  assert.deepEqual(profileRuns([0, 10, 20, 30, 40], [-2, 3, null, 8, 9]), [
    [{distance:0,height:-2},{distance:10,height:3}],
    [{distance:30,height:8},{distance:40,height:9}],
  ]);
  assert.deepEqual(profileRuns([0, 10], [null, null]), []);
});
