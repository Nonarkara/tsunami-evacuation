#!/usr/bin/env python3
"""Capture fresh viewport and banner receipts from the live site.

Drives the repository's own collector (`tools/viewport/measure.mjs`) plus the
banner collector below, over the surfaces the owner instruction names, and
writes the records the two gate scripts read:

  docs/evidence/viewport-2026-10-28/case-<w>-<h>.json
  docs/evidence/banner-2026-10-28/cases.json

Each record states the surface that was actually reached (`surface`, `navCurrent`,
`terrainState`) so a receipt can never be read as a pass on a page that was not
measured. Every run also writes `capture-receipt.json` with the sha256 of the
bytes the live host served, so the measurements can be tied to one release.

Usage:
  python3 tools/viewport/capture.py [origin]        # default: the live domain

Requires the Playwright python package and a Chromium build for it.
"""

from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "docs" / "evidence"
VIEWPORT_DIR = EVIDENCE / "viewport-2026-10-28"
BANNER_DIR = EVIDENCE / "banner-2026-10-28"
MEASURE = (ROOT / "tools" / "viewport" / "measure.mjs").read_text(encoding="utf-8")

# Surfaces named by the owner instruction, in the order the app presents them.
# route -> (tab, nav label prefix)
ROUTES = {
    "model": ("explore", "Model"),
    "satellite": ("satellite", "Satellite"),
    "plan": ("prepare", "Plan"),
    "drill": ("drill", "Drill"),
    "research": ("research", "Research"),
}
BANNER_PAGES = ["explore", "satellite", "prepare", "drill", "research"]

# Gate viewports: the eight named in the fixed-screen instruction.
VIEWPORT_SIZES = [
    (390, 844), (1024, 768), (1280, 720), (1440, 900),
    (1169, 674), (667, 375), (390, 600), (320, 700),
]
# Banner gate viewports: the eight above plus both sides of 760px and 1100px.
BANNER_SIZES = sorted(set(VIEWPORT_SIZES) | {
    (760, 768), (761, 768), (1099, 768), (1100, 768),
})

LAUNCH_ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
]

BANNER_MEASURE = """
(() => {
  const main = document.getElementById('main').getBoundingClientRect();
  const visible = el => el.getBoundingClientRect().width > 0 && !el.closest('[hidden]');
  const header = document.querySelector('header.soonami-masthead');
  const hr = header.getBoundingClientRect();
  const controls = [...document.querySelectorAll('.soonami-masthead button,.soonami-masthead select')]
    .filter(visible).map(el => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return {
        name: el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent.trim().slice(0, 60),
        rect: r.toJSON(),
        clear: hit === el || el.contains(hit),
      };
    });
  const regions = [...document.querySelectorAll('main .flow-window,main .page-turner,main .terrain-stage,main .terrain-caption,main .terrain-operations')]
    .filter(visible).map(el => ({ name: el.className, rect: el.getBoundingClientRect().toJSON() }));
  const failures = regions.filter(x =>
    x.rect.bottom > main.bottom + 1 || x.rect.top < main.top - 1 ||
    x.rect.right > main.right + 1 || x.rect.left < main.left - 1).map(x => x.name);
  const stageEl = document.querySelector('.terrain-stage');
  return {
    page: header.dataset.page,
    width: innerWidth,
    height: innerHeight,
    doc: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    header: hr.toJSON(),
    main: main.toJSON(),
    controls,
    failures,
    stage: stageEl ? stageEl.getBoundingClientRect().toJSON() : null,
    regions,
  };
})()
"""

SURFACE_MEASURE = """
(() => {
  const header = document.querySelector('header.soonami-masthead');
  const nav = [...document.querySelectorAll('.soonami-masthead button')]
    .find(b => (b.getAttribute('aria-label') || '').startsWith(SURFACE_PREFIX));
  const terrain = document.querySelector('.terrain-rehearsal');
  const shown = el => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return true;
    return !!(el.offsetParent || el.getClientRects().length);
  };
  const heading = [...document.querySelectorAll('main h1,main h2,main h3')].find(shown);
  return {
    surface: header ? header.dataset.page : null,
    navCurrent: nav ? nav.getAttribute('aria-current') : null,
    terrainState: terrain ? terrain.dataset.state : null,
    heading: heading ? (heading.textContent || '').trim().slice(0, 80) : null,
    visibleRegions: [...document.querySelectorAll('main section,main article,main .flow-window')]
      .filter(shown).map(el => el.className).slice(0, 6),
  };
})()
"""


