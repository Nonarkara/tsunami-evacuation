import { emptyEvidence } from './provenance';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDdpmRow, provinceByCode, ddpmInspection as data, ddpmDatasetEvidence } from './ddpm';

test('full DDPM file includes Andaman provinces and all reported Risk codes',()=>{
  assert.equal(data.rows,1416);
  assert.equal(data.provinces.length,22);
  assert.equal(provinceByCode(82)?.rows,106);
  assert.equal(provinceByCode(83)?.rows,69);
  assert.equal(provinceByCode(94)?.nameTh,'ปัตตานี');
  assert.deepEqual(data.riskCodes,{'1':1232,'2':98,'3':73,'4':13});
  assert.equal(data.provinces.reduce((n,p)=>n+p.rows,0),data.rows);
  assert.equal(Object.values(data.riskCodes).reduce((n,v)=>n+v,0),data.rows);
});
test('inspection retains missingness, separate dates and unknown Height units',()=>{
  assert.equal(data.missing.People_All,257);
  assert.equal(data.missing.House,257);
  assert.equal(data.missing.mcode,248);
  assert.equal(data.heightRaw.unit,null);
  assert.deepEqual([data.heightRaw.min,data.heightRaw.max],[0,19.6]);
  assert.equal(data.statedDataUpdated,'2024-01-30');
  assert.equal(data.resourceModified.slice(0,10),'2024-11-14');
  assert.equal(ddpmDatasetEvidence.retrievedAt,data.retrievedAt);
  assert.equal(emptyEvidence('unknown','https://example.com').retrievedAt,null);
  assert.equal(data.csvSha256,'382656389fad630a83ce590ba98b15afa4402e2a42281bc691e990c3e2f3899a');
});
test('CSV numeric blanks never become zero and raw strings remain available',()=>{
  const row={pcode:' ',Height:'0',Risk:'2',People_All:' NULL ',House:' ',X:'696258.2',OID1:''};
  const parsed=parseDdpmRow(row);
  assert.equal(parsed.pcode,null);
  assert.equal(parsed.peopleAll,null);
  assert.equal(parsed.house,null);
  assert.equal(parsed.height,0);
  assert.equal(parsed.risk,2);
  assert.equal(parsed.sourceX,696258.2);
  assert.deepEqual(parsed.raw,row);
  row.Height='9'; assert.equal(parsed.raw.Height,'0');
});
