import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../docs/evidence/resume-audit-2026-11-03/',import.meta.url);
const read=name=>JSON.parse(readFileSync(new URL(name,base),'utf8'));
const geometry=read('geometry.json'), tasks=read('task-visibility.json'), expanded=read('expanded.json'), edges=read('edges.json');
assert.equal(geometry.length,36,'five workspaces plus method, both languages, three sizes');
for(const r of geometry){
  assert.deepEqual(r.document,r.viewport,`document fit: ${r.case} ${r.viewport}`);
  assert.equal(r.header.h,36,'combined scene banner');
  if(r.stage)assert.ok(r.stage.y>=42&&r.stage.y<=44,'scene starts below single banner');
}
assert.equal(tasks.length,6);
for(const r of tasks)for(const t of r.task)assert.equal(t.firstScreen,true,`${t.selector}: ${r.viewport}`);
function checkDialog(d,viewport){
  assert.ok(d.rect.w<=660&&d.rect.w<=viewport[0]-24,'method width fits reading measure');
  assert.ok(d.rect.y>=0&&d.rect.y+d.rect.h<=viewport[1]+1,'method height fits viewport');
  assert.ok(d.scroll[0]<=d.scroll[2]+2&&d.scroll[1]<=d.scroll[3]+2,'no dialog scrolling');
}
assert.equal(expanded.length,4);
for(const r of expanded){
  assert.deepEqual(r.document,r.viewport);
  checkDialog(r.dialogs.at(-1),r.viewport);
  for(const c of r.checkboxes)assert.ok(c.width<=20&&c.height<=20,'intrinsic checkbox size');
  for(const family of r.families)assert.match(family,/^(Jost|Prompt)/,'house primary family');
}
assert.equal(edges.length,11);
for(const r of edges){
  assert.deepEqual(r.document,r.viewport);assert.equal(r.header,36);
  const d=r.dialog;checkDialog({rect:d,scroll:[d.scrollW,d.scrollH,d.clientW,d.clientH]},r.viewport);
}
// Counterfactual only in memory: the old 900px dialog must fail the new reading budget.
const old=structuredClone(expanded.find(r=>r.viewport[0]===1440));old.dialogs.at(-1).rect.w=900;
assert.throws(()=>checkDialog(old.dialogs.at(-1),old.viewport));
console.log('PASS: 36 primary cases, 6 task pairs, 4 expanded dialogs, 11 edges; old 900px dialog rejected.');
