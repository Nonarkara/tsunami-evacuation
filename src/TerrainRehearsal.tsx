import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import terrainWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(terrainWorker);
import { ReplayWaterLayer } from './ReplayWaterLayer';
import { StudyMap } from './Map';
import type { CoastalRegion } from './research';
import { areaPacks, alongRoute, walkerProgress, nextTurn, routeArrows, demonstrationLevel, parseHazardReplay, replayAt, replayPolygons, type HazardReplay } from './rehearsal';
import { simulate, frame, elevation, waterScreen, distance, type RouteData, type TerrainGrid, type Coord } from './crowd';

const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
const minutes = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export function TerrainRehearsal({ region, selected, onSelect }: { region: CoastalRegion; selected: number; onSelect: (n: number) => void }) {
  const waterLayer = useRef<ReplayWaterLayer | null>(null);
  const [waterSurfaceError, setWaterSurfaceError] = useState('');
  const host = useRef<HTMLDivElement>(null), map = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [data, setData] = useState<RouteData>(), [grid, setGrid] = useState<TerrainGrid>();
  const [dimension, setDimension] = useState<'2d' | '3d'>('3d');
  const [started, setStarted] = useState(false), [preparation, setPreparation] = useState(0);
  const [hazard, setHazard] = useState<HazardReplay>(), [importError, setImportError] = useState('');
  const [animateWater, setAnimateWater] = useState(false), [peak, setPeak] = useState(10), [riseMinutes, setRiseMinutes] = useState(10);
  const [flat, setFlat] = useState(false), [terrainLoaded, setTerrainLoaded] = useState(false);
  const [count, setCount] = useState(1500), [speed, setSpeed] = useState(1.4), [width, setWidth] = useState(2);
  const [seconds, setSeconds] = useState(0), [playing, setPlaying] = useState(false), [rate, setRate] = useState(30);
  const [camera, setCamera] = useState<'overview' | 'coast' | 'route' | 'walk'>('overview');
  const [mode, setMode] = useState<'crowd' | 'water'>('crowd');
  const [route, setRoute] = useState(1), [water, setWater] = useState(0), [screen, setScreen] = useState(false);
  const [queueFocus, setQueueFocus] = useState<{ edge: string; status: string }>();
  const [point, setPoint] = useState<{ coord: Coord; elevation: number | null }>();
  const areaPack = areaPacks[region.id];
  const isStudy = !!areaPack?.routesUrl && (areaPack.placeIndex === undefined || areaPack.placeIndex === selected);
  const terrainGridRef = useRef(grid); terrainGridRef.current = grid;
  const lastSelection = useRef(`${region.id}:${selected}`);
  useEffect(() => {
    if (!areaPack) return;
    const abort = new AbortController();
    const read = async (url: string | undefined) => {
      if (!url) return undefined;
      const r = await fetch(url, { signal: abort.signal }); if (!r.ok) throw new Error('Area dataset unavailable'); return r.json();
    };
    Promise.all([read(areaPack.routesUrl), read(areaPack.terrainUrl), read(areaPack.hazardUrl)])
      .then(([r, g, h]) => { setData(r); setGrid(g); if (h) setHazard(parseHazardReplay(h, region.id)); })
      .catch(e => { if (e.name !== 'AbortError') setImportError('Some area datasets are unavailable. Terrain reference remains available.'); });
    return () => abort.abort();
  }, [areaPack]);
  const model = useMemo(() => data && isStudy ? simulate(data, count, speed, width, preparation) : undefined, [data, count, speed, width, preparation, isStudy]);
  const current = useMemo(() => model ? frame(model, started ? seconds : -1) : undefined, [model, seconds, started]);
  useEffect(() => { setSeconds(0); setStarted(false); setPlaying(false); setQueueFocus(undefined); }, [count, speed, width, preparation, region.id, selected]);
  const duration = Math.max(model?.duration ?? 0, hazard?.frames.at(-1)?.seconds ?? 0, animateWater ? riseMinutes * 60 : 0);
  const waterFrame = hazard ? replayAt(hazard, seconds) : null;
  const shownWaterLevel = animateWater ? demonstrationLevel(seconds, peak, riseMinutes * 60) : water;
  useEffect(() => {
    if (!playing || duration <= 0) return;
    const timer = window.setInterval(() => setSeconds(t => Math.min(duration, t + rate / 5)), 200);
    return () => clearInterval(timer);
  }, [playing, duration, rate]);
  useEffect(() => { if (duration > 0 && seconds >= duration) setPlaying(false); }, [seconds, duration]);
  useEffect(() => {
    if (flat || !host.current) return;
    setReady(false); setTerrainLoaded(false); setFailure(''); setWaterSurfaceError('');
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({ container: host.current, center: isStudy ? [98.265, 8.669] : [region.center[1], region.center[0]], zoom: isStudy ? 13.6 : region.zoom, pitch: dimension === '2d' ? 0 : 58, bearing: -65, maxPitch: 130, minZoom: 5, maxZoom: 23, renderWorldCopies: false,
        style: { version: 8, sources: {
          aerial: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 18, attribution: 'Imagery © Esri and contributors' },
          dem: { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, maxzoom: 15, attribution: '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Terrain © Mapzen / source credits</a>' }
        }, layers: [{ id: 'aerial', type: 'raster', source: 'aerial' }], terrain: dimension === '3d' ? { source: 'dem', exaggeration: 1 } : undefined },
        attributionControl: false
      });
    } catch { setFailure('3D rendering is unavailable on this device. Open the 2D map below.'); return; }
    map.current = m;
    let didLoad = false, sourceErrors = 0;
    const loadTimeout = window.setTimeout(() => {
      if (!didLoad) setFailure('3D sources have not loaded after 18 seconds. Try the 2D map or return to 3D to retry.');
    }, 18000);
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    m.addControl(new maplibregl.ScaleControl({ maxWidth: 100 }), 'bottom-left');
    m.scrollZoom.disable();
    m.on('error', e => {
      sourceErrors++;
      if (sourceErrors >= 4 || e.error?.message?.includes('WebGL')) setFailure('A 3D map source could not load. Use the 2D map, or switch back to retry.');
    });
    m.on('sourcedata', e => { if (e.sourceId === 'dem' && e.isSourceLoaded) setTerrainLoaded(true); });
    m.on('load', () => {
      didLoad = true; window.clearTimeout(loadTimeout); setFailure('');
      for (const id of ['routes', 'people', 'water', 'ends', 'pinch', 'arrows']) m.addSource(id, { type: 'geojson', data: empty });
      m.addLayer({ id: 'water', type: 'fill', source: 'water', paint: { 'fill-color': '#3b99ca', 'fill-opacity': .48 } });
      const surface = new ReplayWaterLayer(setWaterSurfaceError); m.addLayer(surface); waterLayer.current = surface;
      m.addLayer({ id: 'route-casing', type: 'line', source: 'routes', paint: { 'line-color': '#12354e', 'line-width': 8 } });
      m.addLayer({ id: 'routes', type: 'line', source: 'routes', paint: { 'line-color': ['match', ['get', 'route'], 0, '#fafaf7', 1, '#f59e0b', '#b9ddf0'], 'line-width': 3 } });
      m.addLayer({ id: 'people', type: 'circle', source: 'people', filter: ['==', ['get', 'status'], 'walking'], paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 2], 'circle-color': ['match', ['get', 'status'], 'queued', '#f59e0b', 'pending', '#9ba39a', '#fafaf7'], 'circle-stroke-color': '#12354e', 'circle-stroke-width': .5 } });
      m.addLayer({ id: 'ends', type: 'circle', source: 'ends', paint: { 'circle-radius': ['case', ['==',['get','role'],'destination'], 7, 3], 'circle-color': '#12354e', 'circle-stroke-color': '#fafaf7', 'circle-stroke-width': 1.5 } });
      m.addLayer({ id: 'pinch', type: 'circle', source: 'pinch', paint: { 'circle-radius': 5, 'circle-color': '#f59e0b', 'circle-stroke-color': '#12354e', 'circle-stroke-width': 1.5 } });
      m.addLayer({ id: 'waiting-groups', type: 'circle', source: 'people', filter: ['!=', ['get', 'status'], 'walking'], paint: { 'circle-radius': 4, 'circle-color': ['match', ['get', 'status'], 'queued', '#f59e0b', '#9ba39a'], 'circle-stroke-color': '#12354e', 'circle-stroke-width': 1 } });
      const side = 20, pixels = new Uint8Array(side * side * 4);
      for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
        const edge = Math.abs(x - 9.5);
        const arrow = y >= 5 && y <= 15 && Math.abs(y - (5 + edge)) < 2.5;
        if (arrow) { const i = (y * side + x) * 4; pixels.set([250,250,247,255], i); }
      }
      m.addImage('route-chevron', { width: side, height: side, data: pixels });
      m.addLayer({ id: 'direction-arrows', type: 'symbol', source: 'arrows', layout: { 'icon-image': 'route-chevron', 'icon-size': .8, 'icon-rotate': ['get','heading'], 'icon-rotation-alignment': 'map', 'icon-pitch-alignment': 'map', 'icon-keep-upright': false, 'icon-allow-overlap': false } });
      setReady(true);
    });
    m.on('click', e => {
      const group = m.getLayer('waiting-groups') ? m.queryRenderedFeatures(e.point, { layers: ['waiting-groups'] })[0] : undefined;
      if (group?.properties) { setQueueFocus({ edge: String(group.properties.edge), status: String(group.properties.status) }); setPoint(undefined); return; }
      setQueueFocus(undefined);
      setPoint({ coord: [e.lngLat.lng, e.lngLat.lat], elevation: m.queryTerrainElevation(e.lngLat) ?? (terrainGridRef.current ? elevation(terrainGridRef.current, [e.lngLat.lng,e.lngLat.lat]) : null) });
    });
    m.getCanvas().addEventListener('webglcontextlost', () => setFailure('3D graphics context lost. Use the 2D fallback.'));
    const observer = new ResizeObserver(() => m.resize()); observer.observe(host.current);
    return () => { window.clearTimeout(loadTimeout); observer.disconnect(); m.remove(); map.current = null; waterLayer.current = null; };
  }, [flat, region.id]);
  useEffect(() => {
    const m = map.current; if (!m || !ready || !data) return;
    (m.getSource('routes') as GeoJSONSource | undefined)?.setData(isStudy ? { type: 'FeatureCollection', features: data.routes.map((r, i) => ({ type: 'Feature', properties: { route: i }, geometry: { type: 'LineString', coordinates: r.coordinates } })) } : empty);
    (m.getSource('ends') as GeoJSONSource | undefined)?.setData(isStudy ? { type: 'FeatureCollection', features: [data.destination, ...data.routes.map(r => r.coordinates[0])].map((p, i) => ({ type: 'Feature', properties: { role: i === 0 ? 'destination' : 'origin' }, geometry: { type: 'Point', coordinates: p } })) } : empty);
    if (model && isStudy) {
      const p = model.people[0].legs.find(l => l.edge === model.bottleneck)?.from;
      (m.getSource('pinch') as GeoJSONSource | undefined)?.setData(p ? { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: p } } : empty);
    }
  }, [ready, data, isStudy, model]);
  useEffect(() => {
    if (ready && current) (map.current?.getSource('people') as GeoJSONSource)?.setData(isStudy && mode === 'crowd' ? { type: 'FeatureCollection', features: current.features } : empty);
  }, [ready, current, isStudy, mode]);
  useEffect(() => {
    if (!ready) return;
    const source = map.current?.getSource('water') as GeoJSONSource | undefined;
    const polygons = hazard ? replayPolygons(hazard, seconds) : grid && (screen || animateWater) ? waterScreen(grid, shownWaterLevel) : { type: 'FeatureCollection' as const, features: [] };
    source?.setData(polygons);
    const hasSurface = waterLayer.current?.update(polygons, hazard ? undefined : shownWaterLevel) ?? false;
    waterLayer.current?.setVisible(dimension === '3d');
    if (map.current?.getLayer('water')) map.current.setPaintProperty('water', 'fill-opacity', dimension === '3d' && !waterSurfaceError && hasSurface ? .12 : .48);
  }, [ready, grid, shownWaterLevel, screen, isStudy, hazard, seconds, animateWater, dimension, waterSurfaceError]);
  useEffect(() => {
    const m = map.current; if (!m || !ready || flat || !m.isStyleLoaded()) return;
    m.setTerrain(dimension === '3d' ? { source: 'dem', exaggeration: 1 } : null);
    m.setCenterClampedToGround(true);
    if (dimension === '2d' && data && isStudy) fitRoutes();
    else m.easeTo({ pitch: dimension === '2d' ? 0 : 58, bearing: 0, zoom: dimension === '2d' ? region.zoom : undefined, duration: 800 });
  }, [dimension, ready, flat]);
  useEffect(() => {
    const source = map.current?.getSource('arrows') as GeoJSONSource | undefined;
    source?.setData(data && isStudy ? routeArrows(data.routes[route], camera === 'walk' ? 20 : 120) : empty);
  }, [ready, data, route, isStudy, camera]);
  const selectedWalker = model?.people.find(p => p.route === route);
  const progress = selectedWalker && data ? walkerProgress(selectedWalker, data.routes[route], started ? seconds : -1) : undefined;
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !data || !isStudy || !progress || dimension !== '3d' || !['route','walk'].includes(camera)) return;
    const path = data.routes[route];
    const ahead = alongRoute(path, Math.min(progress.total, progress.metres + (camera === 'walk' ? 25 : 100)));
    if (camera === 'walk') {
      const ground = m.queryTerrainElevation(progress.coord) ?? (grid ? elevation(grid, progress.coord) : null);
      const targetGround = m.queryTerrainElevation(ahead.coord) ?? (grid ? elevation(grid, ahead.coord) : null);
      if (ground === null || targetGround === null) return;
      if (progress.metres >= progress.total) { m.setCenterClampedToGround(true); m.easeTo({ center: progress.coord, zoom: 18, pitch: 75, bearing: progress.heading, duration: 600 }); return; }
      m.setCenterClampedToGround(false);
      const options = m.calculateCameraOptionsFromTo(new maplibregl.LngLat(...progress.coord), ground + 1.7, new maplibregl.LngLat(...ahead.coord), targetGround + 1.7);
      m.easeTo({ ...options, duration: playing ? 200 : 800 });
    } else {
      m.setCenterClampedToGround(true);
      m.easeTo({ center: progress.coord, zoom: 16, pitch: 65, bearing: progress.heading, duration: playing ? 200 : 800 });
    }
  }, [ready, camera, seconds, route, data, model, isStudy, dimension, started, playing, terrainLoaded, grid]);
  useEffect(() => {
    const m = map.current; if (!m || !ready) return;
    const markers = region.places.map((place, i) => {
      const button = document.createElement('button');
      button.className = `terrain-place-label${i === selected ? ' selected' : ''}`;
      button.title = place.name;
      button.setAttribute('aria-label', `Select geographic place ${place.name}`);
      button.addEventListener('click', event => { event.stopPropagation(); setPoint(undefined); setQueueFocus(undefined); onSelect(i); });
      return new maplibregl.Marker({ element: button }).setLngLat([place.lng, place.lat]).addTo(m);
    });
    const key = `${region.id}:${selected}`;
    if (lastSelection.current !== key) {
      const p = region.places[selected];
      if (p) { setCamera('overview'); m.flyTo({ center: [p.lng, p.lat], zoom: 14, pitch: dimension === '2d' ? 0 : 58, bearing: 0, duration: 1500 }); }
      lastSelection.current = key;
    }
    return () => markers.forEach(marker => marker.remove());
  }, [ready, selected, region.id, onSelect, dimension]);
  function fitRoutes() {
    const m = map.current; if (!m || !data) return;
    const bounds = new maplibregl.LngLatBounds();
    data.routes.forEach(r => r.coordinates.forEach(p => bounds.extend(p)));
    m.fitBounds(bounds, { padding: { top: 32, bottom: 68, left: 48, right: 48 }, pitch: dimension === '2d' ? 0 : 48, bearing: dimension === '2d' ? 0 : -35, duration: 1600 });
  }
  useEffect(() => { if (ready && data && isStudy && camera === 'overview' && !queueFocus) fitRoutes(); }, [ready, data, isStudy]);
  function view(which: typeof camera) {
    setCamera(which);
    setQueueFocus(undefined);
    map.current?.setCenterClampedToGround(true);
    if (which === 'overview' && isStudy) { fitRoutes(); return; }
    if (which === 'overview') map.current?.flyTo({ center: isStudy ? [98.265, 8.669] : [region.center[1], region.center[0]], zoom: isStudy ? 13.6 : region.zoom, pitch: dimension === '2d' ? 0 : 58, bearing: dimension === '2d' ? 0 : -65, duration: 1800 });
    if (which === 'coast') map.current?.flyTo({ center: data && isStudy ? alongRoute(data.routes[route], (model?.distance[route] ?? 0) * .7).coord : [region.places[selected].lng, region.places[selected].lat], zoom: 14.5, pitch: 70, bearing: 85, duration: 6000, essential: false });
  }
  function inspectQueue() {
    const p = model?.people[0].legs.find(l => l.edge === model.bottleneck)?.from;
    if (!p || !model) return;
    setCamera('overview'); setQueueFocus({ edge: model.bottleneck, status: 'queued' });
    map.current?.setCenterClampedToGround(true);
    map.current?.flyTo({ center: p, zoom: 17, pitch: dimension === '2d' ? 0 : 60, bearing: dimension === '2d' ? 0 : 70, duration: 1500 });
  }
  async function importScenario(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Scenario file exceeds 10MB. Subset the grid first.');
      const value = parseHazardReplay(JSON.parse(await file.text()), region.id);
      setHazard(value); setAnimateWater(false); setScreen(true); setSeconds(0); setStarted(false); setPlaying(false); setImportError('');
    } catch (error) { setImportError(error instanceof Error ? error.message : 'Scenario could not be read.'); }
  }
  function startExercise() {
    if (seconds >= duration) setSeconds(0);
    setStarted(true); setPlaying(v => !v);
  }
  const nextDirection = data && progress ? nextTurn(data.routes[route], progress.metres) : null;
  const queueCount = current?.features.find(f => f.properties?.edge === queueFocus?.edge && f.properties?.status === queueFocus?.status)?.properties?.count ?? 0;
  const active = data?.routes[route];
  const profile = useMemo(() => active && grid ? active.coordinates.map(p => elevation(grid, p) ?? 0) : [], [active, grid]);
  const chainage = useMemo(() => { let sum = 0; return active?.coordinates.map((p, i) => { if (i) sum += distance(active.coordinates[i - 1], p); return sum; }) ?? []; }, [active]);
  return <section className="terrain-rehearsal" aria-label="Terrain and crowd rehearsal" data-presentation="network-node-totals" data-state={flat ? 'flat' : ready ? 'ready' : 'loading'}>
    <div className="terrain-toolbar">
      {isStudy && <div className="experiment-tabs" aria-label="Active experiment"><button aria-pressed={mode === 'crowd'} onClick={() => { setMode('crowd'); setScreen(false); }}>Rehearsal</button><button aria-pressed={mode === 'water'} onClick={() => { setMode('water'); setAnimateWater(false); setQueueFocus(undefined); setScreen(true); setPlaying(false); }}>Water level</button></div>}
      <div className="terrain-view-controls" aria-label="Camera controls">
        <button aria-pressed={!flat && dimension === '3d'} onClick={() => { setFlat(false); setDimension('3d'); }}>3D terrain</button>
        <button aria-pressed={!flat && dimension === '2d'} onClick={() => { setFlat(false); setDimension('2d'); setCamera('overview'); setQueueFocus(undefined); }}>2D map</button>
        {!flat && <><button disabled={!ready} aria-pressed={camera === 'route' || camera === 'coast'} onClick={() => { setDimension('3d'); view(isStudy && model ? 'route' : 'coast'); }} title="Fly over the selected route or geographic area">Fly-by</button><button disabled={!ready || !isStudy || !model} aria-pressed={camera === 'walk'} onClick={() => { setDimension('3d'); view('walk'); }}>Walk-through</button><button disabled={!ready} aria-pressed={camera === 'overview' && !queueFocus} onClick={() => view('overview')}>Overview</button><button disabled={!ready || !isStudy || !model} aria-pressed={!!queueFocus} onClick={inspectQueue} title="Inspect queue">Queue</button></>}
      </div>

    </div>
    {flat ? <StudyMap region={region} selected={selected} onSelect={onSelect} referenceOnly /> : <div className="terrain-stage">
      <div ref={host} className="terrain-canvas" aria-label="3D terrain map. Drag to pan, right-drag to tilt. Click for terrain height." />

      {!ready && !failure && <p className="terrain-notice" role="status">Loading satellite imagery and terrain…</p>}
      {failure && <p className="terrain-notice" role="alert">{failure} <button onClick={() => setFlat(true)}>Open 2D map</button></p>}

    </div>}
    <div className="terrain-caption">
      <span>{queueFocus ? `${queueCount.toLocaleString()} ${queueFocus.status === 'queued' ? 'queued' : 'awaiting release'} at model node · footprint not modeled` : point ? `${point.coord[1].toFixed(5)}, ${point.coord[0].toFixed(5)} · ${point.elevation === null ? 'height unavailable' : `DEM ≈ ${Math.round(point.elevation)} m, not a safety test`}` : `${region.places[selected]?.name} · ${flat ? 'basic 2D reference' : dimension === '2d' ? '2D replay' : camera === 'walk' ? 'coarse terrain view, not street detail' : terrainLoaded ? '1× relief' : 'terrain loading'} · exercise only`}</span>
      <span className="terrain-credits">© <a href="https://www.esri.com/">Esri &amp; contributors</a> · <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Mapzen</a> · <a href="https://www.openstreetmap.org/copyright">OSM</a></span>
      <details className="terrain-map-key"><summary>Map key</summary><p>{isStudy && !flat ? 'Lines: three mapped walking approaches. Amber point: assumed pinch point. White points: moving agents. Amber and gray points: queue and release totals at network nodes, not physical crowd footprints.' : 'Geographic reference; no crowd or route layers in this view.'}{!flat && ' Click terrain for approximate DEM height; no height establishes safety.'} Imagery © Esri and contributors; terrain © Mapzen and credited elevation sources; roads © OpenStreetMap contributors.</p></details>
    </div>
    {!isStudy && <p className="area-data-status">Terrain views available. No local route/destination pack is connected for this selected place. {hazard ? 'Research inundation frames are loaded.' : 'Wave predictions are not connected.'}</p>}
    {!model && (hazard || animateWater) && <div className="imported-replay-controls"><button onClick={startExercise}>{playing ? 'Pause' : started ? 'Run' : 'Start warning'}</button><label>Warning +{minutes(seconds)}<input aria-label="Imported scenario time" type="range" min={0} max={duration} step={1} value={seconds} onChange={e => { setStarted(true); setSeconds(Number(e.target.value)); setPlaying(false); }} /></label><span>{waterFrame ? 'Imported research frame' : 'No model frame at this time'}</span></div>}
    {isStudy && model && data && <>
      <div className="rehearsal-panel" hidden={mode !== 'crowd'}>
      <div className="rehearsal-controls">
        <label>People<select aria-label="People" value={count} onChange={e => setCount(Number(e.target.value))}><option value={500}>500</option><option value={1500}>1,500</option><option value={5000}>5,000</option></select></label>
        <label>Pace<select aria-label="Walking pace" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={0.8}>0.8 m/s</option><option value={1.4}>1.4 m/s</option><option value={2.4}>2.4 m/s</option></select></label>
        <label>Delay<select aria-label="Preparation delay" value={preparation} onChange={e => setPreparation(Number(e.target.value))}><option value={0}>0 s</option><option value={60}>1 min</option><option value={300}>5 min</option></select></label>
        <label>Route<select aria-label="Camera approach" value={route} onChange={e => setRoute(Number(e.target.value))}>{data.routes.map((r, i) => <option value={i} key={r.name}>{r.name.replace(" approach", "")}</option>)}</select></label>
        <button className="rehearsal-play" aria-label={playing ? "Pause rehearsal" : "Run crowd rehearsal"} disabled={flat || !ready} onClick={startExercise}>{playing ? 'Pause' : started ? 'Run' : 'Start'}</button>
      </div>
      <div className="rehearsal-timeline">
        <button onClick={() => { setSeconds(0); setStarted(false); setPlaying(false); setQueueFocus(undefined); }}>Reset</button>
        <label className="timeline-label">{started ? 'Warning +' : 'Ready · '}{minutes(seconds)}<input aria-label="Exercise time" type="range" min={0} max={duration} step={1} value={seconds} onChange={e => { setSeconds(Number(e.target.value)); setStarted(true); setPlaying(false); }} /></label>
        <label>Rate<select aria-label="Playback" value={rate} onChange={e => setRate(Number(e.target.value))}><option value={1}>1×</option><option value={30}>30×</option><option value={120}>120×</option></select></label>
      </div>
      <p className="exercise-boundary" aria-live="polite">{started ? (progress?.state === 'preparing' ? 'Preparing' : progress?.state === 'queued' ? 'Queued at model node' : progress?.state === 'arrived' ? 'Exercise endpoint reached' : 'Evacuation rehearsal') : 'Ready to start warning'} · {hazard ? (waterFrame ? 'unverified model replay' : 'no hazard frame at this time') : animateWater ? `Demo +${shownWaterLevel.toFixed(1)}m MSL; agents unaffected` : 'wave prediction unavailable'} · endpoint unapproved</p>
      <div className="rehearsal-readout" aria-label="Crowd counts">
        <span><strong>{current?.walking.toLocaleString()}</strong> walking</span><span><strong>{current?.queued.toLocaleString()}</strong> queued at nodes</span><span><strong>{current?.arrived.toLocaleString()}</strong> at endpoint</span><span><strong>{current?.pending.toLocaleString()}</strong> awaiting release</span><span>Last arrival <strong>{minutes(model.duration)}</strong> · max link wait <strong>{minutes(model.maxQueueWait)}</strong></span>
      </div>
      </div>
      <div className={`terrain-secondary ${mode}`}>
      {mode === 'water' &&         <div className="water-experiment"><div className="water-control-row"><label><input type="checkbox" checked={screen} onChange={e => setScreen(e.target.checked)} /> Screen terrain</label>
          <label>{hazard ? 'Model depths' : `+${water} m`}<input aria-label="Static experimental water level" type="range" min={0} max={20} step={1} value={water} disabled={!screen || flat || !!hazard} onChange={e => setWater(Number(e.target.value))} /></label></div>
          <small>{hazard ? `${hazard.title} · ${hazard.model} · ${waterFrame ? 'interpolated model frame' : 'no frame at this time'}. ` : 'Blue = connected low terrain at a chosen static level, not tsunami physics. '}Imported frames and terrain screening do not alter agents or certify safety. Unshaded land is not classified safe.</small>
        </div>}
      <div className="terrain-analysis-row">
        <div className="route-profile"><strong>{areaPack?.label}: {active?.name} · {((model.distance[route] ?? 0) / 1000).toFixed(2)} km</strong><span>{progress ? `${(Math.max(0, progress.total - progress.metres) / 1000).toFixed(2)} km to exercise end · ${progress.state}` : 'Approximate DEM profile'} · endpoint unapproved</span>
          <svg viewBox="0 0 480 54" preserveAspectRatio="none" role="img" aria-label={`Terrain elevation profile, ${Math.round(Math.min(...profile))} to ${Math.round(Math.max(...profile))} metres. Not a safety classification.`}><polyline fill="none" stroke="#12354e" strokeWidth="2" points={profile.map((v, i) => `${(chainage[i] ?? 0) / Math.max(1, chainage.at(-1) ?? 1) * 480},${50 - Math.max(0, v) / Math.max(20, ...profile) * 44}`).join(' ')} /></svg>
          <p className="route-cue">{!started ? 'Start runs a rehearsal. Real warnings require prompt action following local guidance.' : progress?.state === 'preparing' ? `Preparation interval: ${Math.max(0, preparation - seconds).toFixed(0)} s remaining in this exercise.` : progress?.state === 'queued' ? 'First walker is queued at a network node; the physical crowd is not simulated.' : progress?.state === 'arrived' ? 'First walker reached the exercise end; other agents may still be en route.' : nextDirection ? `Selected exercise route: in ${nextDirection.distanceM} m, bear ${nextDirection.direction}.` : 'Continue along the selected exercise route to its unapproved endpoint.'}</p>
          <p className="route-cue">At {speed} m/s: {Math.ceil((model.distance[route] ?? 0) / speed / 60)} min walking + {Math.round(preparation / 60)} min exercise delay, before queues.</p>
          <div className="profile-scale"><span>Start ≈ {Math.round(profile[0] ?? 0)} m</span><span>DEM range ≈ {Math.round(Math.min(...profile))}–{Math.round(Math.max(...profile))} m</span><span>End ≈ {Math.round(profile.at(-1) ?? 0)} m</span></div>
        </div>

      </div>
      </div>
      <details className="exercise-method"><summary>Sources, assumptions and what needs validation</summary><p>Road geometry: <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors / ODbL</a>, snapshot {data.accessed}. Three shortest mapped walking paths converge on a selected inland network endpoint. Access, crossings, obstructions and destination suitability have not been surveyed. No route is recommended for emergency use.</p><p>Each white point represents one moving synthetic person; an amber or gray point aggregates people waiting at the same model node. A deterministic FIFO point-queue model uses {speed} m/s, a {preparation}-second preparation delay after the exercise warning, a 0.15-second release interval per approach, 6 m assumed width elsewhere, {width} m at the amber-point link and an assumed flow of 1.2 people/m/s. Queues are totals at exact network nodes. Their physical shape, density and spillback are not modeled; no offsets or decorative crowd rings are drawn. There is no collision, storage spillback, slope penalty, mobility mix, injury or water interaction. Running is an experiment, not advice. This is separate from the paper’s 39,041-agent Unity model.</p><p>Walk-through follows the first synthetic walker at an approximate 1.7m eye height over the available DEM and imagery; it is not street-view photography and does not resolve kerbs, stairs or doors. Arrows follow the selected mapped exercise route, not authority-approved signs. Water rise is a user-chosen static-level demonstration, not tsunami dynamics. Imported depth frames remain research results. Moving people are point markers, not a physical-crowd simulation.</p><p>Terrain: <a href="https://registry.opendata.aws/terrain-tiles/">Mapzen Terrain Tiles on AWS</a>, 1× relief; local screening uses a sampled z12 Terrarium grid accessed {grid?.accessed}. Heights are approximate. Actual inundation replay and approved evacuation guidance require a georeferenced scenario flood grid, surveyed routes and authority-approved refuges from the research team.</p></details>
    </>}
    <details className="exercise-settings"><summary>Scenario settings, data and coverage</summary>
      <div className="scenario-settings-row">
        {model && <label>Assumed pinch width<select aria-label="Assumed pinch width" value={width} onChange={e => setWidth(Number(e.target.value))}><option value={1}>1 m</option><option value={2}>2 m</option><option value={6}>6 m</option></select></label>}
        {grid && <><label><input type="checkbox" checked={animateWater} disabled={!!hazard || flat} onChange={e => { setAnimateWater(e.target.checked); setMode('crowd'); setScreen(e.target.checked); }} /> Animate illustrative water rise</label><label>Screen peak<select aria-label="Demonstration peak level" value={peak} onChange={e => setPeak(Number(e.target.value))}><option value={5}>+5 m MSL</option><option value={10}>+10 m MSL</option><option value={15}>+15 m MSL</option><option value={20}>+20 m MSL</option></select></label><label>Rise duration<select aria-label="Demonstration rise duration" value={riseMinutes} onChange={e => setRiseMinutes(Number(e.target.value))}><option value={5}>5 exercise min</option><option value={10}>10 exercise min</option><option value={20}>20 exercise min</option></select></label></>}
        <button disabled={!ready || flat} onClick={() => { setDimension('3d'); view('coast'); }}>Scenic coast view</button><button onClick={() => { setFlat(true); setPlaying(false); setQueueFocus(undefined); }}>Basic map fallback</button>
      </div>
      <p className="scenario-provenance">{hazard ? <>Imported research replay: <a href={hazard.sourceUrl} target="_blank" rel="noreferrer">{hazard.title}</a> · {hazard.model} · {hazard.verticalDatum} · approval not independently verified. {waterFrame?.waveHeightM == null ? 'Wave height at a gauge is not supplied for this time.' : `Model wave height at ${hazard.waveGauge?.name}: ${waterFrame.waveHeightM.toFixed(2)} m (crest-to-trough).`}</> : <>Wave prediction and approved destinations are not connected. {animateWater ? `The animated +${shownWaterLevel.toFixed(1)} m level is a user-chosen terrain demonstration, not a predicted wave height or arrival time.` : 'The water slider screens terrain; it does not predict tsunami wave height.'}</>}</p>
      <label className="scenario-import">Load research inundation frames (JSON, on this device only)<input aria-label="Load research inundation scenario" type="file" accept="application/json,.json" onChange={e => { void importScenario(e.target.files?.[0]); e.target.value = ''; }} /></label>
      {hazard && <button onClick={() => { setHazard(undefined); setPlaying(false); }}>Remove imported scenario</button>}
      {importError && <p role="alert">{importError}</p>}
      {waterSurfaceError && <p role="status">3D water surface unavailable; footprint layer remains visible. {waterSurfaceError}</p>}
      <p>Format: warning-relative seconds, EPSG:4326 cell bounds, north-to-south rows, MSL datum and depth in metres. A wave-height gauge needs its own location and crest-to-trough definition. No upload or automatic approval. <a href="/data/hazard-replay.schema.json" target="_blank" rel="noreferrer">Scenario file schema</a>.</p>
      <p>Coverage: satellite/DEM views work across the listed regions; the sourced walking-network exercise currently covers Bang Niang only. Each additional beach needs its own route, destination and hazard pack. Public-source expansion: <a href="https://www.clawpack.org/tsunamidata.html" target="_blank" rel="noreferrer">GeoClaw data guidance</a> · <a href="https://www.gebco.net/data-products/gridded-bathymetry-data" target="_blank" rel="noreferrer">GEBCO bathymetry</a> · <a href="https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/tsunamis" target="_blank" rel="noreferrer">NOAA historical observations</a>. These sources are candidates for integration, not connected live feeds.</p>
    </details>
  </section>;
}
