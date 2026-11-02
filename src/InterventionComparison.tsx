import { scenarios, reduction, type Condition } from './research';
import { manualLanguage } from './manual-content';
import { StepDown } from './charts';
import { packageNames } from './research-ledger';

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
      aLabel={t('Warn 30′ · prep 14′','เตือน 30′ · เตรียม 14′')}
      bLabel={t('Warn 45′ · prep 28′','เตือน 45′ · เตรียม 28′')}
      ariaLabel={t(`Modeled victim share, 39,041 agents. Warning/preparation: 30/14 versus 45/28 minutes. ${scenarios.map(s=>`${s.short} ${s.affected}% baseline, ${s.delayed}% delayed`).join('; ')}. Preprint, cumulative packages.`,`ผู้ประสบภัยจำลอง 39,041 ตัวแทน เตือน/เตรียมตัว 30/14 กับ 45/28 นาที: ${scenarios.map((s,i)=>`${names[i]} ${s.affected}% / ${s.delayed}%`).join('; ')}`)}
      steps={scenarios.map((s,i)=>({ name:names[i], title:`${packageNames[i][language]} · ${t('baseline','ฐาน')} ${s.affected.toFixed(1)}% · ${t('delayed','ล่าช้า')} ${s.delayed.toFixed(1)}% · ${s.reference}`, a:s.affected, b:s.delayed, note:i===0?t('ref','อ้างอิง'):`−${reduction(i,condition).toFixed(0)}%` }))}
    />
  </div>;
}
