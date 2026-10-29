import { useEffect, useState } from 'react';
import type { ManualLanguage } from './manual-content';

/** Approximate sun azimuth (degrees, clockwise from north) for Khao Lak (~8.7°N).
 * Simple solar model: sunrise ~06:15 east, solar noon ~12:15 south, sunset ~18:15 west.
 * Good enough for wayfinding: "run toward the sun = east in the morning". */
function sunAzimuth(now: Date): number {
  const h = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  // Shift so 06:15 ≈ 90° (east), 12:15 ≈ 180° (south), 18:15 ≈ 270° (west)
  let az = (h - 6.25) * 30 + 90;
  // Clamp to the daylight arc; outside hours point the glyph down (sun not up).
  if (h < 5.5 || h > 18.75) return -1;
  return ((az % 360) + 360) % 360;
}

function directionLabel(az: number): string {
  if (az < 0) return '—';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const i = Math.round(((az % 360) / 22.5) + 0.5) % 16;
  return dirs[(i + 16) % 16];
}

export function SunIndicator({ language }: { language: ManualLanguage }) {
  const [az, setAz] = useState(sunAzimuth(new Date()));
  useEffect(() => {
    const t = setInterval(() => setAz(sunAzimuth(new Date())), 30000);
    return () => clearInterval(t);
  }, []);
  const t = (en: string, th: string) => language === 'th' ? th : en;
  const up = az >= 0;
  const dir = directionLabel(az);
  return (
    <div className="sun-indicator" role="region" aria-label={t('Sun direction for wayfinding', 'ทิศดวงอาทิตย์นำทาง')}>
      <svg className="sun-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path
            key={a}
            d={`M12 ${a < 90 || a > 270 ? 10.2 : a === 90 ? 7.8 : 16.2} L12 ${a < 90 || a > 270 ? 7.8 : a === 90 ? 10.2 : 13.8}`}
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
          />
        ))}
        <path d={`M${12 + Math.sin((az * Math.PI) / 180) * 6.5} ${12 - Math.cos((az * Math.PI) / 180) * 6.5} L12 12`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="sun-dir">{up ? dir : '—'}</span>
      <span className="sun-note">{up ? t('Sun is in the ' + dir, 'ดวงอาทิตย์อยู่ทางทิศ' + dir) : t('Sun below horizon', 'ดวงอาทิตย์ใต้ขอบฟ้า')}</span>
    </div>
  );
}
