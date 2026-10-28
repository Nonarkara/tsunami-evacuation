import { validateDrill, type DrillLog } from './research';
export type DrillRecord=DrillLog & {recordedAt?:string;route?:string;review?:string};
export function parseDrillArchive(value:unknown):{records:DrillRecord[];invalid:number} {
  if(!Array.isArray(value))return{records:[],invalid:1};
  const records:DrillRecord[]=[];
  for(const item of value){
    if(!item||typeof item!=='object'){continue;}
    const p=item as Record<string,unknown>;
    const counts={participants:p.participants,reached:p.reached,assisted:p.assisted,minutes:p.minutes};
    if(!Object.values(counts).every(v=>typeof v==='number')||!validateDrill(counts as DrillLog))continue;
    if(['route','review'].some(k=>p[k]!==undefined&&(typeof p[k]!=='string'||(p[k] as string).length>2000)))continue;
    if(p.recordedAt!==undefined&&(typeof p.recordedAt!=='string'||!Number.isFinite(Date.parse(p.recordedAt))))continue;
    records.push({...counts as DrillLog,...(typeof p.recordedAt==='string'?{recordedAt:p.recordedAt}:{}),...(typeof p.route==='string'?{route:p.route}:{}),...(typeof p.review==='string'?{review:p.review}:{})});
  }
  return{records,invalid:value.length-records.length};
}
