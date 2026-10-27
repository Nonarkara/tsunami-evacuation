import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { simulate, frame, type ExerciseRoute, type RouteData } from './crowd';
import { alongRoute, bearing, routeChainage, routeArrows, walkerProgress, demonstrationLevel, parseHazardReplay, replayAt, replayPolygons, areaPacks } from './rehearsal';
const routes: RouteData = JSON.parse(readFileSync(new URL('../public/data/rehearsal-routes.json', import.meta.url), 'utf8'));
const path: ExerciseRoute = { name: 'format test', nodeIds: ['a','b','c'], coordinates: [[0,0],[.001,0],[.001,.001]], osmWays: ['1','2'] };
function fixture() { return { schemaVersion: 1, areaId: 'format-test', title: 'Synthetic format test, not a tsunami scenario', sourceUrl: 'https://example.org/research', model: 'unit fixture', license: 'CC0', timeOrigin: 'warning', verticalDatum: 'MSL', depthUnit: 'm', grid: { west:0,east:2,south:0,north:2,rows:2,cols:2,rowOrder:'north-to-south',groundM:[0,1,2,3] }, frames:[{seconds:0,depthM:[0,null,1,2]},{seconds:10,depthM:[2,null,3,4]}] }; }
test('route camera and arrows use source chainage and forward bearing', () => {
  assert.ok(Math.abs(bearing([0,0],[.001,0])-90)<1e-8);
  assert.equal(bearing([0,0],[0,.001]),0);
  const chain=routeChainage(path), p=alongRoute(path,chain[1]/2);
  assert.ok(Math.abs(p.coord[0]-.0005)<1e-9);assert.equal(p.coord[1],0);
  const arrows=routeArrows(path,30);assert.ok(arrows.features.length>2);
  assert.equal(arrows.features[0].properties?.heading,90);
  assert.deepEqual(alongRoute(path,1e6).coord,path.coordinates.at(-1));
});
test('preparation starts at exercise warning and preserves all people until release', () => {
  const m=simulate(routes,30,1.4,2,60);
  const f=frame(m,59);assert.equal(f.pending,30);assert.equal(f.walking,0);
  const p=walkerProgress(m.people[0],routes.routes[0],59);assert.equal(p.state,'preparing');assert.equal(p.metres,0);
  assert.equal(walkerProgress(m.people[0],routes.routes[0],70).state,'moving');
  const noDelay=simulate(routes,30,1.4,2);assert.equal(m.duration-noDelay.duration,60);
});
test('walker camera remains at a node while queued and stops at the exercise end', () => {
  const m=simulate(routes,500,1.4,1), p=m.people.at(-1)!;
  const leg=p.legs.find(l=>l.enter-l.arrival>1)!;
  assert.equal(walkerProgress(p,routes.routes[p.route],(leg.arrival+leg.enter)/2).state,'queued');
  assert.deepEqual(walkerProgress(p,routes.routes[p.route],p.finish+1).coord,routes.destination);
});
test('illustrative water rise is bounded and is not a wave-height calculation', () => {
  assert.equal(demonstrationLevel(-1,10,600),0);assert.equal(demonstrationLevel(300,10,600),5);assert.equal(demonstrationLevel(1000,10,600),10);
  assert.throws(()=>demonstrationLevel(0,10,0));
});
test('research depth replay interpolates cells, keeps no-data unknown and retains bounds', () => {
  const data=parseHazardReplay(fixture(),'format-test'), f=replayAt(data,5)!;
  assert.deepEqual(f.depthM,[1,null,2,3]);assert.equal(f.waveHeightM,null);
  assert.equal(replayAt(data,-1),null);assert.equal(replayAt(data,11),null);
  const polys=replayPolygons(data,5);assert.equal(polys.features.length,3);
  assert.equal(polys.features[0].properties?.surfaceM,1);
  for(const feature of polys.features)for(const p of feature.geometry.coordinates[0])assert.ok(p[0]>=0&&p[0]<=2&&p[1]>=0&&p[1]<=2);
});
test('wave height requires its own gauge and cannot be inferred from ground or depth', () => {
  const f=fixture();Object.assign(f.frames[0],{waveHeightM:2});assert.throws(()=>parseHazardReplay(f,'format-test'));
  const valid={...fixture(),waveGauge:{name:'format gauge',longitude:0,latitude:0,quantity:'crest-to-trough wave height'},frames:[{seconds:0,depthM:[0,0,0,0],waveHeightM:1},{seconds:10,depthM:[2,2,2,2],waveHeightM:3}]};
  assert.equal(replayAt(parseHazardReplay(valid,'format-test'),5)?.waveHeightM,2);
});
test('import rejects area, datum, unit, clock, grid and credential mismatches', () => {
  for(const patch of [{areaId:'other'},{verticalDatum:'MHW'},{depthUnit:'feet'},{timeOrigin:'earthquake'},{sourceUrl:'https://user:password@example.org/model'}])assert.throws(()=>parseHazardReplay({...fixture(),...patch},'format-test'));
  const bad=fixture();bad.frames[1].seconds=0;assert.throws(()=>parseHazardReplay(bad,'format-test'));
  const cells=fixture();cells.frames[1].depthM=[NaN,null,0,0];assert.throws(()=>parseHazardReplay(cells,'format-test'));
});
test('an area without a local pack never silently receives Khao Lak directions', () => {
  assert.equal(areaPacks.phuket,undefined);assert.equal(areaPacks['khao-lak'].destinations,'unapproved');
});

test('exact model sample times preserve known values beside no-data frames', () => {
  const f={...fixture(),waveGauge:{name:'format gauge',longitude:0,latitude:0,quantity:'crest-to-trough wave height'},frames:[{seconds:0,depthM:[2,null,0,0],waveHeightM:3},{seconds:10,depthM:[null,4,0,0]}]};
  const data=parseHazardReplay(f,'format-test');
  assert.deepEqual(replayAt(data,0)?.depthM,[2,null,0,0]);assert.equal(replayAt(data,0)?.waveHeightM,3);
  assert.deepEqual(replayAt(data,10)?.depthM,[null,4,0,0]);assert.equal(replayAt(data,10)?.waveHeightM,null);
  assert.deepEqual(replayAt(data,5)?.depthM,[null,null,0,0]);
});
