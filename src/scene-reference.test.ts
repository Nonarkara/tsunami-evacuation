import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { parseBuildings } from './buildings';
import { ROKEHAN_ORIGIN, rokehanScene, sceneScale, sceneTimeOfDay } from './scene-reference';

const pack = parseBuildings(JSON.parse(readFileSync(new URL('../public/data/buildings-khao-lak-2.json', import.meta.url), 'utf8')), 'khao-lak-2');
const place = 'Bang Niang · บางเนียง';

test('external scene uses the sourced OSM camera node in latitude/longitude order, without guessing a place', () => {
  const raw = JSON.stringify(pack);
  const scene = rokehanScene(pack, { name: place })!;
  const url = new URL(scene.url);
  const params = new URLSearchParams(url.hash.slice(1));
  assert.equal(url.origin, 'https://tools.oyasumi-gamedev.com');
  assert.equal(url.pathname, '/rokehan/');
  assert.equal(params.get('ll'), `${pack.walkStart!.coord[1].toFixed(6)},${pack.walkStart!.coord[0].toFixed(6)}`);
  assert.equal(params.get('n'), place);
  assert.equal(scene.node, pack.walkStart!.node);
  assert.equal(JSON.stringify(pack), raw, 'the pack is read, never rewritten');
  assert.equal(rokehanScene(undefined, { name: 'Unknown' }), null);
  assert.equal(rokehanScene({ ...pack, walkStart: null }, { name: 'Unknown' }), null);
});

test('the permalink carries the tool\'s own parameter names and units', () => {
  const params = new URLSearchParams(new URL(rokehanScene(pack, { name: place, camera: 'walk' })!.url).hash.slice(1));
  assert.equal(params.get('s'), '100', 'near area is the tool\'s Size value in metres');
  assert.equal(params.get('far'), '1', 'surroundings is the tool\'s value in kilometres');
  assert.equal(params.get('tod'), 'day');
  assert.equal([...params.keys()].sort().join(','), 'far,ll,n,s,tod');
});

test('the scene light follows the sun, and the scale follows the camera', () => {
  assert.equal(sceneTimeOfDay(40), 'day');
  assert.equal(sceneTimeOfDay(12), 'day');
  assert.equal(sceneTimeOfDay(11.9), 'dusk');
  assert.equal(sceneTimeOfDay(0), 'dusk');
  assert.equal(sceneTimeOfDay(-0.1), 'night');
  assert.equal(sceneTimeOfDay(-6), 'night');
  assert.equal(sceneTimeOfDay(-7), 'late');
  assert.equal(sceneTimeOfDay(Number.NaN), 'day');
  assert.deepEqual(sceneScale('walk'), { nearMetres: 100, farKilometres: 1 });
  assert.deepEqual(sceneScale('route'), { nearMetres: 300, farKilometres: 2 });
  assert.deepEqual(sceneScale('overview'), { nearMetres: 600, farKilometres: 4 });
  const walk = new URLSearchParams(new URL(rokehanScene(pack, { name: place, camera: 'walk', timeOfDay: 'late' })!.url).hash.slice(1));
  assert.equal(walk.get('tod'), 'late');
  assert.equal(walk.get('s'), '100');
});

test('the Thai interface of the tool is requested when the app reads Thai', () => {
  const url = new URL(rokehanScene(pack, { name: place, language: 'th' })!.url);
  assert.equal(url.searchParams.get('lang'), 'th');
  assert.ok(url.hash.length > 1, 'the hash survives the language switch');
  assert.equal(new URL(rokehanScene(pack, { name: place })!.url).searchParams.get('lang'), null);
  assert.equal(ROKEHAN_ORIGIN, 'https://tools.oyasumi-gamedev.com/rokehan/');
});
