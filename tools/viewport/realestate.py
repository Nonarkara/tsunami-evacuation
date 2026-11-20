#!/usr/bin/env python3
"""Measure the screen real estate of every surface.

A gate can prove that nothing overflows and that no word is stranded. It cannot
say whether a screen is worth the reader's attention. This measures that.

For every surface and width it reports:

- **occupancy** — the share of the viewport that carries information (text, a
  control, an image, a chart) versus the share that is panel background versus
  the share that is empty page. A screen that is mostly empty is a screen that
  asks the reader to scroll for nothing.
- **dead bands** — the tallest run of empty rows. One tall band is a hole in
  the layout; a screen made of them is a page that has been stretched.
- **chrome** — what the header and footer cost, in pixels and in share.
- **pages** — how many screens of reading each surface's flow demands.

Usage:

    python3 tools/viewport/realestate.py https://tsunami.nonarkara.org out.json
    python3 tools/viewport/realestate.py --local dist --port 4190 out.json

The measurement is of the rendered page, not the source: an element with text
that the browser has not laid out yet does not count.
"""

from __future__ import annotations

import argparse
import functools
import http.server
import json
import socketserver
import sys
import threading
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

# 12px cells: fine enough to see a 40px hole, coarse enough to be honest about
# the shape of the page rather than the shape of the text.
CELL = 12

MEASURE = """
() => {
  const CELL = %(cell)d;
  const vw = window.innerWidth, vh = window.innerHeight;
  const cols = Math.ceil(vw / CELL), rows = Math.ceil(vh / CELL);

  const cells = new Uint8Array(cols * rows); // 0 empty, 1 panel, 2 content
  const mark = (r, value) => {
    const c0 = Math.max(0, Math.floor(r.left / CELL));
    const c1 = Math.min(cols - 1, Math.floor((r.right - 0.5) / CELL));
    const r0 = Math.max(0, Math.floor(r.top / CELL));
    const r1 = Math.min(rows - 1, Math.floor((r.bottom - 0.5) / CELL));
    for (let row = r0; row <= r1; row++)
      for (let col = c0; col <= c1; col++) {
        const i = row * cols + col;
        if (value > cells[i]) cells[i] = value;
      }
  };

  const visible = (el) => {
    if (!el || el.closest('[hidden]')) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    return true;
  };

  // Content: something the reader can read or operate.
  const contentSelector = 'p,li,h1,h2,h3,h4,dd,dt,td,th,span,a,button,input,select,textarea,canvas,svg,img,video,summary,label,code';
  for (const el of document.querySelectorAll(contentSelector)) {
    if (!visible(el)) continue;
    const text = (el.textContent || '').trim();
    const isMedia = /^(CANVAS|SVG|IMG|VIDEO|INPUT|SELECT|TEXTAREA|BUTTON|SUMMARY)$/.test(el.tagName);
    if (!text && !isMedia) continue;
    // A parent with text is not a separate content leaf.
    const r = el.getBoundingClientRect();
    mark(r, 2);
  }

  // Panels: a painted box (card, panel, table, section with a background).
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const painted = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
    const bordered = cs.borderTopWidth !== '0px' && cs.borderTopStyle !== 'none';
    if (!painted && !bordered) continue;
    mark(el.getBoundingClientRect(), 1);
  }

  let content = 0, panel = 0, empty = 0;
  const emptyRows = [];
  for (let row = 0; row < rows; row++) {
    let rowEmpty = 0;
    for (let col = 0; col < cols; col++) {
      const v = cells[row * cols + col];
      if (v === 2) { content++; }
      else if (v === 1) { panel++; }
      else { empty++; rowEmpty++; }
    }
    emptyRows.push(rowEmpty === cols);
  }

  // The tallest run of completely empty rows, and the bands between them.
  let run = 0, best = 0, bands = [];
  let start = 0;
  for (let row = 0; row <= rows; row++) {
    if (row < rows && emptyRows[row]) {
      if (run === 0) start = row;
      run++;
    } else {
      if (run > best) best = run;
      if (run * CELL >= 24) bands.push({ top: start * CELL, height: run * CELL });
      run = 0;
    }
  }

  const header = document.querySelector('header.soonami-masthead');
  const footer = document.querySelector('#root > footer, footer');
  const hRect = header ? header.getBoundingClientRect() : null;
  const fRect = footer ? footer.getBoundingClientRect() : null;

  const flows = [...document.querySelectorAll('.paged-flow')].map(el => ({
    label: el.getAttribute('aria-label') || '',
    pages: Number(el.getAttribute('data-pages') || 1),
    visible: visible(el),
  })).filter(f => f.visible);

  return {
    occupancy: {
      contentPct: +((content / (cols * rows)) * 100).toFixed(1),
      panelPct: +((panel / (cols * rows)) * 100).toFixed(1),
      emptyPct: +((empty / (cols * rows)) * 100).toFixed(1),
    },
    deadBands: bands.map(b => ({ top: b.top, height: b.height, pct: +((b.height / vh) * 100).toFixed(1) })),
    tallestEmptyBandPx: best * CELL,
    chrome: {
      header: hRect ? { top: hRect.top, height: hRect.height, share: +((hRect.height / vh) * 100).toFixed(1) } : null,
      footer: fRect ? { top: fRect.top, height: fRect.height, share: +((fRect.height / vh) * 100).toFixed(1) } : null,
    },
    flows,
    document: {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      viewport: [vw, vh],
    },
  };
}
""" % {"cell": CELL}


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve(directory: str, port: int):
    handler = functools.partial(Quiet, directory=directory)
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("out", help="path of the JSON receipt to write")
    parser.add_argument("--local", help="local dist directory to serve for the run")
    parser.add_argument("--port", type=int, default=4190)
    parser.add_argument("--origin", help="origin to measure instead of a local build")
    parser.add_argument("--sections", default=",".join(SECTIONS))
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
                    # The app must have mounted: a receipt taken before the
                    # stylesheet lands measures an unstyled page.
                    try:
                        page.wait_for_function(
                            "() => { const h = document.querySelector('header.soonami-masthead');"
                            " return h && h.getBoundingClientRect().height <= 48; }",
                            timeout=60000,
                        )
                    except Exception:
                        pass
                    page.wait_for_timeout(2500)
                    data = page.evaluate(MEASURE)
                    data["section"] = section
                    data["viewport"] = [width, height]
                    rows.append(data)
                    print(
                        f"{width}x{height} {section}: content {data['occupancy']['contentPct']}%, "
                        f"panel {data['occupancy']['panelPct']}%, empty {data['occupancy']['emptyPct']}%, "
                        f"tallest empty band {data['tallestEmptyBandPx']}px, "
                        f"pages {[f['pages'] for f in data['flows']]}",
                        flush=True,
                    )
            browser.close()
    finally:
        if server:
            server.shutdown()

    Path(args.out).write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {args.out} ({len(rows)} measurements)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
