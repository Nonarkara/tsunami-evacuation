import assert from 'node:assert/strict';
function luminance(hex){const c=hex.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const [x,y]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(x+.05)/(y+.05);}
for(const [label,a,b] of [['body','#181c1c','#f3f3ee'],['secondary','#525853','#f3f3ee'],['masthead','#f3f3ee','#12354e'],['amber navigation','#f59e0b','#12354e'],['action text','#181c1c','#f59e0b'],['active row','#181c1c','#e4e7dc']]){const ratio=contrast(a,b);console.log(`${label}: ${ratio.toFixed(2)}:1`);assert.ok(ratio>=4.5,`${label} fails AA`);}
