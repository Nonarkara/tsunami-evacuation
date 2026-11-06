#!/usr/bin/env python3
"""Record the roof shapes the published OpenStreetMap snapshot states outright.

The snapshot the building pack was collected from carries `roof:shape` on a
handful of ways. Those are explicit source readings, not interpretations of an
image, so they are recorded with their tag, their value and the snapshot's
receipt, and they are never mixed with the aerial-imagery classification, which
is a judgement about a dated picture.

The script merges into the existing roof pack: imagery readings are kept, an
OpenStreetMap reading replaces an imagery reading for the same building (a
stated source beats an interpreted one) and keeps the superseded reading in its
reason. It is idempotent - running it twice writes the same pack.

Usage:
    python3 scripts/harvest-osm-roofs.py --area khao-lak-2
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache'

PROVIDER = 'OpenStreetMap'
ATTRIBUTION = '© OpenStreetMap contributors'
LICENSE = 'Open Database License (ODbL) 1.0 — https://www.openstreetmap.org/copyright'

# The shape a roof reading means for the drawing. A gable has a ridge along the
# footprint's long axis; every other pitched roof has no single ridge line, so
# it is recorded but nothing is drawn on it.
FLAT = 'flat'
GABLE = 'gable'
PITCHED = 'pitched'

GABLE_SHAPES = {'gabled', 'gambrel', 'half-hipped', 'mansard', 'saltbox'}
PITCHED_SHAPES = {
    'hipped', 'pyramidal', 'cone', 'dome', 'onion', 'round', 'skillion',
    'tented', 'spherical', 'curved', 'sawtooth',
}


def shape_for(value: str) -> str | None:
    value = value.strip().lower()
    if value == 'flat':
        return FLAT
    if value in GABLE_SHAPES:
        return GABLE
    if value in PITCHED_SHAPES:
        return PITCHED
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--area', default='khao-lak-2')
    parser.add_argument('--pack-dir', default=str(ROOT / 'public' / 'data'))
    parser.add_argument('--cache-dir', default=str(CACHE))
    args = parser.parse_args()

    pack_dir = Path(args.pack_dir)
    cache = Path(args.cache_dir)
    raw_path = cache / f'buildings-{args.area}.raw.json'
    receipt_path = cache / f'buildings-{args.area}.raw.receipt.json'
    buildings_path = pack_dir / f'buildings-{args.area}.json'
    roofs_path = pack_dir / f'roofs-{args.area}.json'

    raw = json.loads(raw_path.read_text())
    receipt = json.loads(receipt_path.read_text())
    buildings = json.loads(buildings_path.read_text())
    by_osm = {f['properties']['osm']: f for f in buildings['features']}

    existing = {}
    if roofs_path.exists():
        for feature in json.loads(roofs_path.read_text())['features']:
            existing[feature['properties']['osm']] = feature

    harvested: dict[str, dict] = {}
    for element in raw.get('elements', []):
        if element.get('type') != 'way':
            continue
        tags = element.get('tags') or {}
        raw_shape = tags.get('roof:shape')
        if not raw_shape or not tags.get('building'):
            continue
        osm = f"way/{element['id']}"
        if osm not in by_osm:
            continue
        shape = shape_for(raw_shape)
        if shape is None:
            print(f'skip {osm}: unsupported roof:shape={raw_shape!r}')
            continue
        extra = {k: v for k, v in tags.items() if k.startswith('roof:') and k != 'roof:shape'}
        reason = f'OpenStreetMap roof:shape={raw_shape} on the published snapshot'
        if extra:
            reason += ' (' + ', '.join(f'{k}={v}' for k, v in sorted(extra.items())) + ')'
        harvested[osm] = {
            'type': 'Feature',
            'properties': {
                'osm': osm,
                'roofShape': shape,
                'roofSource': 'osm-tag',
                'roofMethod': 'osm-tag',
                'roofConfidence': 'high',
                'roofReason': reason,
                'roofOsm': {
                    'provider': PROVIDER,
                    'url': receipt['url'],
                    'sha256': receipt['sha256'],
                    'retrievedAt': receipt['retrievedAt'],
                    'attribution': ATTRIBUTION,
                    'license': LICENSE,
                    'tag': 'roof:shape',
                    'value': raw_shape,
                    'extraTags': extra,
                },
                'roofClassifiedBy': 'OpenStreetMap tag',
                'roofClassifiedAt': receipt['retrievedAt'],
            },
            'geometry': by_osm[osm]['geometry'],
        }

    # An OpenStreetMap reading replaces an imagery reading for the same building.
    superseded = 0
    for osm, feature in harvested.items():
        previous = existing.get(osm)
        if previous and previous['properties'].get('roofSource') == 'aerial-imagery-classification':
            feature['properties']['roofReason'] += (
                ' — replaces an earlier aerial-imagery reading of the same building'
            )
            superseded += 1
        existing[osm] = feature

    features = list(existing.values())
    counts: dict[str, int] = {}
    unknown = 0
    for feature in features:
        shape = feature['properties'].get('roofShape')
        if shape:
            counts[shape] = counts.get(shape, 0) + 1
        else:
            unknown += 1
    total = len(features)
    classified = total - unknown
    buildings_in_area = len(buildings['features'])

    output = {
        'schemaVersion': 1,
        'areaId': args.area,
        'type': 'FeatureCollection',
        'crsNote': 'EPSG:4326 longitude/latitude; no simplification or coordinate rounding',
        'sources': [
            {
                'kind': 'osm-tag',
                'provider': PROVIDER,
                'url': receipt['url'],
                'sha256': receipt['sha256'],
                'retrievedAt': receipt['retrievedAt'],
                'attribution': ATTRIBUTION,
                'license': LICENSE,
                'method': 'Roof shape stated by the source snapshot as roof:shape, with the tag and its value kept verbatim.',
            },
            {
                'kind': 'aerial-imagery',
                'provider': 'Esri World Imagery',
                'tileTemplate': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                'zoomUsed': 18,
                'groundResolutionMPerPx': 0.5903,
                'attribution': 'Imagery © Esri and contributors',
                'license': 'Esri World Imagery terms of use: https://www.esri.com/en-us/legal/terms/full-master-agreement',
                'method': 'Roof shape read from aerial imagery at zoom 18 and classified by mcode-tools:connector__matrix__describe_images. Geometry copied unchanged from buildings-' + args.area + '.json.',
            },
        ],
        'method': 'Two kinds of reading, kept apart: a shape the source states outright, and a shape read from a dated aerial image. The ridge line drawn for a gable is derived from the footprint\'s long axis - the source says the roof is pitched, it does not give the ridge direction.',
        'counts': dict(sorted(counts.items()), unknown=unknown, total=total),
        'coverage': round(classified / total, 4) if total else 0.0,
        'coverageDetail': {
            'classified': classified,
            'considered': total,
            'buildingsInArea': buildings_in_area,
            'consideredShareOfArea': round(total / buildings_in_area, 4) if buildings_in_area else 0.0,
            'notJudged': unknown,
            'bySource': {
                'osm-tag': sum(1 for f in features if f['properties'].get('roofSource') == 'osm-tag'),
                'aerial-imagery-classification': sum(1 for f in features if f['properties'].get('roofSource') == 'aerial-imagery-classification'),
            },
        },
        'features': features,
    }

    roofs_path.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(
        f'{args.area}: harvested {len(harvested)} sourced roof shapes '
        f'({superseded} replacing an imagery reading); pack now {total} records, '
        f'counts={output["counts"]}, coverage={output["coverage"]} '
        f'({classified} of {buildings_in_area} buildings in the area considered)'
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
