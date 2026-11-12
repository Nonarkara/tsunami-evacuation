import { DockControls } from './BannerDock';
import { ReadingDialog } from './ReadingDialog';
import { ExerciseMethod } from './ExerciseMethod';
import { TechnicalFiles } from './TechnicalData';
import { PagedFlow } from './PagedFlow';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import terrainWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(terrainWorker);
import { ReplayWaterLayer } from './ReplayWaterLayer';
import { advancePlayback } from './playback';
import { TimeScrubber } from './TimeScrubber';
import { buildingAreaId, parseBuildings, buildingDisplay, cameraStep, EYE_HEIGHT_M, type BuildingPack } from './buildings';
import { StudyMap } from './Map';
import { CameraSymbol } from './CameraSymbol';
import { WalkthroughCoach } from './WalkthroughCoach';
import { manualLanguage } from './manual-content';
import { SunIndicator } from './SunIndicator';
import type { CoastalRegion } from './research';
import { areaPacks, alongRoute, bearing, routeChainage, walkerProgress, walkerSchedule, nextTurn, routeArrows, demonstrationLevel, parseHazardReplay, replayAt, replayPolygons, type HazardReplay } from './rehearsal';
import { simulate, frame, elevation, waterScreen, type RouteData, type TerrainGrid, type Coord } from './crowd';
import { paceLines, segmentWaits, speedForSeconds, bottleneckSummaries } from './escape-timing';
import { waitClock } from './viz';
import { PaceRuler, ProfileQueue, StackBar } from './charts';
import { EscapeGuide, EscapeMethod, EscapePlayback, type EscapeGuideProps } from './EscapeGuide';
import { WarningLesson } from './WarningLesson';
import { rokehanScene, sceneTimeOfDay } from './scene-reference';
import { parseRoofShapes, roofRidges, applyRoofShapes, type RoofRecord } from './roofshapes';
import { depthColourExpression, depthRange, fileDepthScale } from './water-depth';
import { solarPosition } from './orientation';
import { DdpmMaps } from './DdpmMaps';
import { placeReference } from './place-references';
import { DDPM_VILLAGE_SNAPSHOT, parseRiskVillages, villageHit, riskPoint, type RiskVillageSnapshot } from './ddpm-maps';

