import { useEffect, useMemo, type RefObject } from 'react';
import type { GeoJSONSource, Map as LibreMap } from 'maplibre-gl';
import { waterScreen, type TerrainGrid } from './crowd';
import { replayAt, replayFramePolygons, type HazardReplay } from './rehearsal';
import type { ReplayWaterLayer } from './ReplayWaterLayer';
import { depthColourExpression, fileDepthScale } from './water-depth';

const dry: GeoJSON.FeatureCollection<GeoJSON.Polygon> = { type: 'FeatureCollection', features: [] };

type WaterOptions = {
  map: RefObject<LibreMap | null>;
  layer: RefObject<ReplayWaterLayer | null>;
  ready: boolean;
  visible: boolean;
  dimension: '2d' | '3d';
  surfaceError: boolean;
  grid?: TerrainGrid;
  level?: number;
  replay?: HazardReplay;
  seconds: number;
};

export function useTerrainWater({ map, layer, ready, visible, dimension, surfaceError, grid, level, replay, seconds }: WaterOptions) {
  const replaySeconds = replay ? seconds : 0;
  const frame = useMemo(() => replay ? replayAt(replay, replaySeconds) : null, [replay, replaySeconds]);
  const fill = useMemo(() => replay ? depthColourExpression(fileDepthScale(replay.frames)) : '#3b99ca', [replay]);
  const thresholds = useMemo(() => grid ? [...new Set(grid.heights)].sort((a, b) => b - a) : [], [grid]);
  // The mask changes only when a DEM height crosses the selected plane.
  // The 3D surface still uses the continuous demonstration level.
  const threshold = level === undefined || replay ? undefined : thresholds.find(height => height <= level);
  const polygons = useMemo(() => {
    if (replay) return frame ? replayFramePolygons(replay.grid, frame) : dry;
    return grid && threshold !== undefined ? waterScreen(grid, threshold) : dry;
  }, [replay, frame, grid, threshold]);
  const surfaceLevel = replay ? undefined : level;

  useEffect(() => {
    if (!ready) return;
    (map.current?.getSource('water') as GeoJSONSource | undefined)?.setData(polygons);
  }, [map, ready, polygons]);
  useEffect(() => {
    if (!ready) return;
    const hasSurface = layer.current?.update(polygons, surfaceLevel) ?? false;
    if (map.current?.getLayer('water')) {
      map.current.setPaintProperty('water', 'fill-opacity', dimension === '3d' && !surfaceError && hasSurface ? .12 : .48);
      map.current.setPaintProperty('water', 'fill-color', fill);
    }
  }, [map, layer, ready, polygons, surfaceLevel, dimension, surfaceError, fill]);
  useEffect(() => {
    if (ready) layer.current?.setVisible(dimension === '3d' && visible);
  }, [layer, ready, dimension, visible]);
  return frame;
}
