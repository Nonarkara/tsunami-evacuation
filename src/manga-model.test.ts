import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { parseBuildings } from './buildings';
import {decodeManga,mangaCoordinates} from './manga/data';
const read=(name:string)=>JSON.parse(readFileSync(new URL(`../public/data/${name}`,import.meta.url),'utf8'));

/** Decode the baked manga binary the same way the renderer does. */
function decode(){
  const gz=readFileSync(new URL('../public/model/bang-niang.bin.gz',import.meta.url));
  const raw=gunzipSync(gz);
  return decodeManga(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength) as ArrayBuffer);
}

test('the manga binary describes the published Bang Niang pack exactly',()=>{
  const {H,bLen}=decode();
  const pack=parseBuildings(read('buildings-khao-lak-2.json'),'khao-lak-2');
  assert.equal(H.area,'khao-lak-2');
  assert.equal(H.nB,pack.features.length);
  assert.equal(H.nBV,pack.features.reduce((n:number,f:any)=>n+f.geometry.coordinates[0].length-1,0));
  assert.equal(bLen.every((n:number)=>n>=3),true,'building rings are non-degenerate');
  assert.ok(H.nR>0&&H.nW>0&&H.nP>0,'streets, water and parks must be present');
  assert.ok(H.sources.buildings.sha256===pack.rawSha256);
  assert.match(H.sources.osm.url,/api\.openstreetmap\.org\/api\/0\.6\/map\.json\?bbox=/);
  assert.match(H.attribution,/OpenStreetMap contributors/);
});

test('every rendered footprint vertex matches the original source within half a quantization unit',()=>{
  const {H,bXY}=decode(),coordinates=mangaCoordinates(bXY,H.q,H.bbox);
  const pack=parseBuildings(read('buildings-khao-lak-2.json'),'khao-lak-2');
  const mx=111320*Math.cos(H.origin[0]*Math.PI/180),my=110574;
  let offset=0;
  for(const feature of pack.features)for(const [lng,lat] of feature.geometry.coordinates[0].slice(0,-1)){
    const x=(lng-H.origin[1])*mx,z=-(lat-H.origin[0])*my;
    assert.ok(Math.abs(coordinates[offset++]-x)<=H.q/2+1e-6);
    assert.ok(Math.abs(coordinates[offset++]-z)<=H.q/2+1e-6);
  }
  assert.equal(offset,coordinates.length);
  assert.throws(()=>decodeManga(new ArrayBuffer(8)));
});

test('height truth in the bake: only explicit source heights draw volume',()=>{
  const {H,bH,bK}=decode();
  const pack=parseBuildings(read('buildings-khao-lak-2.json'),'khao-lak-2');
  const tagged=pack.features.filter(f=>f.properties.heightSource==='heightTag').length;
  const floored=pack.features.filter(f=>f.properties.heightSource==='levelsEstimate').length;
  assert.equal(tagged,0,'this pack has no height tags today');
  // Every building with a non-explicit height bakes flat, never at a 3 m fallback.
  for(const h of bH)assert.equal(h,0);
  for(const k of bK)assert.equal(k,0);
  assert.equal(H.nB-tagged-floored,pack.features.length-floored);
  assert.match(H.notes,/only explicit source heights draw volume/);
});

test('quantized coordinates stay inside Int16 and rings stay non-degenerate',()=>{
  const {H,bLen,rLen,wLen,pLen}=decode();
  assert.equal(bLen.every((n:number)=>n>=3),true);
  assert.equal(rLen.every((n:number)=>n>=2),true);
  assert.equal(wLen.every((n:number)=>n>=3),true);
  assert.equal(pLen.every((n:number)=>n>=3),true);
  const [x0,z0,x1,z1]=H.bbox;
  assert.ok((x1-x0)/H.q<64000&&(z1-z0)/H.q<64000);
  assert.ok(Number.isFinite(H.q)&&H.q>0);
});
