import { useEffect, useRef, useState } from 'react';
import type { ManualLanguage } from './manual-content';
import type { MangaLabels, MangaState } from './manga/model';

/** Camera state survives leaving the view and coming back within one session. */
let savedState: MangaState | null = null;

const MODEL_URL = '/model/bang-niang.bin.gz';

/**
 * The Bang Niang manga street model: the owner's miaoshen "Grand model"
 * renderer fed by the local bake. The three.js engine is loaded only when
 * this view is opened, and disposed when it is left.
 */
export function MangaModel({language}:{language:ManualLanguage}) {
  const t = (en: string, th: string) => language === 'th' ? th : en;
  const host = useRef<HTMLDivElement>(null), hintHost = useRef<HTMLParagraphElement>(null),controlsHost=useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [fail, setFail] = useState('');
  const [stats, setStats] = useState<{ buildings: number; roads: number; water: number; parks: number }>();
  useEffect(() => {
    const hostEl = host.current, hintEl = hintHost.current;
    if (!hostEl || !hintEl) return;
    setPhase('loading');setFail('');
    let instance: { state(): MangaState; dispose(): void } | null = null;
    const ctrl = new AbortController();
    const labels: MangaLabels = language === 'th' ? {
      canvas: 'แบบจำลองผังถนนบางเนียงลายเส้นคอนทราสต์สูง ลากเพื่อหมุน ดับเบิลคลิกเพื่อไปยืน',
      mode: 'มุมมอง', sky: 'ฟ้า', walk: 'เดิน',
      tod: 'แสง', day: 'กลางวัน', dusk: 'พลบค่ำ', night: 'กลางคืน',
      speed: 'กล้อง', stroll: 'ช้า', walkp: 'เดิน', hurry: 'เร็ว', glide: 'ร่อน',
      loading: 'กำลังสร้างแบบจำลอง…',
      hintSky: 'ลากเพื่อหมุน · ลากด้วยปุ่มขวาเพื่อเลื่อน · สกรอลล์เพื่อซูม · ดับเบิลคลิกเพื่อไปยืนที่นั่น',
      hintSkyT: 'ลากเพื่อหมุน · ถ่างนิ้วเพื่อซูม · แตะสองครั้งเพื่อไปยืนที่นั่น',
      hintWalk: 'WASD / ลูกศรเลื่อน · Q/E หมุน · ลากเพื่อมอง · Shift เร่งกล้อง',
      hintWalkT: 'ลากเพื่อมอง กดวงกลมค้างไว้เพื่อเดิน',
    } : {
      canvas: 'High-contrast architectural street linework model of Bang Niang. Drag to turn, double-click to stand there.',
      mode: 'View', sky: 'Sky', walk: 'Walk',
      tod: 'Light', day: 'Day', dusk: 'Dusk', night: 'Night',
      speed: 'Camera', stroll: 'Stroll', walkp: 'Walk', hurry: 'Hurry', glide: 'Glide',
      loading: 'Building the model…',
      hintSky: 'Drag to turn · right-drag to move · scroll to zoom · double-click to stand there',
      hintSkyT: 'Drag to turn · pinch to zoom · double-tap to stand there',
      hintWalk: 'WASD / arrows move · Q/E turn · drag to look · Shift speeds camera',
      hintWalkT: 'Drag to look. Hold the circle to walk.',
    };
    import('./manga/model').then(m => m.start(hostEl, {
      labels, url: MODEL_URL, signal: ctrl.signal, state: savedState, hintHost: hintEl,controlsHost:controlsHost.current??undefined,
    })).then(inst => {
      if (ctrl.signal.aborted) { inst.dispose(); return; }
      instance = inst; setStats(inst.stats()); setPhase('ready');
    }).catch((error: unknown) => {
      if (ctrl.signal.aborted || (error as Error)?.name === 'AbortError') return;
      setFail((error as Error)?.message ?? 'unknown');
      setPhase('failed');
    });
    return () => {
      if (instance) savedState = instance.state();
      ctrl.abort();
    };
  }, [language]);
  return <div className="manga-wrap" data-manga-state={phase}>
    <div ref={host} className="manga-stage" aria-label={t('Architectural street linework model canvas', 'ผืนผ้าใบแบบจำลองลายเส้นผังถนน')} />
    <div ref={controlsHost} className="manga-controls" />
    <p ref={hintHost} className="manga-hintline" />
    {phase === 'failed' && <p className="manga-fail" role="alert">{t('The model could not start. It needs WebGL. Terrain, rehearsal and research remain available.', 'เริ่มแบบจำลองไม่ได้ ต้องใช้ WebGL ภูมิประเทศ แบบฝึก และงานวิจัยยังใช้ได้ตามปกติ')} <span className="manga-fail-detail">{fail}</span></p>}
    {phase === 'ready' && stats && <span className="sr-only" aria-hidden="true">{`${stats.buildings} buildings, ${stats.roads} streets and waterways`}</span>}
  </div>;
}
