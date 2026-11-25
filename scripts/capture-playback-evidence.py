#!/usr/bin/env python3
"""Re-take the Results geometry receipts against a real browser.

The evidence in `docs/evidence/playback-data-2026-11-12/` was produced by a
scratch script that was never kept. The receipt recorded the bundle it was
taken against — `index-DG2lLEsn.js`, commit `c47b077` — and nothing has
re-measured the layout since. The gate `scripts/check-playback-data-evidence.mjs`
kept reporting PASS against it, so it was asserting a layout that no longer
exists: the package inspector card has since moved columns, and the Results
restyle changed the heading scale on top of that.

This is the producer that was missing. It drives a built site in Chromium and
writes the three receipts the gate reads:

    docs/evidence/playback-data-2026-11-12/geometry.json
    docs/evidence/playback-data-2026-11-12/data-dialogs.json
    docs/evidence/playback-data-2026-11-12/thai-landscape-pages.json
    docs/evidence/playback-data-2026-11-12/live-assets.json

Usage:

    python3 scripts/capture-playback-evidence.py --local dist
    python3 scripts/capture-playback-evidence.py --origin https://tsunami.nonarkara.org

`--origin` records the bytes the host actually serves, so the receipt is
evidence for one release and the served-bytes gate can prove it.
"""

from __future__ import annotations

import argparse
import functools
import hashlib
import http.server
import json
import os
import socketserver
import subprocess
import sys
import threading
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
EVIDENCE = ROOT / "docs" / "evidence" / "playback-data-2026-11-12"
CHROMIUM_ARGS = [
    "--single-process",
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
]
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

# The eight viewports the geometry receipt covers: the three the owner checks
# by hand (390, 1024, 1440), the two narrow ones that fragment the flow, and
# the three laptop sizes in between.
VIEWPORTS = [
    (1440, 900), (1024, 768), (1280, 720), (1169, 674),
    (390, 844), (390, 600), (320, 700), (667, 375),
]
DIALOG_VIEWPORTS = [(1440, 900), (1024, 768), (390, 844)]

# A screenshot is evidence, so it must not be taken at a size that a loaded
# machine can break. Playwright's default is 30 s; on 20 November 2026 a capture
# on a busy machine timed out on the third case and produced nothing, which
# leaves the previous release's receipt in place — a receipt that describes a
# bundle the site no longer serves. 90 s is long enough for a loaded machine
# and short enough that a genuinely broken page still fails.
SCREENSHOT_TIMEOUT_MS = 90_000
THAI_LANDSCAPE = (667, 375)
THAI_PAGES = 3

# One measurement pass, in the page. Every box is the rendered rectangle, not a
# declared size: a hidden element reports zeroes, which is how the reader can
# tell "not on this surface" from "measured and empty".
MEASURE = """
() => {
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, bottom: r.bottom};
  };
  const pick = (sel) => {
    const el = document.querySelector(sel);
    return el ? rect(el) : null;
  };
  const flow = document.querySelector('.evidence-pane .paged-flow');
  const dialog = document.querySelector('dialog[open]');
  return {
    header: pick('header.soonami-masthead'),
    results: pick('.evidence-pane'),
    window: pick('.evidence-pane .flow-window'),
    outcome: pick('.evidence-pane .outcome-summary'),
    package: pick('.evidence-pane .active-package-card'),
    axis: pick('.evidence-pane .comparison-selector'),
    ladder: pick('.evidence-pane .measure-ladder'),
    button: pick('.evidence-pane .technical-data-trigger'),
    map: pick('.terrain-rehearsal'),
    dialog: dialog ? rect(dialog) : null,
    files: pick('dialog[open] .technical-files'),
    pages: flow ? flow.getAttribute('data-pages') : null,
    document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    viewport: [window.innerWidth, window.innerHeight],
    focus: dialog ? {
      label: (dialog.querySelector('header h2') || {}).textContent || '',
      open: dialog.querySelectorAll('details[open]').length,
    } : null,
    url: location.href,
  };
}
"""


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve(directory: str, port: int):
    handler = functools.partial(Quiet, directory=directory)
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def git_commit() -> str:
    try:
        out = subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "HEAD"],
            capture_output=True, text=True, timeout=30, check=True,
        )
        return out.stdout.strip()
    except Exception:
        return "unknown"


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def live_assets(origin: str) -> dict:
    """Record the bytes the host serves, so the receipt names one release."""
    html = fetch(f"{origin}/").decode("utf-8")
    paths = ["/"]
    for token in html.split('"'):
        if token.startswith("/assets/") and token not in paths:
            paths.append(token)
    paths += [
        "/data/rehearsal-routes.json",
        "/data/terrain.json",
        "/data/hazard-replay.schema.json",
        "/data/ddpm-phang-nga-risk-villages-2026-10-28.geojson",
    ]
    receipts = []
    for path in paths:
        try:
            raw = fetch(f"{origin}{path}")
            receipts.append({
                "path": path,
                "status": 200,
                "bytes": len(raw),
                "sha256": hashlib.sha256(raw).hexdigest(),
            })
        except Exception as error:
            receipts.append({"path": path, "status": 0, "error": str(error)})
    return {
        "commit": git_commit(),
        "origin": origin,
        "capturedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "receipts": receipts,
    }


