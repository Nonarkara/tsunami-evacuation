#!/usr/bin/env python3
"""Classify roof shape (flat vs gable) from aerial imagery for OSM building footprints.

Reads a buildings pack from public/data, crops Esri World Imagery over each footprint at
zoom 19, asks a vision model (mcode-tools / connector__matrix__describe_images) for a
binary roof label, and writes a provenance-carrying pack to public/data/roofs-<area>.json.

A roof shape is only ever written when it was read from the imagery. Every other building
is left null, with the reason recorded. No roof shape is inferred from height, area,
building type, location or any other non-imagery signal.

Usage:
  python3 scripts/classify-roofs.py --area khao-lak-2
  python3 scripts/classify-roofs.py --area khao-lak-0 --no-vision   # crops only
  python3 scripts/classify-roofs.py --area khao-lak-2 --reassemble  # rebuild pack from cache

Requires: Pillow, requests, the mcode-tools CLI on PATH.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import math
import re
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover - environment guard
    sys.exit('Pillow is required: python3 -m pip install Pillow')

try:
    import requests
except ImportError:  # pragma: no cover - environment guard
    sys.exit('requests is required: python3 -m pip install requests')

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / 'public' / 'data'
EVIDENCE_DIR = ROOT / 'docs' / 'evidence' / 'roofshapes-2026-10-30'
REPORT_PATH = ROOT / 'docs' / 'ROOF-SHAPES.md'

TILE = 256
TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
PROVIDER = 'Esri World Imagery'
ATTRIBUTION = 'Imagery © Esri and contributors'
USER_AGENT = 'tsunami-evacuation-roofshape/1.0 (OSM roof classification pipeline; research use)'
CLASSIFIER_ID = 'mcode-tools:connector__matrix__describe_images'

MARGIN_PX = 6          # native z19 pixels of context around the footprint
MIN_SPAN_PX = 12.0     # a footprint narrower than this cannot support a roof reading
CELL = 256             # rendered crop cell size in pixels
LABEL_H = 24           # label bar height in a montage sheet
SHEET_COLS = 5
SHEET_ROWS = 5

SHEET_PROMPT = """You are reading overhead aerial/satellite imagery of individual buildings.

This image is a montage of {count} cells in a {cols} by {rows} grid, read left to right, top to bottom.
Every cell has a dark bar across its top carrying a building index number, and below that bar an
overhead crop of exactly one building. The building footprint is outlined in magenta on the crop.
The bar number is the ONLY identifier; do not rely on position.

Judge only what is actually visible in each crop. These are low-resolution aerial photographs and
many crops are blurry.

- "gable" ONLY if you can clearly see a ridge: a straight linear edge along the roof where the
  surface brightness changes abruptly, with one side of that line noticeably brighter than the
  other. Two roof slopes meeting along that line.
- "flat" ONLY if you can clearly see one continuous flat roof surface of even brightness, with
  straight edges, and no ridge line anywhere on it. A flat roof may still show panel seams,
  parapet walls, stains or a round tank - those are not ridges and the roof is still flat.
- "unknown" in EVERY other case: the crop is too blurry, you cannot make out the roof surface,
  the brightness varies without a clear straight ridge, or you are simply unsure.

Answer with exactly one line per index, in ascending index order, and nothing else. Use this
exact format for every line:
<index>: <flat|gable|unknown> <high|medium|low> <short phrase of at most 12 words saying what you saw>

Use "high" confidence only when the shape is unmistakable, "medium" when it is clear but not
sharp, and "low" when you are choosing between flat and gable - in that case answer "unknown"
instead. Do not add commentary, markdown or blank lines."""

SINGLE_PROMPT = """You are reading overhead aerial/satellite imagery of a single building.

This crop shows exactly one building. The building footprint is outlined in magenta.

Judge only what is actually visible. This is a low-resolution aerial photograph and many crops are
blurry.

- "gable" ONLY if you can clearly see a ridge: a straight linear edge along the roof where the
  surface brightness changes abruptly, with one side of that line noticeably brighter than the
  other. Two roof slopes meeting along that line.
- "flat" ONLY if you can clearly see one continuous flat roof surface of even brightness, with
  straight edges, and no ridge line anywhere on it. A flat roof may still show panel seams,
  parapet walls, stains or a round tank - those are not ridges and the roof is still flat.
- "unknown" in EVERY other case: the crop is too blurry, you cannot make out the roof surface,
  the brightness varies without a clear straight ridge, or you are simply unsure.

Answer with exactly one line, and nothing else, in this format:
<flat|gable|unknown> <high|medium|low> <short phrase of at most 12 words saying what you saw>

