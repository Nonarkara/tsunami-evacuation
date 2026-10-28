import {useEffect,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {ReadingDialog} from './ReadingDialog';

/** Move scene controls, never the map or its state, into the single application banner. */
export function DockControls({target,children}:{target:HTMLElement|null;children:ReactNode}) {
  return target?createPortal(children,target):null;
}

export function BannerDock({context,onDock,scene}:{context:ReactNode;onDock:(node:HTMLDivElement|null)=>void;scene:boolean}) {
  const [wide,setWide]=useState(()=>matchMedia('(min-width:1100px)').matches);
  const [medium,setMedium]=useState(()=>matchMedia('(min-width:760px)').matches);
  useEffect(()=>{
    const media=matchMedia('(min-width:1100px)'),middle=matchMedia('(min-width:760px)'),change=()=>{
      const active=document.activeElement as HTMLElement|null;
      const restore=!!active?.closest('dialog[open]'),label=active?.getAttribute('aria-label');
      setWide(media.matches);setMedium(middle.matches);
      if(restore)requestAnimationFrame(()=>{
        const header=document.querySelector('.soonami-masthead');
        const match=Array.from(header?.querySelectorAll<HTMLElement>('button,select')??[]).find(el=>label&&el.getAttribute('aria-label')===label);
        const fallback=header?.querySelector<HTMLElement>('.banner-overflow,.masthead-nav [aria-current=page]');
        (match??fallback)?.focus({preventScroll:true});
      });
    };
    media.addEventListener('change',change);middle.addEventListener('change',change);
    return()=>{media.removeEventListener('change',change);middle.removeEventListener('change',change);};
  },[]);
  const controls=<><div className="banner-context">{context}</div><div className="banner-scene" ref={onDock} hidden={!scene}/></>;
  if(wide)return <div className="banner-dock">{controls}</div>;
  if(medium)return <div className="banner-dock"><div className="banner-context">{context}</div><span hidden={!scene}><ReadingDialog compact title="Map controls / เครื่องมือแผนที่" triggerLabel="⋯" className="banner-overflow"><div className="banner-scene" ref={onDock} hidden={!scene}/></ReadingDialog></span></div>;
  return <ReadingDialog compact title="Map controls / เครื่องมือแผนที่" triggerLabel="⋯" className="banner-overflow">{controls}</ReadingDialog>;
}