def load(page, url: str) -> bool:
    """Start a fresh document before measuring Results.

    Wait for the application shell so the visitor can select Results before
    external imagery finishes. Starting from a blank document also resets
    state when the new case changes only the hash.
    """
    for attempt in range(3):
        try:
            page.goto("about:blank", wait_until="commit", timeout=30000)
            page.goto(url, wait_until="domcontentloaded", timeout=90000)
            page.wait_for_selector("header.soonami-masthead", timeout=45000)
            return True
        except Exception as error:
            print(f"      retry {attempt + 1}: {error}", flush=True)
            page.wait_for_timeout(2000)
    return False


def open_results(page, base: str, language: str) -> bool:
    """Open the Results pane and wait for it to settle.

    The Results pane is a view inside the explore surface. Below 760px the whole
    banner context — the view select included — is folded into the map-controls
    dialog, so the receipt has to open that dialog the way a visitor does before
    it can choose the view. A receipt taken before the pane has been selected
    would measure the terrain instead.
    """
    if not load(page, f"{base}/?lang={language}#explore"):
        return False
    page.wait_for_timeout(1200)
    # The select is found by the option it carries, not by its label: the label
    # is bilingual and a receipt must not depend on the language.
    select = 'select:has(option[value="evidence"])'
    if page.query_selector(select) is None:
        return False
    opened_dialog = False
    if not page.is_visible(select):
        # A locator, not a handle: the dock re-renders the trigger when the
        # layout settles, and a stale handle never becomes clickable.
        trigger = page.locator(".banner-overflow:visible").first
        if trigger.count() == 0:
            return False
        trigger.click()
        page.wait_for_timeout(600)
        opened_dialog = True
    page.select_option(select, "evidence")
    page.wait_for_timeout(400)
    if opened_dialog:
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
    try:
        page.wait_for_selector(
            ".evidence-pane .paged-flow[data-pages]", state="attached", timeout=30000
        )
    except Exception:
        return False
    # The flow counts its pages from measured columns; a late chart resize can
    # change the count, so the page is measured after the count has settled.
    page.wait_for_timeout(2500)
    return page.is_visible(".evidence-pane .outcome-summary")


