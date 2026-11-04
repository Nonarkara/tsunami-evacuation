import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coastalRegions} from './research';
import {placeReference} from './place-references';
import {parseBuildings} from './buildings';

test('all context pins match original OSM street-node coordinates and complete source receipts',()=>{
  let count=0;
  for(const region of coastalRegions)for(const [index] of region.places.entries()){
    const id=`${region.id}-${index}`,pack=parseBuildings(JSON.parse(readFileSync(new URL(`../public/data/buildings-${id}.json`,import.meta.url),'utf8')),id),reference=placeReference(region.id,index);
    assert.ok(reference);assert.ok(pack.walkStart);
    assert.deepEqual(reference.coord,pack.walkStart.coord);
    for(const key of ['node','way'] as const)assert.equal(reference[key],pack.walkStart[key]);
    for(const key of ['sourceUrl','retrievedAt','rawSha256'] as const)assert.equal(reference[key],pack[key]);
    count++;
  }
  assert.equal(count,17);
  assert.equal(placeReference('unknown',0),undefined);
  assert.equal(placeReference('khao-lak',99),undefined);
});
