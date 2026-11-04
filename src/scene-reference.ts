import type { BuildingPack } from './buildings';

/** External illustration at an existing OSM node, never a generated route/refuge or guessed centre. */
export function rokehanReference(pack: BuildingPack | undefined, name: string): string | null {
  const start=pack?.walkStart;
  if(!start || !/^node\/\d+$/.test(start.node) || !/^way\/\d+$/.test(start.way))return null;
  const [lng,lat]=start.coord;
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>85||Math.abs(lng)>180)return null;
  const url=new URL('https://tools.oyasumi-gamedev.com/rokehan/');
  url.hash=new URLSearchParams({ll:`${lat},${lng}`,s:'100',tod:'day',far:'4',n:name}).toString();
  return url.href;
}
