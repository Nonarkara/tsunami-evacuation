#!/usr/bin/env python3
"""Measure how full each reading page actually is, on every surface.

A paged flow can be correct and still be bad: a page that carries two lines and
then 180 px of nothing, or a blank page at the end, asks the reader to turn the
page for nothing. The MSH law forbids a void; this finds them.

For every surface, width and flow it walks the pages one by one and measures
what the reader actually sees in the visible slice:

- **fill** — the share of the visible slice that carries text, a control or a
  chart;
- **voids** — the tallest run of empty rows inside that slice;
- **split blocks** — blocks that continue onto the next page (a chart cut in
  half is worse than a short page).

Usage:

    python3 tools/viewport/pagefill.py https://tsunami.nonarkara.org out.json
    python3 tools/viewport/pagefill.py --local dist --port 4191 out.json

It is a read-only instrument: it turns pages and looks.
"""

from __future__ import annotations

import argparse
import functools
import hashlib
import http.server
import json
import re
import socketserver
import subprocess
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
CHROMIUM_ARGS = [
    "--single-process",
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
]

VIEWPORTS = [(390, 844), (1024, 768), (1440, 900)]
SECTIONS = ["explore", "prepare", "drill", "research", "ddpm"]

# A page below this share of content is a page that mostly asks the reader to turn.
FILL_FLOOR = 45.0
# A void taller than this share of the slice is a hole in the page.
VOID_FLOOR = 12.0

MEASURE = """
(index) => {
  const flows = [...document.querySelectorAll('.paged-flow')].filter(flow => {
    const r = flow.getBoundingClientRect();
    if (r.height < 20 || r.width < 20) return false;
    if (flow.closest('[hidden]')) return false;
    const cs = getComputedStyle(flow);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  });
  const flow = flows[index];
  if (!flow) return null;
  const win = flow.querySelector('.flow-window');
  const content = flow.querySelector('.flow-content');
  if (!win || !content) return null;
  const wr = win.getBoundingClientRect();
  if (wr.height < 20) return null;
  const visible = (el) => {
    if (!el || el.closest('[hidden]')) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const inSlice = (r) => r.right > wr.left + 1 && r.left < wr.right - 1
    && r.bottom > wr.top + 1 && r.top < wr.bottom - 1;

  // Everything that carries information, as a union of rectangles clipped to the slice.
  // Spans and strong elements carry the profile's figures and the card's heading:
  // leaving them out would report the gap between two pieces of text as a void.
  const rects = [];
  const sel = 'p,li,h1,h2,h3,h4,dd,dt,td,th,a,button,input,select,textarea,canvas,svg,img,video,summary,label,code,figcaption,span,strong';
  for (const el of document.querySelectorAll(sel)) {
    if (!visible(el)) continue;
    const text = (el.textContent || '').trim();
    const media = /^(CANVAS|SVG|IMG|VIDEO|INPUT|SELECT|TEXTAREA|BUTTON|SUMMARY)$/.test(el.tagName);
    if (!text && !media) continue;
    const r = el.getBoundingClientRect();
    if (!inSlice(r)) continue;
    rects.push({ l: Math.max(r.left, wr.left), t: Math.max(r.top, wr.top), r: Math.min(r.right, wr.right), b: Math.min(r.bottom, wr.bottom) });
  }

  const ROW = 8;
  const rows = Math.max(1, Math.floor(wr.height / ROW));
  const filled = new Array(rows).fill(false);
  for (const rect of rects) {
    const r0 = Math.max(0, Math.floor((rect.t - wr.top) / ROW));
    const r1 = Math.min(rows - 1, Math.ceil((rect.b - wr.top) / ROW) - 1);
    for (let i = r0; i <= r1; i++) filled[i] = true;
  }
  let contentRows = 0, run = 0, bestRun = 0, bandTop = 0, bestTop = 0;
  for (let i = 0; i < rows; i++) {
    if (filled[i]) { contentRows++; if (run > bestRun) { bestRun = run; bestTop = bandTop; } run = 0; }
    else { if (run === 0) bandTop = i; run++; }
  }
  if (run > bestRun) { bestRun = run; bestTop = bandTop; }

  // Where does the empty band sit? A band under the content is a short page;
  // a band inside the content is a hole in the page.
  let contentTop = Infinity, contentBottom = -Infinity;
  for (const rect of rects) {
    if (rect.t < contentTop) contentTop = rect.t;
    if (rect.b > contentBottom) contentBottom = rect.b;
  }
  const bandTopPx = wr.top + bestTop * ROW;
  const bandBottomPx = bandTopPx + bestRun * ROW;
  let voidPosition = 'none';
  if (bestRun > 0) {
    if (!rects.length) voidPosition = 'empty';
    else if (bandTopPx >= contentBottom - 4) voidPosition = 'tail';
    else if (bandBottomPx <= contentTop + 4) voidPosition = 'head';
    else voidPosition = 'interior';
  }

  // A block that continues onto another page: it has fragments on more than one column.
  const spread = {};
  const stride = win.clientWidth + 24;
  for (const el of content.querySelectorAll('*')) {
    if (!visible(el)) continue;
    if (!/^(P|LI|H1|H2|H3|H4|DD|DT|TD|TH|FIGURE|SECTION|ARTICLE|DIV|SVG|CANVAS)$/.test(el.tagName)) continue;
    const text = (el.textContent || '').trim();
    const media = /^(SVG|CANVAS|IMG)$/.test(el.tagName);
    if (!text && !media) continue;
    const cls = (el.className || el.tagName).toString().slice(0, 40);
    const rs = [...el.getClientRects()].filter(r => r.width > 20 && r.height > 2);
    const cols = new Set(rs.map(r => Math.floor((r.left - wr.left + 4) / stride)));
    if (cols.size > 1) {
      spread[cls] = (spread[cls] || 0) + 1;
    }
  }

  return {
    label: flow.getAttribute('aria-label') || '',
    page: flow.getAttribute('data-pages'),
    slice: { w: Math.round(wr.width), h: Math.round(wr.height) },
    fillPct: +((contentRows / rows) * 100).toFixed(1),
    tallestVoidPx: bestRun * ROW,
    tallestVoidPct: +((bestRun * ROW / wr.height) * 100).toFixed(1),
    voidPosition,
    splitBlocks: Object.keys(spread),
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
    """The commit the receipt belongs to, so a stale receipt is visible."""
    try:
        return subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "HEAD"],
            capture_output=True, text=True, timeout=10, check=False,
        ).stdout.strip() or "not recorded"
    except Exception:
        return "not recorded"


def _fetch(url: str) -> bytes:
    """Fetch with a browser's user agent: the host refuses the default one."""
    import urllib.request

    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                                                       "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"})
    return urllib.request.urlopen(request, timeout=120).read()


