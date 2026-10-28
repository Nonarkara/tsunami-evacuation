import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDrillArchive } from './drill-log';

test('legacy drill counts and dated follow-up records survive archive validation in order',()=>{
  const legacy={participants:25,reached:24,assisted:2,minutes:8};
  const current={...legacy,recordedAt:'2026-10-28T01:00:00Z',route:'Synthetic test route',review:'Check gate with coordinator'};
  const source=[legacy,current];const before=JSON.stringify(source);
  assert.deepEqual(parseDrillArchive(source),{records:source,invalid:0});
  assert.equal(JSON.stringify(source),before);
});
test('corrupt drill archives are counted rather than treated as writable empty history',()=>{
  assert.deepEqual(parseDrillArchive(null),{records:[],invalid:1});
  const result=parseDrillArchive([null,'bad',{participants:2,reached:3,assisted:0,minutes:5},{participants:2,reached:1,assisted:0,minutes:5}]);
  assert.equal(result.invalid,3);assert.equal(result.records.length,1);
  assert.equal(parseDrillArchive([{participants:2,reached:1,assisted:0,minutes:5,recordedAt:'not a date'}]).invalid,1);
});