const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
const minutes = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
/** Run pace used by the mixed-pace exercise. An assumed walking model, not advice. */
const RUN_PACE = 3;
/** Walking paces the reader can compare, in metres per second. */
const WALK_PACES = [0.8, 1.4, 2.4];
export function TerrainRehearsal({ region, selected, onSelect, consoleSlot, finding, onReview, onPlan, bannerDock, active:sceneActive }: { region: CoastalRegion; selected: number; onSelect: (n: number) => void; consoleSlot?: ReactNode; finding?: ReactNode; onReview:()=>void; onPlan:()=>void; bannerDock:HTMLElement|null; active:boolean }) {
  const areaPack = areaPacks[region.id];
  const isStudy = !!areaPack?.routesUrl && (areaPack.placeIndex === undefined || areaPack.placeIndex === selected);
  const initialLesson = isStudy && new URLSearchParams(location.search).get('lesson') === 'escape';
  const waterLayer = useRef<ReplayWaterLayer | null>(null);
  const [waterSurfaceError, setWaterSurfaceError] = useState('');
  const host = useRef<HTMLDivElement>(null), map = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [data, setData] = useState<RouteData>(), [grid, setGrid] = useState<TerrainGrid>();
  const [dimension, setDimension] = useState<'2d' | '3d'>('3d');
  const [started, setStarted] = useState(false), [preparation, setPreparation] = useState(0);
  const [hazard, setHazard] = useState<HazardReplay>(), [importError, setImportError] = useState('');
  const [animateWater, setAnimateWater] = useState(initialLesson), [peak, setPeak] = useState(10), [riseMinutes, setRiseMinutes] = useState(10);
  const [flat, setFlat] = useState(false), [terrainLoaded, setTerrainLoaded] = useState(false);
  const [count, setCount] = useState(1500), [speed, setSpeed] = useState(1.4), [width, setWidth] = useState(2);
  const [runShare, setRunShare] = useState(0), [targetMinutes, setTargetMinutes] = useState(30);
  const runCount = Math.round(count * runShare);
  const [seconds, setReadingSeconds] = useState(0);
  const [waterSeconds, setWaterSeconds] = useState(0);
  const [playing, setPlaying] = useState(false), [rate, setRate] = useState(initialLesson?1:30);
  const playbackSeconds = useRef(0);
  const playbackRunning = useRef(false);
  const drawCamera = useRef<(() => void) | null>(null);

  const setSeconds = useCallback((value: number) => {
    playbackSeconds.current = value;
    setReadingSeconds(value);
    setWaterSeconds(value);
  }, []);
  const pausePlayback = useCallback(() => {
    playbackRunning.current = false;
    setSeconds(playbackSeconds.current);
    setPlaying(false);
  }, [setSeconds]);
  const [camera, setCamera] = useState<'overview' | 'coast' | 'route' | 'walk'>(initialLesson?'walk':'overview');
  const [cameraEpoch, setCameraEpoch] = useState(0);
  const coastRequestHandled=useRef(-1);
  const [operationView,setOperationView]=useState('operate');
  const [mode, setMode] = useState<'crowd' | 'water' | 'escape'>(initialLesson?'escape':'crowd');
  const [schematic,setSchematic] = useState(true);
  // Keep imported data intact; this learning mode always shows the chosen illustration.
  const activeHazard = mode === 'escape' ? undefined : hazard;
  const [route, setRoute] = useState(1), [water, setWater] = useState(0), [screen, setScreen] = useState(initialLesson);
  const [queueFocus, setQueueFocus] = useState<{ edge: string; status: string }>();
  const [point, setPoint] = useState<{ coord: Coord; elevation: number | null }>();
  const [buildingsEnabled, setBuildingsEnabled] = useState(true), [buildings, setBuildings] = useState<BuildingPack>();
  const [roofs, setRoofs] = useState<Map<string, RoofRecord>>();
  const [buildingError, setBuildingError] = useState('');
  const [riskVillages,setRiskVillages]=useState<RiskVillageSnapshot|null>(null),[riskError,setRiskError]=useState('');
  const [showRiskVillages,setShowRiskVillages]=useState(false),[listedFocus,setListedFocus]=useState<[number,number]|null>(null);
  const [villagePick,setVillagePick]=useState<ReturnType<typeof villageHit>>(null);
  const [freeWalk, setFreeWalk] = useState<{ coord: Coord; bearing: number }>();
  const [eyeViewReady, setEyeViewReady] = useState(false);
  const [pageVisible,setPageVisible] = useState(!document.hidden);
  const [modalOpen,setModalOpen] = useState(false);
  const manualCamera = useRef(false);
  const playbackAllowed=sceneActive&&pageVisible&&!modalOpen&&!flat;
  const cameraSuspended=useRef(!playbackAllowed); cameraSuspended.current=!playbackAllowed;
  const [walkCompare, setWalkCompare] = useState<'off' | 'compare'>('off');
  const language = manualLanguage(location.search,navigator.language);
  const t = (en:string,th:string) => language==='th' ? th : en;
  const terrainGridRef = useRef(grid); terrainGridRef.current = grid;
  const lastSelection = useRef(`${region.id}:${selected}`);
  useEffect(()=>{setVillagePick(null);setListedFocus(null);},[selected]);
  useEffect(()=>{
    setRiskVillages(null);setRiskError('');setShowRiskVillages(false);setListedFocus(null);setVillagePick(null);
    if(region.id!=='khao-lak')return;
    const abort=new AbortController();
    fetch(DDPM_VILLAGE_SNAPSHOT,{signal:abort.signal}).then(response=>{if(!response.ok)throw Error('DDPM snapshot unavailable');return response.json();}).then(value=>{if(!abort.signal.aborted)setRiskVillages(parseRiskVillages(value));}).catch(error=>{if(error.name!=='AbortError')setRiskError(t('DDPM inventory unavailable; external sheets remain linked.','บัญชี ปภ. ไม่พร้อมใช้ ยังเปิดแผ่นแผนที่ภายนอกได้'));});
    return()=>abort.abort();
  },[region.id]);
  useEffect(()=>{
    const visibility=()=>{
      setPageVisible(!document.hidden);
      if(document.hidden){pausePlayback();map.current?.stop();}
    };
    document.addEventListener('visibilitychange',visibility);
    return()=>document.removeEventListener('visibilitychange',visibility);
  },[]);
  useEffect(()=>{
    // Reading a native dialog is a task change; closing it never resumes playback.
    const sync=()=>{
      const open=!!document.querySelector('dialog[open]');setModalOpen(open);
      if(open){pausePlayback();map.current?.stop();}
    };
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
    sync();return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!sceneActive||!pageVisible){coastRequestHandled.current=cameraEpoch;pausePlayback();map.current?.stop();}
  },[sceneActive,pageVisible]);
  useEffect(()=>{
    // Scene/camera task switches pause the exercise, retaining its current clock.
    pausePlayback();map.current?.stop();
  },[operationView,dimension]);
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
  // The roof readings for this area. A pack may be absent for an area, and an
  // absent pack simply means no roof is drawn — it is not an error to report.
  useEffect(() => {
    setRoofs(undefined);
    if (!buildingsEnabled || !buildings) return;
    const abort = new AbortController(), area = buildingAreaId(region.id, selected);
    fetch(`/data/roofs-${area}.json`, { signal: abort.signal })
      .then(r => r.ok ? r.json() : null)
      .then(value => {
        if (abort.signal.aborted || value === null) return;
        try { setRoofs(parseRoofShapes(value, area, buildings)); } catch { setRoofs(undefined); }
      })
      .catch(() => { if (!abort.signal.aborted) setRoofs(undefined); });
    return () => abort.abort();
  }, [region.id, selected, buildingsEnabled, buildings]);
  // The external scene is matched to this place's sun and to the camera in use, so the
  // tool opens on what the reader is looking at. The sun is re-read once a minute.
  const [sunMinute, setSunMinute] = useState(0);
  useEffect(() => { const timer = setInterval(() => setSunMinute(m => m + 1), 60000); return () => clearInterval(timer); }, []);
  const roofCounts = useMemo(() => {
    const records = roofs ? Array.from(roofs.values()) : [];
    const gables = records.filter(r => r.shape === 'gable').length;
    const statedGables = records.filter(r => r.shape === 'gable' && r.method === 'osm-tag').length;
    return { gables, stated: statedGables, judged: gables - statedGables, total: records.length };
  }, [roofs]);
  const scene = useMemo(() => rokehanScene(buildings, {
    name: t(region.places[selected]?.name ?? '', region.places[selected]?.thaiName ?? region.places[selected]?.name ?? ''),
    timeOfDay: sceneTimeOfDay(solarPosition(new Date(), region.places[selected]?.lat ?? region.center[0], region.places[selected]?.lng ?? region.center[1]).altitude),
    camera: camera === 'walk' ? 'walk' : camera === 'overview' ? 'overview' : 'route',
    language: language === 'th' ? 'th' : 'en',
  }), [buildings, region.id, selected, camera, language, sunMinute]);
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
  useEffect(() => { setSeconds(0); setStarted(false); pausePlayback(); setQueueFocus(undefined); }, [count, speed, width, preparation, runShare, region.id, selected]);
  const duration = Math.max(model?.duration ?? 0, activeHazard?.frames.at(-1)?.seconds ?? 0, animateWater ? riseMinutes * 60 : 0);
  const waterFrame = useMemo(() => activeHazard ? replayAt(activeHazard, waterSeconds) : null, [activeHazard, waterSeconds]);
  const waterFill = useMemo(() => activeHazard ? depthColourExpression(fileDepthScale(activeHazard.frames)) : '#3b99ca', [activeHazard]);
  const shownWaterLevel = animateWater ? demonstrationLevel(waterSeconds, peak, riseMinutes * 60) : water;
  useEffect(() => {
    if (!playing || !playbackAllowed || duration <= 0) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let last = performance.now(), lastReading = last, lastWater = last, ticket = 0;
    const tick = (now: number) => {
      if (!playbackRunning.current || cameraSuspended.current || document.hidden) return;
      const time = advancePlayback(playbackSeconds.current, now - last, rate, duration);
      last = now;
      playbackSeconds.current = time;
      if (!reducedMotion.matches) drawCamera.current?.();
      if (time >= duration) {
        pausePlayback();
        return;
      }
      if (now - lastReading >= 50) {
        setReadingSeconds(time);
        lastReading = now;
      }
      if ((animateWater || activeHazard) && now - lastWater >= 200) {
        setWaterSeconds(time);
        lastWater = now;
      }
      ticket = requestAnimationFrame(tick);
    };
    ticket = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ticket);
  }, [playing, playbackAllowed, duration, rate, animateWater, activeHazard, pausePlayback]);
  useEffect(() => {
    if (flat || !host.current) return;
    setReady(false); setTerrainLoaded(false); setFailure(''); setWaterSurfaceError('');
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({ container: host.current, center: isStudy ? [98.265, 8.669] : [region.center[1], region.center[0]], zoom: isStudy ? 13.6 : region.zoom, pitch: dimension === '2d' ? 0 : 58, bearing: -65, maxPitch: 130, minZoom: 5, maxZoom: 23, renderWorldCopies: false, pixelRatio: Math.max(window.devicePixelRatio || 1, 2), canvasContextAttributes: {antialias:true},
        style: { version: 8, sources: {
          aerial: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 18, attribution: 'Imagery © Esri and contributors' },
          dem: { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, maxzoom: 15, attribution: '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Terrain © Mapzen / source credits</a>' }
        }, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#d6d0c4' } }, { id: 'aerial', type: 'raster', source: 'aerial' }],
          // Daylight haze instead of a dark void above the horizon. Distant massing fades
          // into the horizon, which reads as depth; flat colour keeps the cel look.
          sky: { 'sky-color': '#dfe6e4', 'horizon-color': '#f1f2ec', 'fog-color': '#f1f2ec', 'fog-ground-blend': .55, 'horizon-fog-blend': .7 },
          light: { anchor: 'viewport', color: '#fffaf0', intensity: .42, position: [1.25, 195, 38] },
          terrain: dimension === '3d' ? { source: 'dem', exaggeration: 1 } : undefined },
        attributionControl: false
      });
    } catch { setFailure('3D rendering is unavailable on this device. Open the 2D map below.'); return; }
    map.current = m;
    const recordCamera=()=>{
      if(!host.current)return;
      host.current.dataset.cameraCenter=m.getCenter().toArray().map(value=>value.toFixed(7)).join(',');
      host.current.dataset.cameraZoom=m.getZoom().toFixed(6);
    };
    m.on('moveend',recordCamera);
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
      for (const id of ['routes', 'people', 'water', 'ends', 'pinch', 'arrows', 'buildings','ddpm-villages','roof-ridges']) m.addSource(id, { type: 'geojson', data: empty });
      // Relief shading from the same DEM tiles: without it the cel ground is a blank sheet,
      // so a street, a beach ridge and a hill read as one flat colour.
      m.addLayer({ id:'relief', type:'hillshade', source:'dem', paint:{ 'hillshade-exaggeration':.45, 'hillshade-shadow-color':'#8f948a', 'hillshade-highlight-color':'#fbf9f2', 'hillshade-accent-color':'#c6c6b6' } }, 'aerial');
      m.addLayer({ id:'building-outlines', type:'line', source:'buildings', minzoom:15, paint:{ 'line-color':'#4c5347', 'line-width':.8, 'line-opacity':.65 } });
      // Massing is solid, not glass: at eye height a translucent box reads as a floating slab
      // rather than a building. Warm tones separate massing from ground without a second accent.
      m.addLayer({ id:'building-volumes', type:'fill-extrusion', source:'buildings', minzoom:15, filter:['==',['get','heightSource'],'heightTag'], paint:{ 'fill-extrusion-height':['get','renderHeight'], 'fill-extrusion-base':0, 'fill-extrusion-color':'#e9e4d8', 'fill-extrusion-opacity':1, 'fill-extrusion-vertical-gradient':true } });
      // Ground-level footprint outlines; the solid extrusion supplies the roof plane.
      // These lines are not elevated roof edges or certified building geometry.
      m.addLayer({ id:'building-footprint-outlines', type:'line', source:'buildings', minzoom:15, paint:{ 'line-color':'#f59e0b', 'line-width':.5, 'line-opacity':.55 } });
      // A roof ridge, for the buildings that have a roof reading. The ridge runs along
      // the footprint's long edge; the source states the roof shape, not its direction.
      // Heights are unknown for these buildings, so the roof is not drawn in three
      // dimensions - the ridge shows where the ridge would sit, seen from above.
      m.addLayer({ id: 'roof-ridge-halo', type: 'line', source: 'roof-ridges', minzoom: 15.4, paint: { 'line-color': '#f7f6f1', 'line-width': ['interpolate', ['linear'], ['zoom'], 15.4, 4.4, 17, 5.6], 'line-opacity': .55, 'line-dasharray': [2.5, 1.8] } });
      m.addLayer({ id: 'roof-ridges', type: 'line', source: 'roof-ridges', minzoom: 15.4, paint: { 'line-color': '#181c1c', 'line-width': ['interpolate', ['linear'], ['zoom'], 15.4, 2.2, 17, 3], 'line-opacity': .95, 'line-dasharray': [2.5, 1.8] } });
      m.addLayer({ id: 'water', type: 'fill', source: 'water', paint: { 'fill-color': '#3b99ca', 'fill-opacity': .48 } });
      const surface = new ReplayWaterLayer(setWaterSurfaceError); m.addLayer(surface); waterLayer.current = surface;
      m.addLayer({ id: 'route-casing', type: 'line', source: 'routes', paint: { 'line-color': '#12354e', 'line-width': 8 } });
      m.addLayer({ id: 'routes', type: 'line', source: 'routes', paint: { 'line-color': ['match', ['get', 'route'], 0, '#fafaf7', 1, '#f59e0b', '#b9ddf0'], 'line-width': 3 } });
      m.addLayer({id:'ddpm-villages',type:'circle',source:'ddpm-villages',paint:{'circle-radius':4,'circle-color':riskPoint.fill,'circle-stroke-color':riskPoint.stroke,'circle-stroke-width':riskPoint.strokeWidth}});
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
      pausePlayback();manualCamera.current=true;setCamera('overview');
      const listed=m.getLayer('ddpm-villages')?m.queryRenderedFeatures(e.point,{layers:['ddpm-villages']})[0]:undefined;
      if(listed){setVillagePick(villageHit(listed.properties));setPoint(undefined);return;}
      setVillagePick(null);
      const group = m.getLayer('waiting-groups') ? m.queryRenderedFeatures(e.point, { layers: ['waiting-groups'] })[0] : undefined;
      if (group?.properties) { setQueueFocus({ edge: String(group.properties.edge), status: String(group.properties.status) }); setPoint(undefined); return; }
      setQueueFocus(undefined);
      setPoint({ coord: [e.lngLat.lng, e.lngLat.lat], elevation: m.queryTerrainElevation(e.lngLat) ?? (terrainGridRef.current ? elevation(terrainGridRef.current, [e.lngLat.lng,e.lngLat.lat]) : null) });
    });
    m.getCanvas().addEventListener('webglcontextlost', () => {
      pausePlayback();
      m.stop();
      setFailure('3D graphics context lost. Use the 2D fallback.');
    });
    const observer = new ResizeObserver(() => m.resize()); observer.observe(host.current);
    return () => { window.clearTimeout(loadTimeout); observer.disconnect(); m.remove(); map.current = null; waterLayer.current = null; };
  }, [flat, region.id]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !m.getSource('buildings')) return;
    (m.getSource('buildings') as GeoJSONSource).setData(buildingsEnabled && buildings ? buildingDisplay(buildings) : empty);
    for (const id of ['building-outlines','building-footprint-outlines','building-volumes']) if (m.getLayer(id)) m.setLayoutProperty(id,'visibility',buildingsEnabled && buildings && (id !== 'building-volumes' || dimension === '3d') ? 'visible' : 'none');
    // The ridges follow the buildings: they are derived from the footprint the
    // reading was attached to, and they are shown only while the buildings are.
    (m.getSource('roof-ridges') as GeoJSONSource | undefined)?.setData(buildingsEnabled && buildings && roofs ? roofRidges(applyRoofShapes(buildings.features, roofs) as never) : empty);
    for (const id of ['roof-ridges','roof-ridge-halo']) if (m.getLayer(id)) m.setLayoutProperty(id,'visibility',buildingsEnabled && buildings && roofs ? 'visible' : 'none');
  }, [ready, buildings, buildingsEnabled, roofs, dimension, flat]);
  useEffect(()=>{
    const source=map.current?.getSource('ddpm-villages') as GeoJSONSource|undefined;
    source?.setData(region.id==='khao-lak'&&showRiskVillages&&mode!=='escape'&&riskVillages?riskVillages:empty);
    if(!showRiskVillages||mode==='escape')setVillagePick(null);
  },[ready,region.id,showRiskVillages,riskVillages,mode]);
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
    if (!ready) return;
    const m = map.current; if (!m) return;
    const celShade = mode === 'escape' && schematic;
    if (m.getLayer('aerial')) m.setLayoutProperty('aerial', 'visibility', celShade ? 'none' : 'visible');
    if (m.getLayer('bg')) m.setLayoutProperty('bg', 'visibility', 'visible');
    if (m.getLayer('building-outlines')) m.setPaintProperty('building-outlines', 'line-opacity', celShade ? 1 : .65);
    if (m.getLayer('building-footprint-outlines')) m.setPaintProperty('building-footprint-outlines', 'line-opacity', celShade ? .9 : .55);
    // In the escape rehearsal only the practice line should read as the way ahead; the other
    // two mapped approaches drop to a hairline so two pale lines cannot be mistaken for it.
    if (m.getLayer('routes')) {
      m.setPaintProperty('routes', 'line-color', mode === 'escape'
        ? ['case', ['==', ['get', 'route'], route], '#f59e0b', '#b8b2a4']
        : ['match', ['get', 'route'], 0, '#fafaf7', 1, '#f59e0b', '#b9ddf0']);
      m.setPaintProperty('routes', 'line-width', mode === 'escape'
        ? ['case', ['==', ['get', 'route'], route], 4.5, 1.5] : 3);
    }
    if (m.getLayer('route-casing')) {
      m.setPaintProperty('route-casing', 'line-color', mode === 'escape' ? '#2b2b22' : '#12354e');
      m.setPaintProperty('route-casing', 'line-width', mode === 'escape'
        ? ['case', ['==', ['get', 'route'], route], 9, 3] : 8);
    }
  }, [ready, mode, schematic, route]);

  useEffect(() => {
    if (ready && current) (map.current?.getSource('people') as GeoJSONSource)?.setData(isStudy && (mode === 'crowd' || mode === 'escape') ? { type: 'FeatureCollection', features: current.features } : empty);
  }, [ready, current, isStudy, mode]);
  const replaySeconds = activeHazard ? waterSeconds : 0;
  useEffect(() => {
    if (!ready) return;
    const source = map.current?.getSource('water') as GeoJSONSource | undefined;
    const polygons = activeHazard ? replayPolygons(activeHazard, replaySeconds) : grid && (screen || animateWater) ? waterScreen(grid, shownWaterLevel) : { type: 'FeatureCollection' as const, features: [] };
    source?.setData(polygons);
    const hasSurface = waterLayer.current?.update(polygons, activeHazard ? undefined : shownWaterLevel) ?? false;
    waterLayer.current?.setVisible(dimension === '3d' && sceneActive);
    if (map.current?.getLayer('water')) {
      map.current.setPaintProperty('water', 'fill-opacity', dimension === '3d' && !waterSurfaceError && hasSurface ? .12 : .48);
      // An imported frame is shaded by the depth the model gives for each cell, so
      // the shape of the inundation can be read. The scale is the deepest cell in
      // any frame of the file, not of this frame: a wave deepens almost everywhere
      // at once, so a per-frame scale left the colour unchanged between frames and
      // two moments of the same event looked identical. The user-chosen
      // demonstration level keeps its own flat colour: it has no depth to shade by.
      map.current.setPaintProperty('water', 'fill-color', waterFill);
    }
  }, [ready, grid, shownWaterLevel, screen, activeHazard, replaySeconds, animateWater, dimension, waterSurfaceError, sceneActive, waterFill]);
  useEffect(()=>{
    waterLayer.current?.setAnimating(playing&&playbackAllowed);
    return()=>waterLayer.current?.setAnimating(false);
  },[playing,playbackAllowed,ready]);
  useEffect(() => {
    const m = map.current; if (!m || !ready || flat || !m.getSource('dem')) return;
    m.setTerrain(dimension === '3d' ? { source: 'dem', exaggeration: 1 } : null);
    m.setCenterClampedToGround(true);
    m.stop();
    if (dimension === '2d') m.jumpTo({elevation:0});
    if (dimension === '2d' && data && isStudy) fitRoutes(0);
    else m.jumpTo({ pitch: dimension === '2d' ? 0 : 58, bearing: 0, zoom: dimension === '2d' ? region.zoom : undefined });
  }, [dimension, ready, flat]);
  const active = data?.routes[route];
  const chainage = useMemo(() => active ? routeChainage(active) : [], [active]);
  const selectedWalker = model?.people.find(p => p.route === route);
  const progress = selectedWalker && active ? walkerProgress(selectedWalker, active, started ? seconds : -1, chainage) : undefined;
  const selectedSchedule = selectedWalker ? walkerSchedule(selectedWalker, seconds) : undefined;
  // A runner on the same route, used only to show what a run pace changes.
  const runnerTwin = model?.people.find(p => p.route === route && p.run);
  const runnerProgress = runnerTwin && active ? walkerProgress(runnerTwin, active, started ? seconds : -1, chainage) : undefined;
  const selectedCompareWalker = compareModel?.people.find(p => p.route === route);
  const compareProgress = selectedCompareWalker && active ? walkerProgress(selectedCompareWalker, active, started ? seconds : -1, chainage) : undefined;

  const arrows = useMemo(() => active && isStudy ? routeArrows(active, camera === 'walk' ? 20 : 120) : empty, [active, isStudy, camera]);
  const arrowAnchor = camera === 'walk' && progress ? Math.floor(progress.metres / 10) * 10 : null;
  useEffect(() => {
    const m = map.current;
    const source = m?.getSource('arrows') as GeoJSONSource | undefined;
    if (!source) return;
    const visible = arrowAnchor === null ? arrows : {
      ...arrows,
      features: arrows.features.filter(feature => {
        const metres = feature.properties?.chainageM ?? 0;
        return metres > arrowAnchor + 16 && metres < arrowAnchor + 300;
      }),
    };
    source.setData(visible);
    if (m?.getLayer('ends')) m.setLayoutProperty('ends', 'visibility', camera === 'walk' && dimension === '3d' ? 'none' : 'visible');
  }, [ready, arrows, arrowAnchor, camera, dimension]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !active || !isStudy || !selectedWalker || dimension !== '3d' || (camera !== 'route' && camera !== 'walk')) return;
    const walking = camera === 'walk';
    let lastPosition = '';
    let hasGround = false;
    if (walking) setEyeViewReady(false);
    const align = () => {
      if (manualCamera.current || cameraSuspended.current || document.hidden) return;
      const canvas = m.getCanvas();
      if (!canvas.clientWidth || !canvas.clientHeight) return;
      const time = started ? playbackSeconds.current : -1;
      const position = walkerProgress(selectedWalker, active, time, chainage);
      const aheadDistance = Math.min(position.total, position.metres + (walking ? 25 : 100));
      const ahead = position.metres >= position.total
        ? cameraStep(position.coord, position.heading, 25)
        : alongRoute(active, aheadDistance, chainage).coord;
      const ground = walking ? m.queryTerrainElevation(position.coord) : 0;
      const target = walking ? m.queryTerrainElevation(ahead) : 0;
      if (ground === null || target === null) {
        lastPosition = '';
        if (hasGround) setEyeViewReady(false);
        hasGround = false;
        return;
      }
      const key = `${position.metres}:${ground}:${target}:${canvas.clientWidth}:${canvas.clientHeight}`;
      if (key === lastPosition) return;
      lastPosition = key;
      m.setCenterClampedToGround(!walking);
      if (walking) {
        m.jumpTo(m.calculateCameraOptionsFromTo(
          new maplibregl.LngLat(...position.coord), ground + EYE_HEIGHT_M,
          new maplibregl.LngLat(...ahead), target + EYE_HEIGHT_M,
        ));
        if (host.current) {
          host.current.dataset.eyeViewport = `${canvas.clientWidth}x${canvas.clientHeight}`;
          host.current.dataset.eyeZoom = m.getZoom().toFixed(6);
        }
        if (!hasGround) setEyeViewReady(true);
        hasGround = true;
      } else {
        m.jumpTo({ center: position.coord, zoom: 16, pitch: 65, bearing: bearing(position.coord, ahead) });
      }
      if (host.current) host.current.dataset.followSeconds = time.toFixed(3);
    };
    const alignWhenStill = () => {
      if (!playbackRunning.current) align();
    };
    drawCamera.current = align;
    m.on('idle', alignWhenStill);
    m.on('resize', alignWhenStill);
    alignWhenStill();
    return () => {
      drawCamera.current = null;
      m.off('idle', alignWhenStill);
      m.off('resize', alignWhenStill);
    };
  }, [ready, active, isStudy, selectedWalker, chainage, dimension, camera, started, terrainLoaded, cameraEpoch, playbackAllowed]);
  useEffect(() => {
    if (!playing) drawCamera.current?.();
  }, [playing, seconds]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !sceneActive || isStudy || camera !== 'walk' || !freeWalk || dimension !== '3d' || manualCamera.current || cameraSuspended.current) return;
    setEyeViewReady(false);
    let lastGround: string | undefined;
    const align = () => {
      if(manualCamera.current || cameraSuspended.current) return;
      if(!m.getCanvas().clientWidth || !m.getCanvas().clientHeight) return;
      const ahead = cameraStep(freeWalk.coord, freeWalk.bearing, 25);
      const ground = m.queryTerrainElevation(freeWalk.coord), target = m.queryTerrainElevation(ahead);
      if (ground === null || target === null) {lastGround=undefined;setEyeViewReady(false);return;}
      const key=`${ground.toFixed(3)}:${target.toFixed(3)}:${m.getCanvas().clientWidth}:${m.getCanvas().clientHeight}`;
      if (key===lastGround) return;
      lastGround=key; m.setCenterClampedToGround(false);
      m.jumpTo(m.calculateCameraOptionsFromTo(new maplibregl.LngLat(...freeWalk.coord),ground + EYE_HEIGHT_M,new maplibregl.LngLat(...ahead),target + EYE_HEIGHT_M));
      if(host.current){host.current.dataset.eyeViewport=`${m.getCanvas().clientWidth}x${m.getCanvas().clientHeight}`;host.current.dataset.eyeZoom=m.getZoom().toFixed(6);}
      setEyeViewReady(true);
    };
    m.on('idle',align); m.on('resize',align); align();
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
    return () => { m.off('idle',align); m.off('resize',align); canvas.removeEventListener('keydown',key,true); };
  }, [ready, isStudy, camera, freeWalk, dimension, cameraEpoch,sceneActive,playbackAllowed]);
  useEffect(() => {
    const m=map.current;
    if (!m || !ready) return;
    const leaveEyeView = (event: maplibregl.MapLibreEvent) => {
      if (event.originalEvent) {
        manualCamera.current=true;pausePlayback();setCamera('overview');
        // MapLibre already interrupted the old transition for this gesture. Do not
        // stop here: that would also cancel the zoom/rotation the user just asked for.
        m.setCenterClampedToGround(true);
      }
    };
    m.on('movestart',leaveEyeView);
    return () => { m.off('movestart',leaveEyeView); };
  }, [ready]);
  useEffect(() => {
    const m = map.current; if (!m || !ready) return;
    const markers = region.places.flatMap((place, i) => {
      const reference=placeReference(region.id,i);if(!reference)return [];
      const button = document.createElement('button');
      button.className = `terrain-place-label${i === selected ? ' selected' : ''}`;
      button.title = t(`Mapped street node for ${place.name} · ${reference.node}`,`จุดถนนอ้างอิง ${place.thaiName} · ${reference.node}`);
      button.setAttribute('aria-label',t(`Select mapped context for ${place.name}`,`เลือกบริบทแผนที่ ${place.thaiName}`));
      button.dataset.sourceNode=reference.node;
      button.addEventListener('click', event => { event.stopPropagation(); setPoint(undefined); setQueueFocus(undefined); setVillagePick(null);setListedFocus(null);onSelect(i); });
      return [new maplibregl.Marker({ element: button }).setLngLat(reference.coord).addTo(m)];
    });
    const key = `${region.id}:${selected}`;
    if (lastSelection.current !== key) {
      const p = region.places[selected];
      if (p) { setCamera('overview'); m.flyTo({ center: [p.lng, p.lat], zoom: 14, pitch: dimension === '2d' ? 0 : 58, bearing: 0, duration: 1500 }); }
      lastSelection.current = key;
    }
    return () => markers.forEach(marker => marker.remove());
  }, [ready, selected, region.id, onSelect, dimension, language]);
  function fitRoutes(duration = 1600) {
    const m = map.current; if (!m || !data) return;
    const bounds = new maplibregl.LngLatBounds();
    data.routes.forEach(r => r.coordinates.forEach(p => bounds.extend(p)));
    m.fitBounds(bounds, { padding: { top: 32, bottom: 68, left: 48, right: 48 }, pitch: dimension === '2d' ? 0 : 48, bearing: dimension === '2d' ? 0 : -35, duration });
  }
  useEffect(() => { if (ready && data && isStudy && camera === 'overview' && !queueFocus) fitRoutes(); }, [ready, data, isStudy]);
  function view(which: typeof camera) {
    manualCamera.current=false;
    pausePlayback();map.current?.stop();
    if (which === 'walk') setRate(1);
    setCamera(which); setCameraEpoch(epoch=>epoch+1);
    setQueueFocus(undefined);
    map.current?.setCenterClampedToGround(true);
    if (which === 'overview' && isStudy) { fitRoutes(); return; }
    if (which === 'overview') map.current?.flyTo({ center: isStudy ? [98.265, 8.669] : [region.center[1], region.center[0]], zoom: isStudy ? 13.6 : region.zoom, pitch: dimension === '2d' ? 0 : 58, bearing: dimension === '2d' ? 0 : -65, duration: 1800 });
  }
  useEffect(() => {
    if (!ready || dimension !== '3d' || camera !== 'coast' || !playbackAllowed || manualCamera.current || coastRequestHandled.current===cameraEpoch) return;
    coastRequestHandled.current=cameraEpoch;
    map.current?.flyTo({center:data && isStudy ? alongRoute(data.routes[route],(model?.distance[route] ?? 0)*.7).coord : [region.places[selected].lng,region.places[selected].lat],zoom:15.5,pitch:70,bearing:85,duration:3000,essential:false});
  }, [ready,dimension,camera,cameraEpoch,selected,region.id,data,isStudy,route,model,playbackAllowed]);
  function inspectQueue() {
    const p = model?.people[0].legs.find(l => l.edge === model.bottleneck)?.from;
    if (!p || !model) return;
    pausePlayback();map.current?.stop();
    setCamera('overview'); setQueueFocus({ edge: model.bottleneck, status: 'queued' });
    map.current?.setCenterClampedToGround(true);
    map.current?.flyTo({ center: p, zoom: 17, pitch: dimension === '2d' ? 0 : 60, bearing: dimension === '2d' ? 0 : 70, duration: 1500 });
  }
  async function importScenario(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Scenario file exceeds 10MB. Subset the grid first.');
      const value = parseHazardReplay(JSON.parse(await file.text()), region.id);
      setHazard(value); setAnimateWater(false); setScreen(true); setSeconds(0); setStarted(false); pausePlayback(); setImportError('');
    } catch (error) { setImportError(error instanceof Error ? error.message : 'Scenario could not be read.'); }
  }
  function startExercise() {
    if (!playbackAllowed || duration <= 0) return;
    if (playbackRunning.current) {
      pausePlayback();
      return;
    }
    if (playbackSeconds.current >= duration) setSeconds(0);
    playbackRunning.current = true;
    setStarted(true);
    setPlaying(true);
  }
  const nextDirection = active && progress ? nextTurn(active, progress.metres, chainage) : null;
  const queueCount = current?.features.find(f => f.properties?.edge === queueFocus?.edge && f.properties?.status === queueFocus?.status)?.properties?.count ?? 0;
  const routeNamesTh:Record<string,string>={'North approach':'เส้นทางเหนือ','Central approach':'เส้นทางกลาง','South approach':'เส้นทางใต้'};
  const routeName = active ? t(active.name,routeNamesTh[active.name]??active.name) : t('Practice route','เส้นทางฝึก');
  const progressLabel = progress ? {preparing:t('preparing','เตรียมในแบบฝึก'),moving:t('moving','กำลังเดิน'),queued:t('queued','รอคิว'),arrived:t('arrived','ถึงปลายทาง')}[progress.state] : '';
  const paceLadder = useMemo(() => active && model ? paceLines(active, model, WALK_PACES, RUN_PACE, runCount) : [], [active, model, runCount]);
  const waits = useMemo(() => active && model ? segmentWaits(route, active, model) : [], [active, model, route]);
  const bottlenecks = useMemo(
    () => active && model ? bottleneckSummaries(route, active, model) : [],
    [active, model, route],
  );
  const queues = useMemo(() => new Map(current?.features
    .filter(feature => feature.properties?.status === 'queued')
    .map(feature => [feature.properties?.edge, feature.properties?.count ?? 0])), [current]);
  const profile = useMemo(() => active && grid ? active.coordinates.map(p => elevation(grid, p)) : [], [active, grid]);
  const knownHeights = profile.filter((h): h is number => h !== null && Number.isFinite(h));
  const heightText = (h: number | null | undefined) => h == null ? t('unknown','ไม่ทราบ') : `≈ ${Math.round(h)} m`;
  const heightRange = knownHeights.length ? `${Math.round(Math.min(...knownHeights))}–${Math.round(Math.max(...knownHeights))} m` : t('unavailable','ไม่มีข้อมูล');
  const guideAvailable=camera==='walk'&&!flat&&!!progress&&!!selectedSchedule;
  const walkerGroundElev = grid && progress ? elevation(grid,progress.coord) : null;
  useEffect(()=>{if(!isStudy){setMode('crowd');setAnimateWater(false);setScreen(false);}},[isStudy]);
  const escapeProps:EscapeGuideProps|undefined = model && selectedSchedule && progress ? {
    language, started, playing, ready:ready&&!flat&&(dimension==='2d'||eyeViewReady), state:progress.state,
    remainingM:Math.max(0,progress.total-progress.metres), totalM:progress.total,
    seconds, duration, rate, pace:selectedWalker?.speed ?? speed, schematic, onStyle:()=>setSchematic(v=>!v),
    finishSeconds:selectedSchedule.finishSeconds, queueSeconds:selectedSchedule.queueSeconds,
    groundElevation:walkerGroundElev, waterLevel:shownWaterLevel, peak, nextTurn:nextDirection,
    onPlay:startExercise, onReset:()=>{setSeconds(0);setStarted(false);pausePlayback();setQueueFocus(undefined);},
    onSeek:value=>{setSeconds(value);setStarted(true);pausePlayback();}, onRate:setRate, onPlan, onReview,
    method:<ReadingDialog language={language} title={t('What this exercise can show','แบบฝึกนี้บอกอะไรได้')}><EscapeMethod language={language}/></ReadingDialog>,
  } : undefined;
  useEffect(()=>{if(!guideAvailable)setOperationView('operate');},[guideAvailable]);
  function showListedPoint(feature:GeoJSON.Feature<GeoJSON.Point>) {
    const coord:Coord=[feature.geometry.coordinates[0],feature.geometry.coordinates[1]];
    manualCamera.current=true;pausePlayback();setCamera('overview');setFreeWalk(undefined);setQueueFocus(undefined);setPoint(undefined);setVillagePick(villageHit(feature.properties));
    setShowRiskVillages(true);setMode('crowd');setListedFocus(coord);
    const m=map.current;if(m){m.stop();m.setCenterClampedToGround(true);m.jumpTo({center:coord,zoom:14,pitch:0,bearing:0,elevation:0});}
  }
  return <section className="terrain-rehearsal" aria-label="Terrain and crowd rehearsal" data-exercise-seconds={seconds.toFixed(3)} data-water-seconds={waterSeconds.toFixed(3)} data-experiment={mode} data-water-source={activeHazard ? 'imported-replay' : 'illustration'} data-imported-replay={hazard ? 'retained' : 'none'} data-presentation="network-node-totals" data-camera={camera} data-buildings={buildingsEnabled && buildings ? 'shown' : 'off'} data-building-area={buildings?.area ?? ''} data-building-policy="explicit-height-tags-only" data-tagged-height-records={buildingsEnabled?buildings?.counts.heightTag??0:0} data-ddpm-source-records={showRiskVillages&&mode!=='escape'?riskVillages?.featureCount??0:0} data-state={flat ? 'flat' : ready ? 'ready' : 'loading'}>
    <DockControls target={bannerDock}><div className="terrain-toolbar">
      {isStudy && <><div className="experiment-tabs" role="group" aria-label="Active experiment"><button aria-pressed={mode === 'crowd'} aria-label="Rehearsal" title="Rehearsal — crowd queue on the mapped network" onClick={() => { setMode('crowd'); setAnimateWater(false); setScreen(false); pausePlayback(); }}><CameraSymbol name="rehearsal" /></button><button aria-pressed={mode === 'water'} aria-label="Water level" title="Water level — illustrative static level on the terrain" onClick={() => { setMode('water'); setAnimateWater(false); setQueueFocus(undefined); setScreen(true); pausePlayback(); }}><CameraSymbol name="water" /></button><button aria-pressed={mode === 'escape'} aria-label="Escape / ฝึกอพยพ" title="Escape practice — arrows are not approved evacuation directions / ฝึกตามลูกศร ไม่ใช่เส้นทางรับรอง" disabled={!ready || !model || !data || flat} onClick={() => { setMode('escape'); setOperationView('operate'); setAnimateWater(true); setScreen(true); setSeconds(0); setStarted(false); pausePlayback(); setQueueFocus(undefined); setDimension('3d'); view('walk'); }}><CameraSymbol name="escape" /></button></div><span className="toolbar-divider" aria-hidden="true" /></>}
      <div className="terrain-view-controls" role="group" aria-label="Camera controls">
        <button aria-pressed={!flat && dimension === '3d'} aria-label="3D terrain" title="3D terrain" onClick={() => { setFlat(false); setDimension('3d'); }}><CameraSymbol name="terrain3d" /></button>
        <button aria-pressed={!flat && dimension === '2d'} aria-label="2D map" title="2D map — plan view" onClick={() => { setFlat(false); setDimension('2d'); setCamera('overview'); setQueueFocus(undefined); }}><CameraSymbol name="map2d" /></button>
        {!flat && <><button disabled={!ready} aria-label="Fly-by" title="Fly-by — aerial sweep over the route or area" aria-pressed={camera === 'route' || camera === 'coast'} onClick={() => { setDimension('3d'); view(isStudy && model ? 'route' : 'coast'); }}><CameraSymbol name="flyby" /></button><button disabled={!ready || (isStudy && !model) || (!isStudy && !buildings?.walkStart)} aria-label="Walk-through" title="Walk-through — 1.65 m eye height on the mapped route" aria-pressed={camera === 'walk'} onClick={() => { setDimension('3d'); view('walk'); if (!isStudy) { const start=buildings?.walkStart;if(!start)return;const coord:Coord=start.coord; setFreeWalk({coord,bearing:start.bearing}); map.current?.easeTo({center:coord,zoom:16,pitch:60,duration:600}); map.current?.getCanvas().focus({preventScroll:true}); } }}><CameraSymbol name="walk" /></button><button disabled={!ready} aria-label="Overview" title="Overview — the whole exercise area" aria-pressed={camera === 'overview' && !queueFocus} onClick={() => view('overview')}><CameraSymbol name="overview" /></button><button disabled={!ready || !isStudy || !model} aria-label="Queue" title="Queue — totals waiting at network nodes" aria-pressed={!!queueFocus} onClick={inspectQueue}><CameraSymbol name="queue" /></button>{isStudy && model && <><span className="toolbar-divider" aria-hidden="true" /><button aria-label="Compare departures" title="Compare immediate and delayed departure" aria-pressed={walkCompare === 'compare'} onClick={() => setWalkCompare(walkCompare === 'off' ? 'compare' : 'off')}><CameraSymbol name="compare" /></button></>}</>}
      </div>

    </div></DockControls>
    {flat ? <StudyMap region={region} selected={selected} onSelect={index=>{setVillagePick(null);setListedFocus(null);onSelect(index);}} buildings={buildings} villages={showRiskVillages&&mode!=='escape'?riskVillages:null} focus={listedFocus} /> : <div className="terrain-stage">
      <div ref={host} className="terrain-canvas" aria-label="3D terrain map. Drag to pan, right-drag to tilt. Click for terrain height." />

      {!ready && !failure && <p className="terrain-notice" role="status">Loading satellite imagery and terrain…</p>}
      {failure && <p className="terrain-notice" role="alert">{failure} <button onClick={() => { pausePlayback(); setFlat(true); }}>Open 2D map</button></p>}

    </div>}
    <div className="terrain-caption"><div className="caption-top">
      <span>{villagePick ? `${villagePick.Village} \u00b7 DDPM ${villagePick.OBJECTID} \u00b7 ${t('inventory only','\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e40\u0e17\u0e48\u0e32\u0e19\u0e31\u0e49\u0e19')}` : showRiskVillages&&mode!=='escape'&&riskVillages ? `DDPM \u00b7 ${riskVillages.featureCount} \u00b7 ${t('inventory, not refuges','\u0e1a\u0e31\u0e0d\u0e0a\u0e35 \u0e44\u0e21\u0e48\u0e43\u0e0a\u0e48\u0e08\u0e38\u0e14\u0e2d\u0e1e\u0e22\u0e1e')}` : queueFocus ? `${queueCount.toLocaleString()} ${queueFocus.status === 'queued' ? t('queued','รอคิว') : t('awaiting release','รอปล่อยตัว')} · ${t('model node, no crowd footprint','จุดโครงข่าย ไม่จำลองพื้นที่ฝูงชน')}` : point ? `${point.coord[1].toFixed(5)}, ${point.coord[0].toFixed(5)} · ${point.elevation === null ? t('height unavailable','ไม่มีข้อมูลความสูง') : `DEM ≈ ${Math.round(point.elevation)} m · ${t('not a safety test','ไม่ยืนยันความปลอดภัย')}`}` : <>{`${camera === 'walk' && !flat ? '' : `${t(region.places[selected]?.name,region.places[selected]?.thaiName ?? region.places[selected]?.name)} · `}${flat ? t('basic 2D reference','แผนที่อ้างอิง 2D') : dimension === '2d' ? t('2D replay','เล่นซ้ำ 2D') : camera === 'walk' ? `${eyeViewReady ? t('1.65m eye','สายตา 1.65m') : t('Ground view loading','กำลังโหลดมุมมองพื้น')} · DEM${buildingsEnabled && buildings ? ` · ${t('unknown heights flat','ไม่ทราบความสูง: แบน')}` : ''}` : activeHazard && waterFrame ? `${t('depth','ความลึก')} ${depthRange(waterFrame.depthM).min.toFixed(1)}\u2013${depthRange(waterFrame.depthM).max.toFixed(1)} m` : buildingsEnabled && buildings ? `${buildings.counts.heightTag} ${t('tagged heights; others flat','ระบุความสูง ส่วนอื่นแบน')}` : terrainLoaded ? t('1× relief','ความสูง 1 เท่า') : t('terrain loading','กำลังโหลดภูมิประเทศ')}`} <span className="nowrap">({t('practice only','ฝึกเท่านั้น')})</span></>}</span>
      <ReadingDialog language={language} className="terrain-map-key" title={t('Map key','คำอธิบายแผนที่')}><p>{isStudy && !flat ? t('Lines: mapped practice approaches. Amber point: assumed pinch point. White points move; hollow rings use the model run pace. Amber/gray counts wait at exact model nodes, not physical crowd footprints.','เส้น: ทางฝึกตามแผนที่ จุดอำพัน: คอขวดสมมติ จุดขาวเคลื่อนที่ วงโปร่งใช้ความเร็ววิ่งของแบบจำลอง จำนวนอำพัน/เทารอที่จุดโครงข่าย ไม่ใช่พื้นที่ฝูงชนจริง') : t('Geographic reference; no crowd or route layers here.','อ้างอิงภูมิศาสตร์ ไม่มีชั้นฝูงชนหรือเส้นทางในมุมมองนี้')} {t('Place labels anchor mapped street nodes near each place, not beach centres, entrances or refuges. Click terrain for approximate DEM height; no height establishes safety.','ป้ายสถานที่ยึดจุดถนน OSM ใกล้พื้นที่ ไม่ใช่ใจกลางหาด ทางเข้า หรือจุดอพยพ คลิกภูมิประเทศดู DEM โดยประมาณ ความสูงไม่ยืนยันความปลอดภัย')}</p>{showRiskVillages&&mode!=='escape'&&riskVillages&&<p>{t('DDPM inventory rings: one symbol for every Risk code; source snapshot','\u0e27\u0e07\u0e08\u0e38\u0e14\u0e1a\u0e31\u0e0d\u0e0a\u0e35 DDPM: \u0e43\u0e0a\u0e49\u0e2a\u0e31\u0e0d\u0e25\u0e31\u0e01\u0e29\u0e13\u0e4c\u0e40\u0e14\u0e35\u0e22\u0e27\u0e01\u0e31\u0e19\u0e17\u0e38\u0e01\u0e23\u0e2b\u0e31\u0e2a Risk \u0e20\u0e32\u0e1e\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25')} {riskVillages.reviewedAt}. {t('Not people, inundation depth, routes or refuges.','\u0e44\u0e21\u0e48\u0e43\u0e0a\u0e48\u0e04\u0e19 \u0e04\u0e27\u0e32\u0e21\u0e25\u0e36\u0e01\u0e19\u0e49\u0e33 \u0e40\u0e2a\u0e49\u0e19\u0e17\u0e32\u0e07 \u0e2b\u0e23\u0e37\u0e2d\u0e08\u0e38\u0e14\u0e2d\u0e1e\u0e22\u0e1e')}</p>}<p>{t('Walk-through opens paused at1×. Start explicitly;5×/30×/120× compress exercise time. Manual input, changing task or leaving the page pauses playback. Rendering stalls do not jump the clock ahead. Images and coarse DEM remain source-limited; requesting2pixels per CSS pixel does not create street detail.','มุมมองเดินเริ่มหยุดที่1× กดเริ่มเอง ความเร็ว5×/30×/120×ย่อเวลาแบบฝึก การควบคุมด้วยตนเอง เปลี่ยนงาน หรือออกจากหน้าจะหยุดเล่น การสะดุดไม่กระโดดเวลา ภาพและ DEM หยาบจำกัดตามต้นทาง การขอ2พิกเซลต่อพิกเซล CSS ไม่ได้เพิ่มรายละเอียดถนน')}</p><p>{t('Buildings retain OSM footprints. Only explicit source heights extrude; missing heights and floor-derived estimates remain flat. No entrance, walkability or refuge suitability is established. Imagery: Esri/contributors; terrain: Mapzen/credited elevation sources; paths: OSM contributors.','เก็บรูปอาคาร OSM ไว้ อาคารสามมิติใช้เฉพาะความสูงที่ต้นทางระบุ ส่วนที่ไม่ทราบหรือประมาณจากชั้นแสดงแบน ไม่ยืนยันทางเข้า การเดินผ่าน หรือความเหมาะสมเป็นที่อพยพ ภาพ: Esri/ผู้ร่วมสร้าง ภูมิประเทศ: Mapzen/แหล่งความสูงที่อ้างอิง ทาง: ผู้ร่วมสร้าง OSM')}</p>
{roofs && roofs.size > 0 && <p>{t(`Ridge lines: the roof's ridge for buildings that have a roof reading — ${roofCounts.gables} gables here (${roofCounts.stated} stated by the source snapshot, ${roofCounts.judged} read from the aerial image). The ridge runs along the footprint's long edge, because the source gives the roof shape and not its direction. These buildings have no known height, so the roof is drawn in plan, not in three dimensions. ${roofCounts.total} of ${buildings?.features.length ?? 0} buildings in this area have a roof reading; the rest are not judged.`,`เส้นหลังคา: แนวหลังคาของอาคารที่มีข้อมูลรูปหลังคา — หลังคาจั่ว ${roofCounts.gables} หลังในพื้นที่นี้ (${roofCounts.stated} ระบุจากแหล่งข้อมูล ${roofCounts.judged} อ่านจากภาพถ่ายทางอากาศ) เส้นวางตามด้านยาวของอาคาร เพราะแหล่งข้อมูลระบุรูปหลังคาแต่ไม่ระบุทิศของหลังคา อาคารเหล่านี้ไม่มีความสูงที่ทราบ จึงแสดงหลังคาในแบบผัง ไม่ใช่ในสามมิติ มีข้อมูลรูปหลังคา ${roofCounts.total} จาก ${buildings?.features.length ?? 0} อาคารในพื้นที่นี้ ที่เหลือไม่ได้ประเมิน`)}</p>}{activeHazard && <p>{t(`Water shade: the depth the model gives for each cell \u2014 pale is shallow, dark is deep, on one scale for the whole file (0\u2013${fileDepthScale(activeHazard?.frames ?? []).toFixed(1)} m), so the water darkens as it deepens and one moment can be compared with the next. A cell the model gives no depth for is not shaded at all: unknown, never safe.`,`การลงสีน้ำ: ความลึกที่แบบจำลองให้ในแต่ละเซลล์ \u2014 สีอ่อนคือตื้น สีเข้มคือลึก โดยใช้สเกลเดียวกันทั้งไฟล์ (0\u2013${fileDepthScale(activeHazard?.frames ?? []).toFixed(1)} เมตร) น้ำจึงเข้มขึ้นเมื่อลึกขึ้น และเปรียบเทียบช่วงเวลาต่าง ๆ ได้ เซลล์ที่แบบจำลองไม่ให้ความลึกจะไม่ถูกลงสีเลย: ไม่ทราบ ไม่ใช่ปลอดภัย`)}</p>}{scene && <p>{t('Rokehan scene ↗ opens an external tool that draws this place from OpenStreetMap and elevation as a manga-style 3D scene, at the sourced OSM camera node, with this place’s approximate light and the current view’s scale. It estimates the heights and details this project does not have, so it is an illustration — not a survey, a street photograph or a verified evacuation path. It opens in a new tab: the tool only permits framing on its own site. Rokehan / Location Scout is by MIYADAIKU / おやすみゲーム開発部; free to use with attribution. Camera node:','ฉาก Rokehan ↗ เปิดเครื่องมือภายนอกที่วาดสถานที่นี้จาก OpenStreetMap และข้อมูลความสูงเป็นฉาก 3 มิติสไตล์มังงะ ที่จุด OSM ที่อ้างอิง พร้อมแสงโดยประมาณของสถานที่และระยะของมุมมองปัจจุบัน เครื่องมือประมาณความสูงและรายละเอียดที่โครงการนี้ยังไม่มี จึงเป็นภาพประกอบ ไม่ใช่งานสำรวจ ไม่ใช่ภาพถ่ายระดับถนน และไม่ใช่เส้นทางอพยพที่ยืนยันแล้ว เปิดในแท็บใหม่ เพราะเครื่องมืออนุญาตให้ฝังเฟรมเฉพาะบนเว็บของผู้พัฒนาเท่านั้น Rokehan / Location Scout โดย MIYADAIKU / おやすみゲーム開発部 ใช้ฟรีโดยต้องให้เครดิต จุดกล้อง:')} <a href={`https://www.openstreetmap.org/${scene.node}`} target="_blank" rel="noreferrer">{scene.node}</a>.</p>}</ReadingDialog>
      {region.id==='khao-lak'&&<DdpmMaps language={language} snapshot={riskVillages} shown={showRiskVillages&&mode!=='escape'} onShown={value=>{setShowRiskVillages(value);pausePlayback();if(value){manualCamera.current=true;setMode('crowd');setCamera('overview');map.current?.stop();}}} error={riskError} onShowPoint={showListedPoint}/>}
      </div><div className="caption-bottom">
      {scene && <a className="scene-link" href={scene.url} target="_blank" rel="noopener noreferrer" title={t('External illustration by MIYADAIKU — opens in a new tab at the sourced OSM camera node, with this place\u2019s approximate light and the current view\u2019s scale. It estimates the heights and details this project does not have: an illustration, not a survey, street photograph or verified evacuation path.','ภาพประกอบจากเครื่องมือภายนอกโดย MIYADAIKU — เปิดในแท็บใหม่ที่จุด OSM ที่อ้างอิง พร้อมแสงโดยประมาณของสถานที่และระยะของมุมมองปัจจุบัน เครื่องมือประมาณความสูงและรายละเอียดที่โครงการนี้ยังไม่มี จึงเป็นภาพประกอบ ไม่ใช่งานสำรวจ ไม่ใช่ภาพถ่ายระดับถนน และไม่ใช่เส้นทางอพยพที่ยืนยันแล้ว')}>{t('Rokehan scene ↗', 'ฉาก Rokehan ↗')}</a>}
      <span className="terrain-credits">© <a href="https://www.esri.com/">Esri &amp; contributors</a> · <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Mapzen</a> · <a href="https://www.openstreetmap.org/copyright">OSM</a></span>
      {camera === 'walk' && <SunIndicator language={manualLanguage(location.search,navigator.language)} latitude={region.places[selected]?.lat ?? region.center[0]} longitude={region.places[selected]?.lng ?? region.center[1]} />}
      </div>
    </div>
    <div className="terrain-operations"><DockControls target={bannerDock}><label className="operation-switch"><span className="sr-only">Scene task / งาน</span><select aria-label="Scene task / งาน" value={operationView} onChange={e=>setOperationView(e.target.value)}><option value="operate">Controls</option><option value="guide" disabled={!guideAvailable}>Guide</option></select></label></DockControls>      {guideAvailable && operationView==='guide' && <div className="guide-playback" aria-label={t('Guide playback','การเล่นแบบฝึก')}>
        <button disabled={!ready} onClick={startExercise}>{playing?t('Pause','หยุดชั่วคราว'):t('Play route','เล่นเส้นทาง')}</button>
        <span>{t('Elapsed','ผ่านไป')} {minutes(seconds)}</span>
        <label>{t('Speed','ความเร็ว')} <select aria-label="Guide speed / ความเร็วในคู่มือ" value={rate} onChange={e=>setRate(Number(e.target.value))}><option value={1}>1×</option><option value={5}>5×</option><option value={30}>30×</option><option value={120}>120×</option></select></label>
      </div>}
{mode === 'escape' && operationView === 'operate' && escapeProps && <EscapePlayback {...escapeProps}/>}
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
    {!isStudy && <><WarningLesson language={language}/><p className="area-data-status">{t('No verified local route or destination, wave prediction or live warning feed is connected here. Terrain and buildings are reference only.','ยังไม่มีเส้นทาง ปลายทาง การพยากรณ์คลื่น หรือคำเตือนสดที่ยืนยันแล้วเชื่อมต่อที่นี่ ภูมิประเทศและอาคารเป็นข้อมูลอ้างอิงเท่านั้น')}</p><button onClick={onPlan}>{t('Confirm a local plan','ยืนยันแผนในพื้นที่')} →</button></>}
    {!model && (hazard || animateWater) && <div className="imported-replay-controls"><button onClick={startExercise}>{playing ? 'Pause' : started ? 'Run' : 'Start warning'}</button><label>Warning +{minutes(seconds)}<TimeScrubber label="Imported scenario time" duration={duration} value={seconds} onChange={value => { setStarted(true); setSeconds(value); pausePlayback(); }} /></label><span>{waterFrame ? `Imported research frame \u00b7 ${depthRange(waterFrame.depthM).min.toFixed(1)}\u2013${depthRange(waterFrame.depthM).max.toFixed(1)} m deep` : 'No model frame at this time'}</span></div>}
    {isStudy && model && data && <>
      <div className="rehearsal-panel" hidden={mode !== 'crowd'}>
      {finding}
      <div className="rehearsal-controls" id="rehearsal-controls">
        <div className="control-group"><span className="control-group-label">{t('Group','กลุ่ม')}</span>
          <label>{t('People','ผู้คน')}<select aria-label={t('People','ผู้คน')} value={count} onChange={e => setCount(Number(e.target.value))}><option value={500}>500</option><option value={1500}>1,500</option><option value={5000}>5,000</option></select></label>
          <label title={t('Share of the group moving at a run pace. An assumed exercise parameter, not advice.','สัดส่วนผู้เดินด้วยจังหวะวิ่ง เป็นค่าตั้งสมมติของแบบฝึก ไม่ใช่คำแนะนำ')}>{t('Runners','ผู้วิ่ง')}<select aria-label="Share of the group moving at a run pace" value={runShare} onChange={e => setRunShare(Number(e.target.value))}><option value={0}>{t('None','ไม่มี')}</option><option value={0.1}>10%</option><option value={0.25}>25%</option><option value={0.5}>50%</option></select></label>
        </div>
        <div className="control-group"><span className="control-group-label">{t('Movement','การเคลื่อนที่')}</span>
          <label title={t('Walking pace of the group. An assumed exercise parameter.','จังหวะเดินของกลุ่ม เป็นค่าตั้งสมมติของแบบฝึก')}>{t('Pace','จังหวะ')}<select aria-label="Walking pace" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={0.8}>0.8 m/s</option><option value={1.4}>1.4 m/s</option><option value={2.4}>2.4 m/s</option></select></label>
          <label>{t('Delay','เวลาเตรียม')}<select aria-label={t('Preparation delay','เวลาเตรียม')} value={preparation} onChange={e => setPreparation(Number(e.target.value))}><option value={0}>0 s</option><option value={60}>1 min</option><option value={300}>5 min</option></select></label>
        </div>
        <div className="control-group"><span className="control-group-label">{t('Scenario','สถานการณ์')}</span>
          <label>{t('Route','เส้นทาง')}<select aria-label={t('Route','เส้นทาง')} value={route} onChange={e => setRoute(Number(e.target.value))}>{data.routes.map((r, i) => <option value={i} key={r.name}>{r.name.replace(" approach", "")}</option>)}</select></label>
          <label title={t('Illustrative water level','ระดับน้ำเพื่อการสาธิต')}>{t('Water','น้ำ')}<select aria-label={t('Illustrative water level','ระดับน้ำเพื่อการสาธิต')} disabled={!!hazard || flat} value={animateWater ? peak : 0} onChange={e => {
            const val = Number(e.target.value);
            if (val === 0) {
              setAnimateWater(false);
              setScreen(false);
            } else {
              setPeak(val);
              setAnimateWater(true);
              setScreen(true);
            }
          }}><option value={0}>{t('Off','ปิด')}</option><option value={5}>+5 m</option><option value={10}>+10 m</option><option value={15}>+15 m</option><option value={20}>+20 m</option></select></label>
        </div>
        <button className="rehearsal-play" aria-label={playing ? t('Pause rehearsal','หยุดชั่วคราวแบบฝึก') : started ? t('Resume rehearsal','เล่นต่อแบบฝึก') : t('Start rehearsal','เริ่มแบบฝึก')} disabled={flat || !ready} onClick={startExercise}>{playing ? t('Pause','หยุดชั่วคราว') : started ? t('Resume','เล่นต่อ') : t('Start','เริ่ม')}</button>
      </div>
      <div className="rehearsal-timeline">
        <button onClick={() => { setSeconds(0); setStarted(false); pausePlayback(); setQueueFocus(undefined); }}>{t('Reset','รีเซ็ต')}</button>
        <label className="timeline-label"><span>{started ? t('Elapsed +','ผ่านไป +') : t('Ready · ','พร้อม · ')}{minutes(seconds)}</span><TimeScrubber label="Exercise time" duration={duration} value={seconds} onChange={value => { setSeconds(value); setStarted(true); pausePlayback(); }} /></label>
        <label title={t('Playback speed','ความเร็วการเล่น')}><span className="sr-only">{t('Speed','ความเร็ว')}</span><select aria-label="Playback speed / ความเร็ว" value={rate} onChange={e => setRate(Number(e.target.value))}><option value={1}>1×</option><option value={5}>5×</option><option value={30}>30×</option><option value={120}>120×</option></select></label>
      </div>
      <p className="exercise-boundary" aria-live="polite">{started ? (progress?.state === 'preparing' ? 'Preparing' : progress?.state === 'queued' ? 'Queued at model node' : progress?.state === 'arrived' ? 'Exercise endpoint reached' : t('Route rehearsal','ฝึกเส้นทาง')) : t('Choose a view, then Start','เลือกมุมมอง แล้วกดเริ่ม')} · {hazard ? (waterFrame ? 'unverified replay; agents unaffected' : 'no replay frame; agents unaffected') : animateWater ? `Illustrative level +${shownWaterLevel.toFixed(1)}m MSL · agents unaffected` : 'no wave prediction'} · <span className="nowrap">{t('endpoint unapproved','ปลายทางยังไม่รับรอง')}</span></p>
      <div className="rehearsal-readout" aria-label="Crowd counts">
        <StackBar total={count} label={t('Crowd state','สถานะกลุ่มคน')} parts={[
          { kind: 'pending', label: t('awaiting','รอออกเดิน'), value: current?.pending ?? count },
          { kind: 'walking', label: t('walking','กำลังเดิน'), value: current?.walking ?? 0 },
          { kind: 'queued', label: t('queued','รอที่จุด'), value: current?.queued ?? 0 },
          { kind: 'arrived', label: t('at end','ถึงปลายทาง'), value: current?.arrived ?? 0 },
        ]} />
        <span>{t('Last arrival','มาถึงล่าสุด')} <strong>{minutes(model.duration)}</strong> · {t('max wait','รอนานสุด')} <strong>{minutes(model.maxQueueWait)}</strong></span>
        {runCount > 0 && <span className="runner-count"><strong>{current?.running.toLocaleString()}</strong> running of {runCount.toLocaleString()} runners</span>}
      </div>
      {active && model && (
        <div className="escape-timing" aria-label="Modelled time to the exercise end">
          <div className="escape-timing-head">
            <strong>{t('Time to the exercise end','เวลาถึงปลายทางแบบฝึก')}</strong>
            <label className="target-time">{t('Target','เป้าหมาย')}<select aria-label="Target time to the exercise end" value={targetMinutes} onChange={e => setTargetMinutes(Number(e.target.value))}><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select></label>
          </div>
          <PaceRuler
            unitLabel={t('Pace m/s → free-flow minutes','จังหวะ ม./วิ → เวลาเมื่อไม่มีคิว (นาที)')}
            marks={paceLadder.map(line => ({ label: `${line.run ? '▸' : ''}${line.pace}→${Math.round(line.seconds / 60)}′`, minutes: line.seconds / 60, kind: line.run ? 'run' : line.pace === speed ? 'own' : 'walk' }))}
            target={targetMinutes}
            targetLabel={t(`${targetMinutes} min needs ${speedForSeconds(active, targetMinutes * 60).toFixed(1)} m/s`,`${targetMinutes} นาที ต้อง ${speedForSeconds(active, targetMinutes * 60).toFixed(1)} ม./วิ`)}
            ariaLabel={t(`Free-flow time to the exercise end: ${paceLadder.map(l => `${l.label} ${minutes(l.seconds)}`).join(', ')}. ${targetMinutes} minutes needs ${speedForSeconds(active, targetMinutes * 60).toFixed(1)} m/s without queueing.`,`เวลาถึงปลายทางเมื่อไม่มีคิว: ${paceLadder.map(l => `${l.pace} ม./วิ ${minutes(l.seconds)}`).join(', ')}`)} />
          <p className="field-note">{t('Free flow, no queueing. Exercise times, not wave-arrival margins or advice.','ไม่มีคิว เป็นเวลาแบบฝึก ไม่ใช่เวลาก่อนคลื่นมาถึงหรือคำแนะนำ')}</p>
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
      {mode === 'escape' && escapeProps && <EscapeGuide {...escapeProps}/>}
      <div className={`terrain-secondary ${mode}`}>
      {mode === 'water' &&         <div className="water-experiment"><div className="water-control-row"><label><input type="checkbox" checked={screen} onChange={e => setScreen(e.target.checked)} /> Screen terrain</label>
          <label>{hazard ? 'Model depths' : `+${water} m`}<input aria-label="Static experimental water level" type="range" min={0} max={20} step={1} value={water} disabled={!screen || flat || !!hazard} onChange={e => setWater(Number(e.target.value))} /></label></div>
          <small>{hazard ? `${hazard.title} · ${hazard.model} · ${waterFrame ? 'interpolated model frame' : 'no frame at this time'}. ` : 'Blue = connected low terrain at a chosen static level, not tsunami physics. '}Imported frames and terrain screening do not alter agents or certify safety. Unshaded land is not classified safe.</small>
        </div>}
      <div className="terrain-analysis-row">
        <div className="route-profile"><strong>{t(areaPack?.label??region.places[selected].name,region.places[selected].thaiName)}: {routeName} · {((model.distance[route] ?? 0) / 1000).toFixed(2)} km</strong><span>{progress ? `${(Math.max(0, progress.total - progress.metres) / 1000).toFixed(2)} km ${t('to practice end','ถึงปลายทางฝึก')} · ${progressLabel}` : t('Approximate DEM profile','ระดับภูมิประเทศแบบหยาบ')}</span>
          <ProfileQueue chainage={chainage} profile={profile} waits={waits} position={started && progress ? progress.metres : undefined}
            profileLabel={t('DEM m · gaps = missing','DEM ม. · เว้นข้อมูลที่ขาด')}
            queueLabel={t('Wait per segment','รอต่อช่วง')} queueMaxLabel={t('max per segment','สูงสุดต่อช่วง')}
            ariaLabel={t(`Terrain elevation profile ${heightRange}, gaps are missing data. Modelled queue wait per segment on the same distance axis; longest ${waits.length ? Math.floor(Math.max(...waits.map(w => w.waitSeconds))) : 0} s. Not a safety classification.`,`ระดับภูมิประเทศ ${heightRange} ช่องว่างคือไม่มีข้อมูล เวลารอคิวจำลองต่อช่วงทางบนแกนระยะทางเดียวกัน ไม่ใช่การจัดระดับความปลอดภัย`)} />
          <p className="route-cue">{!started ? t('Real warnings require prompt action following local guidance.','หากเตือนจริงให้รีบปฏิบัติตามคำแนะนำในพื้นที่') : progress?.state === 'preparing' ? t(`Model delay: ${Math.max(0,preparation-seconds).toFixed(0)} s remaining.`,`เวลารอจำลอง เหลือ ${Math.max(0,preparation-seconds).toFixed(0)} วินาที`) : progress?.state === 'queued' ? t('Selected walker is queued at a model node; physical crowd space is not simulated.','ตัวแทนที่เลือกรอคิวที่จุดจำลอง ไม่ได้จำลองพื้นที่ฝูงชนจริง') : progress?.state === 'arrived' ? t('Selected walker finished; other agents may still be en route.','ตัวแทนที่เลือกถึงปลายทางฝึก ตัวแทนอื่นอาจยังเดินอยู่') : nextDirection ? t(`Practice path: in ${nextDirection.distanceM} m, turn ${nextDirection.direction}.`,`เส้นทางฝึก: อีก ${nextDirection.distanceM} ม. เลี้ยว${nextDirection.direction==='left'?'ซ้าย':'ขวา'}`) : t('Follow the practice path.','ตามเส้นทางฝึก')}</p>
          <div className="profile-scale"><span>{t('Start','ต้นทาง')} {heightText(profile[0])}</span><span>{t('DEM range','ช่วง DEM')} ≈ {heightRange}</span><span>{t('End','ปลายทาง')} {heightText(profile.at(-1))}</span></div>
        </div>

        {bottlenecks.length > 0 && (
          <div className="bottlenecks-card" aria-label={t('Key route choke points', 'คอขวดสำคัญบนเส้นทาง')}>
            <span className="card-subhead">{t('Critical Choke Points', 'จุดคอขวดสำคัญ')}</span>
            <ul className="choke-point-list">
              {bottlenecks.map((b, idx) => (
                <li key={b.edge} className={`choke-point-item ${queueFocus?.edge === b.edge ? 'focused' : ''}`}>
                  <button
                    type="button"
                    className="choke-focus-btn"
                    title={t('Inspect this network choke point on the map', 'ตรวจสอบจุดคอขวดนี้บนแผนที่')}
                    onClick={() => {
                      pausePlayback();
                      map.current?.stop();
                      setCamera('overview');
                      setQueueFocus({ edge: b.edge, status: 'queued' });
                      const legFrom = selectedWalker?.legs.find(l => l.edge === b.edge)?.from;
                      if (legFrom && map.current) {
                        map.current.flyTo({ center: legFrom, zoom: 16.8, pitch: dimension === '2d' ? 0 : 55, duration: 1200 });
                      }
                    }}
                  >
                    <span className="choke-rank">0{idx + 1}</span>
                    <span className="choke-meta">
                      <strong>{(b.chainageM / 1000).toFixed(2)} km</strong>
                      <span className="choke-detail">
                        {t('Max wait', 'รอนานสุด')} {waitClock(b.maxWaitSeconds)}
                        {(queues.get(b.edge) ?? 0) > 0 ? ` · ${queues.get(b.edge)?.toLocaleString()} ${t('queued now', 'กำลังรอ')}` : ''}
                      </span>
                    </span>
                    <span className="choke-arrow">↗</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      </div>
    </>}
    </div></PagedFlow></div>
      <DockControls target={bannerDock}><div className="exercise-console" id="exercise-console"><ReadingDialog language={language} title={t('Sources, assumptions, settings & coverage','แหล่งข้อมูล สมมติฐาน การตั้งค่า และพื้นที่ครอบคลุม')}><div className="console-sections">
      <details className="console-section">
        <summary>{t('Data & sources','ข้อมูลและไฟล์ต้นทาง')}</summary>
        <TechnicalFiles language={language} />
      </details>
      {isStudy && model && data && <section className="console-section" id="console-method">
        <h3>{t('Sources and assumptions','แหล่งข้อมูลและสมมติฐาน')}</h3>
      <ExerciseMethod language={language} speed={speed} preparation={preparation} width={width} accessed={data.accessed} terrainAccessed={grid?.accessed}/>
      </section>}
      <details className="console-section" id="console-settings">
        <summary>{t('Scenario settings, data and coverage','การตั้งค่าฉากทัศน์ ข้อมูล และพื้นที่ครอบคลุม')}</summary>
      <label><input type="checkbox" checked={buildingsEnabled} disabled={flat} onChange={e=>setBuildingsEnabled(e.target.checked)} /> {t('OSM buildings','อาคาร OSM')}</label>
      {buildingsEnabled && <p className="building-source-note">{buildings ? <>{buildings.counts.total.toLocaleString()} {t('mapped footprints','รูปอาคารในแผนที่')} · {buildings.counts.heightTag} {t('explicit height tags extruded','ระบุความสูง แสดงสามมิติ')} · {buildings.counts.levelsEstimate + buildings.counts.unknown} {t('unknown or floor-estimated heights: flat','ไม่ทราบหรือประมาณจากชั้น: แบน')}. <a href={buildings.sourceUrl} target="_blank" rel="noreferrer">{t('OSM source','แหล่ง OSM')}</a> · {buildings.retrievedAt.slice(0,10)}. {t('Local snapshot, not every building. Source heights are not surveyed here. Footprints do not establish entrances, walkability or approved refuges.','ข้อมูลเฉพาะพื้นที่ ไม่ใช่อาคารทุกหลัง ยังไม่ได้สำรวจยืนยันความสูงต้นทาง รูปอาคารไม่ยืนยันทางเข้า การเดินผ่าน หรือจุดอพยพที่อนุมัติ')}</> : buildingError || t('Loading building snapshot…','กำลังโหลดข้อมูลอาคาร…')}</p>}

      <div className="scenario-settings-row">
        {model && <label>{t('Assumed pinch width','ความกว้างคอขวดสมมติ')}<select aria-label={t('Assumed pinch width','ความกว้างคอขวดสมมติ')} value={width} onChange={e => setWidth(Number(e.target.value))}><option value={1}>1 m</option><option value={2}>2 m</option><option value={6}>6 m</option></select></label>}
        {grid && <><label><input type="checkbox" checked={animateWater} disabled={!!hazard || flat} onChange={e => { setAnimateWater(e.target.checked); setMode('crowd'); setScreen(e.target.checked); }} /> {t('Animate illustrative water rise','แสดงน้ำสาธิตเพิ่มระดับ')}</label><label>{t('Screen peak','ระดับสาธิตสูงสุด')}<select aria-label={t('Demonstration peak level','ระดับน้ำสาธิตสูงสุด')} value={peak} onChange={e => setPeak(Number(e.target.value))}><option value={5}>+5 m MSL</option><option value={10}>+10 m MSL</option><option value={15}>+15 m MSL</option><option value={20}>+20 m MSL</option></select></label><label>{t('Rise duration','ระยะเวลาเพิ่มระดับ')}<select aria-label={t('Demonstration rise duration','ระยะเวลาเพิ่มระดับน้ำสาธิต')} value={riseMinutes} onChange={e => setRiseMinutes(Number(e.target.value))}><option value={5}>5 {t('exercise min','นาทีแบบฝึก')}</option><option value={10}>10 {t('exercise min','นาทีแบบฝึก')}</option><option value={20}>20 {t('exercise min','นาทีแบบฝึก')}</option></select></label></>}
        <button disabled={!ready || flat} onClick={() => { setDimension('3d'); view('coast'); }}>{t('Scenic coast view','วิวชายฝั่ง')}</button><button onClick={() => { setFlat(true); pausePlayback(); setQueueFocus(undefined); }}>{t('Basic map fallback','แผนที่พื้นฐาน')}</button>
      </div>
      <p className="scenario-provenance">{hazard && mode === 'escape' ? <>{t('Imported replay retained, but not displayed in Escape. Switch to Water level to inspect it. Escape uses the chosen illustrative surface only.','เก็บไฟล์เล่นซ้ำที่นำเข้าไว้ แต่ไม่แสดงในแบบฝึกอพยพ เลือกระดับน้ำเพื่อดูไฟล์นั้น แบบฝึกอพยพใช้ผิวน้ำสาธิตที่ตั้งขึ้นเท่านั้น')}</> : hazard ? <>{t('Imported research replay:','ผลวิจัยเล่นซ้ำที่นำเข้า:')} <a href={hazard.sourceUrl} target="_blank" rel="noreferrer">{hazard.title}</a> · {hazard.model} · {hazard.verticalDatum} · {t('approval not independently verified.','ยังไม่ได้ตรวจสอบการอนุมัติโดยอิสระ')} {waterFrame?.waveHeightM == null ? t('Wave height at a gauge is not supplied for this time.','ไม่มีข้อมูลความสูงคลื่นจากสถานีวัดในเวลานี้') : t(`Model wave height at ${hazard.waveGauge?.name}: ${waterFrame.waveHeightM.toFixed(2)} m (crest-to-trough).`,`ความสูงคลื่นจำลองที่ ${hazard.waveGauge?.name}: ${waterFrame.waveHeightM.toFixed(2)} เมตร (ยอดถึงท้องคลื่น)`)}</> : <>{t('Wave prediction and approved destinations are not connected.','ยังไม่เชื่อมต่อการพยากรณ์คลื่นและปลายทางที่ได้รับอนุมัติ')} {animateWater ? t(`The animated +${shownWaterLevel.toFixed(1)} m level is a user-chosen terrain demonstration, not a predicted wave height or arrival time.`,`ระดับเคลื่อนไหว +${shownWaterLevel.toFixed(1)} เมตรเป็นการสาธิตเทียบภูมิประเทศที่ผู้ใช้ตั้ง ไม่ใช่ความสูงคลื่นหรือเวลาถึงที่พยากรณ์`) : t('The water slider screens terrain; it does not predict tsunami wave height.','แถบระดับน้ำใช้เทียบภูมิประเทศ ไม่ได้พยากรณ์ความสูงคลื่นสึนามิ')}</>}</p>
      <label className="scenario-import">{t('Load research inundation frames (JSON, on this device only)','เปิดเฟรมน้ำท่วมวิจัย (JSON เฉพาะอุปกรณ์นี้)')}<input aria-label={t('Load research inundation scenario','เปิดฉากทัศน์น้ำท่วมวิจัย')} type="file" accept="application/json,.json" onChange={e => { void importScenario(e.target.files?.[0]); e.target.value = ''; }} /></label>
      {hazard && <button onClick={() => { setHazard(undefined); pausePlayback(); }}>{t('Remove imported scenario','นำฉากทัศน์ที่นำเข้าออก')}</button>}
      {importError && <p role="alert">{importError}</p>}
      {waterSurfaceError && <p role="status">{t('3D water surface unavailable; footprint layer remains visible.','แสดงผิวน้ำสามมิติไม่ได้ ยังแสดงชั้นขอบเขตน้ำ')} {waterSurfaceError}</p>}
      <p>{t('Format: warning-relative seconds, EPSG:4326 cell bounds, north-to-south rows, MSL datum and depth in metres. A wave-height gauge needs its own location and crest-to-trough definition. No upload or automatic approval.','รูปแบบ: วินาทีจากคำเตือน ขอบเขตเซลล์ EPSG:4326 แถวจากเหนือไปใต้ อ้างอิง MSL และความลึกเป็นเมตร สถานีความสูงคลื่นต้องมีตำแหน่งและนิยามยอดถึงท้องคลื่นของตนเอง ไม่มีการอัปโหลดหรืออนุมัติอัตโนมัติ')} <a href="/data/hazard-replay.schema.json" target="_blank" rel="noreferrer">{t('Scenario file schema','ข้อกำหนดไฟล์ฉากทัศน์')}</a>.</p>
      <p>{t('Coverage: satellite/DEM views work across the listed regions; the sourced walking-network exercise currently covers Bang Niang only. Each additional beach needs its own route, destination and hazard pack. Public-source candidates:','พื้นที่ครอบคลุม: มีภาพถ่ายและ DEM สำหรับภูมิภาคในรายการ แบบฝึกโครงข่ายเดินที่มีแหล่งอ้างอิงครอบคลุมบางเนียงเท่านั้น ชายหาดอื่นต้องมีชุดเส้นทาง ปลายทาง และภัยของตนเอง แหล่งสาธารณะที่อาจนำมาใช้:')} <a href="https://www.clawpack.org/tsunamidata.html" target="_blank" rel="noreferrer">GeoClaw</a> · <a href="https://www.gebco.net/data-products/gridded-bathymetry-data" target="_blank" rel="noreferrer">GEBCO</a> · <a href="https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/tsunamis" target="_blank" rel="noreferrer">NOAA</a>. {t('Not connected live feeds.','ยังไม่ใช่ฟีดสดที่เชื่อมต่อแล้ว')}</p>
      </details>
      {consoleSlot && <details className="console-section"><summary>{t('Local context and personal plan','ข้อมูลพื้นที่และแผนส่วนบุคคล')}</summary>{consoleSlot}</details>}
        </div></ReadingDialog></div></DockControls>
  </section>;
}
