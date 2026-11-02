import { scenarios, reduction, type Condition } from './research';
import { manualLanguage } from './manual-content';
import { StepDown } from './charts';

/** The study's cumulative packages on one shared % scale: both timing conditions, selectable steps. */
export function InterventionComparison({ step, condition, onSelect, height }: { step?: number; condition: Condition; onSelect?: (step: number) => void; height?: number }) {
  const language = manualLanguage(location.search, navigator.language);
  const t = (en: string, th: string) => language === 'th' ? th : en;
  const names = scenarios.map((_,i)=>t(['Base','Walk','+Refuge','+VE50','+Signs'][i],['ฐาน','เดิน','+อาคาร','+VE50','+ป้าย'][i]));
  return <div className="comparison-selector" role="region" aria-label={t('Modeled victim share by cumulative package','ผู้ประสบภัยจำลองตามมาตรการสะสม')} lang={language}>
    <StepDown
      height={height}
      show={condition==='baseline'?'a':'b'}
      selected={step}
      onSelect={onSelect}
      aLabel={t('30′ warning','เตือน 30′')}
      bLabel={t('45′ warning','เตือน 45′')}
      ariaLabel={t(`Modeled victim share, 39,041 agents: ${scenarios.map(s=>`${s.short} ${s.affected}% at 30-minute warning, ${s.delayed}% at 45-minute warning`).join('; ')}. Preprint, cumulative packages.`,`ผู้ประสบภัยจำลอง 39,041 ตัวแทน: ${scenarios.map((s,i)=>`${names[i]} ${s.affected}% / ${s.delayed}%`).join('; ')}`)}
      steps={scenarios.map((s,i)=>({ name:names[i], title:`${s.label} · 30′ ${s.affected.toFixed(1)}% · 45′ ${s.delayed.toFixed(1)}% · ${s.reference}`, a:s.affected, b:s.delayed, note:i===0?t('ref','อ้างอิง'):`−${reduction(i,condition).toFixed(0)}%` }))}
    />
  </div>;
}
