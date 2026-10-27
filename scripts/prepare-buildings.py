"""Prepare source-faithful OSM building polygons. Based on MiniMax's handoff.

No class/default heights, invented nodes, DEM bases or refuge classifications.
Usage: python3 scripts/prepare-buildings.py RAW --retrieved-at ISO_DATE_OR_TIMESTAMP
The input must be an OSM API map JSON with its original bounds metadata.
"""
import argparse
import datetime
import hashlib
import json
import math
import re
from pathlib import Path

STOREY_M = 3.0


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def tagged_height(value):
    if value is None:
        return None
    text = str(value).strip().lower().replace('′', "'").replace('″', '"')
    feet_inches = re.fullmatch(r"(\d+(?:\.\d+)?)\s*'\s*(\d+(?:\.\d+)?)\s*\"", text)
    if feet_inches:
        feet, inches = map(float, feet_inches.groups())
        if inches >= 12:
            return None
        height = feet * .3048 + inches * .0254
    else:
        match = re.fullmatch(r"(\d+(?:\.\d+)?)\s*(m|metres?|meters?|ft|feet|'|in|inches|\")?", text)
        if not match:
            return None
        scale = .3048 if match[2] in ('ft', 'feet', "'") else .0254 if match[2] in ('in', 'inches', '"') else 1
        height = float(match[1]) * scale
    return round(height, 4) if math.isfinite(height) and .5 <= height <= 400 else None


def levels_value(value):
    if value is None or not re.fullmatch(r'\d+(?:\.\d+)?', str(value).strip()):
        return None
    levels = float(value)
    return levels if math.isfinite(levels) and 1 <= levels <= 120 else None


def cross(a, b, c):
    return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0])


def intersects(a, b, c, d):
    def on(p, q, r):
        return min(p[0], r[0]) <= q[0] <= max(p[0], r[0]) and min(p[1], r[1]) <= q[1] <= max(p[1], r[1])
    x, y, z, w = cross(a,b,c), cross(a,b,d), cross(c,d,a), cross(c,d,b)
    if x*y < 0 and z*w < 0:
        return True
    return (x == 0 and on(a,c,b)) or (y == 0 and on(a,d,b)) or (z == 0 and on(c,a,d)) or (w == 0 and on(c,b,d))


def valid_ring(refs, nodes):
    if not isinstance(refs, list) or len(refs) < 4 or refs[0] != refs[-1] or any(n not in nodes for n in refs):
        return None
    ring = [nodes[n] for n in refs]
    if len(set(ring[:-1])) != len(ring)-1 or len(ring) > 1001:
        return None
    # Translate before area arithmetic to avoid cancellation around lon=98,lat=8.
    origin = ring[0]
    points = [(x-origin[0], y-origin[1]) for x,y in ring]
    area = sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points,points[1:]))
    if abs(area) < 1e-14:
        return None
    for i in range(len(ring)-1):
        for j in range(i+1, len(ring)-1):
            if j == i+1 or i == 0 and j == len(ring)-2:
                continue
            if intersects(ring[i],ring[i+1],ring[j],ring[j+1]):
                return None
    # RFC7946 outer winding; closure and original coordinates are retained.
    return ring if area > 0 else list(reversed(ring))


