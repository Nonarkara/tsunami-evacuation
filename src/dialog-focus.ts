/** Keep Tab within a modal, including browsers that otherwise focus the document body. */
export function cycleDialogFocus(element:HTMLDialogElement,event:Pick<KeyboardEvent,'key'|'shiftKey'|'preventDefault'>) {
  if(event.key!=='Tab'||!element.open)return;
  const controls=Array.from(element.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary')).filter(el=>el.getClientRects().length>0);
  if(!controls.length)return;
  event.preventDefault();
  const current=controls.indexOf(document.activeElement as HTMLElement),direction=event.shiftKey?-1:1;
  let next=current<0?(event.shiftKey?0:-1):current;
  for(let attempt=0;attempt<controls.length;attempt++){
    next=(next+direction+controls.length)%controls.length;
    controls[next].focus({preventScroll:true});
    if(document.activeElement===controls[next])break;
  }
}
