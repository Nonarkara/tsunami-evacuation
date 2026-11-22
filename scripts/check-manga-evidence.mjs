import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rows=JSON.parse(readFileSync(new URL('../docs/evidence/recovery-2026-11-05/geometry.json',import.meta.url),'utf8'));
function check(row){
  const [width,height]=row.viewport;
  if(row.expected)assert.deepEqual(row.viewport,row.expected);
  assert.deepEqual(row.document,row.viewport,'No document scroll');assert.equal(row.header.h,36);
  assert.equal(row.phase,'ready');
  // The renderer controls must exist, and the reader must never see two rows
  // of them. A control group inside a closed dialog is not on screen, so the
  // count of visible rows can be zero — but it can never be two.
  assert.ok(row.controlsInDom>=1,'The renderer controls must exist');
  assert.ok(row.bars<=1,'No duplicate renderer controls');
  if(row.case.startsWith('manga-'))assert.equal(row.bars,1,'The manga surface must show its control bar');
  assert.ok(row.stage.y>=42&&row.stage.y<=44);assert.ok(row.stage.h>=Math.min(400,height*.54),'Scene must use its working track');
  // Controls and attribution must not lie on top of the scene. The camera
  // controls are docked into the banner at wide widths and into the Map
  // controls dialog on a phone, so the check is that they do not overlap the
  // scene, not that they sit below it.
  if(row.controls)assert.ok(row.controls.bottom<=row.stage.y+1||row.controls.y>=row.stage.bottom-1,'Controls stay outside the scene');
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
// A control row lying on top of the scene must be rejected, two control rows
// on screen at once must be rejected, and controls that are not there at all
// must be rejected.
const withControls=rows.find(row=>row.controls);
if(withControls)assert.throws(()=>check({...withControls,controls:{...withControls.controls,y:withControls.stage.y+4,bottom:withControls.stage.y+24}}),'A control row over the scene must fail');
assert.throws(()=>check({...desktop,bars:2}),'Two control rows on screen must fail');
assert.throws(()=>check({...desktop,controlsInDom:0}),'Missing renderer controls must fail');
console.log(`PASS ${rows.length} fresh manga geometry cases; original220/260px caps, an overlaid control row and a duplicate row rejected.`);
