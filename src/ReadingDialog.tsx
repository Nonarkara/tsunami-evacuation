import { cycleDialogFocus } from './dialog-focus';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PagedFlow } from './PagedFlow';

export function ReadingDialog({title,children,className='',language,triggerLabel}:{title:string;children:ReactNode;className?:string;language?:'en'|'th';triggerLabel?:string}) {
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),id=useId();
  useEffect(()=>{
    function trap(event:KeyboardEvent){
      const element=dialog.current;
      if(element)cycleDialogFocus(element,event);
    }
    document.addEventListener('keydown',trap,true);
    return()=>document.removeEventListener('keydown',trap,true);
  },[]);
  return <><button ref={trigger} type="button" className={`reading-trigger ${className}`} aria-haspopup="dialog" aria-label={title} onClick={()=>{dialog.current?.showModal();dialog.current?.querySelector<HTMLButtonElement>('.reading-close')?.focus({preventScroll:true});}}>{triggerLabel??title}</button>{createPortal(
    <dialog ref={dialog} className="reading-dialog" lang={language} aria-labelledby={id} onClose={()=>trigger.current?.focus({preventScroll:true})}>
      <header><h2 id={id}>{title}</h2><button autoFocus className="reading-close" aria-label="Close reading / ปิด" onClick={()=>dialog.current?.close()}>×</button></header>
      <PagedFlow label={title}>{children}</PagedFlow>
    </dialog>,document.body)}</>;
}
