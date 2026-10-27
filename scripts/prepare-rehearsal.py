"""Build traceable exercise routes from a saved OSM API response. No safety inference.
Usage: python3 scripts/prepare-rehearsal.py /path/to/osm-map.json
Snapshot API: https://api.openstreetmap.org/api/0.6/map.json?bbox=98.235,8.655,98.285,8.68
"""
import json, math, heapq, sys, datetime
raw=json.load(open(sys.argv[1]));elements=raw['elements'];nodes={str(n['id']):(n['lon'],n['lat']) for n in elements if n['type']=='node'}
def dist(a,b):return math.hypot((a[0]-b[0])*109990,(a[1]-b[1])*111195)
graph={};allowed={'residential','service','unclassified','tertiary','secondary','primary','path','footway','pedestrian','living_street','track','steps'}
for w in elements:
 t=w.get('tags',{})
 if w['type']!='way' or t.get('highway') not in allowed or t.get('access') in {'private','no'} or t.get('foot') in {'no','private'}:continue
 for a,b in zip(w['nodes'],w['nodes'][1:]):
  a,b=str(a),str(b)
  if a not in nodes or b not in nodes:continue
  length=dist(nodes[a],nodes[b]);graph.setdefault(a,[]).append((b,length,str(w['id'])));graph.setdefault(b,[]).append((a,length,str(w['id'])))
# Largest connected public walking component only.
seen=set();components=[]
for start in graph:
 if start in seen:continue
 stack=[start];group=[];seen.add(start)
 while stack:
  a=stack.pop();group.append(a)
  for b,_,_ in graph[a]:
   if b not in seen:seen.add(b);stack.append(b)
 components.append(group)
component=max(components,key=len)
def nearest(p):return min(component,key=lambda n:dist(nodes[n],p))
end=nearest((98.282,8.671));cost={end:0};parent={};q=[(0,end)]
while q:
 d,a=heapq.heappop(q)
 if d!=cost[a]:continue
 for b,l,w in graph[a]:
  if d+l<cost.get(b,float('inf')):cost[b]=d+l;parent[b]=(a,w);heapq.heappush(q,(d+l,b))
routes=[]
for name,lat in [('North approach',8.675),('Central approach',8.669),('South approach',8.660)]:
 a=nearest((98.244,lat));ids=[a];ways=[]
 while a!=end:
  a,w=parent[a];ids.append(a);ways.append(w)
 routes.append(dict(name=name,nodeIds=ids,coordinates=[nodes[n] for n in ids],osmWays=ways))
 print(name,len(ids),'nodes',round(cost[ids[0]]),'metres')
output=dict(source='OpenStreetMap API 0.6 / ODbL; shortest paths on mapped walking-permitted ways; no access survey',accessed=datetime.date.today().isoformat(),apiTimestamp=raw.get('osm3s',{}).get('timestamp_osm_base'),destination=nodes[end],routes=routes)
json.dump(output,open('public/data/rehearsal-routes.json','w'),separators=(',',':'))
print('Endpoint',nodes[end],'; not an approved refuge')