Use "high" confidence only when the shape is unmistakable, "medium" when it is clear but not
sharp, and "low" when you are choosing between flat and gable - in that case answer "unknown"
instead."""


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')


def load_font(size: int):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # pragma: no cover - older Pillow
        return ImageFont.load_default()


# --------------------------------------------------------------------------------------
# Web Mercator / tile geometry
# --------------------------------------------------------------------------------------

def lonlat_to_px(lon: float, lat: float, zoom: int):
    """EPSG:4326 -> Web Mercator pixel coordinates at `zoom` (256 px tiles)."""
    world = TILE * (2 ** zoom)
    x = (lon + 180.0) / 360.0 * world
    lat = max(-85.05112878, min(85.05112878, lat))
    s = math.sin(math.radians(lat))
    y = (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)) * world
    return x, y


def tile_range(x0: float, y0: float, x1: float, y1: float):
    tx0 = math.floor(x0 / TILE)
    tx1 = math.floor((x1 - 1e-9) / TILE)
    ty0 = math.floor(y0 / TILE)
    ty1 = math.floor((y1 - 1e-9) / TILE)
    return tx0, ty0, tx1, ty1


# --------------------------------------------------------------------------------------
# Tile cache
# --------------------------------------------------------------------------------------

def is_placeholder(path: Path) -> bool:
    """True when Esri answered with its 'Map data not yet available' tile rather than imagery."""
    try:
        with Image.open(path) as image:
            image = image.convert('RGB')
            width, height = image.size
            pixels = image.load()
            counts = {}
            for y in range(0, height, 2):
                for x in range(0, width, 2):
                    colour = pixels[x, y]
                    counts[colour] = counts.get(colour, 0) + 1
            total = sum(counts.values())
            modal, share = max(counts.items(), key=lambda item: item[1])
            red, green, blue = modal
            if not (abs(red - green) <= 4 and abs(green - blue) <= 4):
                return False
            if not (185 <= red <= 225):
                return False
            if share / total < 0.30:
                return False
            near = sum(count for colour, count in counts.items()
                       if all(abs(colour[i] - red) <= 8 for i in range(3)))
            return near / total >= 0.85
    except OSError:
        return False


class TileCache:
    """Disk-cached Esri World Imagery tiles with per-tile retrieval receipts."""

    def __init__(self, root: Path, zoom: int, workers: int = 5):
        self.root = Path(root) / f'z{zoom}'
        self.zoom = zoom
        self.workers = workers
        self.notes: dict = {}
        self.placeholder: set = set()
        self._local = threading.local()

    @property
    def session(self):
        session = getattr(self._local, 'session', None)
        if session is None:
            session = requests.Session()
            session.headers.update({'User-Agent': USER_AGENT})
            self._local.session = session
        return session

    def _paths(self, tx: int, ty: int):
        return self.root / str(tx) / f'{ty}.jpg', self.root / str(tx) / f'{ty}.json'

    def meta(self, tx: int, ty: int):
        _, meta_path = self._paths(tx, ty)
        if not meta_path.exists():
            return None
        try:
            return json.loads(meta_path.read_text())
        except (OSError, ValueError):
            return None

    def fetch(self, tx: int, ty: int):
        path, meta_path = self._paths(tx, ty)
        if path.exists():
            meta = self.meta(tx, ty)
            if meta:
                if meta.get('placeholder'):
                    self.placeholder.add((tx, ty))
                return path
        url = TILE_URL.format(z=self.zoom, y=ty, x=tx)
        for attempt in range(4):
            try:
                response = self.session.get(url, timeout=45)
            except requests.RequestException:
                time.sleep(1.5 * (attempt + 1))
                continue
            if response.status_code == 200 and response.content:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(response.content)
                placeholder = is_placeholder(path)
                if placeholder:
                    self.placeholder.add((tx, ty))
                meta_path.write_text(json.dumps({
                    'url': url, 'fetchedAt': now_iso(),
                    'sha256': hashlib.sha256(response.content).hexdigest(),
                    'bytes': len(response.content),
                    'placeholder': placeholder,
                }, ensure_ascii=False, separators=(',', ':')))
                return path
            if response.status_code in (404, 400):
                self.notes[(tx, ty)] = f'HTTP {response.status_code}'
                return None
            time.sleep(1.5 * (attempt + 1))
        self.notes[(tx, ty)] = 'fetch failed'
        return None

    def prefetch(self, tiles):
        todo = [t for t in tiles if not self._paths(t[0], t[1])[0].exists()]
        if not todo:
            for tx, ty in tiles:
                meta = self.meta(tx, ty)
                if meta and meta.get('placeholder'):
                    self.placeholder.add((tx, ty))
            return
        with ThreadPoolExecutor(max_workers=self.workers) as pool:
            list(pool.map(lambda t: self.fetch(t[0], t[1]), todo))


def probe_zoom(tiles, zoom: int, cache_root: Path, sample: int = 10):
    """Return (usable, detail) for `zoom`. Esri answers 'Map data not yet available' where
    the service has no imagery at that zoom level."""
    picks = list(tiles)
    if len(picks) > sample:
        step = len(picks) / sample
        picks = [picks[int(i * step)] for i in range(sample)]
    probe_cache = TileCache(cache_root, zoom)
    probe_cache.prefetch(picks)
    placeholders = [t for t in picks if t in probe_cache.placeholder]
    usable = len(placeholders) < max(1, len(picks) // 2)
    detail = {'zoom': zoom, 'sampledTiles': len(picks), 'placeholderTiles': len(placeholders),
              'usable': usable}
    return usable, detail


# --------------------------------------------------------------------------------------
# Cropping
# --------------------------------------------------------------------------------------

def footprint_pixels(feature, zoom: int):
    ring = feature['geometry']['coordinates'][0]
    return [lonlat_to_px(lon, lat, zoom) for lon, lat in ring]


def footprint_span(points):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    width = max(xs) - min(xs)
    height = max(ys) - min(ys)
    return width, height


def build_crop(feature, cache: TileCache, zoom: int):
    """Return (cell image, metadata) for one footprint, or (None, reason) when unjudgeable."""
    points = footprint_pixels(feature, zoom)
    width, height = footprint_span(points)
    span = min(width, height)
    if span < MIN_SPAN_PX:
        return None, {
            'reason': 'tooSmall',
            'detail': f'footprint spans {span:.1f}px at z{zoom} (minimum {MIN_SPAN_PX:.0f}px)',
            'spanPx': round(span, 2), 'spanMaxPx': round(max(width, height), 2),
        }

    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    win_x0, win_y0 = min(xs) - MARGIN_PX, min(ys) - MARGIN_PX
    win_x1, win_y1 = max(xs) + MARGIN_PX, max(ys) + MARGIN_PX
    tx0, ty0, tx1, ty1 = tile_range(win_x0, win_y0, win_x1, win_y1)

    mosaic = Image.new('RGB', ((tx1 - tx0 + 1) * TILE, (ty1 - ty0 + 1) * TILE), (28, 28, 28))
    missing = []
    blank = []
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            path = cache.fetch(tx, ty)
            if path is None:
                missing.append(f'{tx}/{ty}')
                continue
            if (tx, ty) in cache.placeholder:
                blank.append(f'{tx}/{ty}')
                continue
            with Image.open(path) as tile:
                mosaic.paste(tile.convert('RGB'), ((tx - tx0) * TILE, (ty - ty0) * TILE))
    if missing:
        return None, {
            'reason': 'noImagery',
            'detail': 'no imagery tile for ' + ','.join(missing[:4]),
            'spanPx': round(span, 2), 'spanMaxPx': round(max(width, height), 2),
        }
    if blank:
        return None, {
            'reason': 'noImagery',
            'detail': f'Esri returned "Map data not yet available" for tile {blank[0]} at z{zoom}',
            'spanPx': round(span, 2), 'spanMaxPx': round(max(width, height), 2),
        }

    origin_x, origin_y = tx0 * TILE, ty0 * TILE
    crop_left = int(math.floor(win_x0 - origin_x))
    crop_top = int(math.floor(win_y0 - origin_y))
    crop_right = int(math.ceil(win_x1 - origin_x))
    crop_bottom = int(math.ceil(win_y1 - origin_y))
    crop = mosaic.crop((crop_left, crop_top, crop_right, crop_bottom))
    native_w, native_h = crop.size
    scale = min(CELL / native_w, CELL / native_h)
    new_w, new_h = max(1, round(native_w * scale)), max(1, round(native_h * scale))
    crop = crop.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new('RGB', (CELL, CELL), (32, 32, 32))
    pad_x, pad_y = (CELL - new_w) // 2, (CELL - new_h) // 2
    canvas.paste(crop, (pad_x, pad_y))

    # Footprint outline, in crop-window pixel space (not mosaic space).
    window_x0 = origin_x + crop_left
    window_y0 = origin_y + crop_top
    draw = ImageDraw.Draw(canvas)
    poly = [((x - window_x0) * scale + pad_x, (y - window_y0) * scale + pad_y) for x, y in points]
    draw.line(poly + [poly[0]], fill=(0, 0, 0), width=5, joint='curve')
    draw.line(poly + [poly[0]], fill=(255, 0, 255), width=2, joint='curve')

    return canvas, {
        'reason': None,
        'spanPx': round(span, 2), 'spanMaxPx': round(max(width, height), 2),
        'nativePx': [native_w, native_h], 'tiles': [f'{tx0}/{ty0}/{tx1}/{ty1}'],
    }


def build_sheet(items):
    """items: list of (index, cell image). Returns a montage PNG image."""
    rows = math.ceil(len(items) / SHEET_COLS)
    width = SHEET_COLS * CELL
    height = rows * (CELL + LABEL_H)
    sheet = Image.new('RGB', (width, height), (18, 18, 18))
    draw = ImageDraw.Draw(sheet)
    font = load_font(17)
    for position, (index, image) in enumerate(items):
        row, col = divmod(position, SHEET_COLS)
        x0 = col * CELL
        y0 = row * (CELL + LABEL_H)
        draw.rectangle([x0, y0, x0 + CELL - 1, y0 + LABEL_H - 1], fill=(8, 8, 8))
        draw.text((x0 + 7, y0 + 4), f'#{index}', fill=(255, 235, 0), font=font)
        sheet.paste(image, (x0, y0 + LABEL_H))
        draw.rectangle([x0, y0, x0 + CELL - 1, y0 + LABEL_H + CELL - 1], outline=(90, 90, 90), width=1)
    return sheet


# --------------------------------------------------------------------------------------
# Vision
# --------------------------------------------------------------------------------------

LABEL_RE = re.compile(r'^\s*#?\s*(\d+)\s*[:.)\-]\s*(flat|gable|unknown)\b\s*(high|medium|low)?\s*(.*)$', re.I)


def run_cli(command, timeout=600):
    result = subprocess.run(command, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        raise RuntimeError(f'{command[1:3]} failed ({result.returncode}): {result.stderr.strip()[:300]}')
    return result.stdout


def upload_image(path: Path) -> str:
    payload = json.loads(run_cli(['mcode-tools', 'upload_temp_url', str(path), '--mime-type', 'image/png']))
    url = payload.get('temp_url') or payload.get('url') or payload.get('download_url')
    if not url:
        raise RuntimeError(f'upload_temp_url returned no url for {path}')
    return url


def upload_images(paths, workers: int = 6):
    """Upload several crops concurrently. Each returns a short-lived https url."""
    paths = [Path(p) for p in paths]
    with ThreadPoolExecutor(max_workers=workers) as pool:
        return list(pool.map(upload_image, paths))


def describe_many(items):
    """items: list of (url, prompt). Returns one description string per item, in order."""
    args_file = Path('/tmp/roof-describe-args.json')
    args_file.write_text(json.dumps({
        'image_info': [{'url': url, 'prompt': prompt} for url, prompt in items]
    }))
    payload = json.loads(run_cli(['mcode-tools', 'connector', 'call',
                                  'connector__matrix__describe_images', '--args-file', str(args_file)]))
    results = payload.get('results') or []
    if len(results) != len(items):
        raise RuntimeError(f'describe_images returned {len(results)} results for {len(items)} images')
    out = []
    for item, result in zip(items, results):
        if not result.get('success'):
            out.append('')
            continue
        out.append(result.get('description', ''))
    return out


def describe(url: str, prompt: str):
    return describe_many([(url, prompt)])[0]


LOOSE_LABEL_RE = re.compile(r'\b(flat|gable|unknown)\b\s*(high|medium|low)?\b', re.I)


def parse_one(text: str):
    """Parse a single-image answer. The model numbers the answer itself, so the leading
    number is ignored; only the label, confidence and reason are taken."""
    if not text:
        return None
    text = re.sub(r'```[a-z]*', '', text)
    first = text.strip().splitlines()[0] if text.strip() else ''
    match = LABEL_RE.match(first) or LABEL_RE.match(text.strip())
    if match:
        label, confidence, reason = match.group(2), match.group(3), match.group(4)
    else:
        loose = LOOSE_LABEL_RE.search(first)
        if not loose:
            return None
        label, confidence = loose.group(1), loose.group(2)
        reason = re.sub(r'^[^a-zA-Z]*', '', first)
    reason = re.sub(r'\s+', ' ', reason).strip().strip('`').strip()
    return {
        'roofShape': label.lower(),
        'roofConfidence': (confidence or '').lower() or None,
        'roofReason': reason[:140],
    }


def parse_labels(text: str):
    """Parse '<index>: <label> <confidence> <reason>' lines. Returns {int: dict}."""
    text = re.sub(r'```[a-z]*', '', text)
    found = {}
    for line in text.splitlines():
        match = LABEL_RE.match(line)
        if not match:
            continue
        index, label, confidence, reason = match.groups()
        reason = re.sub(r'\s+', ' ', reason).strip().strip('`').strip()
        found[int(index)] = {
            'roofShape': label.lower(),
            'roofConfidence': (confidence or '').lower() or None,
            'roofReason': reason[:140],
        }
    return found


def classify_sheet(sheet_path: Path, indices, log):
    url = upload_image(sheet_path)
    prompt = SHEET_PROMPT.format(count=len(indices), cols=SHEET_COLS, rows=SHEET_ROWS)
    text = describe(url, prompt)
    labels = parse_labels(text)
    log(f'    sheet {sheet_path.name}: {len(labels)}/{len(indices)} parsed')
    return labels, text


def classify_singles(crops, indices, log):
    """Read each crop on its own (one image, one focused prompt per image).

    Returns {index: parsed} for the crops the model actually answered.
    """
    if not crops:
        return {}
    urls = upload_images(crops)
    items = [(url, SINGLE_PROMPT) for url in urls]
    descriptions = describe_many(items)
    out = {}
    for index, text in zip(indices, descriptions):
        parsed = parse_one(text)
        if parsed:
            out[index] = parsed
    log(f'    singles {indices[0]}-{indices[-1]}: {len(out)}/{len(indices)} parsed')
    return out


def decide(sheet_label, single_label):
    """Combine the two independent reads of one building.

    A roof shape is recorded only when the two reads do not contradict each other.
      - both reads agree on a shape      -> that shape
      - sheet unknown, single decisive   -> the single read breaks the tie
      - anything else (a real conflict)   -> no shape, the disagreement is recorded
    """
    sheet_shape = (sheet_label or {}).get('roofShape')
    single_shape = (single_label or {}).get('roofShape')
    if sheet_shape in ('flat', 'gable') and single_shape == sheet_shape:
        reason = (sheet_label or {}).get('roofReason') or (single_label or {}).get('roofReason') or ''
        confidences = [(sheet_label or {}).get('roofConfidence'), (single_label or {}).get('roofConfidence')]
        if 'low' in confidences:
            confidence = 'low'
        elif 'medium' in confidences:
            confidence = 'medium'
        else:
            confidence = 'high'
        return {'roofShape': sheet_shape, 'roofConfidence': confidence,
                'roofMethod': 'sheet', 'roofReason': reason, 'status': 'agreed'}
    if sheet_shape == 'unknown' and single_shape in ('flat', 'gable'):
        return {'roofShape': single_shape,
                'roofConfidence': (single_label or {}).get('roofConfidence') or 'medium',
                'roofMethod': 'single',
                'roofReason': (single_label or {}).get('roofReason') or '',
                'status': 'singleResolved'}
    if sheet_shape in ('flat', 'gable') and single_shape == 'unknown':
        return {'roofShape': None, 'roofConfidence': None, 'roofMethod': None,
                'roofReason': f"Not judged: the montage read saw a {sheet_shape} roof but the "
                              f"single-crop read could not identify the roof shape.",
                'status': 'readDisagreement'}
    if sheet_shape in ('flat', 'gable') and single_shape in ('flat', 'gable'):
        return {'roofShape': None, 'roofConfidence': None, 'roofMethod': None,
                'roofReason': f"Not judged: the two independent reads disagreed "
                              f"(montage: {sheet_shape}, single crop: {single_shape}).",
                'status': 'readDisagreement'}
    if sheet_shape is None and single_shape in ('flat', 'gable'):
        return {'roofShape': single_shape,
                'roofConfidence': (single_label or {}).get('roofConfidence') or 'medium',
                'roofMethod': 'single',
                'roofReason': (single_label or {}).get('roofReason') or '',
                'status': 'singleResolved'}
    return {'roofShape': None, 'roofConfidence': None, 'roofMethod': None,
            'roofReason': 'Not judged: the roof shape could not be identified in the aerial crop.',
            'status': 'unknown'}


# --------------------------------------------------------------------------------------
# Pipeline
# --------------------------------------------------------------------------------------

def feature_centre(features):
    """Representative latitude of an area, used only to report ground resolution."""
    lats = []
    for feature in features[:200]:
        ring = feature['geometry']['coordinates'][0]
        lats.append(sum(p[1] for p in ring[:-1]) / max(1, len(ring) - 1))
    return lats or [0.0]


def area_tiles(features, zoom: int):
    """All Esri tiles needed to cover every footprint in the area at `zoom`."""
    tiles = set()
    for feature in features:
        points = footprint_pixels(feature, zoom)
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        tx0, ty0, tx1, ty1 = tile_range(min(xs) - MARGIN_PX, min(ys) - MARGIN_PX,
                                         max(xs) + MARGIN_PX, max(ys) + MARGIN_PX)
        for tx in range(tx0, tx1 + 1):
            for ty in range(ty0, ty1 + 1):
                tiles.add((tx, ty))
    return tiles


def load_pack(area: str):
    path = DATA_DIR / f'buildings-{area}.json'
    if not path.exists():
        sys.exit(f'no buildings pack for area {area}: {path}')
    return path, json.loads(path.read_text())


def area_geometry_hash(feature) -> str:
    blob = json.dumps(feature['geometry'], ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(blob.encode('utf-8')).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--area', action='append', default=[], help='area id, repeatable (e.g. khao-lak-2)')
    parser.add_argument('--zoom', default='auto', help="'auto' picks the deepest zoom Esri has imagery for")
    parser.add_argument('--no-vision', action='store_true', help='build crops and sheets only')
    parser.add_argument('--reassemble', action='store_true', help='rebuild packs from cached labels only')
    parser.add_argument('--limit', type=int, default=0, help='cap buildings per area (debug)')
    parser.add_argument('--work-dir', type=Path, default=Path('/tmp/tsunami-roof-work'))
    parser.add_argument('--tile-cache', type=Path, default=Path('/tmp/tsunami-roof-tiles'))
    parser.add_argument('--sleep', type=float, default=1.0, help='seconds between vision calls')
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    areas = args.area
    if not areas:
        areas = ['khao-lak-2']
    if not args.quiet:
        print(f'areas: {", ".join(areas)}  zoom={args.zoom}', flush=True)

    summary = {}
    for area in areas:
        summary[area] = run_area(area, args)

    if not args.quiet:
        print('\n== summary ==')
        for area, info in summary.items():
            print(f'{area}: {info["counts"]}  coverage={info["coverage"]:.3f}')
    return 0


def run_area(area: str, args):
    def log(message):
        if not args.quiet:
            print(message, flush=True)

    pack_path, pack = load_pack(area)
    features = pack['features']
    if args.limit:
        features = features[:args.limit]

    work = Path(args.work_dir) / area
    crops_dir = work / 'crops'
    sheets_dir = work / 'sheets'
    crops_dir.mkdir(parents=True, exist_ok=True)
    sheets_dir.mkdir(parents=True, exist_ok=True)

    # ---- phase 0: pick the deepest zoom Esri actually has imagery for ----------------
    # Esri answers "Map data not yet available" above the source imagery's zoom, so the
    # deepest usable zoom is probed per area and recorded as a receipt.
    candidates = ([19, 18, 17] if str(args.zoom) == 'auto' else [int(args.zoom)])
    zoom_probes = []
    zoom = candidates[-1]
    for candidate in candidates:
        tiles = area_tiles(features, candidate)
        usable, detail = probe_zoom(tiles, candidate, args.tile_cache)
        detail['tilesCoveringBuildings'] = len(tiles)
        zoom_probes.append(detail)
        if usable:
            zoom = candidate
            break
    log(f'[{area}] zoom probes: {json.dumps(zoom_probes)}')
    log(f'[{area}] using zoom {zoom}')

    cache = TileCache(args.tile_cache, zoom)

    # ---- phase 1: crops -------------------------------------------------------------
    entries = []   # per building record
    needed_tiles = set()
    for position, feature in enumerate(features):
        index = position + 1
        points = footprint_pixels(feature, zoom)
        width, height = footprint_span(points)
        span = min(width, height)
        crop_path = crops_dir / f'{index:05d}.png'
        record = {
            'index': index,
            'osm': feature['properties']['osm'],
            'spanPx': round(span, 2),
            'spanMaxPx': round(max(width, height), 2),
            'geometryHash': area_geometry_hash(feature),
            'crop': str(crop_path),
        }
        if span < MIN_SPAN_PX:
            record.update({'roofShape': None, 'roofMethod': None, 'roofConfidence': None,
                           'roofReason': f'Not judged: footprint spans only {span:.1f}px at z{zoom}; '
                                         'too small to read a roof from imagery.',
                           'status': 'tooSmall'})
            entries.append(record)
            continue
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        tx0, ty0, tx1, ty1 = tile_range(min(xs) - MARGIN_PX, min(ys) - MARGIN_PX,
                                         max(xs) + MARGIN_PX, max(ys) + MARGIN_PX)
        for tx in range(tx0, tx1 + 1):
            for ty in range(ty0, ty1 + 1):
                needed_tiles.add((tx, ty))
        record['status'] = 'pending'
        entries.append(record)

    log(f'[{area}] {len(entries)} buildings, {len(needed_tiles)} tiles to fetch')
    cache.prefetch(sorted(needed_tiles))
    log(f'[{area}] tiles ready')

    label_cache_path = work / 'labels.json'
    label_cache = {}
    if label_cache_path.exists():
        try:
            label_cache = json.loads(label_cache_path.read_text())
        except ValueError:
            label_cache = {}

    def save_label_cache():
        label_cache_path.write_text(json.dumps(label_cache, ensure_ascii=False, indent=1, sort_keys=True))

    eligible = [e for e in entries if e['status'] == 'pending']
    for entry in eligible:
        index = entry['index']
        crop_path = Path(entry['crop'])
        cached = label_cache.get(str(index))
        if cached and cached.get('geometryHash') == entry['geometryHash'] and crop_path.exists():
            entry.update(cached)
            entry['status'] = cached.get('status', 'done')
            continue
        cell, meta = build_crop(features[index - 1], cache, zoom)
        if cell is None:
            entry.update({'roofShape': None, 'roofMethod': None, 'roofConfidence': None,
                          'roofReason': f"Not judged: {meta['detail']}.",
                          'status': meta['reason'], 'spanPx': meta.get('spanPx', entry['spanPx'])})
            label_cache[str(index)] = {k: entry[k] for k in
                                       ('roofShape', 'roofMethod', 'roofConfidence', 'roofReason', 'status')}
            label_cache[str(index)]['geometryHash'] = entry['geometryHash']
            continue
        cell.save(crop_path)
        entry['cropReady'] = True
        entry['nativePx'] = meta['nativePx']

    save_label_cache()

    # ---- phase 2: two independent reads of every crop --------------------------------
    # Read 1: montage sheet (one call for up to 25 buildings).
    # Read 2: the same crop again on its own, with a focused single-building prompt.
    # A roof shape is recorded only when the two reads do not contradict each other.
    todo = [e for e in entries if e.get('cropReady') and e['status'] == 'pending']
    if args.no_vision or args.reassemble:
        log(f'[{area}] vision skipped; {len(todo)} crops awaiting classification')
    elif todo:
        log(f'[{area}] classifying {len(todo)} buildings via {CLASSIFIER_ID}')
        per_sheet = SHEET_COLS * SHEET_ROWS

        # --- read 1: montage sheets ---
        sheets = []
        for position in range(0, len(todo), per_sheet):
            chunk = todo[position:position + per_sheet]
            sheet_path = sheets_dir / f'sheet-{position // per_sheet + 1:03d}.png'
            items = [(e['index'], Image.open(e['crop']).convert('RGB')) for e in chunk]
            build_sheet(items).save(sheet_path)
            sheets.append((sheet_path, [e['index'] for e in chunk]))
        for sheet_path, indices in sheets:
            try:
                labels, raw = classify_sheet(sheet_path, indices, log)
            except Exception as error:  # noqa: BLE001 - a failed sheet must not abort the run
                log(f'    sheet {sheet_path.name} FAILED: {error}')
                labels = {}
                raw = ''
            (work / 'raw' / sheet_path.stem).mkdir(parents=True, exist_ok=True)
            (work / 'raw' / sheet_path.stem / 'response.txt').write_text(raw)
            for entry in todo:
                if entry['index'] not in indices:
                    continue
                entry['sheetLabel'] = labels.get(entry['index'])
            save_label_cache()

        # --- read 2: each crop on its own ---
        singles = {}
        for position in range(0, len(todo), per_sheet):
            chunk = todo[position:position + per_sheet]
            crops = [e['crop'] for e in chunk]
            indices = [e['index'] for e in chunk]
            try:
                singles.update(classify_singles(crops, indices, log))
            except Exception as error:  # noqa: BLE001
                log(f'    singles {indices[0]}-{indices[-1]} FAILED: {error}')
            for entry in todo:
                if entry['index'] in indices:
                    entry['singleLabel'] = singles.get(entry['index'])
            save_label_cache()
            time.sleep(args.sleep)

        # --- combine ---
        for entry in todo:
            entry.update(decide(entry.get('sheetLabel'), entry.get('singleLabel')))
            entry.pop('sheetLabel', None)
            entry.pop('singleLabel', None)
            label_cache[str(entry['index'])] = {
                key: entry[key] for key in
                ('roofShape', 'roofMethod', 'roofConfidence', 'roofReason', 'status')}
            label_cache[str(entry['index'])]['geometryHash'] = entry['geometryHash']
        save_label_cache()

    # ---- phase 4: assemble the pack -------------------------------------------------
    retrieved_at = None
    for entry in entries:
        if entry.get('roofShape'):
            retrieved_at = retrieved_at or now_iso()
    used = sorted(needed_tiles)
    stamps = []
    for tx, ty in used:
        meta = cache.meta(tx, ty)
        if meta:
            stamps.append(meta['fetchedAt'])
    tile_retrieved_at = max(stamps) if stamps else now_iso()

    features_out = []
    counts = {'flat': 0, 'gable': 0, 'unknown': 0}
    unclassified = {'tooSmall': 0, 'noImagery': 0, 'unknown': 0, 'noResponse': 0,
                    'readDisagreement': 0}
    methods = {'sheet': 0, 'single': 0}
    confidences = {'high': 0, 'medium': 0, 'low': 0}
    for entry in entries:
        feature = features[entry['index'] - 1]
        shape = entry.get('roofShape')
        if shape in ('flat', 'gable'):
            counts[shape] += 1
            methods[entry.get('roofMethod')] = methods.get(entry.get('roofMethod'), 0) + 1
            confidence = entry.get('roofConfidence')
            if confidence in confidences:
                confidences[confidence] += 1
        else:
            counts['unknown'] += 1
            status = entry.get('status') or 'unknown'
            unclassified[status if status in unclassified else 'unknown'] += 1
        properties = {
            'osm': feature['properties']['osm'],
            'roofShape': shape if shape in ('flat', 'gable') else None,
            'roofSource': 'aerial-imagery-classification' if shape in ('flat', 'gable') else None,
            'roofMethod': entry.get('roofMethod') if shape in ('flat', 'gable') else None,
            'roofConfidence': entry.get('roofConfidence') if shape in ('flat', 'gable') else None,
            'roofReason': entry.get('roofReason') or '',
            'roofImagery': {
                'provider': PROVIDER,
                'url': TILE_URL,
                'zoom': zoom,
                'retrievedAt': tile_retrieved_at,
                'attribution': ATTRIBUTION,
            },
            'roofClassifiedBy': CLASSIFIER_ID if shape in ('flat', 'gable') else None,
            'roofClassifiedAt': now_iso() if shape in ('flat', 'gable') else None,
        }
        features_out.append({
            'type': 'Feature',
            'properties': properties,
            'geometry': feature['geometry'],
        })

    total = len(features_out)
    classified = counts['flat'] + counts['gable']
    output = {
        'schemaVersion': 1,
        'areaId': area,
        'type': 'FeatureCollection',
        'crsNote': pack.get('crsNote', 'EPSG:4326 longitude/latitude; no simplification or coordinate rounding'),
        'source': PROVIDER,
        'attribution': ATTRIBUTION,
        'license': 'Esri World Imagery terms of use: https://www.esri.com/en-us/legal/terms/full-master-agreement',
        'method': 'Roof shape read from aerial imagery at zoom %d and classified by %s. '
                  'Geometry copied unchanged from buildings-%s.json.' % (zoom, CLASSIFIER_ID, area),
        'imagery': {
            'provider': PROVIDER,
            'tileTemplate': TILE_URL,
            'zoomUsed': zoom,
            'zoomProbes': zoom_probes,
            'groundResolutionMPerPx': round(156543.033928 * math.cos(math.radians(
                sum(feature_centre(features)) / max(1, len(feature_centre(features))))) / (2 ** zoom), 4),
            'attribution': ATTRIBUTION,
        },
        'minSpanPx': MIN_SPAN_PX,
        'counts': dict(counts, total=total),
        'coverage': round(classified / total, 4) if total else 0.0,
        'coverageDetail': {
            'classified': classified,
            'total': total,
            'unknown': counts['unknown'],
            'unclassifiedReasons': unclassified,
            'method': methods,
            'confidence': confidences,
        },
        'features': features_out,
    }

    out_path = DATA_DIR / f'roofs-{area}.json'
    out_path.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n')
    log(f'[{area}] wrote {out_path}  counts={counts}  coverage={output["coverage"]}')

    # evidence: per-building records
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    records_path = EVIDENCE_DIR / f'buildings-{area}.csv'
    lines = ['index,osm,roofShape,roofConfidence,roofMethod,status,spanPx,spanMaxPx,crop,reason']
    for entry in entries:
        crop = Path(entry['crop'])
        try:
            rel = str(crop.relative_to(Path(args.work_dir)))
        except ValueError:
            rel = str(crop)
        lines.append(','.join([
            str(entry['index']), entry['osm'], entry.get('roofShape') or '',
            entry.get('roofConfidence') or '', entry.get('roofMethod') or '',
            entry.get('status') or '', str(entry['spanPx']), str(entry['spanMaxPx']), rel,
            '"' + (entry.get('roofReason') or '').replace('"', "'") + '"',
        ]))
    records_path.write_text('\n'.join(lines) + '\n')

    return {
        'counts': counts,
        'coverage': output['coverage'],
        'unclassified': unclassified,
        'output': str(out_path),
        'records': str(records_path),
        'tileRetrievedAt': tile_retrieved_at,
        'tilesUsed': len(used),
    }


if __name__ == '__main__':
    sys.exit(main())
