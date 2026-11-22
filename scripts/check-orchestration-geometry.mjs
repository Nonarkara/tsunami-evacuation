import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Recorded actual browser geometry, not inferred CSS. Refresh receipts after layout changes.
const root=new URL('../docs/evidence/orchestration-2026-11-04/',import.meta.url);
const read=name=>JSON.parse(readFileSync(new URL(`${name}.json`,root),'utf8'));
function fits(rect,[width,height]) {
  return rect&&rect.x>=0&&rect.y>=0&&rect.right<=width+1&&rect.bottom<=height+1;
}
function check(row) {
  const viewport=row.viewport;
  if(row.expectedViewport)assert.deepEqual(viewport,row.expectedViewport);
  if(!row.document)return;
  assert.deepEqual(row.document,viewport,`${row.case}: document overflow`);
  assert.equal(row.banner.h,36);
  if(row.map){assert.ok(row.map.y>=42&&row.map.y<=44);assert.ok(fits(row.map,viewport));}
  if(row.caption)assert.ok(row.caption.h<=60,`${row.case}: caption exceeds60px budget`);
  if(row.start)assert.ok(fits(row.start,viewport),`${row.case}: Start outside screen`);
  for(const dialog of row.dialogs??[]){
    assert.ok(fits({...dialog,right:dialog.x+dialog.w,bottom:dialog.y+dialog.h},viewport));
    const [sw,sh,cw,ch]=dialog.scroll;assert.ok(sw<=cw+1&&sh<=ch+1,`${row.case}: dialog overflow`);
    if(row.case.startsWith('ddpm-expanded'))assert.equal(dialog.pages,'1');
  }
  if(row.case.startsWith('escape-')||row.case.startsWith('edge-'))assert.ok(fits(row.turn,viewport),`${row.case}: first direction cue missing`);
  // The enlargement the reader feels is the reading text's own size: the body
  // element carries the title scale, so the size is measured where it is read.
  if(row.case.startsWith('large-'))assert.equal(row.readingSize,'16.25px',`${row.case}: reading text is not enlarged to 125%`);
}
let count=0;
for(const [name,expected] of [['geometry',12],['expanded',6],['large-text',6],['other-workspaces',18],['locate-edges',4],['edges',3]]){
  const rows=read(name);assert.equal(rows.length,expected);
  for(const row of rows){check(row);count++;}
}
const original=read('geometry-before-caption').find(row=>row.caption?.h>60);
assert.ok(original,'Original defect receipt must remain');
assert.throws(()=>check(original),'The original86px caption must fail this budget');
assert.throws(()=>check({...read('expanded')[0],dialogs:[{x:16,y:16,w:900,h:852,scroll:[900,852,900,852]}]}),'Oversized legacy dialog must fail');
// The enlargement check must be able to fail: a reading text left at the
// standard size has to be rejected, not passed.
const unEnlarged=read('large-text').find(row=>row.case.startsWith('large-'));
assert.throws(()=>check({...unEnlarged,readingSize:'13px'}),'An unenlarged reading text must fail');
console.log(`PASS ${count} browser geometry receipts; original caption, dialog and unenlarged text rejected.`);
