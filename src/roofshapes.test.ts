import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseBuildings } from './buildings';
import { parseRoofShapes, ridgeLine, applyRoofShapes, roofRidges } from './roofshapes';
const read=(name:string)=>JSON.parse(readFileSync(new URL(`../public/data/${name}`,import.meta.url),'utf8'));
const pack=parseBuildings(read('buildings-khao-lak-2.json'),'khao-lak-2');
const roofs=read('roofs-khao-lak-2.json');
test('roof pack describes its own building pack and only judged roofs become records',()=>{
  const judged=parseRoofShapes(roofs,'khao-lak-2',pack);
  assert.equal(judged.size,1);
  const record=judged.get('way/659714874');
  assert.ok(record);
  assert.equal(record.shape,'gable');
  assert.equal(record.method,'sheet');
  assert.equal(record.confidence,'medium');
  assert.ok(record.reason.length>10);
  assert.ok(record.imagery.url.startsWith('https://'));
  assert.ok(Number.isFinite(Date.parse(record.imagery.retrievedAt)));
  assert.match(record.classifiedBy,/mcode-tools:/);
});
test('roof boundary rejects area mismatch, foreign footprints, bad shapes and missing provenance',()=>{
  assert.throws(()=>parseRoofShapes(roofs,'phuket-0',pack));
  const foreign=structuredClone(roofs);
  foreign.features=foreign.features.filter((f:any)=>f.properties.roofShape).map((f:any)=>({...f,geometry:structuredClone(pack.features[0].geometry)}));
  assert.throws(()=>parseRoofShapes(foreign,'khao-lak-2',pack));
  const badShape=structuredClone(roofs);badShape.features.find((f:any)=>f.properties.roofShape).properties.roofShape='hip';assert.throws(()=>parseRoofShapes(badShape,'khao-lak-2',pack));
  const noReason=structuredClone(roofs);noReason.features.find((f:any)=>f.properties.roofShape).properties.roofReason='';assert.throws(()=>parseRoofShapes(noReason,'khao-lak-2',pack));
  const noImagery=structuredClone(roofs);delete noImagery.features.find((f:any)=>f.properties.roofShape).properties.roofImagery;assert.throws(()=>parseRoofShapes(noImagery,'khao-lak-2',pack));
  const dup=structuredClone(roofs);const gable=dup.features.find((f:any)=>f.properties.roofShape);dup.features.push(structuredClone(gable));assert.throws(()=>parseRoofShapes(dup,'khao-lak-2',pack));
  const outside=structuredClone(roofs);outside.features.find((f:any)=>f.properties.roofShape).properties.osm='way/1';assert.throws(()=>parseRoofShapes(outside,'khao-lak-2',pack));
});
test('ridge line follows the footprint long axis through its centre',()=>{
  const box=[[0,0],[0.002,0],[0.002,0.0005],[0,0.0005],[0,0]];
  const ridge=ridgeLine(box);
  assert.equal(ridge.length,2);
  // 0.002° of longitude ≈ 219 m; 0.0005° of latitude ≈ 55 m, so the ridge runs east–west.
  assert.ok(Math.abs(ridge[0][1]-ridge[1][1])<1e-6);
  assert.ok(ridge[1][0]-ridge[0][0]>0.001);
});
test('applying roofs conserves features and leaves unjudged buildings null',()=>{
  const judged=parseRoofShapes(roofs,'khao-lak-2',pack);
  const applied=applyRoofShapes(pack.features,judged);
  assert.equal(applied.length,pack.features.length);
  const shapes=applied.map(f=>f.properties.roofShape);
  assert.equal(shapes.filter(s=>s==='gable').length,1);
  assert.equal(shapes.filter(s=>s===null).length,pack.features.length-1);
  const ridges=roofRidges(applied as never);
  assert.equal(ridges.features.length,1);
  assert.equal(ridges.features[0].geometry.coordinates.length,2);
});
