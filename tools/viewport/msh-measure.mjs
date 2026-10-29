// Read-only MSH collector: chrome cost, task visibility, geometry failures,
// hierarchy and preservation for the fixed-screen workspace.
//
// It records geometry and computed style only. It does not navigate, click,
// inject styles, scroll or collect page text beyond short labels it needs to
// compare a control's box against its own label.
export function measureMsh() {
  const main = document.getElementById('main');
  const mainBox = main.getBoundingClientRect();
  const shown = el => {
    if (!el) return false;
    if (el.closest('[hidden]')) return false;
    const r = el.getBoundingClientRect();
    const style=getComputedStyle(el);
    if(style.visibility==='hidden'||style.display==='none') return false;
    const windowBox=el.closest('.flow-window')?.getBoundingClientRect();
    const clip=windowBox ?? {left:0,right:innerWidth,top:0,bottom:innerHeight};
    return r.width > 0 && r.height > 0 && r.right>clip.left && r.left<clip.right && r.bottom>clip.top && r.top<clip.bottom;
  };
  const label = el => (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40);

  // Chrome: every band that occupies the top or bottom of the viewport.
  const chrome = [...document.querySelectorAll('header, footer, [role="banner"], .masthead, .banner-dock')]
    .filter(shown)
    .map(el => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        name: el.className || el.tagName.toLowerCase(),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
        position: style.position,
        sticky: style.position === 'sticky' || style.position === 'fixed',
        atTop: r.top <= 1,
        atBottom: Math.abs(r.bottom - innerHeight) <= 1,
      };
    });
  const topChrome = chrome.filter(c => c.atTop);
  const bottomChrome = chrome.filter(c => c.atBottom);
  const topHeight = topChrome.reduce((sum, c) => Math.max(sum, c.bottom), 0);
  const bottomHeight = bottomChrome.length
    ? Math.max(...bottomChrome.map(c => innerHeight - c.top))
    : 0;

  // Regions: the operating blocks of the workspace.
  const regionSelectors = [
    '.explore-grid', '.geography-pane', '.terrain-rehearsal', '.terrain-stage',
    '.terrain-caption', '.terrain-operations', '.flow-window', '.page-turner',
    '.operations-content', '.walkthrough-coach', '.route-profile', '.terrain-analysis-row',
    '.rehearsal-controls', '.rehearsal-timeline', '.compare-panel', '.reading-dialog',
  ];
  const regions = regionSelectors
    .map(sel => document.querySelector(sel))
    .filter(el => el && shown(el))
    .map(el => {
      const r = el.getBoundingClientRect();
      return {
        name: el.className,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      };
    });

  // Vertical rhythm inside the task column: gaps between stacked blocks.
  const column = document.querySelector('.terrain-operations') || main;
  const blocks = [...column.children]
    .filter(shown)
    .map(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        name: el.className || el.tagName.toLowerCase(),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
        marginTop: Math.round(parseFloat(cs.marginTop) || 0),
        marginBottom: Math.round(parseFloat(cs.marginBottom) || 0),
        children: el.children.length,
        textLength: (el.textContent || '').trim().length,
      };
    })
    .sort((a, b) => a.top - b.top);
  const gaps = [];
  for (let i = 1; i < blocks.length; i++) {
    const gap = blocks[i].top - blocks[i - 1].bottom;
    if (gap > 12) gaps.push({ between: [blocks[i - 1].name, blocks[i].name], gap });
  }

  // Stretched siblings: equal-height siblings where one holds far less content.
  const stretched = [];
  for (const group of [column, ...column.querySelectorAll(':scope > *')]) {
    const kids = [...group.children].filter(shown);
    const byHeight = new Map();
    for (const kid of kids) {
      const h = Math.round(kid.getBoundingClientRect().height);
      byHeight.set(h, [...(byHeight.get(h) || []), kid]);
    }
    for (const [height, group2] of byHeight) {
      if (group2.length < 2 || height < 40) continue;
      const contents = group2.map(k => (k.textContent || '').trim().length);
      if (Math.max(...contents) - Math.min(...contents) > 120) {
        stretched.push({
          parent: group.className || group.tagName.toLowerCase(),
          height,
          children: group2.map(k => ({ name: k.className || k.tagName.toLowerCase(), textLength: contents[group2.indexOf(k)] })),
        });
      }
    }
  }

  // Controls whose box is far larger than their own label.
  const inflated = [];
  for (const el of [...document.querySelectorAll('button, select, .reading-trigger')].filter(shown)) {
    const r = el.getBoundingClientRect();
    const text = label(el);
    const textWidth = text.length * 7.5;
    if (r.width > textWidth + 56 && r.width > 120) {
      inflated.push({ name: el.className || el.tagName.toLowerCase(), label: text, width: Math.round(r.width), height: Math.round(r.height) });
    }
  }

  // Hierarchy: the visible reading order of the first screen, by computed size.
  const hierarchy = [];
  for (const el of [...main.querySelectorAll('h1,h2,h3,strong,.eyebrow,.coach-heading strong,.stat-pill,dt,dd')].filter(shown)) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.top > mainBox.bottom + 40) continue;
    hierarchy.push({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0, 40),
      size: Math.round(parseFloat(cs.fontSize)),
      weight: cs.fontWeight,
      y: Math.round(r.y),
    });
  }
  hierarchy.sort((a, b) => a.y - b.y);

  // Task visibility: the primary information and the primary action on screen together.
  const canvas = document.querySelector('.terrain-canvas, .map-wrap, .leaflet-container');
  const primaryAction = document.querySelector('.terrain-operations button, .coach-next button, .page-turner button');
  const inView = el => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top >= mainBox.top - 1 && r.bottom <= mainBox.bottom + 1 && r.left >= mainBox.left - 1 && r.right <= mainBox.right + 1 && r.width > 0 && r.height > 0;
  };

  // Geometry failures: anything crossing the viewport edge or the main box.
  const failures = [];
  for (const el of [...main.querySelectorAll('*')].filter(shown)) {
    const r = el.getBoundingClientRect();
    if (r.right > innerWidth + 1 || r.left < -1) failures.push({ name: el.className || el.tagName.toLowerCase(), left: Math.round(r.left), right: Math.round(r.right) });
  }

  return {
    width: innerWidth,
    height: innerHeight,
    doc: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
    scrollY,
    chrome: { top: topHeight, bottom: bottomHeight, bands: chrome, costPercent: Math.round(((topHeight + bottomHeight) / innerHeight) * 100) },
    regions,
    blocks,
    gaps,
    stretched,
    inflated,
    hierarchy,
    task: {
      mapVisible: inView(canvas),
      actionVisible: inView(primaryAction),
      actionName: primaryAction ? label(primaryAction) : null,
      canvasSize: canvas ? { w: Math.round(canvas.getBoundingClientRect().width), h: Math.round(canvas.getBoundingClientRect().height) } : null,
    },
    failures: failures.slice(0, 12),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
}
