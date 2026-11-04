import source from './data/place-references.json';

/** These anchors are mapped street nodes, not beach centres, entrances or evacuation destinations. */
export function placeReference(region:string,index:number) {
  const reference=(source as Record<string,typeof source['khao-lak-0']>)[`${region}-${index}`];
  if(!reference||!/^node\/\d+$/.test(reference.node)||!/^way\/\d+$/.test(reference.way)||!reference.coord.every(Number.isFinite)||Math.abs(reference.coord[0])>180||Math.abs(reference.coord[1])>85)return undefined;
  return {...reference,coord:[reference.coord[0],reference.coord[1]] as [number,number]};
}
