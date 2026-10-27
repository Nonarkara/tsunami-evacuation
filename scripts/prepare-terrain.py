"""Sample a reproducible coarse terrain-screening grid; not tsunami inundation.
Requires Pillow. Run from the repository root. Credits: AWS Mapzen Terrain Tiles.
"""
import math,urllib.request,io,json,concurrent.futures,datetime
from PIL import Image
z=12
west,east,south,north=98.22,98.31,8.62,8.80
N=2**z
def pixel(lon,lat):return ((lon+180)/360*N*256,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*N*256)
a,b=pixel(west,north);c,d=pixel(east,south)
keys=[(x,y) for x in range(int(a)//256,int(c)//256+1) for y in range(int(b)//256,int(d)//256+1)]
def get(k):
 x,y=k;url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
 im=Image.open(io.BytesIO(urllib.request.urlopen(url,timeout=30).read())).convert('RGB');return k,im
images=dict(concurrent.futures.ThreadPoolExecutor(8).map(get,keys))
w,h=101,201
heights=[]
for row in range(h):
 lat=north-(north-south)*row/(h-1)
 for col in range(w):
  lon=west+(east-west)*col/(w-1);x,y=pixel(lon,lat);r,g,b=images[(int(x)//256,int(y)//256)].getpixel((int(x)%256,int(y)%256));heights.append(round(r*256+g+b/256-32768,1))
json.dump(dict(w=w,h=h,west=west,east=east,south=south,north=north,heights=heights,source='Mapzen Terrain Tiles / AWS, Terrarium z12',accessed=datetime.date.today().isoformat()),open('public/data/terrain.json','w'),separators=(',',':'))
print('DEM',len(keys),'tiles',w*h,'samples',min(heights),max(heights))
