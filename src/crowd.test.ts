import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { simulate, frame, waterScreen, elevation, type RouteData, type TerrainGrid } from './crowd';
const routes: RouteData = JSON.parse(readFileSync(new URL('../public/data/rehearsal-routes.json', import.meta.url), 'utf8'));
test('crowd counts are conserved across release, queues, movement and completion', () => {
  const model = simulate(routes, 120, 1.4, 1);
  for (const t of [0, 10, 50, 500, 2000, model.duration]) {
    const f = frame(model, t);
    assert.equal(f.arrived + f.queued + f.walking + f.pending, 120);
    assert.equal(f.features.reduce((sum, feature) => sum + Number(feature.properties?.count), 0), 120 - f.arrived);
  }
  assert.equal(frame(model, model.duration).arrived, 120);
});
test('all trajectories follow the source path and never enter before arrival', () => {
  const model = simulate(routes, 90, .8, 2);
  for (const p of model.people) {
    const route = routes.routes[p.route];
    assert.equal(p.legs.length, route.nodeIds.length - 1);
    p.legs.forEach((leg, i) => {
      assert.deepEqual(leg.from, route.coordinates[i]);
      assert.deepEqual(leg.to, route.coordinates[i + 1]);
      assert.ok(leg.enter >= leg.arrival && leg.exit > leg.enter);
      if (i) assert.equal(leg.arrival, p.legs[i - 1].exit);
    });
  }
});
test('narrowing the shared pinch point creates more waiting and later completion', () => {
  const narrow = simulate(routes, 1500, 1.4, 1), wide = simulate(routes, 1500, 1.4, 6);
  assert.ok(narrow.maxQueueWait > wide.maxQueueWait);
  assert.ok(narrow.duration > wide.duration);
});
test('faster input pace reduces free travel time without bypassing service capacity', () => {
  const slow = simulate(routes, 120, .8, 2), fast = simulate(routes, 120, 2.4, 2);
  assert.ok(fast.duration < slow.duration);
  const entries = fast.people.flatMap(p => p.legs.filter(l => l.edge === fast.bottleneck).map(l => l.enter)).sort((a,b) => a-b);
  for (let i = 1; i < entries.length; i++) assert.ok(entries[i] - entries[i-1] >= 1/2.4 - 1e-7);
});
test('terrain screening excludes disconnected depressions and out-of-grid samples', () => {
  const g: TerrainGrid = { w: 4, h: 3, west: 0, east: 3, north: 2, south: 0, source: 'test', accessed: 'test', heights: [0,10,10,10, 0,10,0,10, 0,10,10,10] };
  const f = waterScreen(g, 1);
  assert.equal(f.features.length, 3);
  assert.equal(elevation(g, [2,1]), 0);
  assert.equal(elevation(g, [9,9]), null);
});
test('source routes share a downstream network and retain OSM way provenance', () => {
  assert.equal(routes.routes.length, 3);
  for (const r of routes.routes) {
    assert.equal(r.osmWays.length, r.nodeIds.length-1);
    assert.deepEqual(r.coordinates.at(-1), routes.destination);
    assert.ok(r.osmWays.every(id => /^\d+$/.test(id)));
  }
});

test('waiting people are totals at exact model nodes, never an invented crowd footprint', () => {
  const model = simulate(routes, 5000, 1.4, 1);
  const f = frame(model, 4416);
  assert.equal(f.queued, 2799);
  assert.equal(f.walking, 729);
  assert.equal(f.arrived, 1472);
  const groups = f.features.filter(p => p.properties?.status !== 'walking');
  assert.ok(groups.length > 0 && groups.length < f.queued);
  const ids = new Set<string>();
  for (const g of groups) {
    const key = `${g.properties?.status}:${g.properties?.edge}`;
    assert.ok(!ids.has(key)); ids.add(key);
    const leg = model.people.find(p => p.legs.some(l => l.edge === g.properties?.edge))!.legs.find(l => l.edge === g.properties?.edge)!;
    assert.deepEqual(g.geometry.coordinates, leg.from);
  }
  assert.equal(f.features.reduce((sum, p) => sum + Number(p.properties?.count), 0) + f.arrived, 5000);
});
test('moving points remain exactly on their modeled road segment', () => {
  const model = simulate(routes, 120, 1.4, 1), time = 400;
  const f = frame(model, time);
  for (const p of f.features.filter(p => p.properties?.status === 'walking')) {
    const person = model.people[Number(p.properties?.person)];
    const leg = person.legs.find(l => l.enter <= time && time < l.exit)!;
    const t = (time - leg.enter) / (leg.exit - leg.enter);
    assert.deepEqual(p.geometry.coordinates, [leg.from[0] + (leg.to[0] - leg.from[0]) * t, leg.from[1] + (leg.to[1] - leg.from[1]) * t]);
  }
});
