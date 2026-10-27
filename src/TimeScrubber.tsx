const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function TimeScrubber({ label, duration, value, onChange }: { label: string; duration: number; value: number; onChange: (seconds: number) => void }) {
  return <span className="time-scrubber">
    <input aria-label={label} title="Elapsed time · min:sec / นาที:วินาที" aria-valuetext={`${clock(value)} / ${clock(duration)}`} type="range" min={0} max={duration} step={1} value={value} onChange={e => onChange(Number(e.target.value))} />
    <span className={`time-ruler${duration >= 6000 ? ' long-clock' : ''}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => <i key={i} className={i % 4 === 0 ? 'major' : ''} style={{ left: `${i * 12.5}%` }} />)}
      <span className="ruler-start">{duration >= 6000 ? '0' : '0:00'}</span><span className="ruler-middle">{clock(duration / 2)}</span><span className="ruler-end">{clock(duration)}</span>
    </span>
  </span>;
}
