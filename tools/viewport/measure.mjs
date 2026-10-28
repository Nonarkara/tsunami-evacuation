// Read-only collector for the fixed-screen workspace; run through the approved browser tool.
export function measureViewport() {
  const main=document.getElementById('main').getBoundingClientRect();
  const visible=el=>el.getBoundingClientRect().width>0&&!el.closest('[hidden]');
  const regions=[...document.querySelectorAll('main .flow-window,main .page-turner,main .terrain-stage,main .terrain-caption,main .terrain-operations')].filter(visible).map(el=>({name:el.className,rect:el.getBoundingClientRect().toJSON()}));
  const toolbarHost=document.querySelector('.terrain-toolbar')?.getBoundingClientRect();
  const toolbar=toolbarHost?[...document.querySelectorAll('.terrain-toolbar button')].filter(visible).map(el=>{
    const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return{name:el.getAttribute('aria-label'),inside:r.top>=toolbarHost.top-1&&r.bottom<=toolbarHost.bottom+1&&r.right<=toolbarHost.right+1,clear:hit===el||el.contains(hit)};
  }):[];
  const headerControls=[...document.querySelectorAll('.soonami-masthead button,.soonami-masthead select')].filter(visible).map(el=>({name:el.getAttribute('aria-label'),rect:el.getBoundingClientRect().toJSON()}));
  return {width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,scrollY,main:main.toJSON(),header:document.querySelector('header.soonami-masthead').getBoundingClientRect().toJSON(),regions,toolbar,headerControls,pages:[...document.querySelectorAll('main .page-turner')].filter(visible).map(x=>x.textContent),failures:regions.filter(x=>x.rect.bottom>main.bottom+1||x.rect.top<main.top-1||x.rect.right>main.right+1||x.rect.left<main.left-1).map(x=>x.name)};
}
