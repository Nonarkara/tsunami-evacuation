import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../docs/evidence/playback-data-2026-11-12/', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name, base), 'utf8'));
const fits = (box, frame) => box.x >= frame.x - 1 && box.right <= frame.right + 1 &&
  box.y >= frame.y - 1 && box.bottom <= frame.bottom + 1;

const results = read('geometry.json');
assert.equal(results.length, 16);
function checkResults(row) {
  assert.deepEqual(row.viewport, row.expected);
  assert.deepEqual(row.document, row.viewport);
  assert.equal(row.header.h, 36);
  assert.ok(fits(row.outcome, row.window), 'Outcome must fit on the opening page');
  assert.ok(fits(row.button, row.results), 'Data must be reachable on the opening page');
  if (row.viewport[0] !== 667) {
    assert.ok(fits(row.axis, row.window), 'Package controls must fit with the chart');
    assert.ok(row.axis.h >= 32, 'Package controls must remain intact');
  }
}
results.forEach(checkResults);
const desktop = results.find(row => row.viewport[0] === 1440);
const stackedChartBottom = desktop.outcome.bottom + 500 + desktop.axis.h;
assert.throws(() => checkResults({ ...desktop, axis: { ...desktop.axis, bottom: stackedChartBottom } }));

const dialogs = read('data-dialogs.json');
assert.equal(dialogs.length, 6);
for (const row of dialogs) {
  assert.deepEqual(row.document, row.expected);
  assert.ok(fits(row.files, row.dialog));
  assert.ok(row.dialog.bottom <= row.viewport[1]);
  assert.equal(row.focus.open, 0);
  assert.equal(row.focus.label, row.lang === 'th' ? 'ข้อมูลและไฟล์ต้นทาง' : 'Data & sources');
}
const pages = read('thai-landscape-pages.json');
assert.equal(pages.length, 3);
assert.ok(fits(pages[1].axis, pages[1].window));
assert.ok(pages.every(row => row.button.x === pages[0].button.x));
console.log('PASS 16 Results cases, 6 data dialogs and Thai landscape pagination.');
