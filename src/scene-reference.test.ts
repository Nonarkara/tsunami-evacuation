import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseBuildings} from './buildings';
import {rokehanReference} from './scene-reference';

test('external scene uses the sourced OSM camera node in latitude/longitude order, without guessing a place',()=>{
  const pack=parseBuildings(JSON.parse(readFileSync(new URL('../public/data/buildings-khao-lak-2.json',import.meta.url),'utf8')),'khao-lak-2');
  const raw=JSON.stringify(pack),url=new URL(rokehanReference(pack,'Bang Niang · บางเนียง')!);
  const params=new URLSearchParams(url.hash.slice(1));
  assert.equal(url.origin,'https://tools.oyasumi-gamedev.com');
  assert.equal(params.get('ll'),`${pack.walkStart!.coord[1]},${pack.walkStart!.coord[0]}`);
  assert.equal(params.get('n'),'Bang Niang · บางเนียง');
  assert.equal(JSON.stringify(pack),raw);
  assert.equal(rokehanReference(undefined,'Unknown'),null);
  assert.equal(rokehanReference({...pack,walkStart:null},'Unknown'),null);
});
