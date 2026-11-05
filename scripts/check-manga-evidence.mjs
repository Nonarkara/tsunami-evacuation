import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rows=JSON.parse(readFileSync(new URL('../docs/evidence/recovery-2026-11-05/geometry.json',import.meta.url),'utf8'));
function check(row){
  const [width,height]=row.viewport;
  if(row.expected)assert.deepEqual(row.viewport,row.expected);
  assert.deepEqual(row.document,row.viewport,'No document scroll');assert.equal(row.header.h,36);
  assert.equal(row.phase,'ready');assert.equal(row.bars,1,'No duplicate renderer controls');
  assert.ok(row.stage.y>=42&&row.stage.y<=44);assert.ok(row.stage.h>=Math.min(400,height*.54),'Scene must use its working track');
  assert.ok(row.stage.bottom<=row.controls.y+1,'Controls stay outside the scene');
  for(const box of [row.caption,...row.buttons])assert.ok(box.x>=0&&box.right<=width+1&&box.bottom<=height+1);
  for(const box of row.dialogs){assert.ok(box.x>=0&&box.y>=0&&box.right<=width+1&&box.bottom<=height+1);const [sw,sh,cw,ch]=box.scroll;assert.ok(sw<=cw+1&&sh<=ch+1);if(row.case.startsWith('source-')&&width===390)assert.ok(box.h<=600,'Short source text must fit a compact dialog');}
}
for(const row of rows)check(row);
const desktop=rows.find(row=>row.viewport[0]===1440);
assert.throws(()=>check({...desktop,stage:{...desktop.stage,h:220}}),'Original fixed scene must fail');
const phone=rows.find(row=>row.viewport[0]===390);
assert.throws(()=>check({...phone,stage:{...phone.stage,h:260}}),'Original phone cap must fail');
const source=rows.find(row=>row.case==='source-en');
assert.throws(()=>check({...source,dialogs:[{...source.dialogs[0],h:796}]}),'Original nearly-full-screen source dialog must fail');
console.log(`PASS ${rows.length} fresh manga geometry cases; original220/260px caps rejected.`);