def build_snapshot(raw, raw_bytes, area, retrieved_at, camera_origin=None):
    if not re.fullmatch(r'[a-z][a-z0-9-]{0,63}', area):
        raise ValueError('Invalid area ID')
    datetime.datetime.fromisoformat(retrieved_at.replace('Z','+00:00'))
    bounds = raw.get('bounds', {})
    keys = ['minlon','minlat','maxlon','maxlat']
    if not all(number(bounds.get(k)) for k in keys):
        raise ValueError('Original OSM query bounds are required')
    bbox = [bounds[k] for k in keys]
    if not (-180 <= bbox[0] < bbox[2] <= 180 and -85 <= bbox[1] < bbox[3] <= 85):
        raise ValueError('Invalid query bounds')
    elements = raw.get('elements')
    if not isinstance(elements, list):
        raise ValueError('OSM elements are required')
    nodes = {e['id']:(e['lon'],e['lat']) for e in elements if e.get('type') == 'node' and number(e.get('lon')) and number(e.get('lat')) and -180 <= e['lon'] <= 180 and -85 <= e['lat'] <= 85}
    building_relations = [e for e in elements if e.get('type') == 'relation' and e.get('tags',{}).get('building')]
    relation_members = {m.get('ref') for e in building_relations for m in e.get('members',[]) if m.get('type') == 'way'}
    counts = {'heightTag':0, 'levelsEstimate':0, 'unknown':0}
    skipped = {'invalidGeometry':0, 'excludedBuilding':0, 'relationMember':0, 'unsupportedBuildingRelations':len(building_relations)}
    features = []
    for way in elements:
        if way.get('type') != 'way' or 'building' not in way.get('tags',{}):
            continue
        tags = way['tags']
        if tags['building'] in ('no','false','0','construction','demolished','ruins'):
            skipped['excludedBuilding'] += 1
            continue
        if way['id'] in relation_members:
            skipped['relationMember'] += 1
            continue
        ring = valid_ring(way.get('nodes'), nodes)
        if ring is None:
            skipped['invalidGeometry'] += 1
            continue
        levels = levels_value(tags.get('building:levels'))
        height = tagged_height(tags.get('height'))
        source = 'heightTag' if height is not None else 'levelsEstimate' if levels is not None else 'unknown'
        if source == 'levelsEstimate':
            height = round(levels * STOREY_M, 4)
        counts[source] += 1
        features.append({'type':'Feature', 'properties':{
            'height':height, 'heightSource':source, 'levels':levels,
            'heightTag':str(tags['height'])[:80] if 'height' in tags else None,
            'levelsTag':str(tags['building:levels'])[:80] if 'building:levels' in tags else None,
            'building':str(tags['building'])[:80], 'osm':f"way/{way['id']}",
        }, 'geometry':{'type':'Polygon','coordinates':[[list(p) for p in ring]]}})
    features.sort(key=lambda f:int(f['properties']['osm'].split('/')[1]))
    coordinates = [p for f in features for p in f['geometry']['coordinates'][0]]
    geometry_bounds = [min(p[0] for p in coordinates),min(p[1] for p in coordinates),max(p[0] for p in coordinates),max(p[1] for p in coordinates)] if coordinates else None
    walk_start = None
    if camera_origin:
        candidates = []
        permitted = {'footway','pedestrian','path','living_street','residential','service','unclassified','tertiary'}
        for way in elements:
            tags = way.get('tags', {})
            if way.get('type') != 'way' or tags.get('highway') not in permitted or tags.get('access') in ('private','no') or tags.get('foot') == 'no':
                continue
            refs = way.get('nodes', [])
            for i, ref in enumerate(refs):
                if ref not in nodes:
                    continue
                other = refs[i+1] if i+1 < len(refs) else refs[i-1] if i else None
                if other not in nodes or nodes[other] == nodes[ref]:
                    continue
                coord = nodes[ref]
                score = ((coord[0]-camera_origin[0])*math.cos(math.radians(coord[1])))**2 + (coord[1]-camera_origin[1])**2
                candidates.append((score,way['id'],ref,other))
        for score, way_id, ref, other in sorted(candidates):
            if score > (.015)**2:
                break
            coord = nodes[ref]
            inside = False
            for f in features:
                ring = f['geometry']['coordinates'][0]
                if not (min(p[0] for p in ring) <= coord[0] <= max(p[0] for p in ring) and min(p[1] for p in ring) <= coord[1] <= max(p[1] for p in ring)):
                    continue
                hit = False
                for a,b in zip(ring,ring[1:]):
                    if (a[1] > coord[1]) != (b[1] > coord[1]) and coord[0] < (b[0]-a[0])*(coord[1]-a[1])/(b[1]-a[1])+a[0]:
                        hit = not hit
                if hit:
                    inside = True
                    break
            if not inside:
                target = nodes[other]
                heading = math.degrees(math.atan2((target[0]-coord[0])*math.cos(math.radians(coord[1])),target[1]-coord[1])) % 360
                walk_start = {'coord':list(coord),'bearing':heading,'node':f'node/{ref}','way':f'way/{way_id}','note':'Mapped street/path camera reference; access and evacuation suitability unverified'}
                break
    query = 'https://api.openstreetmap.org/api/0.6/map.json?bbox=' + ','.join(str(v) for v in bbox)
    return {'type':'FeatureCollection', 'schemaVersion':1, 'area':area, 'crsNote':'EPSG:4326 longitude/latitude; no simplification or coordinate rounding',
            'source':'OpenStreetMap API 0.6', 'sourceUrl':query, 'retrievedAt':retrieved_at,
            'retrievalEvidence':'Timestamp supplied by operator; see handover manifest for local-cache evidence',
            'rawSha256':hashlib.sha256(raw_bytes).hexdigest(), 'queryBounds':bbox, 'geometryBounds':geometry_bounds,
            'license':'ODbL 1.0', 'licenseUrl':'https://opendatacommons.org/licenses/odbl/1-0/',
            'attribution':'© OpenStreetMap contributors', 'attributionUrl':'https://www.openstreetmap.org/copyright',
            'heightPolicy':{'heightTag':'OSM height tag, unit-normalized; not independently surveyed', 'levelsEstimate':'building:levels × 3.0m assumed storey; not measured height', 'unknown':'Source height is null. Renderer may use explicitly labelled 3m contextual massing, never a measured height', 'storeyM':STOREY_M, 'base':'0m relative to native MapLibre terrain, not an absolute DEM elevation', 'safety':'No route, refuge, structural suitability or safety classification'},
            'walkStart':walk_start, 'counts':dict(counts,total=len(features)), 'skipped':skipped, 'features':features}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('raw', type=Path)
    parser.add_argument('--area', default='khao-lak')
    parser.add_argument('--retrieved-at', required=True)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    raw_bytes = args.raw.read_bytes()
    result = build_snapshot(json.loads(raw_bytes),raw_bytes,args.area,args.retrieved_at)
    output = args.output or Path('public/data') / f'buildings-{args.area}.json'
    output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
    print(output, result['counts'], result['skipped'])


if __name__ == '__main__':
    main()
