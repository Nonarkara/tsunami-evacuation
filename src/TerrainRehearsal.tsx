import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import terrainWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(terrainWorker);
import { StudyMap } from './Map';
import type { CoastalRegion } from './research';
import { simulate, frame, elevation, waterScreen, distance, type RouteData, type TerrainGrid, type Coord } from './crowd';

const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
const minutes = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export function TerrainRehearsal({ region, selected, onSelect }: { region: CoastalRegion; selected: number; onSelect: (n: number) => void }) {
  const host = useRef<HTMLDivElement>(null), map = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [data, setData] = useState<RouteData>(), [grid, setGrid] = useState<TerrainGrid>();
  const [flat, setFlat] = useState(false), [terrainLoaded, setTerrainLoaded] = useState(false);
  const [count, setCount] = useState(1500), [speed, setSpeed] = useState(1.4), [width, setWidth] = useState(2);
  const [seconds, setSeconds] = useState(0), [playing, setPlaying] = useState(false), [rate, setRate] = useState(30);
  const [camera, setCamera] = useState<'overview' | 'coast' | 'route'>('overview');
  const [mode, setMode] = useState<'crowd' | 'water'>('crowd');
  const [route, setRoute] = useState(1), [water, setWater] = useState(0), [screen, setScreen] = useState(false);
  const [point, setPoint] = useState<{ coord: Coord; elevation: number | null }>();
  const isStudy = region.id === 'khao-lak';
  const lastSelection = useRef(`${region.id}:${selected}`);
  useEffect(() => {
    const abort = new AbortController();
    Promise.all(['/data/rehearsal-routes.json', '/data/terrain.json'].map(async url => {
      const r = await fetch(url, { signal: abort.signal }); if (!r.ok) throw new Error('Source snapshot unavailable'); return r.json();
    })).then(([r, g]) => { setData(r); setGrid(g); }).catch(e => { if (e.name !== 'AbortError') setFailure('Exercise data unavailable. The 2D location map remains available.'); });
    return () => abort.abort();
  }, []);
  const model = useMemo(() => data ? simulate(data, count, speed, width) : undefined, [data, count, speed, width]);
  const current = useMemo(() => model ? frame(model, seconds) : undefined, [model, seconds]);
  useEffect(() => { setSeconds(0); setPlaying(false); }, [count, speed, width, region.id]);
  useEffect(() => {
    if (!playing || !model) return;
    const timer = window.setInterval(() => setSeconds(t => Math.min(model.duration, t + rate / 5)), 200);
    return () => clearInterval(timer);
  }, [playing, model, rate]);
  useEffect(() => { if (model && seconds >= model.duration) setPlaying(false); }, [seconds, model]);
  useEffect(() => {
    if (flat || !host.current) return;
    setReady(false); setTerrainLoaded(false); setFailure('');
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({ container: host.current, center: isStudy ? [98.265, 8.669] : [region.center[1], region.center[0]], zoom: isStudy ? 13.6 : region.zoom, pitch: 58, bearing: -65, maxPitch: 75, minZoom: 5, maxZoom: 17, renderWorldCopies: false,
        style: { version: 8, sources: {
          aerial: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 18, attribution: 'Imagery © Esri and contributors' },
          dem: { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, maxzoom: 15, attribution: '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Terrain © Mapzen / source credits</a>' }
        }, layers: [{ id: 'aerial', type: 'raster', source: 'aerial' }], terrain: { source: 'dem', exaggeration: 1 } },
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
      for (const id of ['routes', 'people', 'water', 'ends', 'pinch']) m.addSource(id, { type: 'geojson', data: empty });
      m.addLayer({ id: 'water', type: 'fill', source: 'water', paint: { 'fill-color': '#3b99ca', 'fill-opacity': .4 } });
      m.addLayer({ id: 'route-casing', type: 'line', source: 'routes', paint: { 'line-color': '#12354e', 'line-width': 8 } });
      m.addLayer({ id: 'routes', type: 'line', source: 'routes', paint: { 'line-color': ['match', ['get', 'route'], 0, '#fafaf7', 1, '#f59e0b', '#b9ddf0'], 'line-width': 3 } });
      m.addLayer({ id: 'people', type: 'circle', source: 'people', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 17, 4], 'circle-color': ['match', ['get', 'status'], 'queued', '#f59e0b', 'pending', '#9ba39a', '#fafaf7'], 'circle-stroke-color': '#12354e', 'circle-stroke-width': .5 } });
      m.addLayer({ id: 'ends', type: 'circle', source: 'ends', paint: { 'circle-radius': 4, 'circle-color': '#12354e', 'circle-stroke-color': '#fafaf7', 'circle-stroke-width': 1.5 } });
      m.addLayer({ id: 'pinch', type: 'circle', source: 'pinch', paint: { 'circle-radius': 5, 'circle-color': '#f59e0b', 'circle-stroke-color': '#12354e', 'circle-stroke-width': 1.5 } });
      setReady(true);
    });
    m.on('click', e => setPoint({ coord: [e.lngLat.lng, e.lngLat.lat], elevation: m.queryTerrainElevation(e.lngLat) }));
    m.getCanvas().addEventListener('webglcontextlost', () => setFailure('3D graphics context lost. Use the 2D fallback.'));
    const observer = new ResizeObserver(() => m.resize()); observer.observe(host.current);
    return () => { window.clearTimeout(loadTimeout); observer.disconnect(); m.remove(); map.current = null; };
  }, [flat, region.id]);
  useEffect(() => {
    const m = map.current; if (!m || !ready || !data) return;
    (m.getSource('routes') as GeoJSONSource | undefined)?.setData(isStudy ? { type: 'FeatureCollection', features: data.routes.map((r, i) => ({ type: 'Feature', properties: { route: i }, geometry: { type: 'LineString', coordinates: r.coordinates } })) } : empty);
    (m.getSource('ends') as GeoJSONSource | undefined)?.setData(isStudy ? { type: 'FeatureCollection', features: [data.destination, ...data.routes.map(r => r.coordinates[0])].map(p => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: p } })) } : empty);
    if (model && isStudy) {
      const p = model.people[0].legs.find(l => l.edge === model.bottleneck)?.from;
      (m.getSource('pinch') as GeoJSONSource | undefined)?.setData(p ? { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: p } } : empty);
    }
  }, [ready, data, isStudy, model]);
  useEffect(() => {
    if (ready && current) (map.current?.getSource('people') as GeoJSONSource)?.setData(isStudy && mode === 'crowd' ? { type: 'FeatureCollection', features: current.features } : empty);
  }, [ready, current, isStudy, mode]);
  useEffect(() => {
    if (ready && grid) (map.current?.getSource('water') as GeoJSONSource)?.setData(screen && isStudy ? waterScreen(grid, water) : empty);
  }, [ready, grid, water, screen, isStudy]);
  useEffect(() => {
    if (!ready || !data || !isStudy || camera !== 'route' || !model) return;
    const p = model.people.find(p => p.route === route)!;
    const leg = p.legs.find(l => seconds < l.exit) ?? p.legs[p.legs.length - 1];
    const f = Math.max(0, Math.min(1, (seconds - leg.enter) / (leg.exit - leg.enter)));
    const center: Coord = [leg.from[0] + (leg.to[0] - leg.from[0]) * f, leg.from[1] + (leg.to[1] - leg.from[1]) * f];
    map.current?.easeTo({ center, zoom: 16, pitch: 65, bearing: 90 - Math.atan2(leg.to[1] - leg.from[1], (leg.to[0] - leg.from[0]) * Math.cos(center[1] * Math.PI / 180)) * 180 / Math.PI, duration: 200 });
  }, [ready, camera, seconds, route, data, model, isStudy]);
  useEffect(() => {
    const m = map.current; if (!m || !ready) return;
    const markers = region.places.map((place, i) => {
      const button = document.createElement('button');
      button.className = `terrain-place-label${i === selected ? ' selected' : ''}`;
      button.title = place.name;
      button.setAttribute('aria-label', `Select geographic place ${place.name}`);
      button.addEventListener('click', event => { event.stopPropagation(); setPoint(undefined); onSelect(i); });
      return new maplibregl.Marker({ element: button }).setLngLat([place.lng, place.lat]).addTo(m);
    });
    const key = `${region.id}:${selected}`;
    if (lastSelection.current !== key) {
      const p = region.places[selected];
      if (p) { setCamera('overview'); m.flyTo({ center: [p.lng, p.lat], zoom: 14, pitch: 58, bearing: 0, duration: 1500 }); }
      lastSelection.current = key;
    }
    return () => markers.forEach(marker => marker.remove());
  }, [ready, selected, region.id, onSelect]);
  function fitRoutes() {
    const m = map.current; if (!m || !data) return;
    const bounds = new maplibregl.LngLatBounds();
    data.routes.forEach(r => r.coordinates.forEach(p => bounds.extend(p)));
    m.fitBounds(bounds, { padding: { top: 32, bottom: 68, left: 48, right: 48 }, pitch: 48, bearing: -35, duration: 1600 });
  }
  useEffect(() => { if (ready && data && isStudy) fitRoutes(); }, [ready, data, isStudy]);
  function view(which: typeof camera) {
    setCamera(which);
    if (which === 'overview' && isStudy) { fitRoutes(); return; }
    if (which === 'overview') map.current?.flyTo({ center: isStudy ? [98.265, 8.669] : [region.center[1], region.center[0]], zoom: isStudy ? 13.6 : region.zoom, pitch: 58, bearing: -65, duration: 1800 });
    if (which === 'coast') map.current?.flyTo({ center: [98.273, 8.672], zoom: 14.5, pitch: 70, bearing: 85, duration: 6000, essential: false });
  }
  const active = data?.routes[route];
  const profile = useMemo(() => active && grid ? active.coordinates.map(p => elevation(grid, p) ?? 0) : [], [active, grid]);
  const chainage = useMemo(() => { let sum = 0; return active?.coordinates.map((p, i) => { if (i) sum += distance(active.coordinates[i - 1], p); return sum; }) ?? []; }, [active]);
  return <section className="terrain-rehearsal" aria-label="Terrain and crowd rehearsal" data-state={flat ? 'flat' : ready ? 'ready' : 'loading'}>
    <div className="terrain-toolbar">
      {isStudy && <div className="experiment-tabs" aria-label="Active experiment"><button aria-pressed={mode === 'crowd'} onClick={() => { setMode('crowd'); setScreen(false); }}>Crowd</button><button aria-pressed={mode === 'water'} onClick={() => { setMode('water'); setScreen(true); setPlaying(false); }}>Water level</button></div>}
      <div className="terrain-view-controls" aria-label="Camera controls">
        <button aria-pressed={!flat} onClick={() => setFlat(false)}>3D terrain</button>
        <button aria-pressed={flat} onClick={() => { setFlat(true); setPoint(undefined); setPlaying(false); }}>2D map</button>
        {!flat && <><button disabled={!ready || !isStudy} onClick={() => view('coast')} title="Mountain fly-by">Fly-by</button><button disabled={!ready || !isStudy} aria-pressed={camera === 'route'} onClick={() => view('route')}>Follow route</button><button disabled={!ready} onClick={() => view('overview')}>Overview</button><button disabled={!ready || !isStudy || !model} onClick={() => { const p = model?.people[0].legs.find(l => l.edge === model.bottleneck)?.from; if (p) { setCamera('overview'); map.current?.flyTo({ center: p, zoom: 17, pitch: 60, bearing: 70, duration: 1500 }); } }} title="Inspect queue">Queue</button></>}
      </div>

    </div>
    {flat ? <StudyMap region={region} selected={selected} onSelect={onSelect} referenceOnly /> : <div className="terrain-stage">
      <div ref={host} className="terrain-canvas" aria-label="3D terrain map. Drag to pan, right-drag to tilt. Click for terrain height." />

      {!ready && !failure && <p className="terrain-notice" role="status">Loading satellite imagery and terrain…</p>}
      {failure && <p className="terrain-notice" role="alert">{failure} <button onClick={() => setFlat(true)}>Open 2D map</button></p>}

    </div>}
    <div className="terrain-caption">
      <span>{point ? `${point.coord[1].toFixed(5)}, ${point.coord[0].toFixed(5)} · ${point.elevation === null ? 'height unavailable' : `DEM ≈ ${Math.round(point.elevation)} m, not a safety test`}` : `${region.places[selected]?.name} · ${flat ? '2D reference' : terrainLoaded ? '1× relief' : 'terrain loading'} · exercise only`}</span>
      <span className="terrain-credits">© <a href="https://www.esri.com/">Esri &amp; contributors</a> · <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Mapzen</a> · <a href="https://www.openstreetmap.org/copyright">OSM</a></span>
      <details className="terrain-map-key"><summary>Map key</summary><p>{isStudy && !flat ? 'Lines: three mapped walking approaches. Amber point: assumed pinch point. White dots: walking; amber: queued; gray: awaiting release.' : 'Geographic reference; no crowd or route layers in this view.'}{!flat && ' Click terrain for approximate DEM height; no height establishes safety.'} Imagery © Esri and contributors; terrain © Mapzen and credited elevation sources; roads © OpenStreetMap contributors.</p></details>
    </div>
    {isStudy && model && data && <>
      <div hidden={mode !== 'crowd'}>
      <div className="rehearsal-controls">
        <label>People<select aria-label="People" value={count} onChange={e => setCount(Number(e.target.value))}><option value={500}>500</option><option value={1500}>1,500</option><option value={5000}>5,000</option></select></label>
        <label>Pace<select aria-label="Walking pace" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={0.8}>0.8 m/s</option><option value={1.4}>1.4 m/s</option><option value={2.4}>2.4 m/s</option></select></label>
        <label>Pinch width<select aria-label="Assumed pinch width" value={width} onChange={e => setWidth(Number(e.target.value))}><option value={1}>1 m</option><option value={2}>2 m</option><option value={6}>6 m</option></select></label>
        <label>Route<select aria-label="Camera approach" value={route} onChange={e => setRoute(Number(e.target.value))}>{data.routes.map((r, i) => <option value={i} key={r.name}>{r.name.replace(" approach", "")}</option>)}</select></label>
        <button className="rehearsal-play" disabled={flat || !ready} onClick={() => { if (seconds >= model.duration) setSeconds(0); setPlaying(v => !v); }}>{playing ? 'Pause rehearsal' : 'Run rehearsal'}</button>
      </div>
      <div className="rehearsal-timeline">
        <button onClick={() => { setSeconds(0); setPlaying(false); }}>Reset</button>
        <label className="timeline-label">Exercise time {minutes(seconds)}<input aria-label="Exercise time" type="range" min={0} max={model.duration} step={1} value={seconds} onChange={e => { setSeconds(Number(e.target.value)); setPlaying(false); }} /></label>
        <label>Rate<select aria-label="Playback" value={rate} onChange={e => setRate(Number(e.target.value))}><option value={1}>1×</option><option value={30}>30×</option><option value={120}>120×</option></select></label>
      </div>
      <p className="exercise-boundary">Bang Niang exercise · unapproved endpoint · no water interaction</p>
      <div className="rehearsal-readout" aria-label="Crowd counts">
        <span><strong>{current?.walking.toLocaleString()}</strong> walking</span><span><strong>{current?.queued.toLocaleString()}</strong> queued</span><span><strong>{current?.arrived.toLocaleString()}</strong> at endpoint</span><span><strong>{current?.pending.toLocaleString()}</strong> awaiting release</span><span>Last arrival <strong>{minutes(model.duration)}</strong> · max link wait <strong>{minutes(model.maxQueueWait)}</strong></span>
      </div>
      </div>
      <div className={`terrain-secondary ${mode}`}>
      {mode === 'water' &&         <div className="water-experiment"><div className="water-control-row"><label><input type="checkbox" checked={screen} onChange={e => setScreen(e.target.checked)} /> Screen terrain</label>
          <label>+{water} m<input aria-label="Static experimental water level" type="range" min={0} max={20} step={1} value={water} disabled={!screen || flat} onChange={e => setWater(Number(e.target.value))} /></label></div>
          <small>Blue = a static low-terrain experiment, connected to the western grid boundary. Omits wave force, timing, channels and buildings. It does not affect the crowd exercise. This is not a tsunami flood forecast; unshaded land is not certified safe.</small>
        </div>}
      <div className="terrain-analysis-row">
        <div className="route-profile"><strong>{active?.name} · {((model.distance[route] ?? 0) / 1000).toFixed(2)} km</strong><span>Approximate DEM profile · endpoint is not an approved refuge</span>
          <svg viewBox="0 0 480 54" preserveAspectRatio="none" role="img" aria-label={`Terrain elevation profile, ${Math.round(Math.min(...profile))} to ${Math.round(Math.max(...profile))} metres. Not a safety classification.`}><polyline fill="none" stroke="#12354e" strokeWidth="2" points={profile.map((v, i) => `${(chainage[i] ?? 0) / Math.max(1, chainage.at(-1) ?? 1) * 480},${50 - Math.max(0, v) / Math.max(20, ...profile) * 44}`).join(' ')} /></svg>
          <div className="profile-scale"><span>Start ≈ {Math.round(profile[0] ?? 0)} m</span><span>DEM range ≈ {Math.round(Math.min(...profile))}–{Math.round(Math.max(...profile))} m</span><span>End ≈ {Math.round(profile.at(-1) ?? 0)} m</span></div>
        </div>

      </div>
      </div>
      <details className="exercise-method"><summary>Sources, assumptions and what needs validation</summary><p>Road geometry: <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors / ODbL</a>, snapshot {data.accessed}. Three shortest mapped walking paths converge on a selected inland network endpoint. Access, crossings, obstructions and destination suitability have not been surveyed. No route is recommended for emergency use.</p><p>Each dot represents one synthetic person. A deterministic FIFO point-queue model uses {speed} m/s, a 0.15-second release interval per approach, 6 m assumed width elsewhere, {width} m at the amber-ring link and an assumed flow of 1.2 people/m/s. Queues are displayed at nodes; dots are offset for visibility. There is no collision, storage spillback, slope penalty, mobility mix, injury or water interaction. Running is an experiment, not advice. This is separate from the paper’s 39,041-agent Unity model.</p><p>Terrain: <a href="https://registry.opendata.aws/terrain-tiles/">Mapzen Terrain Tiles on AWS</a>, 1× relief; local screening uses a sampled z12 Terrarium grid accessed {grid?.accessed}. Heights are approximate. Actual inundation replay and approved evacuation guidance require a georeferenced scenario flood grid, surveyed routes and authority-approved refuges from the research team.</p></details>
    </>}
  </section>;
}