def measure_script() -> str:
    """Wrap the repository's collector so it can be evaluated in the page."""
    body = MEASURE.replace("export function measureViewport", "function measureViewport")
    return f"(() => {{\n{body}\nreturn measureViewport();\n}})()"


USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0 Safari/537.36 tsunami-evacuation-evidence/1.0"
)


def fetch(url: str) -> bytes:
    """Fetch bytes as a browser would; the host answers 403 to the default agent."""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def live_bytes(origin: str) -> list[dict]:
    """Record the sha256 of the bytes the host actually serves."""
    html = fetch(f"{origin}/").decode("utf-8")
    assets: list[str] = []
    for token in html.split('"'):
        if token.startswith("/assets/") and token not in assets:
            assets.append(token)
    records = [{
        "path": "/",
        "bytes": len(html.encode("utf-8")),
        "sha256": hashlib.sha256(html.encode("utf-8")).hexdigest(),
    }]
    for asset in assets:
        raw = fetch(f"{origin}{asset}")
        records.append({
            "path": asset,
            "bytes": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest(),
        })
    return records


def write_receipt(origin: str) -> dict:
    """Write the byte receipt that ties the measurements to one release."""
    cases = sorted(VIEWPORT_DIR.glob("case-*.json"))
    records = sum(len(json.loads(case.read_text(encoding="utf-8"))) for case in cases)
    rows = len(json.loads((BANNER_DIR / "cases.json").read_text(encoding="utf-8")))
    bytes_records = live_bytes(origin)
    (VIEWPORT_DIR / "live-bytes.json").write_text(
        json.dumps(bytes_records, indent=2) + "\n", encoding="utf-8"
    )
    receipt = {
        "origin": origin,
        "capturedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "viewportCases": len(cases),
        "viewportRecords": records,
        "bannerRows": rows,
        "bytes": bytes_records,
    }
    (VIEWPORT_DIR / "capture-receipt.json").write_text(
        json.dumps(receipt, indent=2) + "\n", encoding="utf-8"
    )
    return receipt


def open_page(context, origin: str, width: int, height: int, tab: str | None = None):
    """Load the site and wait for the banner, retrying a flaky first paint.

    A receipt must be taken from a page that actually rendered, so a load that
    never produces the banner is retried rather than measured. The surface is
    chosen with the hash the application reads on boot, which reaches the same
    tab a visitor reaches by clicking the banner.
    """
    url = f"{origin}/" + (f"?capture={tab}#{tab}" if tab else "")
    page = context.new_page()
    last: Exception | None = None
    for attempt in range(3):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=90000)
            page.wait_for_selector("header.soonami-masthead", timeout=45000)
            page.wait_for_timeout(1500)
            return page
        except Exception as exc:  # network hiccup or a slow first paint
            last = exc
            print(f"  load attempt {attempt + 1} failed: {exc}", flush=True)
            try:
                page.close()
            except Exception:
                pass
            page = context.new_page()
    raise RuntimeError(f"could not load {origin} at {width}x{height}: {last}")


