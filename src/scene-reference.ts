import type { BuildingPack } from './buildings';

/** Rokehan — "どこでもロケハン" / Location Scout, by MIYADAIKU / おやすみゲーム開発部.
 *  An external tool that draws a manga-style 3D scene from OpenStreetMap plus elevation.
 *  It fills in the heights and scene detail this project does not have, so its output is
 *  an illustration, never a survey, a street photograph or an evacuation path. */
export const ROKEHAN_ORIGIN = 'https://tools.oyasumi-gamedev.com/rokehan/';

/** The tool's own four time-of-day values. Its own stylised light, not a solar model. */
export type SceneTimeOfDay = 'day' | 'dusk' | 'night' | 'late';

/** The app cameras a scene can be matched to. */
export type SceneCamera = 'walk' | 'route' | 'overview';

export interface RokehanScene {
  /** The permalink that opens the tool at this place, light and scale. */
  url: string;
  /** The sourced OSM node the scene is anchored to. */
  node: string;
  timeOfDay: SceneTimeOfDay;
  /** Near-area radius in metres — the tool's own "Size" menu values. */
  nearMetres: number;
  /** Surroundings distance in kilometres — the tool's own "Surroundings" menu values. */
  farKilometres: number;
  name: string;
}

/** Map the sun's altitude onto the tool's four time-of-day bands.
 *  Approximate on purpose: the tool renders a stylised light, so this only has to
 *  put the scene in the same part of the day as the app's own sun indicator. */
export function sceneTimeOfDay(solarAltitudeDeg: number): SceneTimeOfDay {
  if (!Number.isFinite(solarAltitudeDeg)) return 'day';
  if (solarAltitudeDeg >= 12) return 'day';
  if (solarAltitudeDeg >= 0) return 'dusk';
  if (solarAltitudeDeg >= -6) return 'night';
  return 'late';
}

/** Match what the app is showing to the tool's own size and surroundings options.
 *  Every value here is one of the tool's menu entries, in metres and kilometres —
 *  nothing outside the range the tool offers. */
export function sceneScale(camera: SceneCamera): { nearMetres: number; farKilometres: number } {
  if (camera === 'walk') return { nearMetres: 100, farKilometres: 1 };
  if (camera === 'route') return { nearMetres: 300, farKilometres: 2 };
  return { nearMetres: 600, farKilometres: 4 };
}

/** The scene for a place, anchored to the OSM node the walk-through starts from.
 *  Returns null when no sourced node is available — the app never guesses a centre. */
export function rokehanScene(pack: BuildingPack | undefined, options: {
  name: string;
  timeOfDay?: SceneTimeOfDay;
  camera?: SceneCamera;
  language?: 'en' | 'th';
}): RokehanScene | null {
  const start = pack?.walkStart;
  if (!start || !/^node\/\d+$/.test(start.node) || !/^way\/\d+$/.test(start.way)) return null;
  const [lng, lat] = start.coord;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) return null;
  const timeOfDay = options.timeOfDay ?? 'day';
  const { nearMetres, farKilometres } = sceneScale(options.camera ?? 'overview');
  const url = new URL(ROKEHAN_ORIGIN);
  if (options.language === 'th') url.searchParams.set('lang', 'th');
  url.hash = new URLSearchParams({
    ll: `${lat.toFixed(6)},${lng.toFixed(6)}`,
    s: String(nearMetres),
    tod: timeOfDay,
    far: String(farKilometres),
    n: options.name,
  }).toString();
  return { url: url.href, node: start.node, timeOfDay, nearMetres, farKilometres, name: options.name };
}
