/** Small inline-SVG chart kit. Charts draw in CSS pixels (measured width), so type stays on the
 * shared 11/13 px tokens at every panel width. Every chart states its unit and range. */
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { largestRemainder, niceCeil, profileRuns, reconciledShares, waitClock } from './viz';

function useWidth<T extends HTMLElement>(fallback = 320) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const read = () => { if (el.clientWidth > 0) setWidth(el.clientWidth); };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // A chart mounted inside a hidden pane measures 0; re-check whenever the parent re-renders (e.g. the pane is shown).
  useLayoutEffect(() => { const w = ref.current?.clientWidth; if (w && w !== width) setWidth(w); });
  return [ref, width] as const;
}

/* ── StepDown: cumulative packages, two timing conditions, one shared % scale ── */
export type Step = { name: string; title: string; a: number; b: number; note?: string };
export function StepDown({ steps, selected, onSelect, aLabel, bLabel, show = 'a', height = 96, ariaLabel }: {
  steps: Step[]; selected?: number; onSelect?: (i: number) => void; aLabel: string; bLabel: string; show?: 'a' | 'b'; height?: number; ariaLabel: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const max = niceCeil(Math.max(...steps.flatMap(s => [s.a, s.b])));
  const top = 14, bottom = 4, plot = height - top - bottom;
  const left = 28, col = (w - left) / steps.length, x = (i: number) => left + col * (i + .5);
  const y = (v: number) => top + plot * (1 - v / max);
  const line = (k: 'a' | 'b') => steps.map((s, i) => `${x(i).toFixed(1)},${y(s[k]).toFixed(1)}`).join(' ');
  return <div className="viz stepdown" ref={ref}>
    <div className="viz-legend"><span className="key-a">{aLabel}</span><span className="key-b">{bLabel}</span><span className="viz-unit">%</span></div>
    <svg width={w} height={height} role="img" aria-label={ariaLabel}>
      {[0, max / 2, max].map(v => <g key={v}><line className="viz-grid" x1={left} x2={w} y1={y(v)} y2={y(v)} /><text x={left - 4} y={y(v) + 3} textAnchor="end">{v}</text></g>)}
      {selected !== undefined && <rect className="viz-select" x={left + col * selected} y={0} width={col} height={height} />}
      <polyline className="series-b" points={line('b')} />
      <polyline className="series-a" points={line('a')} />
      {steps.map((s, i) => <g key={i}>
        <circle className="dot-b" cx={x(i)} cy={y(s.b)} r={2.5} />
        <circle className="dot-a" cx={x(i)} cy={y(s.a)} r={3.5} />
        <text className={`val-${show}`} x={x(i)} y={Math.min(y(s.a), y(s.b)) - 5} textAnchor="middle">{s[show].toFixed(1)}</text>
      </g>)}
    </svg>
    <div className="stepdown-axis" style={{ marginLeft: left, gridTemplateColumns: `repeat(${steps.length},1fr)` }}>
      {steps.map((s, i) => onSelect
        ? <button key={i} aria-pressed={selected === i} title={s.title} onClick={() => onSelect(i)}><b>{s.name}</b>{s.note && <small>{s.note}</small>}</button>
        : <span key={i} title={s.title}><b>{s.name}</b>{s.note && <small>{s.note}</small>}</span>)}
    </div>
  </div>;
}

/* ── DotGrid: 100 people, one dot per percent ── */
export type Part = { label: string; value: number; kind: string };
export function DotGrid({ parts, caption }: { parts: Part[]; caption: ReactNode }) {
  const counts = largestRemainder(parts.map(p => p.value), 100);
  const dots = counts.flatMap((n, k) => Array.from({ length: n }, () => parts[k].kind));
  return <figure className="viz dotgrid">
    <svg viewBox="0 0 100 100" width={104} height={104} role="img" aria-label={parts.map(p => `${p.label} ${p.value.toFixed(1)}%`).join('; ')}>
      {dots.map((kind, i) => <circle key={i} className={`dot-${kind}`} cx={5 + (i % 10) * 10} cy={5 + Math.floor(i / 10) * 10} r={3.6} />)}
    </svg>
    <figcaption>
      <dl>{parts.map(p => <div key={p.kind}><dt><i className={`dot-${p.kind}`} aria-hidden="true" />{p.label}</dt><dd>{p.value.toFixed(1)}%</dd></div>)}</dl>
      <small>{caption}</small>
    </figcaption>
  </figure>;
}

/* ── StackBar: one bar that always sums to its total ── */
export function StackBar({ parts, total, label }: { parts: Part[]; total: number; label: string }) {
  const shares = reconciledShares(parts.map(p => p.value), total);
  return <div className="viz stackbar">
    {shares === null ? <p role="status">{label}: counts do not reconcile / จำนวนไม่ตรงกัน</p> : <div className="stack-track" role="img" aria-label={`${label}: ${parts.map(p => `${p.label} ${Math.round(p.value).toLocaleString()}`).join(', ')} / ${total.toLocaleString()}`}>
      {parts.map((p, i) => shares[i] > 0 && <span key={p.kind} className={`seg-${p.kind}`} style={{ width: `${shares[i]}%` }} />)}
    </div>}
    <dl className="stack-legend" style={{ '--stack-cols': Math.min(parts.length, 4), '--stack-cols-narrow': Math.min(parts.length, 2) } as CSSProperties}>{parts.map(p => <div key={p.kind}><dt><i className={`seg-${p.kind}`} aria-hidden="true" />{p.label}</dt><dd>{Math.round(p.value).toLocaleString()}</dd></div>)}</dl>
  </div>;
}

/* ── PaceRuler: free-flow minutes per pace on one axis, with a target line ── */
export type PaceMark = { label: string; minutes: number; kind?: string };
export function PaceRuler({ marks, target, targetLabel, ariaLabel, unitLabel }: { marks: PaceMark[]; target?: number; targetLabel?: string; ariaLabel: string; unitLabel: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const max = niceCeil(Math.max(...marks.map(m => m.minutes), target ?? 0));
  const pad = 14, axisY = 34, x = (m: number) => pad + (w - pad * 2) * (m / max);
  // Greedy two-row label placement so close times never overprint.
  // Width-aware greedy two-row placement (≈6.5 px per glyph at 11 px) so close times never overprint.
  const rows: number[] = []; const end = [-1e9, -1e9];
  const sorted = [...marks].sort((a, b) => a.minutes - b.minutes);
  sorted.forEach(m => { const half = m.label.length * 3.25 + 4, px = x(m.minutes), r = px - half > end[0] ? 0 : px - half > end[1] ? 1 : 0; rows.push(r); end[r] = px + half; });
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  return <div className="viz paceruler" ref={ref}>
    <div className="viz-legend">{unitLabel}</div>
    <svg width={w} height={50} role="img" aria-label={ariaLabel}>
      <line className="viz-axis" x1={pad} x2={w - pad} y1={axisY} y2={axisY} />
      {ticks.map(t => <g key={t}><line className="viz-axis" x1={x(t)} x2={x(t)} y1={axisY} y2={axisY + 4} /><text className="viz-tick" x={x(t)} y={axisY + 14} textAnchor="middle">{Math.round(t)}{t === max ? '′' : ''}</text></g>)}
      {target !== undefined && <g className="viz-target"><line x1={x(target)} x2={x(target)} y1={axisY - 8} y2={axisY + 4} /></g>}
      {sorted.map((m, i) => { const px = x(m.minutes), ly = rows[i] ? 10 : 22; return <g key={m.label} className={`mark-${m.kind ?? 'walk'}`}>
        <line x1={px} x2={px} y1={ly + 3} y2={axisY} /><circle cx={px} cy={axisY} r={3.5} />
        <text x={px} y={ly} textAnchor={px < 40 ? 'start' : px > w - 40 ? 'end' : 'middle'}>{m.label}</text></g>; })}
    </svg>
    {target !== undefined && <div className="pace-target">{targetLabel}</div>}
  </div>;
}

/* ── ProfileQueue: terrain profile and queue waits on one chainage axis ── */
export function ProfileQueue({ chainage, profile, waits, position, ariaLabel, queueLabel, queueMaxLabel = 'max wait', profileLabel = 'DEM m' }: {
  chainage: number[]; profile: (number | null)[]; waits: { chainageM: number; waitSeconds: number }[]; position?: number; ariaLabel: string; queueLabel: string; queueMaxLabel?: string; profileLabel?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const heights = profile.filter((h): h is number => h !== null && Number.isFinite(h));
  const len = Math.max(1, chainage.at(-1) ?? 1), hMax = niceCeil(Math.max(20, ...heights)), hMin = Math.min(0, ...heights), wMax = Math.max(0, ...waits.map(q => q.waitSeconds));
  const left = 38, right = 6, pw = w - left - right, X = (m: number) => left + pw * (m / len);
  const pTop = 6, pH = 50, qTop = pTop + pH + 12, qH = 24, axis = qTop + qH;
  const Y = (h: number) => pTop + pH * (1 - (h - hMin) / (hMax - hMin));
  const runs = profileRuns(chainage, profile);
  const sortedWaits = [...waits].sort((a, b) => a.chainageM - b.chainageM);
  return <div className="viz profilequeue" ref={ref}>
    <svg width={w} height={axis + 16} role="img" aria-label={ariaLabel}>
      <line className="viz-grid" x1={left} x2={w - right} y1={pTop} y2={pTop} />
      <text className="viz-tick" x={left - 4} y={pTop + 4} textAnchor="end">{hMax} m</text>
      <text className="viz-tick" x={left - 4} y={pTop + pH} textAnchor="end">{hMin}</text>
      {runs.map((run, i) => <polyline key={i} className="profile-line" points={run.map(p => `${X(p.distance).toFixed(1)},${Y(p.height).toFixed(1)}`).join(' ')} />)}
      <line className="viz-axis" x1={left} x2={w - right} y1={pTop + pH} y2={pTop + pH} />
      <text className="viz-tick" x={left} y={qTop - 3}>{queueMaxLabel} {waitClock(wMax)}</text>
      {sortedWaits.map((q, i) => { const x0 = X(q.chainageM), x1 = X(sortedWaits[i + 1]?.chainageM ?? len), h = qH * (q.waitSeconds / (wMax || 1));
        return h > 0 && <rect key={i} className="queue-rect" x={x0} y={axis - h} width={Math.max(3, x1 - x0 - 1)} height={h}><title>{`${(q.chainageM / 1000).toFixed(2)} km · ${Math.round(q.waitSeconds)} s`}</title></rect>; })}
      <line className="viz-axis" x1={left} x2={w - right} y1={axis} y2={axis} />
      {[0, len / 2, len].map((m, i) => <text key={i} className="viz-tick" x={X(m)} y={axis + 13} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>{(m / 1000).toFixed(i === 1 ? 1 : 2)}{i === 2 ? ' km' : ''}</text>)}
      {position !== undefined && <line className="viz-playhead" x1={X(position)} x2={X(position)} y1={pTop} y2={axis} />}
    </svg>
    <div className="viz-legend"><span className="key-profile">{profileLabel}</span><span className="key-queue">{queueLabel}</span></div>
  </div>;
}

/* ── Sparkline: a one-line trend for tight spaces; the full chart lives elsewhere ── */
export function Sparkline({ values, width = 56, height = 16 }: { values: number[]; width?: number; height?: number }) {
  const max = Math.max(...values), x = (i: number) => 2 + (width - 4) * i / Math.max(1, values.length - 1), y = (v: number) => 2 + (height - 4) * (1 - v / max);
  return <svg className="viz-spark" width={width} height={height} aria-hidden="true">
    <polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
    <circle cx={x(values.length - 1)} cy={y(values.at(-1)!)} r={2} />
  </svg>;
}
