import {readFile} from 'node:fs/promises';
const rows=JSON.parse(await readFile(new URL('../docs/evidence/banner-2026-10-28/cases.json',import.meta.url),'utf8'));
const old=JSON.parse(await readFile(new URL('../docs/evidence/viewport-2026-10-28/live-routes.json',import.meta.url),'utf8'));
const oldTop=old.find(x=>x.route==='model').regions.find(x=>x.name==='terrain-stage').rect.top;
const failures=[];
for(const [w,h] of [[320,700],[390,844],[760,768],[761,768],[1024,768],[1099,768],[1100,768],[1169,674],[1280,720],[1440,900],[667,375],[390,600]])for(const page of ['explore','satellite','prepare','drill','research']){
 const found=rows.filter(x=>x.width===w&&x.height===h&&x.page===page);
 if(found.length!==1)failures.push(`${page}/${w}x${h}: missing or duplicate measurement`);
}
for(const r of rows){
 if(r.header.height>36.5||r.doc[0]!==r.width||r.doc[1]!==r.height||r.failures.length)failures.push(`${r.page}/${r.width}x${r.height}: banner obstruction or document overflow`);
 if(r.page==='explore'&&(!r.stage||r.stage.top>44.5))failures.push(`${r.width}x${r.height}: extra band above map`);
}
if(!(oldTop>44.5))failures.push('Previous stacked-band failure was not established.');
console.log(JSON.stringify({cases:rows.length,previousMapTop:oldTop,currentMapTopLimit:44,status:failures.length?'FAIL':'BANNER_PASS',failures},null,2));
if(failures.length)process.exitCode=1;
