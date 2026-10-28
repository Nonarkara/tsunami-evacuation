import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** Fixed-height reading pages. Content fragments into columns; controls turn pages, never shrink text. */
export function PagedFlow({children,label='Reading pages',className=''}:{children:ReactNode;label?:string;className?:string}) {
  const host=useRef<HTMLDivElement>(null), content=useRef<HTMLDivElement>(null);
  const [outline,setOutline]=useState<string[]>([]);
  const [page,setPage]=useState(0),[total,setTotal]=useState(1),[stride,setStride]=useState(1);
  const measure=useCallback(()=>{
    const box=host.current, body=content.current;if(!box||!body||box.clientWidth===0)return;
    const titles=Array.from(body.querySelectorAll('h2,h3,summary')).map(el=>el.textContent?.trim()??'');
    setOutline(old=>JSON.stringify(old)===JSON.stringify(titles)?old:titles);
    const step=box.clientWidth+24;
    // Measure natural column flow independently of the optional single-page chart stretch.
    const previousDisplay=body.style.display;
    if(getComputedStyle(body).display==='flex')body.style.display='block';
    const count=Math.max(1,Math.ceil((body.scrollWidth+24)/step));
    body.style.display=previousDisplay;
    setStride(step);setTotal(count);setPage(p=>Math.min(p,count-1));
  },[]);
  useLayoutEffect(()=>{
    const box=host.current,body=content.current;if(!box||!body)return;
    const observer=new ResizeObserver(measure);observer.observe(box);
    const mutation=new MutationObserver(()=>requestAnimationFrame(measure));
    mutation.observe(body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden']});
    document.fonts.ready.then(measure);measure();
    return()=>{observer.disconnect();mutation.disconnect();};
  },[measure]);
  useLayoutEffect(measure,[children,measure]);
  function reveal(target:Element){
    const box=host.current;if(!box)return;
    const x=target.getBoundingClientRect().left-box.getBoundingClientRect().left+page*stride;
    setPage(Math.max(0,Math.min(total-1,Math.floor((x+1)/stride))));
  }
  useEffect(()=>{
    const target=document.getElementById(location.hash.slice(1));
    if(target&&content.current?.contains(target))reveal(target);
  // Re-evaluate a deep link after columns are measured, not after each page turn.
  },[total,stride]);
  return <div className={`paged-flow ${className}`} data-pages={total} aria-label={label}>
    <div className="flow-window" ref={host} onFocusCapture={e=>reveal(e.target)} onClickCapture={e=>{
      const anchor=(e.target as Element).closest('a[href^="#"]');
      const id=anchor?.getAttribute('href')?.slice(1),target=id?document.getElementById(id):null;
      if(target&&content.current?.contains(target)){e.preventDefault();e.stopPropagation();reveal(target);target.setAttribute('tabindex','-1');(target as HTMLElement).focus({preventScroll:true});history.replaceState(null,'',`#${id}`);}
    }}>
      <div className="flow-content" ref={content} style={{transform:`translateX(${-page*stride}px)`}}>{children}</div>
    </div>
    <nav className="page-turner" aria-label={`${label} navigation`}>
      <button disabled={page===0} onClick={()=>setPage(p=>p-1)} aria-label="Previous page / หน้าก่อน">← <span>Previous / ก่อน</span></button>
      {outline.length>1&&<select className="page-jump" aria-label={`${label}: jump to section`} value="" onChange={e=>{
        const target=content.current?.querySelectorAll('h2,h3,summary')[Number(e.target.value)];
        if(target){reveal(target);target.setAttribute('tabindex','-1');(target as HTMLElement).focus({preventScroll:true});}
      }}><option value="">Sections / หัวข้อ</option>{outline.map((title,i)=><option key={i} value={i}>{title}</option>)}</select>}
      <span aria-live="polite">{page+1} / {total}</span>
      <button disabled={page>=total-1} onClick={()=>setPage(p=>p+1)} aria-label="Next page / หน้าถัดไป"><span>Next / ถัดไป</span> →</button>
    </nav>
  </div>;
}