def measure(page) -> dict:
    row = page.evaluate(MEASURE)
    row["expected"] = row["viewport"]
    return row


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin", help="live origin to measure and record bytes from")
    parser.add_argument("--local", help="built site to serve for the run")
    parser.add_argument("--port", type=int, default=4185)
    parser.add_argument("--out", default=str(EVIDENCE))
    parser.add_argument("--screenshots", action="store_true")
    args = parser.parse_args()

    if not args.origin and not args.local:
        parser.error("give --origin or --local")

    server = None
    base = args.origin
    if args.local:
        server = serve(args.local, args.port)
        base = f"http://127.0.0.1:{args.port}"

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    geometry, dialogs, pages = [], [], []

    try:
        with sync_playwright() as p:
            headed = os.environ.get("SOONAMI_SMOKE_HEADED") == "1"
            browser = p.chromium.launch(headless=not headed, args=["--use-gl=angle"] if headed else CHROMIUM_ARGS)
            page = browser.new_page()
            for language in ("en", "th"):
                for width, height in VIEWPORTS:
                    page.set_viewport_size({"width": width, "height": height})
                    if not open_results(page, base, language):
                        print(f"FAIL  could not open the Results pane at {width}x{height} ({language})", flush=True)
                        browser.close()
                        return 1
                    row = measure(page)
                    row["case"] = "results-en" if language == "en" else "results-th"
                    row["lang"] = language
                    geometry.append(row)
                    if args.screenshots:
                        page.screenshot(path=str(out / f"results-{language}-{width}x{height}.png"), timeout=SCREENSHOT_TIMEOUT_MS)
                    print(f"ok    {language} {width}x{height} pages={row['pages']}", flush=True)

                for width, height in DIALOG_VIEWPORTS:
                    page.set_viewport_size({"width": width, "height": height})
                    if not open_results(page, base, language):
                        print(f"FAIL  could not open the Results pane at {width}x{height} ({language})", flush=True)
                        browser.close()
                        return 1
                    page.click(".evidence-pane .technical-data-trigger")
                    page.wait_for_selector("dialog[open]", timeout=15000)
                    page.wait_for_timeout(700)
                    row = measure(page)
                    row["case"] = "data-en" if language == "en" else "data-th"
                    row["lang"] = language
                    dialogs.append(row)
                    if args.screenshots:
                        page.screenshot(path=str(out / f"data-{language}-{width}x{height}.png"), timeout=SCREENSHOT_TIMEOUT_MS)
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(400)
                    print(f"ok    dialog {language} {width}x{height}", flush=True)

                if language == "th":
                    width, height = THAI_LANDSCAPE
                    page.set_viewport_size({"width": width, "height": height})
                    if not open_results(page, base, language):
                        print("FAIL  could not open the Results pane for the Thai landscape pages", flush=True)
                        browser.close()
                        return 1
                    for index in range(THAI_PAGES):
                        row = measure(page)
                        row["lang"] = language
                        row["page"] = index + 1
                        pages.append(row)
                        if args.screenshots:
                            page.screenshot(path=str(out / f"results-th-landscape-page-{index + 1}.png"), timeout=SCREENSHOT_TIMEOUT_MS)
                        nxt = page.query_selector(".evidence-pane .page-turner button:last-of-type")
                        if nxt is None or nxt.is_disabled():
                            break
                        nxt.click()
                        page.wait_for_timeout(700)
                    print(f"ok    thai landscape pages={len(pages)}", flush=True)
            browser.close()
    except Exception as error:
        print(f"FAIL  the capture stopped: {error}", flush=True)
        return 1
    finally:
        if server:
            server.shutdown()

    (out / "geometry.json").write_text(json.dumps(geometry, indent=2) + "\n", encoding="utf-8")
    (out / "data-dialogs.json").write_text(json.dumps(dialogs, indent=2) + "\n", encoding="utf-8")
    (out / "thai-landscape-pages.json").write_text(json.dumps(pages, indent=2) + "\n", encoding="utf-8")
    if args.origin:
        assets = live_assets(args.origin)
        (out / "live-assets.json").write_text(json.dumps(assets, indent=2) + "\n", encoding="utf-8")
        print(f"recorded {len(assets['receipts'])} served paths from {args.origin}", flush=True)

    print(f"geometry {len(geometry)} · dialogs {len(dialogs)} · thai pages {len(pages)}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
