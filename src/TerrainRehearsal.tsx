import { DockControls } from './BannerDock';
import { ReadingDialog } from './ReadingDialog';
import { PagedFlow } from './PagedFlow';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import terrainWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(terrainWorker);
import { ReplayWaterLayer } from './ReplayWaterLayer';
import { advancePlayback } from './playback';
import { TimeScrubber } from './TimeScrubber';
import { buildingAreaId, parseBuildings, cameraStep, EYE_HEIGHT_M, UNKNOWN_BUILDING_MASSING_M, type BuildingPack } from './buildings';
import { StudyMap } from './Map';
import { CameraSymbol } from './CameraSymbol';
import { WalkthroughCoach } from './WalkthroughCoach';
import { manualLanguage } from './manual-content';
import { SunIndicator } from './SunIndicator';
import type { CoastalRegion } from './research';
import { areaPacks, alongRoute, walkerProgress, walkerSchedule, nextTurn, routeArrows, demonstrationLevel, parseHazardReplay, replayAt, replayPolygons, type HazardReplay } from './rehearsal';
import { simulate, frame, elevation, waterScreen, distance, type RouteData, type TerrainGrid, type Coord } from './crowd';
import { paceLines, segmentWaits, speedForSeconds } from './escape-timing';

const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
const minutes = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
/** Run pace used by the mixed-pace exercise. An assumed walking model, not advice. */
const RUN_PACE = 3;
/** Walking paces the reader can compare, in metres per second. */
const WALK_PACES = [0.8, 1.4, 2.4];
export function TerrainRehearsal({ region, selected, onSelect, consoleSlot, onReview, bannerDock }: { region: CoastalRegion; selected: number; onSelect: (n: number) => void; consoleSlot?: ReactNode; onReview:()=>void; bannerDock:HTMLElement|null }) {
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
  const [runShare, setRunShare] = useState(0), [targetMinutes, setTargetMinutes] = useState(30);
  const runCount = Math.round(count * runShare);
  const [seconds, setSeconds] = useState(0), [playing, setPlaying] = useState(false), [rate, setRate] = useState(30);
  const [camera, setCamera] = useState<'overview' | 'coast' | 'route' | 'walk'>('overview');
  const [cameraEpoch, setCameraEpoch] = useState(0);
  const [operationView,setOperationView]=useState('operate');
  const [mode, setMode] = useState<'crowd' | 'water'>('crowd');
  const [route, setRoute] = useState(1), [water, setWater] = useState(0), [screen, setScreen] = useState(false);
  const [queueFocus, setQueueFocus] = useState<{ edge: string; status: string }>();
  const [point, setPoint] = useState<{ coord: Coord; elevation: number | null }>();
  const [buildingsEnabled, setBuildingsEnabled] = useState(true), [buildings, setBuildings] = useState<BuildingPack>();
  const [buildingError, setBuildingError] = useState('');
  const [freeWalk, setFreeWalk] = useState<{ coord: Coord; bearing: number }>();
  const [eyeViewReady, setEyeViewReady] = useState(false);
  const [walkCompare, setWalkCompare] = useState<'off' | 'compare'>('off');
  const language = manualLanguage(location.search,navigator.language);
  const t = (en:string,th:string) => language==='th' ? th : en;
  const areaPack = areaPacks[region.id];
  const isStudy = !!areaPack?.routesUrl && (areaPack.placeIndex === undefined || areaPack.placeIndex === selected);
  const terrainGridRef = useRef(grid); terrainGridRef.current = grid;
  const lastSelection = useRef(`${region.id}:${selected}`);
  useEffect(() => {
    setBuildings(undefined); setBuildingError('');
    if (!buildingsEnabled) return;
    const abort = new AbortController(), area = buildingAreaId(region.id, selected);
    fetch(`/data/buildings-${area}.json`, { signal: abort.signal })
      .then(r => { if (!r.ok) throw new Error('Building snapshot unavailable'); return r.json(); })
      .then(value => { const pack = parseBuildings(value, area); if (!abort.signal.aborted) setBuildings(pack); })
      .catch(error => { if (error.name !== 'AbortError') setBuildingError('Buildings unavailable here. Terrain and rehearsal remain available. / ข้อมูลอาคารไม่พร้อมใช้งาน'); });
    return () => abort.abort();
  }, [region.id, selected, buildingsEnabled]);
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
  const model = useMemo(() => data && isStudy ? simulate(data, count, speed, width, preparation, { count: runCount, speed: RUN_PACE }) : undefined, [data, count, speed, width, preparation, runCount, isStudy]);
  const compareModel = useMemo(() => data && isStudy && walkCompare === 'compare' ? simulate(data, count, speed, width, 0) : undefined, [data, count, speed, width, walkCompare, isStudy]);
  const current = useMemo(() => model ? frame(model, started ? seconds : -1) : undefined, [model, seconds, started]);
  const compareCurrent = useMemo(() => compareModel ? frame(compareModel, started ? seconds : -1) : undefined, [compareModel, seconds, started]);
  useEffect(() => { setSeconds(0); setStarted(false); setPlaying(false); setQueueFocus(undefined); }, [count, speed, width, preparation, runShare, region.id, selected]);
  const duration = Math.max(model?.duration ?? 0, hazard?.frames.at(-1)?.seconds ?? 0, animateWater ? riseMinutes * 60 : 0);
  const [waterSeconds,setWaterSeconds] = useState(0);
  const playbackSeconds = useRef(seconds); playbackSeconds.current=seconds;
  useEffect(()=>{ if (!playing) setWaterSeconds(seconds); },[seconds,playing]);
  useEffect(()=>{
    if (!playing) return;
    const timer=window.setInterval(()=>setWaterSeconds(playbackSeconds.current),200);
    return ()=>clearInterval(timer);
  },[playing]);
  const waterFrame = hazard ? replayAt(hazard, waterSeconds) : null;
  const shownWaterLevel = animateWater ? demonstrationLevel(waterSeconds, peak, riseMinutes * 60) : water;
  useEffect(() => {
    if (!playing || duration <= 0) return;
    let last=performance.now(), ticket=0;
    const tick=(now:number) => {
      const elapsed=now-last;
      if (elapsed>=1000/30) {
        last=now;
        if (!document.hidden) setSeconds(value=>advancePlayback(value,elapsed,rate,duration));
      }
      ticket=requestAnimationFrame(tick);
    };
    ticket=requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ticket);
  }, [playing, duration, rate]);
  useEffect(() => { if (duration > 0 && seconds >= duration) setPlaying(false); }, [seconds, duration]);
  useEffect(() => {
    if (flat || !host.current) return;
    setReady(false); setTerrainLoaded(false); setFailure(''); setWaterSurfaceError('');
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({ container: host.current, center: isStudy ? [98.265, 8.669] : [region.center[1], region.center[0]], zoom: isStudy ? 13.6 : region.zoom, pitch: dimension === '2d' ? 0 : 58, bearing: -65, maxPitch: 130, minZoom: 5, maxZoom: 23, renderWorldCopies: false, pixelRatio: Math.max(window.devicePixelRatio || 1, 2), canvasContextAttributes: {antialias:true},
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
      for (const id of ['routes', 'people', 'water', 'ends', 'pinch', 'arrows', 'buildings']) m.addSource(id, { type: 'geojson', data: empty });
      m.addLayer({ id:'building-outlines', type:'line', source:'buildings', minzoom:15, paint:{ 'line-color':'#d5e2df', 'line-width':.7, 'line-opacity':.65 } });
      // Massing is solid, not glass: at eye height a translucent box reads as a floating slab
      // rather than a building. The vertical gradient separates the roof plane from the facade.
      m.addLayer({ id:'building-volumes', type:'fill-extrusion', source:'buildings', minzoom:15, paint:{ 'fill-extrusion-height':['coalesce',['get','height'],UNKNOWN_BUILDING_MASSING_M], 'fill-extrusion-base':0, 'fill-extrusion-color':['case',['==',['get','heightSource'],'unknown'],'#8d9189','#e3e9e4'], 'fill-extrusion-opacity':1, 'fill-extrusion-vertical-gradient':true } });
      // Ground-level footprint outlines; the solid extrusion supplies the roof plane.
      // These lines are not elevated roof edges or certified building geometry.
      m.addLayer({ id:'building-footprint-outlines', type:'line', source:'buildings', minzoom:15, paint:{ 'line-color':'#f59e0b', 'line-width':.5, 'line-opacity':.55 } });
      m.addLayer({ id: 'water', type: 'fill', source: 'water', paint: { 'fill-color': '#3b99ca', 'fill-opacity': .48 } });
      const surface = new ReplayWaterLayer(setWaterSurfaceError); m.addLayer(surface); waterLayer.current = surface;
      m.addLayer({ id: 'route-casing', type: 'line', source: 'routes', paint: { 'line-color': '#12354e', 'line-width': 8 } });
      m.addLayer({ id: 'routes', type: 'line', source: 'routes', paint: { 'line-color': ['match', ['get', 'route'], 0, '#fafaf7', 1, '#f59e0b', '#b9ddf0'], 'line-width': 3 } });
      m.addLayer({ id: 'people', type: 'circle', source: 'people', filter: ['all', ['==', ['get', 'status'], 'walking'], ['!=', ['get', 'run'], true]], paint: { 'circle-pitch-scale':'viewport', 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 15, 3.5, 17, 6, 19, 9], 'circle-color': ['match', ['get', 'status'], 'queued', '#f59e0b', 'pending', '#9ba39a', '#fafaf7'], 'circle-stroke-color': '#12354e', 'circle-stroke-width': 1 } });
      // Runners are drawn as hollow rings: a shape difference, never a colour that
      // would read as safer or safer-looking.
      m.addLayer({ id: 'runners', type: 'circle', source: 'people', filter: ['all', ['==', ['get', 'status'], 'walking'], ['==', ['get', 'run'], true]], paint: { 'circle-pitch-scale':'viewport', 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2.5, 15, 5, 17, 8, 19, 11], 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#12354e', 'circle-stroke-width': 2 } });
      m.addLayer({ id: 'ends', type: 'circle', source: 'ends', paint: { 'circle-pitch-scale':'viewport', 'circle-radius': ['case', ['==',['get','role'],'destination'], 7, 3], 'circle-color': '#12354e', 'circle-stroke-color': '#fafaf7', 'circle-stroke-width': 1.5 } });
      m.addLayer({ id: 'pinch', type: 'circle', source: 'pinch', paint: { 'circle-pitch-scale':'viewport', 'circle-radius': 5, 'circle-color': '#f59e0b', 'circle-stroke-color': '#12354e', 'circle-stroke-width': 1.5 } });
      m.addLayer({ id: 'waiting-groups', type: 'circle', source: 'people', filter: ['!=', ['get', 'status'], 'walking'], paint: { 'circle-pitch-scale':'viewport', 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 15, 5.5, 17, 8, 19, 13], 'circle-color': ['match', ['get', 'status'], 'queued', '#f59e0b', '#9ba39a'], 'circle-stroke-color': '#12354e', 'circle-stroke-width': 1.5 } });
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
    const m = map.current;
    if (!m || !ready || !m.getSource('buildings')) return;
    (m.getSource('buildings') as GeoJSONSource).setData(buildingsEnabled && buildings ? buildings : empty);
    for (const id of ['building-outlines','building-footprint-outlines','building-volumes']) if (m.getLayer(id)) m.setLayoutProperty(id,'visibility',buildingsEnabled && buildings && (id !== 'building-volumes' || dimension === '3d') ? 'visible' : 'none');
  }, [ready, buildings, buildingsEnabled, dimension, flat]);
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
    const polygons = hazard ? replayPolygons(hazard, waterSeconds) : grid && (screen || animateWater) ? waterScreen(grid, shownWaterLevel) : { type: 'FeatureCollection' as const, features: [] };
    source?.setData(polygons);
    const hasSurface = waterLayer.current?.update(polygons, hazard ? undefined : shownWaterLevel) ?? false;
    waterLayer.current?.setVisible(dimension === '3d');
    if (map.current?.getLayer('water')) map.current.setPaintProperty('water', 'fill-opacity', dimension === '3d' && !waterSurfaceError && hasSurface ? .12 : .48);
  }, [ready, grid, shownWaterLevel, screen, isStudy, hazard, waterSeconds, animateWater, dimension, waterSurfaceError]);
  useEffect(() => {
    const m = map.current; if (!m || !ready || flat || !m.getSource('dem')) return;
    m.setTerrain(dimension === '3d' ? { source: 'dem', exaggeration: 1 } : null);
    m.setCenterClampedToGround(true);
    m.stop();
    if (dimension === '2d') m.jumpTo({elevation:0});
    if (dimension === '2d' && data && isStudy) fitRoutes(0);
    else m.jumpTo({ pitch: dimension === '2d' ? 0 : 58, bearing: 0, zoom: dimension === '2d' ? region.zoom : undefined });
  }, [dimension, ready, flat]);
  const selectedWalker = model?.people.find(p => p.route === route);
  const progress = selectedWalker && data ? walkerProgress(selectedWalker, data.routes[route], started ? seconds : -1) : undefined;
  const selectedSchedule = selectedWalker ? walkerSchedule(selectedWalker, seconds) : undefined;
  // A runner on the same route, used only to show what a run pace changes.
  const runnerTwin = model?.people.find(p => p.route === route && p.run);
  const runnerProgress = runnerTwin && data ? walkerProgress(runnerTwin, data.routes[route], started ? seconds : -1) : undefined;
  const selectedCompareWalker = compareModel?.people.find(p => p.route === route);
  const compareProgress = selectedCompareWalker && data ? walkerProgress(selectedCompareWalker, data.routes[route], started ? seconds : -1) : undefined;

  useEffect(() => {
    const m=map.current, source=m?.getSource('arrows') as GeoJSONSource | undefined;
    if (!source) return;
    const arrows=data && isStudy ? routeArrows(data.routes[route],camera === 'walk' ? 20 : 120) : empty;
    if (camera === 'walk' && progress) arrows.features=arrows.features.filter(f=>(f.properties?.chainageM ?? 0)>progress.metres+6 && (f.properties?.chainageM ?? 0)<progress.metres+300);
    source.setData(arrows);
    if (m?.getLayer('ends')) m.setLayoutProperty('ends','visibility',camera === 'walk' && dimension === '3d' ? 'none' : 'visible');
  },[ready,data,route,isStudy,camera,progress?.metres,dimension]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !data || !isStudy || !progress || dimension !== '3d' || !['route','walk'].includes(camera)) return;
    const path = data.routes[route];
    const ahead = progress.metres >= progress.total ? {coord:cameraStep(progress.coord,progress.heading,25)} : alongRoute(path, Math.min(progress.total, progress.metres + (camera === 'walk' ? 25 : 100)));
    if (camera === 'walk') {
      setEyeViewReady(false);
      let lastGround: string | undefined;
      const align = () => {
        const ground=m.queryTerrainElevation(progress.coord), targetGround=m.queryTerrainElevation(ahead.coord);
        if (ground === null || targetGround === null) return;
        const key=`${ground.toFixed(3)}:${targetGround.toFixed(3)}`;
        if (key===lastGround) return;
        lastGround=key; m.setCenterClampedToGround(false);
        const options=m.calculateCameraOptionsFromTo(new maplibregl.LngLat(...progress.coord),ground+EYE_HEIGHT_M,new maplibregl.LngLat(...ahead.coord),targetGround+EYE_HEIGHT_M);
        m.jumpTo(options); setEyeViewReady(true);
      };
      m.on('idle',align); align();
      return () => { m.off('idle',align); };
    } else {
      m.setCenterClampedToGround(true);
      m.easeTo({ center: progress.coord, zoom: 16, pitch: 65, bearing: progress.heading, duration: playing ? 50 : 800 });
    }
  }, [ready, camera, seconds, route, data, model, isStudy, dimension, started, playing, terrainLoaded, grid, cameraEpoch]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || isStudy || camera !== 'walk' || !freeWalk || dimension !== '3d') return;
    setEyeViewReady(false);
    let lastGround: string | undefined;
    const align = () => {
      const ahead = cameraStep(freeWalk.coord, freeWalk.bearing, 25);
      const ground = m.queryTerrainElevation(freeWalk.coord), target = m.queryTerrainElevation(ahead);
      if (ground === null || target === null) return;
      const key=`${ground.toFixed(3)}:${target.toFixed(3)}`;
      if (key===lastGround) return;
      lastGround=key; m.setCenterClampedToGround(false);
      m.jumpTo(m.calculateCameraOptionsFromTo(new maplibregl.LngLat(...freeWalk.coord),ground + EYE_HEIGHT_M,new maplibregl.LngLat(...ahead),target + EYE_HEIGHT_M));
      setEyeViewReady(true);
    };
    m.on('idle',align); align();
    const canvas = m.getCanvas();
    const key = (event: KeyboardEvent) => {
      const move = ['w','s','a','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key);
      if (!move) return;
      event.preventDefault(); event.stopPropagation();
      setFreeWalk(p => {
        if (!p) return p;
        if (event.key === 'a' || event.key === 'ArrowLeft') return {...p,bearing:p.bearing-8};
        if (event.key === 'd' || event.key === 'ArrowRight') return {...p,bearing:p.bearing+8};
        return {...p,coord:cameraStep(p.coord,p.bearing,event.key === 's' || event.key === 'ArrowDown' ? -2 : 2)};
      });
    };
    canvas.addEventListener('keydown',key,true);
    return () => { m.off('idle',align); canvas.removeEventListener('keydown',key,true); };
  }, [ready, isStudy, camera, freeWalk, dimension, cameraEpoch]);
  useEffect(() => {
    const m=map.current;
    if (!m || !ready || camera !== 'walk') return;
    const leaveEyeView = (event: maplibregl.MapLibreEvent) => {
      if (event.originalEvent) { setCamera('overview'); m.setCenterClampedToGround(true); }
    };
    m.on('movestart',leaveEyeView);
    return () => { m.off('movestart',leaveEyeView); };
  }, [ready,camera]);
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
  function fitRoutes(duration = 1600) {
    const m = map.current; if (!m || !data) return;
    const bounds = new maplibregl.LngLatBounds();
    data.routes.forEach(r => r.coordinates.forEach(p => bounds.extend(p)));
    m.fitBounds(bounds, { padding: { top: 32, bottom: 68, left: 48, right: 48 }, pitch: dimension === '2d' ? 0 : 48, bearing: dimension === '2d' ? 0 : -35, duration });
  }
  useEffect(() => { if (ready && data && isStudy && camera === 'overview' && !queueFocus) fitRoutes(); }, [ready, data, isStudy]);
  function view(which: typeof camera) {
    if (which === 'walk') { setRate(1); setPlaying(false); }
    setCamera(which); setCameraEpoch(epoch=>epoch+1);
    setQueueFocus(undefined);
    map.current?.setCenterClampedToGround(true);
    if (which === 'overview' && isStudy) { fitRoutes(); return; }
    if (which === 'overview') map.current?.flyTo({ center: isStudy ? [98.265, 8.669] : [region.center[1], region.center[0]], zoom: isStudy ? 13.6 : region.zoom, pitch: dimension === '2d' ? 0 : 58, bearing: dimension === '2d' ? 0 : -65, duration: 1800 });
  }
  useEffect(() => {
    if (!ready || dimension !== '3d' || camera !== 'coast') return;
    map.current?.flyTo({center:data && isStudy ? alongRoute(data.routes[route],(model?.distance[route] ?? 0)*.7).coord : [region.places[selected].lng,region.places[selected].lat],zoom:15.5,pitch:70,bearing:85,duration:3000,essential:false});
  }, [ready,dimension,camera,cameraEpoch,selected,region.id,data,isStudy,route,model]);
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
  const paceLadder = useMemo(() => active && model ? paceLines(active, model, WALK_PACES, RUN_PACE, runCount) : [], [active, model, runCount]);
  const waits = useMemo(() => active && model ? segmentWaits(route, active, model) : [], [active, model, route]);
  const profile = useMemo(() => active && grid ? active.coordinates.map(p => elevation(grid, p) ?? 0) : [], [active, grid]);
  const chainage = useMemo(() => { let sum = 0; return active?.coordinates.map((p, i) => { if (i) sum += distance(active.coordinates[i - 1], p); return sum; }) ?? []; }, [active]);
  const guideAvailable=camera==='walk'&&!flat&&!!progress&&!!selectedSchedule;
  useEffect(()=>{if(!guideAvailable)setOperationView('operate');},[guideAvailable]);
  return <section className="terrain-rehearsal" aria-label="Terrain and crowd rehearsal" data-exercise-seconds={seconds.toFixed(3)} data-water-seconds={waterSeconds.toFixed(3)} data-presentation="network-node-totals" data-camera={camera} data-buildings={buildingsEnabled && buildings ? 'shown' : 'off'} data-building-area={buildings?.area ?? ''} data-state={flat ? 'flat' : ready ? 'ready' : 'loading'}>
    <DockControls target={bannerDock}><div className="terrain-toolbar">
      {isStudy && <><div className="experiment-tabs" role="group" aria-label="Active experiment"><button aria-pressed={mode === 'crowd'} aria-label="Rehearsal" title="Rehearsal — crowd queue on the mapped network" onClick={() => { setMode('crowd'); setScreen(false); }}><CameraSymbol name="rehearsal" /></button><button aria-pressed={mode === 'water'} aria-label="Water level" title="Water level — illustrative static level on the terrain" onClick={() => { setMode('water'); setAnimateWater(false); setQueueFocus(undefined); setScreen(true); setPlaying(false); }}><CameraSymbol name="water" /></button></div><span className="toolbar-divider" aria-hidden="true" /></>}
      <div className="terrain-view-controls" role="group" aria-label="Camera controls">
        <button aria-pressed={!flat && dimension === '3d'} aria-label="3D terrain" title="3D terrain" onClick={() => { setFlat(false); setDimension('3d'); }}><CameraSymbol name="terrain3d" /></button>
        <button aria-pressed={!flat && dimension === '2d'} aria-label="2D map" title="2D map — plan view" onClick={() => { setFlat(false); setDimension('2d'); setCamera('overview'); setQueueFocus(undefined); }}><CameraSymbol name="map2d" /></button>
        {!flat && <><button disabled={!ready} aria-label="Fly-by" title="Fly-by — aerial sweep over the route or area" aria-pressed={camera === 'route' || camera === 'coast'} onClick={() => { setDimension('3d'); view(isStudy && model ? 'route' : 'coast'); }}><CameraSymbol name="flyby" /></button><button disabled={!ready || (isStudy && !model) || (!isStudy && buildingsEnabled && !buildings && !buildingError)} aria-label="Walk-through" title="Walk-through — 1.65 m eye height on the mapped route" aria-pressed={camera === 'walk'} onClick={() => { setDimension('3d'); view('walk'); if (!isStudy) { const p=region.places[selected], start=buildings?.walkStart; const coord:Coord=start?.coord ?? [p.lng,p.lat]; setFreeWalk({coord,bearing:start?.bearing ?? 0}); map.current?.easeTo({center:coord,zoom:16,pitch:60,duration:600}); map.current?.getCanvas().focus({preventScroll:true}); } }}><CameraSymbol name="walk" /></button><button disabled={!ready} aria-label="Overview" title="Overview — the whole exercise area" aria-pressed={camera === 'overview' && !queueFocus} onClick={() => view('overview')}><CameraSymbol name="overview" /></button><button disabled={!ready || !isStudy || !model} aria-label="Queue" title="Queue — totals waiting at network nodes" aria-pressed={!!queueFocus} onClick={inspectQueue}><CameraSymbol name="queue" /></button>{isStudy && model && <><span className="toolbar-divider" aria-hidden="true" /><button aria-label="Compare departures" title="Compare immediate and delayed departure" aria-pressed={walkCompare === 'compare'} onClick={() => setWalkCompare(walkCompare === 'off' ? 'compare' : 'off')}><CameraSymbol name="compare" /></button></>}</>}
      </div>

    </div></DockControls>
    {flat ? <StudyMap region={region} selected={selected} onSelect={onSelect} buildings={buildings} /> : <div className="terrain-stage">
      <div ref={host} className="terrain-canvas" aria-label="3D terrain map. Drag to pan, right-drag to tilt. Click for terrain height." />

      {!ready && !failure && <p className="terrain-notice" role="status">Loading satellite imagery and terrain…</p>}
      {failure && <p className="terrain-notice" role="alert">{failure} <button onClick={() => setFlat(true)}>Open 2D map</button></p>}

    </div>}
    <div className="terrain-caption">
      <span>{queueFocus ? `${queueCount.toLocaleString()} ${queueFocus.status === 'queued' ? 'queued' : 'awaiting release'} at model node · footprint not modeled` : point ? `${point.coord[1].toFixed(5)}, ${point.coord[0].toFixed(5)} · ${point.elevation === null ? 'height unavailable' : `DEM ≈ ${Math.round(point.elevation)} m, not a safety test`}` : `${camera === 'walk' && !flat ? '' : `${region.places[selected]?.name} · `}${flat ? 'basic 2D reference' : dimension === '2d' ? '2D replay' : camera === 'walk' ? `${eyeViewReady ? '1.65m eye' : 'Ground view loading'} · coarse DEM${buildingsEnabled && buildings ? ' · unknown=3m' : ''}` : buildingsEnabled && buildings ? 'OSM massing: 3m if unknown' : terrainLoaded ? '1× relief' : 'terrain loading'} · exercise only`}</span>
      <span className="terrain-credits">© <a href="https://www.esri.com/">Esri &amp; contributors</a> · <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Mapzen</a> · <a href="https://www.openstreetmap.org/copyright">OSM</a></span>
      {camera === 'walk' && <SunIndicator language={manualLanguage(location.search,navigator.language)} latitude={region.places[selected]?.lat ?? region.center[0]} longitude={region.places[selected]?.lng ?? region.center[1]} />}
      <ReadingDialog className="terrain-map-key" title="Map key"><p>{isStudy && !flat ? 'Lines: three mapped walking approaches. Amber point: assumed pinch point. White points: moving agents. Hollow rings: agents moving at the run pace. Amber and gray points: queue and release totals at network nodes, not physical crowd footprints.' : 'Geographic reference; no crowd or route layers in this view.'}{!flat && ' Click terrain for approximate DEM height; no height establishes safety.'} Playback: choose Walk-through for a paused 1× eye-level view, then Start or Play route in Guide. Hidden tabs and rendering stalls pause advancement rather than jumping ahead. Use 5× to review faster; 30×/120× compress exercise time. Rendering requests at least 2 pixels per CSS pixel (device limits may cap it); imagery detail and coarse DEM remain source-limited, not street-level photography. Buildings use OSM footprints; height tags are not surveyed here, floor counts assume 3m per storey, and missing heights use labelled 3m massing. No building is a certified refuge. Imagery © Esri and contributors; terrain © Mapzen and credited elevation sources; roads © OpenStreetMap contributors.</p></ReadingDialog>
    </div>
    <div className="terrain-operations"><DockControls target={bannerDock}><label className="operation-switch"><span className="sr-only">Scene task / งาน</span><select aria-label="Scene task / งาน" value={operationView} onChange={e=>setOperationView(e.target.value)}><option value="operate">Controls</option><option value="guide" disabled={!guideAvailable}>Guide</option></select></label></DockControls>      {guideAvailable && operationView==='guide' && <div className="guide-playback" aria-label={t('Guide playback','การเล่นแบบฝึก')}>
        <button disabled={!ready} onClick={startExercise}>{playing?t('Pause','หยุดชั่วคราว'):t('Play route','เล่นเส้นทาง')}</button>
        <span>{t('Elapsed','ผ่านไป')} {minutes(seconds)}</span>
        <label>{t('Speed','ความเร็ว')} <select aria-label="Guide speed / ความเร็วในคู่มือ" value={rate} onChange={e=>setRate(Number(e.target.value))}><option value={1}>1×</option><option value={5}>5×</option><option value={30}>30×</option><option value={120}>120×</option></select></label>
      </div>}