def served_bytes(origin: str | None, local: str | None) -> list[dict]:
    """The bytes this receipt describes: the built bundles, or the served ones.

    A receipt without the bytes it measured against is a receipt that can be
    read as proof of a release that never shipped.
    """
    if origin:
        html = _fetch(f"{origin}/").decode("utf-8", "replace")
        names = sorted(set(re.findall(r"assets/index-[A-Za-z0-9_-]+\.(?:js|css)", html)))
        out = []
        for name in names:
            out.append({"path": f"/{name}", "sha256": hashlib.sha256(_fetch(f"{origin}/{name}")).hexdigest()})
        return out
    if local:
        assets = Path(local) / "assets"
        out = []
        for path in sorted(p for p in assets.glob("index-*.*") if p.suffix in (".js", ".css")):
            out.append({
                "path": f"/assets/{path.name}",
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            })
        return out
    return []


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("out")
    parser.add_argument("--local")
    parser.add_argument("--port", type=int, default=4191)
    parser.add_argument("--origin")
    parser.add_argument("--sections", default=",".join(SECTIONS))
    parser.add_argument("--fail", action="store_true",
                        help="exit non-zero when a page is blank, holds a hole, or is a fragment")
    args = parser.parse_args()

    server = None
    base = args.origin
    if args.local:
        server = serve(args.local, args.port)
        base = f"http://127.0.0.1:{args.port}"
    if not base:
        parser.error("give --origin or --local")

    sections = [s.strip() for s in args.sections.split(",") if s.strip()]
    rows = []
    receipt = {
        "capturedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "commit": git_commit(),
        "origin": args.origin or base,
        "viewports": [f"{w}x{h}" for w, h in VIEWPORTS],
        "sections": sections,
        "bytes": served_bytes(args.origin, args.local),
        "pages": [],
    }
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=CHROMIUM_ARGS)
            page = browser.new_page()
            for width, height in VIEWPORTS:
                page.set_viewport_size({"width": width, "height": height})
                for section in sections:
                    for attempt in range(3):
                        try:
                            page.goto(f"{base}/#{section}", wait_until="load", timeout=120000)
                            page.reload(wait_until="load", timeout=120000)
                            break
                        except Exception as error:
                            print(f"      retry {attempt + 1}: {error}", file=sys.stderr, flush=True)
                            page.wait_for_timeout(2000)
                    try:
                        page.wait_for_function(
                            "() => { const h = document.querySelector('header.soonami-masthead');"
                            " return h && h.getBoundingClientRect().height <= 48; }",
                            timeout=60000,
                        )
                    except Exception:
                        pass
                    page.wait_for_timeout(2500)

                    # A reading page is measured once its column count and its
                    # height have settled. A flow that has not been measured yet
                    # renders as one tall column, and measuring that would
                    # report a page the reader never sees. The flow's own count
                    # must agree with the width it laid out.
                    try:
                        page.wait_for_function(
                            "() => {"
                            " const flows = [...document.querySelectorAll('.paged-flow')].filter(flow => {"
                            "  const r = flow.getBoundingClientRect();"
                            "  if (r.height < 20 || r.width < 20) return false;"
                            "  if (flow.closest('[hidden]')) return false;"
                            "  const cs = getComputedStyle(flow);"
                            "  return cs.display !== 'none' && cs.visibility !== 'hidden'; });"
                            " const key = flows.map(f => {"
                            "  const body = f.querySelector('.flow-content');"
                            "  const win = f.querySelector('.flow-window');"
                            "  if (!body || !win) return 'x';"
                            "  const step = win.clientWidth + 24;"
                            "  const expected = Math.max(1, Math.ceil((body.scrollWidth + 24) / step));"
                            "  return f.getAttribute('data-pages') + '/' + expected + ':'"
                            "   + Math.round(win.getBoundingClientRect().height); }).join('|');"
                            " const previous = window.__pagefillKey;"
                            " window.__pagefillKey = key;"
                            " return key.length > 0 && previous === key; }",
                            timeout=30000,
                            polling=250,
                        )
                    except Exception as error:
                        print(f"      layout did not settle: {error}", file=sys.stderr, flush=True)

                    # Measure every flow the reader can actually see.
                    flow_total = page.evaluate(
                        "() => [...document.querySelectorAll('.paged-flow')].filter(flow => {"
                        " const r = flow.getBoundingClientRect();"
                        " if (r.height < 20 || r.width < 20) return false;"
                        " if (flow.closest('[hidden]')) return false;"
                        " const cs = getComputedStyle(flow);"
                        " return cs.display !== 'none' && cs.visibility !== 'hidden'; }).length"
                    )
                    for flow_index in range(flow_total):
                        flows = page.query_selector_all(".paged-flow")
                        visible = [f for f in flows if f.is_visible()]
                        if flow_index >= len(visible):
                            break
                        flow = visible[flow_index]
                        total = int(flow.get_attribute("data-pages") or 1)
                        for index in range(min(total, 12)):
                            data = page.evaluate(MEASURE, flow_index)
                            if data is None:
                                break
                            data["section"] = section
                            data["viewport"] = [width, height]
                            data["pageIndex"] = index + 1
                            data["flowIndex"] = flow_index
                            data["lastPage"] = index + 1 >= total
                            rows.append(data)
                            flag = ""
                            if data["voidPosition"] == "empty":
                                flag += "  <-- BLANK"
                            elif data["voidPosition"] == "interior" and data["tallestVoidPct"] > VOID_FLOOR:
                                flag += "  <-- HOLE"
                            elif not data["lastPage"] and data["fillPct"] < FILL_FLOOR:
                                flag += "  <-- FRAGMENT"
                            if data["splitBlocks"]:
                                flag += "  split:" + ",".join(data["splitBlocks"][:3])
                            print(
                                f"{width}x{height} {section} '{data['label']}' p{index + 1}/{total} "
                                f"fill {data['fillPct']}% void {data['tallestVoidPx']}px"
                                f" {data['voidPosition']}{flag}",
                                flush=True,
                            )
                            nxt = flow.query_selector(".page-turner button:last-of-type")
                            if nxt is None or nxt.is_disabled():
                                break
                            # The page may be animating, and Playwright's click waits
                            # for the element to hold still. Turning the page is a
                            # button press, not a gesture, so dispatch it directly.
                            nxt.evaluate("(el) => el.click()")
                            # Measure only once the column has come to rest.
                            page.wait_for_function(
                                "() => { const c = document.querySelector('.flow-content');"
                                " if (!c) return true;"
                                " const t = getComputedStyle(c).transform;"
                                " const previous = window.__pagefillTransform;"
                                " window.__pagefillTransform = t;"
                                " return previous === t; }",
                                timeout=8000,
                                polling=120,
                            )
                            page.wait_for_timeout(250)
            browser.close()
    finally:
        if server:
            server.shutdown()

    receipt["pages"] = rows
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    blank = [r for r in rows if r["voidPosition"] == "empty"]
    holes = [r for r in rows if r["voidPosition"] == "interior" and r["tallestVoidPct"] > VOID_FLOOR]
    fragments = [r for r in rows if not r.get("lastPage") and r["fillPct"] < FILL_FLOOR]
    split = [r for r in rows if r["splitBlocks"]]
    print(f"\n{len(rows)} pages measured · {len(blank)} blank · {len(holes)} with a hole · "
          f"{len(fragments)} fragment pages · {len(split)} splitting a block")
    for r in blank + holes + fragments:
        print(f"  {r['viewport'][0]}x{r['viewport'][1]} {r['section']} p{r['pageIndex']}: "
              f"fill {r['fillPct']}%, void {r['tallestVoidPx']}px ({r['tallestVoidPct']}%), {r['voidPosition']}")
    if args.fail and (blank or holes or fragments):
        print(f"\nPAGE_FILL_FAIL: {len(blank)} blank, {len(holes)} hole, {len(fragments)} fragment", file=sys.stderr)
        return 1
    if args.fail:
        print("\nPAGE_FILL_PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
