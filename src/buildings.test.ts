import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseBuildings, cameraStep, EYE_HEIGHT_M, UNKNOWN_BUILDING_MASSING_M, buildingAreaId } from './buildings';
import { coastalRegions, satelliteToolkits } from './research';
import { distance } from './crowd';
const read=(name:string)=>JSON.parse(readFileSync(new URL(`../public/data/${name}`,import.meta.url),'utf8'));
const index=read('buildings-index.json');
test('all17listed places have separate sourced building snapshots and count conservation',()=>{
  assert.equal(index.entries.length,coastalRegions.reduce((n,r)=>n+r.places.length,0));
  for(const r of coastalRegions)for(let i=0;i<r.places.length;i++){
    const id=buildingAreaId(r.id,i),pack=parseBuildings(read(`buildings-${id}.json`),id);
    assert.equal(pack.features.length,pack.counts.total);
    assert.ok(pack.walkStart);assert.match(pack.walkStart.node,/^node\/\d+$/);
    assert.equal(pack.counts.heightTag+pack.counts.levelsEstimate+pack.counts.unknown,pack.counts.total);
    for(const f of pack.features){const p=f.properties;if(p.heightSource==='unknown')assert.equal(p.height,null);assert.ok(!('base' in p));}
  }
});
test('building boundary rejects wrong area, broken rings and fabricated unknown heights',()=>{
  const good=read('buildings-khao-lak-2.json');
  assert.throws(()=>parseBuildings(good,'phuket-0'));
  const unclosed=structuredClone(good);unclosed.features[0].geometry.coordinates[0].pop();assert.throws(()=>parseBuildings(unclosed,'khao-lak-2'));
  const invented=structuredClone(good);invented.features.find((f:{properties:{heightSource:string}})=>f.properties.heightSource==='unknown').properties.height=6;assert.throws(()=>parseBuildings(invented,'khao-lak-2'));
  const missingBounds=structuredClone(good);delete missingBounds.queryBounds;assert.throws(()=>parseBuildings(missingBounds,'khao-lak-2'));
  const flat=structuredClone(good);flat.features[0].geometry.coordinates=[[[0,0],[1,1],[2,2],[0,0]]];assert.throws(()=>parseBuildings(flat,'khao-lak-2'));
  const counts=structuredClone(good);counts.counts.total--;assert.throws(()=>parseBuildings(counts,'khao-lak-2'));
});
test('eyeheight is1.65m and optional unknown-height massing is3m without changing source heights',()=>{
  assert.equal(EYE_HEIGHT_M,1.65);assert.equal(UNKNOWN_BUILDING_MASSING_M,3);
  const a:[number,number]=[98.253,8.667], b=cameraStep(a,0,2), c=cameraStep(a,90,2);
  assert.ok(b[1]>a[1]);assert.ok(c[0]>a[0]);assert.ok(Math.abs(distance(a,b)-2)<.01);
  assert.throws(()=>cameraStep(a,0,Infinity));
});
test('disconnected instrument records cannot report fake online readings',()=>{
  for(const s of satelliteToolkits){assert.equal(s.status,'NOT_CONNECTED');assert.equal(s.value,'Not connected');assert.equal(new URL(s.sourceUrl).protocol,'https:');}
});
