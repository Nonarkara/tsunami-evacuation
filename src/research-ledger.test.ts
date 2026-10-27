import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evidenceCsv, bibtex, paperCitation, sourceRows, packageNames } from './research-ledger';
import { CITATION } from './research';

test('exported evidence retains both conditions, denominator, provenance and Thai names',()=>{
  const csv=evidenceCsv();
  assert.ok(csv.startsWith('\uFEFF')); // Excel must retain Thai, not silently decode as a local legacy encoding.
  const lines=csv.slice(1).split('\r\n');
  assert.equal(lines.length,6);
  const parse=(line:string)=>line.slice(1,-1).split('","').map(v=>v.replaceAll('""','"'));
  const values=lines.slice(1).map(parse);
  assert.deepEqual(values.map(r=>[r[2],r[3]]),[['21.8','22.6'],['7.0','10.6'],['3.7','5.6'],['1.3','3.4'],['1.2','2.9']]);
  for(const row of values){assert.equal(row[4],'39041');assert.equal(row[5],'https://ssrn.com/abstract=7270357');assert.ok(row[6].includes('§'));assert.equal(row[7],'reported model result');assert.match(row[1],/[ก-๙]/);}
});
test('citation and BibTeX follow the checked SSRN date and author order',()=>{
  for(const text of [CITATION,paperCitation]){assert.match(text,/Trumikaborworn, N\., Warnitchai, P\., & Latcharote, P\./);assert.match(text,/2026/);assert.doesNotMatch(text,/2024/);}
  assert.ok(bibtex.indexOf('Warnitchai, Pennung')<bibtex.indexOf('Latcharote, Panon'));
  assert.match(bibtex,/SSRN preprint/);assert.match(bibtex,/12 August 2026/);
});
test('every evidence record has unique ID, two language fields and explicit integration status',()=>{
  assert.equal(new Set(sourceRows.map(s=>s.id)).size,sourceRows.length);
  assert.deepEqual(sourceRows.filter(s=>s.kind==='candidate').map(s=>s.id),['R4','R5','R6']);
  for(const source of sourceRows){assert.equal(new URL(source.url).protocol,'https:');for(const field of [source.name,source.locator,source.status,source.use]){assert.ok(field.en.length>5);assert.ok(field.th.length>5);}}
  assert.equal(packageNames.length,5);
});
