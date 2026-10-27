"""Collect small, named-place OSM building snapshots (two requests at a time).
Raw responses remain in ignored .cache/. Public index records provenance and coverage.
"""
import concurrent.futures
import datetime
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import time

spec = importlib.util.spec_from_file_location('prepare_buildings', Path(__file__).with_name('prepare-buildings.py'))
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)
ROOT = Path(__file__).resolve().parents[1]


def collect(item):
    region, place = item
    area = f"{region['id']}-{place['i']}"
    bbox = [round(place['lng']-.012,6), round(place['lat']-.012,6), round(place['lng']+.012,6), round(place['lat']+.012,6)]
    if area == 'khao-lak-2':
        bbox = [98.24,8.658,98.29,8.684]
    url = 'https://api.openstreetmap.org/api/0.6/map.json?bbox=' + ','.join(str(v) for v in bbox)
    cache = ROOT / '.cache' / f'buildings-{area}.raw.json'
    receipt = cache.with_suffix('.receipt.json')
    if cache.exists() and receipt.exists():
        raw_bytes = cache.read_bytes()
        retrieval = json.loads(receipt.read_text())
        if retrieval['url'] != url or retrieval['sha256'] != hashlib.sha256(raw_bytes).hexdigest():
            raise ValueError('Cache checksum mismatch: ' + area)
    else:
        for attempt in range(3):
            try:
                raw_bytes = subprocess.check_output(['curl','--fail','--silent','--show-error','--max-time','45','--user-agent','Soonami-research/1.0 (https://tsunami.nonarkara.org)',url])
                json.loads(raw_bytes)
                break
            except (subprocess.CalledProcessError, json.JSONDecodeError):
                if attempt == 2:
                    raise
                time.sleep(2 ** (attempt+1))
        retrieval = {'url':url,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(raw_bytes).hexdigest()}
        cache.write_bytes(raw_bytes)
        receipt.write_text(json.dumps(retrieval,indent=2))
    snapshot = prepare.build_snapshot(json.loads(raw_bytes),raw_bytes,area,retrieval['retrievedAt'],camera_origin=(place['lng'],place['lat']))
    if snapshot['queryBounds'] != bbox:
        raise ValueError('Response bounds do not match requested source area: ' + area)
    snapshot['retrievalEvidence'] = 'Fetched from source URL; raw response SHA-256 and completion timestamp recorded during collection'
    output = ROOT / 'public' / 'data' / f'buildings-{area}.json'
    output.write_text(json.dumps(snapshot,ensure_ascii=False,separators=(',',':'))+'\n')
    print(area,snapshot['counts'],flush=True)
    return {'id':area,'region':region['id'],'placeIndex':place['i'],'name':place['name'],'url':f'/data/buildings-{area}.json','queryBounds':snapshot['queryBounds'],'geometryBounds':snapshot['geometryBounds'],'sourceUrl':url,'retrievedAt':retrieval['retrievedAt'],'rawSha256':snapshot['rawSha256'],'counts':snapshot['counts']}


def main():
    areas = json.loads((ROOT / 'public/data/building-areas.json').read_text())
    items = [(region,place) for region in areas for place in region['places']]
    (ROOT / '.cache').mkdir(exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        entries = list(pool.map(collect,items))
    result = {'schemaVersion':1,'coverage':'Small snapshots around named places, not full provincial coverage. OSM mapping and height data are incomplete.','entries':entries}
    (ROOT / 'public/data/buildings-index.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')


if __name__ == '__main__':
    main()