<PagedFlow label="Rehearsal controls and guide" className="operations-pages"><div className="operations-content" hidden={operationView!=='guide'}>
      {camera === 'walk' && !flat && progress && selectedSchedule && <WalkthroughCoach language={manualLanguage(location.search,navigator.language)} state={progress.state} remainingM={Math.max(0,progress.total-progress.metres)} finishSeconds={selectedSchedule.finishSeconds} remainingSeconds={selectedSchedule.remainingSeconds} queueSeconds={selectedSchedule.queueSeconds} pace={selectedWalker?.speed ?? 0} runner={runnerTwin && runnerProgress ? { pace: runnerTwin.speed, remainingM: Math.max(0, runnerProgress.total - runnerProgress.metres), finishSeconds: runnerTwin.finish } : undefined} onReview={onReview} full/>}
      </div><div className="operations-content" hidden={operationView!=='operate'}>
    {camera === 'walk' && !isStudy && !flat && <div className="ground-walk-controls" aria-label="Terrain camera controls">
      <button aria-label="Turn camera left" onClick={()=>setFreeWalk(p=>p ? {...p,bearing:p.bearing-8}:p)}>↶</button>
      <button aria-label="Move camera forward" onClick={()=>setFreeWalk(p=>p ? {...p,coord:cameraStep(p.coord,p.bearing,2)}:p)}>↑</button>
      <button aria-label="Move camera backward" onClick={()=>setFreeWalk(p=>p ? {...p,coord:cameraStep(p.coord,p.bearing,-2)}:p)}>↓</button>
      <button aria-label="Turn camera right" onClick={()=>setFreeWalk(p=>p ? {...p,bearing:p.bearing+8}:p)}>↷</button>
      <span>{eyeViewReady ? '1.65m camera' : 'Loading ground height'} · no route guidance / ไม่ใช่เส้นทางอพยพ</span>
    </div>}
    {!isStudy && <p className="area-data-status">Terrain views available. No local route/destination pack is connected for this selected place. {hazard ? 'Research inundation frames are loaded.' : 'Wave predictions are not connected.'}</p>}
    {!model && (hazard || animateWater) && <div className="imported-replay-controls"><button onClick={startExercise}>{playing ? 'Pause' : started ? 'Run' : 'Start warning'}</button><label>Warning +{minutes(seconds)}<TimeScrubber label="Imported scenario time" duration={duration} value={seconds} onChange={value => { setStarted(true); setSeconds(value); setPlaying(false); }} /></label><span>{waterFrame ? 'Imported research frame' : 'No model frame at this time'}</span></div>}
    {isStudy && model && data && <>
      <div className="rehearsal-panel" hidden={mode !== 'crowd'}>
      <div className="rehearsal-controls" id="rehearsal-controls">
        <div className="control-group"><span className="control-group-label">{t('Group','กลุ่ม')}</span>
          <label>People<select aria-label="People" value={count} onChange={e => setCount(Number(e.target.value))}><option value={500}>500</option><option value={1500}>1,500</option><option value={5000}>5,000</option></select></label>
          <label title={t('Share of the group moving at a run pace. An assumed exercise parameter, not advice.','สัดส่วนผู้เดินด้วยจังหวะวิ่ง เป็นค่าตั้งสมมติของแบบฝึก ไม่ใช่คำแนะนำ')}>Runners<select aria-label="Share of the group moving at a run pace" value={runShare} onChange={e => setRunShare(Number(e.target.value))}><option value={0}>{t('None','ไม่มี')}</option><option value={0.1}>10%</option><option value={0.25}>25%</option><option value={0.5}>50%</option></select></label>
        </div>
        <div className="control-group"><span className="control-group-label">{t('Movement','การเคลื่อนที่')}</span>
          <label title={t('Walking pace of the group. An assumed exercise parameter.','จังหวะเดินของกลุ่ม เป็นค่าตั้งสมมติของแบบฝึก')}>Pace<select aria-label="Walking pace" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={0.8}>0.8 m/s</option><option value={1.4}>1.4 m/s</option><option value={2.4}>2.4 m/s</option></select></label>
          <label>Delay<select aria-label="Preparation delay" value={preparation} onChange={e => setPreparation(Number(e.target.value))}><option value={0}>0 s</option><option value={60}>1 min</option><option value={300}>5 min</option></select></label>
        </div>
        <div className="control-group"><span className="control-group-label">{t('Scenario','สถานการณ์')}</span>
          <label>Route<select aria-label="Camera approach" value={route} onChange={e => setRoute(Number(e.target.value))}>{data.routes.map((r, i) => <option value={i} key={r.name}>{r.name.replace(" approach", "")}</option>)}</select></label>
          <label>Water demo<select aria-label="Illustrative water level" disabled={!!hazard || flat} value={animateWater ? peak : 0} onChange={e => {
            const val = Number(e.target.value);
            if (val === 0) {
              setAnimateWater(false);
              setScreen(false);
            } else {
              setPeak(val);
              setAnimateWater(true);
              setScreen(true);
            }
          }}><option value={0}>Off</option><option value={5}>+5 m</option><option value={10}>+10 m</option><option value={15}>+15 m</option><option value={20}>+20 m</option></select></label>
        </div>
        <button className="rehearsal-play" aria-label={playing ? t('Pause rehearsal','หยุดชั่วคราวแบบฝึก') : started ? t('Resume rehearsal','เล่นต่อแบบฝึก') : t('Start rehearsal','เริ่มแบบฝึก')} disabled={flat || !ready} onClick={startExercise}>{playing ? t('Pause','หยุดชั่วคราว') : started ? t('Resume','เล่นต่อ') : t('Start','เริ่ม')}</button>
      </div>
      <div className="rehearsal-timeline">
        <button onClick={() => { setSeconds(0); setStarted(false); setPlaying(false); setQueueFocus(undefined); }}>Reset</button>
        <label className="timeline-label"><span>{started ? t('Elapsed +','ผ่านไป +') : t('Ready · ','พร้อม · ')}{minutes(seconds)}</span><TimeScrubber label="Exercise time" duration={duration} value={seconds} onChange={value => { setSeconds(value); setStarted(true); setPlaying(false); }} /></label>
        <label>{t('Speed','ความเร็ว')}<select aria-label="Playback speed / ความเร็ว" value={rate} onChange={e => setRate(Number(e.target.value))}><option value={1}>1×</option><option value={5}>5×</option><option value={30}>30×</option><option value={120}>120×</option></select></label>
      </div>
      <p className="exercise-boundary" aria-live="polite">{started ? (progress?.state === 'preparing' ? 'Preparing' : progress?.state === 'queued' ? 'Queued at model node' : progress?.state === 'arrived' ? 'Exercise endpoint reached' : t('Route rehearsal','ฝึกเส้นทาง')) : t('Choose a view, then Start','เลือกมุมมอง แล้วกดเริ่ม')} · {hazard ? (waterFrame ? 'unverified replay; agents unaffected' : 'no replay frame; agents unaffected') : animateWater ? `Illustrative level +${shownWaterLevel.toFixed(1)}m MSL · agents unaffected` : 'no wave prediction'} · endpoint unapproved</p>
      <div className="rehearsal-readout" aria-label="Crowd counts">
        <span><strong>{current?.walking.toLocaleString()}</strong> walking</span><span><strong>{current?.queued.toLocaleString()}</strong> queued at nodes</span><span><strong>{current?.arrived.toLocaleString()}</strong> at endpoint</span><span><strong>{current?.pending.toLocaleString()}</strong> awaiting release</span><span>Last arrival <strong>{minutes(model.duration)}</strong> · max link wait <strong>{minutes(model.maxQueueWait)}</strong></span>
        {runCount > 0 && <span className="runner-count"><strong>{current?.running.toLocaleString()}</strong> running of {runCount.toLocaleString()} runners</span>}
      </div>
      {active && model && (
        <div className="escape-timing" aria-label="Modelled time to the exercise end">
          <div className="escape-timing-head">
            <strong>{t('Time to the exercise end','เวลาถึงปลายทางแบบฝึก')}</strong>
            <label className="target-time">{t('Target','เป้าหมาย')}<select aria-label="Target time to the exercise end" value={targetMinutes} onChange={e => setTargetMinutes(Number(e.target.value))}><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select></label>
          </div>
          <dl className="escape-paces">
            {paceLadder.map(line => (
              <div key={line.pace} className={line.run ? 'run' : undefined}>
                <dt>{line.label}{line.run ? ` · ${runCount.toLocaleString()} of ${count.toLocaleString()}` : ''}</dt>
                <dd>{minutes(line.seconds)}<small>free flow</small></dd>
              </div>
            ))}
            <div className="needed">
              <dt>{t(`Pace for ${targetMinutes} min`,`จังหวะเพื่อ ${targetMinutes} นาที`)}</dt>
              <dd>{speedForSeconds(active, targetMinutes * 60).toFixed(1)} m/s<small>{t('without queueing','เมื่อไม่มีคิว')}</small></dd>
            </div>
          </dl>
          <p className="field-note">{t('Modelled on the mapped route. The endpoint is unapproved; these are exercise times, not wave-arrival margins and not advice.','คำนวณจากเส้นทางที่แมปไว้ ปลายทางยังไม่ได้รับการรับรอง เวลาเหล่านี้เป็นเวลาแบบฝึก ไม่ใช่เวลาคงเหลือก่อนคลื่นมาถึง และไม่ใช่คำแนะนำ')}</p>
        </div>
      )}
      {walkCompare === 'compare' && compareProgress && progress && (
        <div className="compare-panel" aria-label="Departure timing comparison">
          <div className="compare-heading">Exercise comparison · same route, different preparation delays</div>
          <p className="field-note">{preparation===0 ? 'Both conditions currently have zero preparation delay. Choose a delay to compare.' : `At warning +${minutes(seconds)}: 0s preparation has ${compareCurrent?.pending} awaiting release and ${compareCurrent?.queued} queued; selected delay has ${current?.pending} awaiting release and ${current?.queued} queued.`}</p>
          <p className="field-note">Mapped route progress · 0–100%</p>
          <div className="compare-timeline">
            <div className="compare-bar">
              <div className="compare-track"><div className="compare-fill immediate" style={{width: `${Math.min(100, (compareProgress.metres / compareProgress.total) * 100)}%`}}></div></div>
              <span className="compare-label">0 s preparation · {Math.round(compareProgress.metres)} / {Math.round(compareProgress.total)} m · {compareProgress.state === 'arrived' ? 'arrived' : compareProgress.state}</span>
            </div>
            <div className="compare-bar">
              <div className="compare-track"><div className="compare-fill delayed" style={{width: `${Math.min(100, (progress.metres / progress.total) * 100)}%`}}></div></div>
              <span className="compare-label">Selected ({Math.round(preparation / 60)} min preparation) · {Math.round(progress.metres)} / {Math.round(progress.total)} m · {progress.state}</span>
            </div>
          </div>
          <p className="compare-note">Both rows use the exercise clock and an unapproved endpoint; this is not a safety comparison.</p>
        </div>
      )}
      </div>
      <div className={`terrain-secondary ${mode}`}>
      {mode === 'water' &&         <div className="water-experiment"><div className="water-control-row"><label><input type="checkbox" checked={screen} onChange={e => setScreen(e.target.checked)} /> Screen terrain</label>
          <label>{hazard ? 'Model depths' : `+${water} m`}<input aria-label="Static experimental water level" type="range" min={0} max={20} step={1} value={water} disabled={!screen || flat || !!hazard} onChange={e => setWater(Number(e.target.value))} /></label></div>
          <small>{hazard ? `${hazard.title} · ${hazard.model} · ${waterFrame ? 'interpolated model frame' : 'no frame at this time'}. ` : 'Blue = connected low terrain at a chosen static level, not tsunami physics. '}Imported frames and terrain screening do not alter agents or certify safety. Unshaded land is not classified safe.</small>
        </div>}
      <div className="terrain-analysis-row">
        <div className="route-profile"><strong>{areaPack?.label}: {active?.name} · {((model.distance[route] ?? 0) / 1000).toFixed(2)} km</strong><span>{progress ? `${(Math.max(0, progress.total - progress.metres) / 1000).toFixed(2)} km to exercise end · ${progress.state}` : 'Approximate DEM profile'} · endpoint unapproved</span>
          <div className="profile-chart"><div className="profile-y-scale" aria-hidden="true"><span>{Math.round(Math.max(20,...profile))} m</span><span>{Math.round(Math.max(20,...profile)/2)} m</span><span>0 m</span></div><svg viewBox="0 0 480 54" preserveAspectRatio="none" role="img" aria-label={`Terrain elevation profile, ${Math.round(Math.min(...profile))} to ${Math.round(Math.max(...profile))} metres. Not a safety classification.`}><path vectorEffect="non-scaling-stroke" d="M0 6H480M0 28H480M0 50H480" fill="none" stroke="#b9c2bd" strokeWidth=".6"/><polyline vectorEffect="non-scaling-stroke" fill="none" stroke="#12354e" strokeWidth="2" points={profile.map((v, i) => `${(chainage[i] ?? 0) / Math.max(1, chainage.at(-1) ?? 1) * 480},${50 - Math.max(0, v) / Math.max(20, ...profile) * 44}`).join(' ')} /></svg><div className="profile-x-scale" aria-hidden="true"><span>0 km</span><span>{((chainage.at(-1)??0)/2000).toFixed(2)}</span><span>{((chainage.at(-1)??0)/1000).toFixed(2)} km</span></div></div>
          <p className="route-cue">{!started ? 'Start runs a rehearsal. Real warnings require prompt action following local guidance.' : progress?.state === 'preparing' ? `Preparation interval: ${Math.max(0, preparation - seconds).toFixed(0)} s remaining in this exercise.` : progress?.state === 'queued' ? 'First walker is queued at a network node; the physical crowd is not simulated.' : progress?.state === 'arrived' ? 'First walker reached the exercise end; other agents may still be en route.' : nextDirection ? `Selected exercise route: in ${nextDirection.distanceM} m, bear ${nextDirection.direction}.` : 'Continue along the selected exercise route to its unapproved endpoint.'}</p>
          <div className="profile-scale"><span>Start ≈ {Math.round(profile[0] ?? 0)} m</span><span>DEM range ≈ {Math.round(Math.min(...profile))}–{Math.round(Math.max(...profile))} m</span><span>End ≈ {Math.round(profile.at(-1) ?? 0)} m</span></div>
        </div>
        {waits.length > 0 && (
          <div className="queue-chart">
            <strong>{t('Where the queue forms','คิวเกิดที่ไหน')}</strong>
            <span className="queue-chart-sub">{t('Longest modelled wait per segment of the selected route','เวลารอสูงสุดที่จำลองไว้ในแต่ละช่วงของเส้นทางที่เลือก')}</span>
            <div className="queue-chart-plot" role="img" aria-label={`Modelled wait per route segment. Longest wait ${Math.round(Math.max(...waits.map(w => w.waitSeconds)))} seconds at ${Math.round(Math.max(...waits.map(w => w.waitSeconds)) / 60)} minutes.`}>
              {waits.map(wait => (
                <div className="queue-column" key={wait.edge}>
                  <span className="queue-bar" style={{ height: `${Math.max(2, wait.waitSeconds / Math.max(1, ...waits.map(w => w.waitSeconds)) * 100)}%` }} />
                  <span className="queue-tick">{Math.round(wait.waitSeconds)}s</span>
                  <span className="queue-chainage">{(wait.chainageM / 1000).toFixed(1)} km</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      </div>
    </>}
    </div></PagedFlow></div>
      <DockControls target={bannerDock}><div className="exercise-console" id="exercise-console"><ReadingDialog title="Sources, assumptions, settings & coverage"><div className="console-sections">
      {isStudy && model && data && <section className="console-section" id="console-method">
        <h3>Sources and assumptions</h3>
      <p>Road geometry: <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors / ODbL</a>, snapshot {data.accessed}. Three shortest mapped walking paths converge on a selected inland network endpoint. Access, crossings, obstructions and destination suitability have not been surveyed. No route is recommended for emergency use.</p><p>Each white point represents one moving synthetic person; an amber or gray point aggregates people waiting at the same model node. A deterministic FIFO point-queue model uses {speed} m/s, a {preparation}-second preparation delay after the exercise warning, a 0.15-second release interval per approach, 6 m assumed width elsewhere, {width} m at the amber-point link and an assumed flow of 1.2 people/m/s. Queues are totals at exact network nodes. Their physical shape, density and spillback are not modeled; no offsets or decorative crowd rings are drawn. There is no collision, storage spillback, slope penalty, mobility mix, injury or water interaction. Running is an experiment, not advice. This is separate from the paper’s 39,041-agent Unity model.</p><p>Walk-through follows the first synthetic walker at an approximate 1.65m eye height over the available DEM and imagery; it is not street-view photography and does not resolve kerbs, stairs or doors. Arrows follow the selected mapped exercise route, not authority-approved signs. Water rise is a user-chosen static-level demonstration, not tsunami dynamics. Imported depth frames remain research results. Moving people are point markers, not a physical-crowd simulation.</p><p>Terrain: <a href="https://registry.opendata.aws/terrain-tiles/">Mapzen Terrain Tiles on AWS</a>, 1× relief; local screening uses a sampled z12 Terrarium grid accessed {grid?.accessed}. Heights are approximate. Actual inundation replay and approved evacuation guidance require a georeferenced scenario flood grid, surveyed routes and authority-approved refuges from the research team.</p>
      </section>}
      <details className="console-section" id="console-settings">
        <summary>Scenario settings, data and coverage</summary>
      <label><input type="checkbox" checked={buildingsEnabled} disabled={flat} onChange={e=>setBuildingsEnabled(e.target.checked)} /> OSM buildings / อาคาร</label>
      {buildingsEnabled && <p className="building-source-note">{buildings ? <>{buildings.counts.total.toLocaleString()} mapped footprints · {buildings.counts.heightTag} height tags · {buildings.counts.levelsEstimate} floor-count estimates · {buildings.counts.unknown.toLocaleString()} unknown heights shown as 3m massing. <a href={buildings.sourceUrl} target="_blank" rel="noreferrer">OSM source</a> · {buildings.retrievedAt.slice(0,10)}. Coverage is a local snapshot, not every building in the region. Heights are not surveyed or approved refuges. / อาคารที่ไม่มีข้อมูลความสูงใช้รูปทรงสมมติ 3 เมตร ไม่ใช่การรับรองจุดอพยพ</> : buildingError || 'Loading building snapshot… / กำลังโหลดข้อมูลอาคาร'}</p>}

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
      {consoleSlot && <details className="console-section"><summary>Local context and personal plan</summary>{consoleSlot}</details>}
        </div></ReadingDialog></div></DockControls>
  </section>;
}
