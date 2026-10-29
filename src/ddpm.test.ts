import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DDPM_MAP_CREDIT, ddpmKhaoLakSheets, ddpmSheetUrls, parseRiskVillages, riskPoint, villageHit, villageSummary } from './ddpm';

const snapshot = JSON.parse(readFileSync(new URL('../public/data/ddpm-phang-nga-risk-villages-2026-10-28.geojson', import.meta.url), 'utf8'));

test('Phang Nga village snapshot keeps authority metadata and service coordinates', () => {
  const parsed = parseRiskVillages(snapshot);
  assert.equal(parsed.featureCount, 106);
  assert.equal(parsed.tier, 'authority-listed');
  assert.match(parsed.owner, /DDPM/);
  assert.equal(parsed.reviewedAt, '2026-10-28');
  assert.equal(parsed.retrievedAt, '2026-10-28T20:22:18+07:00');
  assert.equal(parsed.validUntil, '2027-04-28');
  assert.equal(parsed.heightField.display, 'omitted');
  assert.match(parsed.serviceResponseSha256, /^[a-f0-9]{64}$/);
  assert.equal(new Set(parsed.features.map(feature => feature.properties?.pname)).size, 1);
  const bangNiang = parsed.features.filter(feature => String(feature.properties?.Village ?? '').includes('บางเนียง'));
  assert.ok(bangNiang.length >= 1);
  for (const feature of bangNiang) assert.ok(feature.geometry.coordinates[0] > 98 && feature.geometry.coordinates[0] < 99);
});

test('village text shows the raw Risk code and leaves Height out', () => {
  const feature = snapshot.features.find((item: { properties: { Height: number } }) => item.properties.Height === 14.23);
  assert.equal(feature.properties.Village, 'บ้านบางเนียง');
  const hit = villageHit(feature.properties);
  assert.ok(hit);
  const line = villageSummary(hit);
  assert.match(line, /บ้านบางเนียง/);
  assert.match(line, /source Risk 4/);
  assert.equal(line.includes('14.23'), false);
  assert.equal(line.includes(String(feature.properties.X)), false);
  assert.equal(line.includes(String(feature.properties.People_All)), false);
  assert.deepEqual(Object.values(riskPoint), ['#fafaf7', '#12354e', 1.5]);
});

test('official Khao Lak sheets are external DDPM files with the published credit', () => {
  assert.equal(DDPM_MAP_CREDIT.th, 'แผนที่อพยพหนีภัยสึนามิ — กรมป้องกันและบรรเทาสาธารณภัย (DDPM), tsunami.disaster.go.th');
  assert.deepEqual(ddpmKhaoLakSheets.map(sheet => sheet.code), ['PG_6', 'PG_7', 'PG_10']);
  assert.deepEqual(ddpmSheetUrls('PG_7'), {
    pdf600: 'https://tsunami.disaster.go.th/maps/evacuation-maps/phang-nga/PG_7_600.pdf',
    pdf1600: 'https://tsunami.disaster.go.th/maps/evacuation-maps/phang-nga/PG_7_1600.pdf',
    jpg: 'https://tsunami.disaster.go.th/maps/evacuation-maps/phang-nga/PG_7.jpg',
  });
  assert.match(ddpmKhaoLakSheets[0].en, /Ban Bang Niang/);
  assert.match(ddpmKhaoLakSheets[1].en, /Khuk Khak/);
  assert.match(ddpmKhaoLakSheets[2].en, /2030/);
});

test('a depth field or a moved coordinate is rejected', () => {
  const moved = structuredClone(snapshot);
  moved.features[0].geometry.coordinates = [98, 8];
  assert.throws(() => parseRiskVillages(moved), /longitude/);
  const depth = structuredClone(snapshot);
  depth.features[0].properties.inundationDepth = 2;
  assert.throws(() => parseRiskVillages(depth), /depth/);
  const tier = structuredClone(snapshot);
  tier.tier = 'live';
  assert.throws(() => parseRiskVillages(tier), /schema/);
});
