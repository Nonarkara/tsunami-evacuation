import { getPosition } from 'suncalc';

const bangkokClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
/** Device time formatted in Bangkok; no external clock synchronization. */
export function formatBangkokTime(now: Date): string { return bangkokClock.format(now); }
export function cardinalDirection(azimuth: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((azimuth % 360 + 360) % 360) / 45) % 8];
}
export function solarPosition(now: Date, latitude: number, longitude: number) {
  return getPosition(now, latitude, longitude);
}
