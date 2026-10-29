import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBangkokTime, cardinalDirection, solarPosition } from './orientation';

test('Bangkok clock uses UTC+7 including midnight rollover', () => {
  assert.equal(formatBangkokTime(new Date('2026-10-29T00:00:00Z')), '07:00:00');
  assert.equal(formatBangkokTime(new Date('2026-10-29T17:00:00Z')), '00:00:00');
});
test('direction bins are centered on their actual bearings', () => {
  for (const [bearing, label] of [[0,'N'],[45,'NE'],[90,'E'],[180,'S'],[270,'W'],[359,'N'],[-90,'W']] as const) assert.equal(cardinalDirection(bearing), label);
});
test('tropical noon sun crosses north in June, south in December', () => {
  const summer = solarPosition(new Date('2026-06-21T05:30:00Z'), 8.682, 98.264);
  const winter = solarPosition(new Date('2026-12-21T05:30:00Z'), 8.682, 98.264);
  assert.ok(summer.altitude > 70 && (summer.azimuth < 30 || summer.azimuth > 330));
  assert.ok(winter.altitude > 50 && winter.azimuth > 150 && winter.azimuth < 210);
  assert.ok(solarPosition(new Date('2026-06-21T17:00:00Z'), 8.682, 98.264).altitude < 0);
});
