import {readFile,readdir} from 'node:fs/promises';
const folder=new URL('../docs/evidence/viewport-2026-10-28/',import.meta.url);
const files=(await readdir(folder)).filter(f=>/^case-\d+-\d+\.json$/.test(f));
const records=(await Promise.all(files.map(async f=>JSON.parse(await readFile(new URL(f,folder),'utf8'))))).flat();
const failures=[];
const expected=[[390,844],[1024,768],[1280,720],[1440,900],[667,375],[390,600],[1169,674],[320,700]];
for(const [w,h] of expected)for(const route of ['model','satellite','plan','drill','research']){
 const r=records.filter(x=>x.width===w&&x.height===h&&x.route===route);
 if(r.length!==1)failures.push(`${route}/${w}x${h}: missing or duplicate capture`);
}
for(const r of records){
 const key=`${r.route}/${r.width}x${r.height}`;
 if(r.documentWidth!==r.width||r.documentHeight!==r.height||r.scrollY!==0)failures.push(`${key}: document scroll/overflow`);
 if(r.header.height>48)failures.push(`${key}: oversized header`);
 if(r.failures.length)failures.push(`${key}: region outside main`);
 if(r.toolbar.some(x=>!x.clear||!x.inside))failures.push(`${key}: camera controls obscured`);
 if(r.headerControls.some(x=>x.rect.x<0||x.rect.right>r.width+1))failures.push(`${key}: header control clipped`);
}
const before=JSON.parse(await readFile(new URL('before.json',folder),'utf8'));
const oldFails=before.document[1]>before.viewport[1];
if(!oldFails)failures.push('Original scroll failure was not reproduced.');
console.log(JSON.stringify({cases:records.length,oldDocumentHeight:before.document[1],oldViewportHeight:before.viewport[1],oldFails,status:failures.length?'FAIL':'BOUNDS_PASS',failures},null,2));
if(failures.length)process.exitCode=1;
