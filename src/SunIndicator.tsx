import { useEffect, useState } from 'react';
import type { ManualLanguage } from './manual-content';
import { cardinalDirection, solarPosition } from './orientation';

/** Approximate sky context at the selected place, with north at the top of the glyph.
 * Not a camera-relative arrow, device compass, or evacuation instruction. */
export function SunIndicator({ language, latitude, longitude }: {
  language: ManualLanguage; latitude: number; longitude: number;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const { azimuth, altitude } = solarPosition(now, latitude, longitude);
  const up = altitude > 0;
  const dir = cardinalDirection(azimuth);
  const thai = language === 'th';
  const dirs: Record<string, string> = {
    N: 'เหนือ', NE: 'ตะวันออกเฉียงเหนือ', E: 'ตะวันออก', SE: 'ตะวันออกเฉียงใต้',
    S: 'ใต้', SW: 'ตะวันตกเฉียงใต้', W: 'ตะวันตก', NW: 'ตะวันตกเฉียงเหนือ',
  };
  const label = up
    ? thai ? `ดวงอาทิตย์โดยประมาณ: ${dirs[dir]} ${Math.round(azimuth)}°` : `Approximate sun: ${dir} ${Math.round(azimuth)}°`
    : thai ? 'ดวงอาทิตย์ใต้ขอบฟ้า' : 'Sun below horizon';
  const note = thai ? 'เหนืออยู่ด้านบน · เวลาอุปกรณ์ · ไม่ใช่เข็มทิศหรือทิศทางอพยพ' : 'North up · device time · not a compass or evacuation bearing';
  return (
    <span className="sun-indicator" role="img" aria-label={`${label}. ${note}`} title={`${label} · ${note}`}>
      <svg className="sun-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <text x="12" y="5" textAnchor="middle" fontSize="5" fill="currentColor">N</text>
        <circle cx="12" cy="13" r="6" fill="none" stroke="currentColor" strokeWidth="1" />
        {up && <path d="M12 17 L12 8 M9 11 L12 8 L15 11" transform={`rotate(${azimuth} 12 13)`} fill="none" stroke="currentColor" strokeWidth="1.5" />}
        {!up && <path d="M8 13h8" stroke="currentColor" />}
      </svg>
      <span className="sun-dir">{up ? thai ? `อาทิตย์ ≈ ${dir}` : `Sun ≈ ${dir}` : thai ? 'ใต้ขอบฟ้า' : 'Below horizon'}</span>
    </span>
  );
}
