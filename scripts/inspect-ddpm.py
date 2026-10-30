"""Inspect the complete DDPM CSV, preserving unknown meanings and reproducible source hashes.
Usage: python3 scripts/inspect-ddpm.py CSV METADATA OUTPUT
Downloads are explicit and separate; builds never fetch upstream data.
"""
import csv
import hashlib
import io
import json
import math
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

DATASET_URL = 'https://catalog.disaster.go.th/dataset/risk_tsunami'
CSV_URL = 'https://catalog.disaster.go.th/dataset/920e3932-203b-4568-9acb-ac7978a78b20/resource/033cdf9d-2357-4683-9ce6-ae3b378bc9f1/download/ddpm_risk_tsunami.csv'

def inspect(csv_bytes, metadata_bytes, retrieved_at):
    rows = list(csv.DictReader(io.StringIO(csv_bytes.decode('utf-8-sig'))))
    if not rows:
        raise ValueError('CSV has no records')
    required = {'pcode', 'pname', 'Height', 'Risk', 'Y_Lat', 'X_Long', 'People_All', 'House', 'mcode'}
    if not required.issubset(rows[0]):
        raise ValueError('Source schema changed')
    meta = json.loads(metadata_bytes)['result']
    resource = next(r for r in meta['resources'] if r['id'] == '033cdf9d-2357-4683-9ce6-ae3b378bc9f1')
    provinces = Counter((r['pcode'], r['pname']) for r in rows)
    coordinates = [(float(r['Y_Lat']), float(r['X_Long'])) for r in rows if r['Y_Lat'].strip() and r['X_Long'].strip()]
    valid = [(lat, lng) for lat, lng in coordinates if -90 <= lat <= 90 and -180 <= lng <= 180]
    heights = [float(r['Height']) for r in rows if r['Height'].strip()]
    if not heights or not all(math.isfinite(h) for h in heights):
        raise ValueError('Height values must be finite; interpretation remains unknown')
    return {
        'retrievedAt': retrieved_at,
        'datasetUrl': DATASET_URL, 'csvUrl': CSV_URL,
        'csvSha256': hashlib.sha256(csv_bytes).hexdigest(),
        'metadataSha256': hashlib.sha256(metadata_bytes).hexdigest(),
        'licenseLabel': meta.get('license_title'), 'licenseUrl': meta.get('license_url'),
        'statedDataUpdated': meta.get('last_updated_date'),
        'resourceModified': resource.get('last_modified'), 'catalogModified': meta.get('metadata_modified'),
        'rows': len(rows),
        'provinces': [{'pcode': int(code), 'nameTh': name, 'rows': n} for (code, name), n in sorted(provinces.items())],
        'riskCodes': dict(sorted(Counter(r['Risk'] for r in rows).items())),
        'heightRaw': {'min': min(heights), 'max': max(heights), 'unit': None, 'meaning': None},
        'coordinates': {'populated': len(coordinates), 'inRange': len(valid), 'uniquePairs': len(set(coordinates)), 'methodVerified': False},
        'missing': {key: sum(not r[key].strip() for r in rows) for key in rows[0]},
        'sideLabels': dict(Counter(r['side'] for r in rows)),
    }

if __name__ == '__main__':
    csv_path, metadata_path, output = map(Path, sys.argv[1:])
    result = inspect(csv_path.read_bytes(), metadata_path.read_bytes(), datetime.now(timezone.utc).isoformat())
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
