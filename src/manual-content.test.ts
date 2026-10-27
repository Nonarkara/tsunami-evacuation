import { test } from 'node:test';
import assert from 'node:assert/strict';
import { manualLanguage } from './manual-content';

test('manual respects an explicit language before device preference and safely falls back',()=>{
  assert.equal(manualLanguage('?lang=en','th-TH'),'en');
  assert.equal(manualLanguage('?lang=th','en-US'),'th');
  assert.equal(manualLanguage('?lang=unknown','th-TH'),'th');
  assert.equal(manualLanguage('','fr-FR'),'en');
});
