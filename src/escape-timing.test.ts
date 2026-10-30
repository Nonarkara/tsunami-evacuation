import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { simulate, type RouteData } from './crowd';
import { freeFlowSeconds, paceLines, routeLength, segmentWaits, speedForSeconds } from './escape-timing';

const routes: RouteData = JSON.parse(readFileSync(new URL('../public/data/rehearsal-routes.json', import.meta.url), 'utf8'));

test('the route length matches the distance the exercise model reports', () => {
  const model = simulate(routes, 100, 1.4, 2);
  routes.routes.forEach((route, index) => {
    assert.ok(Math.abs(routeLength(route) - model.distance[index]) < 1);
  });
});

test('free-flow time is the route length divided by the pace, and its inverse is the pace', () => {
  const route = routes.routes[0];
  const seconds = freeFlowSeconds(route, 1.4);
  assert.ok(Math.abs(seconds - routeLength(route) / 1.4) < 1e-6);
  assert.ok(Math.abs(speedForSeconds(route, seconds) - 1.4) < 1e-9);
  assert.throws(() => speedForSeconds(route, 0), /Target time must be positive/);
  assert.throws(() => freeFlowSeconds(route, 0), /Pace must be positive/);
});

test('the pace ladder lists the walking paces and adds the run pace only when runners are used', () => {
  const model = simulate(routes, 200, 1.4, 2);
  const walking = paceLines(routes.routes[0], model, [0.8, 1.4, 2.4], 3, 0);
  assert.deepEqual(walking.map(l => l.pace), [0.8, 1.4, 2.4]);
  assert.ok(walking.every(l => !l.run));
  const mixed = simulate(routes, 200, 1.4, 2, 0, { count: 50, speed: 3 });
  const ladder = paceLines(routes.routes[0], mixed, [0.8, 1.4, 2.4], 3, 50);
  assert.deepEqual(ladder.map(l => l.pace), [0.8, 1.4, 2.4, 3]);
  assert.equal(ladder.filter(l => l.run).length, 1);
  assert.equal(ladder[3].label, 'Run 3 m/s');
});

test('the ladder reports free-flow time and the modelled last arrival separately', () => {
  const model = simulate(routes, 500, 1.4, 1);
  const ladder = paceLines(routes.routes[0], model, [1.4], 3, 0);
  assert.ok(ladder[0].seconds < ladder[0].queuedSeconds, 'queueing must make the last arrival later than free flow');
});

test('segment waits sit on the route and grow with the modelled queue', () => {
  const narrow = simulate(routes, 1500, 1.4, 1), wide = simulate(routes, 1500, 1.4, 6);
  const narrowWaits = segmentWaits(0, routes.routes[0], narrow);
  const wideWaits = segmentWaits(0, routes.routes[0], wide);
  assert.ok(narrowWaits.length > 0);
  assert.ok(Math.max(...narrowWaits.map(w => w.waitSeconds)) > Math.max(...wideWaits.map(w => w.waitSeconds)));
  for (const wait of narrowWaits) {
    assert.ok(wait.chainageM >= 0 && wait.chainageM <= routeLength(routes.routes[0]) + 1);
    assert.ok(wait.waitSeconds >= 0);
  }
  const chainages = narrowWaits.map(w => w.chainageM);
  assert.deepEqual(chainages, [...chainages].sort((a, b) => a - b));
});
