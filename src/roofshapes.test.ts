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
  // Six gables and two pitched roofs carry a reading; the rest are explicit nulls.
  assert.equal(judged.size,8);
  const record=judged.get('way/659714874');
  assert.ok(record);
  assert.equal(record.shape,'gable');
  assert.equal(record.method,'sheet');
  assert.equal(record.confidence,'medium');
  assert.ok(record.reason.length>10);
  assert.ok(record.imagery!.url.startsWith('https://'));
  assert.ok(Number.isFinite(Date.parse(record.imagery!.retrievedAt)));
  assert.match(record.classifiedBy,/mcode-tools:/);
});
test('a roof stated by the source keeps its tag, value and snapshot receipt',()=>{
  const judged=parseRoofShapes(roofs,'khao-lak-2',pack);
  const stated=judged.get('way/659714712');
  assert.ok(stated);
  assert.equal(stated.shape,'gable');
  assert.equal(stated.method,'osm-tag');
  assert.equal(stated.confidence,'high');
  assert.equal(stated.osmTag!.tag,'roof:shape');
  assert.equal(stated.osmTag!.value,'gabled');
  assert.equal(stated.osmTag!.provider,'OpenStreetMap');
  assert.ok(stated.osmTag!.url.startsWith('https://'));
  assert.match(stated.osmTag!.sha256,/^[0-9a-f]{64}$/);
  assert.ok(Number.isFinite(Date.parse(stated.osmTag!.retrievedAt)));
  assert.equal(stated.imagery,undefined);
  const pitched=judged.get('way/659461964');
  assert.equal(pitched!.shape,'pitched');
  assert.equal(pitched!.osmTag!.value,'pyramidal');
});
test('roof boundary rejects area mismatch, foreign footprints, bad shapes and missing provenance',()=>{
  assert.throws(()=>parseRoofShapes(roofs,'phuket-0',pack));
  const foreign=structuredClone(roofs);
  foreign.features=foreign.features.filter((f:any)=>f.properties.roofShape).map((f:any)=>({...f,geometry:structuredClone(pack.features[0].geometry)}));
  assert.throws(()=>parseRoofShapes(foreign,'khao-lak-2',pack));
  const badShape=structuredClone(roofs);badShape.features.find((f:any)=>f.properties.roofShape).properties.roofShape='hip';assert.throws(()=>parseRoofShapes(badShape,'khao-lak-2',pack));
  const noReason=structuredClone(roofs);noReason.features.find((f:any)=>f.properties.roofShape).properties.roofReason='';assert.throws(()=>parseRoofShapes(noReason,'khao-lak-2',pack));
  // An image reading without its imagery provenance, and a stated reading without
  // its snapshot receipt, are both refused.
  const noImagery=structuredClone(roofs);delete noImagery.features.find((f:any)=>f.properties.roofMethod==='sheet').properties.roofImagery;assert.throws(()=>parseRoofShapes(noImagery,'khao-lak-2',pack));
  const noOsm=structuredClone(roofs);delete noOsm.features.find((f:any)=>f.properties.roofMethod==='osm-tag').properties.roofOsm;assert.throws(()=>parseRoofShapes(noOsm,'khao-lak-2',pack));
  const badSha=structuredClone(roofs);badSha.features.find((f:any)=>f.properties.roofMethod==='osm-tag').properties.roofOsm.sha256='not-a-hash';assert.throws(()=>parseRoofShapes(badSha,'khao-lak-2',pack));
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
  assert.equal(shapes.filter(s=>s==='gable').length,6);
  assert.equal(shapes.filter(s=>s==='pitched').length,2);
  assert.equal(shapes.filter(s=>s===null).length,pack.features.length-8);
  // Only a gable has one ridge line; a pitched roof without one draws nothing.
  const ridges=roofRidges(applied as never);
  assert.equal(ridges.features.length,6);
  assert.equal(ridges.features[0].geometry.coordinates.length,2);
  assert.ok(ridges.features.every(f=>f.properties?.roofShape==='gable'));
});
test('the pack counts agree with the readings it holds',()=>{
  const judged=parseRoofShapes(roofs,'khao-lak-2',pack);
  const detail=roofs.coverageDetail as Record<string,any>;
  assert.equal(detail.classified,judged.size);
  assert.equal(detail.considered,roofs.features.length);
  assert.equal(detail.buildingsInArea,pack.features.length);
  const bySource=detail.bySource as Record<string,number>;
  const stated=Array.from(judged.values()).filter(r=>r.method==='osm-tag').length;
  const judgedImagery=Array.from(judged.values()).filter(r=>r.method!=='osm-tag').length;
  assert.equal(bySource['osm-tag'],stated);
  assert.equal(bySource['aerial-imagery-classification'],judgedImagery);
  assert.equal(stated+judgedImagery,judged.size);
});
