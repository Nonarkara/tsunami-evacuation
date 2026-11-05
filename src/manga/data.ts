/** Local bake coordinates are quarter-metre integers relative to bbox minimum. */
export function decodeManga(buffer:ArrayBuffer) {
  const view=new DataView(buffer);
  const length=view.getUint32(0,true);
  const header=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,4,length)));
  if(!Number.isFinite(header.q)||header.q<=0||!Array.isArray(header.bbox)||header.bbox.length!==4||!header.bbox.every(Number.isFinite)||!Array.isArray(header.origin)||header.origin.length!==2||!header.origin.every(Number.isFinite))throw Error('Invalid model coordinates');
  let offset=4+((length+3)&~3);
  function take<T extends Uint16ArrayConstructor|Uint8ArrayConstructor|Int16ArrayConstructor>(Type:T,count:number):InstanceType<T>{
    if(!Number.isSafeInteger(count)||count<0||count>1e7)throw Error('Invalid model count');
    const array=new Type(buffer,offset,count) as InstanceType<T>;offset=(offset+array.byteLength+3)&~3;return array;
  }
  const H=header;
  const bLen=take(Uint16Array,H.nB),bH=take(Uint16Array,H.nB),bK=take(Uint8Array,H.nB),bXY=take(Int16Array,2*H.nBV);
  const rC=take(Uint8Array,H.nR),rLen=take(Uint16Array,H.nR),rXY=take(Int16Array,2*H.nRV);
  const wLen=take(Uint16Array,H.nW),wXY=take(Int16Array,2*H.nWV),pLen=take(Uint16Array,H.nP),pXY=take(Int16Array,2*H.nPV);
  for(const [lengths,total,minimum] of [[bLen,H.nBV,3],[rLen,H.nRV,2],[wLen,H.nWV,3],[pLen,H.nPV,3]] as const){
    if(lengths.reduce((a,b)=>a+b,0)!==total||!lengths.every(n=>n>=minimum))throw Error('Invalid model geometry totals');
  }
  if(offset!==buffer.byteLength||bH.some((height,i)=>height>0&&bK[i]!==1)||rC.some(c=>c>6))throw Error('Invalid model data');
  return {H,bLen,bH,bK,bXY,rC,rLen,rXY,wLen,wXY,pLen,pXY};
}

export function modelPoint(x:number,z:number,q:number,bbox:number[]):[number,number]{return [bbox[0]+x*q,bbox[1]+z*q];}
export function mangaCoordinates(array:Int16Array,q:number,bbox:number[]){return Float64Array.from(array,(value,index)=>value*q+bbox[index%2]);}