def goto_tab(page, origin: str, tab: str) -> None:
    """Open one surface of the application.

    The surface is chosen with the hash the application reads on boot. The
    query parameter makes each URL distinct, because changing only the hash of
    a URL that is already loaded is a same-document navigation and the
    application does not listen for `hashchange`.
    """
    page.goto(f"{origin}/?capture={tab}#{tab}", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_selector("header.soonami-masthead", timeout=45000)
    page.wait_for_function(
        "tab => { const m = document.querySelector('main');"
        " return m && m.dataset.page === tab; }",
        arg=tab,
        timeout=30000,
    )


def click_nav(page, prefix: str) -> None:
    """Use the banner's own navigation control, the way a visitor does."""
    button = page.locator(f'.soonami-masthead button[aria-label^="{prefix}"]').first
    button.wait_for(state="visible", timeout=15000)
    button.click()
    page.wait_for_function(
        "prefix => { const h = document.querySelector('header.soonami-masthead');"
        " return h && h.dataset.page; }",
        arg=prefix,
        timeout=15000,
    )


def settle(page, tab: str) -> str:
    """Let fonts, layout and the map reach a steady state before measuring.

    A receipt taken while the terrain is still loading measures the loading
    state, not the workspace, so the map is waited out and the state that was
    actually measured is recorded.
    """
    page.wait_for_timeout(1200)
    if tab == "explore":
        try:
            page.wait_for_selector(
                '.terrain-rehearsal[data-state="ready"],.terrain-rehearsal[data-state="flat"]',
                timeout=45000,
            )
        except Exception:
            pass
    try:
        page.wait_for_load_state("networkidle", timeout=5000)
    except Exception:
        pass
    page.wait_for_timeout(600)
    terrain = page.locator(".terrain-rehearsal").first
    try:
        return terrain.get_attribute("data-state") or ""
    except Exception:
        return ""


def parse_viewports(flag: str | None) -> list[tuple[int, int]]:
    """Parse a `--viewports 1024x768,667x375` filter."""
    if not flag:
        return []
    sizes = []
    for token in flag.split(","):
        token = token.strip()
        if not token:
            continue
        width, height = token.lower().split("x")
        sizes.append((int(width), int(height)))
    return sizes


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    origin = args[0] if args else "https://tsunami.nonarkara.org"
    origin = origin.rstrip("/")

    if "--receipt-only" in sys.argv:
        # Rewrite the byte receipt from the records already on disk.
        print(json.dumps(write_receipt(origin), indent=2))
        return 0

    only = parse_viewports(
        sys.argv[sys.argv.index("--viewports") + 1] if "--viewports" in sys.argv else None
    )
    sizes = only or BANNER_SIZES

    viewport_records: dict[tuple[int, int], list[dict]] = {}
    banner_rows: list[dict] = []

    VIEWPORT_DIR.mkdir(parents=True, exist_ok=True)
    BANNER_DIR.mkdir(parents=True, exist_ok=True)

    def flush() -> None:
        """Write what has been measured so far; a later failure keeps it.

        A partial run replaces only the viewports it re-measured, so the rows of
        the other viewports are carried over instead of being dropped.
        """
        for (width, height), records in viewport_records.items():
            (VIEWPORT_DIR / f"case-{width}-{height}.json").write_text(
                json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
            )
        merged = list(banner_rows)
        cases_file = BANNER_DIR / "cases.json"
        if cases_file.exists() and only:
            # Replace the rows of every viewport this run measured, whether or
            # not it also produced a viewport case file for them.
            replaced = set(sizes)
            merged += [
                row for row in json.loads(cases_file.read_text(encoding="utf-8"))
                if (row["width"], row["height"]) not in replaced
            ]
        merged.sort(key=lambda row: (row["width"], row["height"], BANNER_PAGES.index(row["page"])))
        cases_file.write_text(
            json.dumps(merged, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=LAUNCH_ARGS)
        for width, height in sizes:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                device_scale_factor=1,
            )
            page = open_page(context, origin, width, height)

            for route, (tab, prefix) in ROUTES.items():
                for attempt in range(3):
                    try:
                        goto_tab(page, origin, tab)
                        break
                    except Exception as exc:
                        print(f"  nav to {route} attempt {attempt + 1} failed: {exc}", flush=True)
                        if attempt == 2:
                            raise
                        page = open_page(context, origin, width, height)
                state = settle(page, tab)

                surface = page.evaluate(
                    SURFACE_MEASURE.replace("SURFACE_PREFIX", json.dumps(prefix))
                )
                surface["terrainState"] = surface["terrainState"] or state or None
                record = page.evaluate(measure_script())
                record["route"] = route
                record.update(surface)

                banner = page.evaluate(BANNER_MEASURE)
                banner["surface"] = surface["surface"]
                banner["navCurrent"] = surface["navCurrent"]
                banner["terrainState"] = surface["terrainState"]
                banner_rows.append(banner)

                if (width, height) in VIEWPORT_SIZES:
                    viewport_records.setdefault((width, height), []).append(record)

                print(
                    f"{width}x{height} {route:<9} surface={surface['surface']} "
                    f"doc={record['documentWidth']}x{record['documentHeight']} "
                    f"header={record['header']['height']} "
                    f"failures={record['failures']} state={surface['terrainState']}",
                    flush=True,
                )

            context.close()
            flush()
        browser.close()

    flush()

    # The receipt is written last and never takes the measurements down with it.
    try:
        receipt = write_receipt(origin)
    except Exception as exc:
        print(f"byte receipt failed: {exc}", flush=True)
        receipt = {"origin": origin, "bytes": None}
    print(json.dumps(receipt, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
