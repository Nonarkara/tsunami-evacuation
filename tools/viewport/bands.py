#!/usr/bin/env python3
"""Measure the text bands of a workspace: rendered lines, orphans and chrome cost.

`measure.mjs` records the document box, the banner and the operating regions. It
does not read how the text inside those regions actually breaks. This collector
reads the *rendered* lines of a band — the characters on each line, the measure in
characters per line, and whether the last line is an orphan.

It drives a real browser against a served build, reads nothing from the source, and
writes one JSON receipt per viewport so a claim about a band can be checked later.

    python3 tools/viewport/bands.py https://tsunami.nonarkara.org out/bands.json

What the receipt must carry
---------------------------
- `served` — the sha256 of the bundle the host actually served, so a receipt can be
  tied to one release and never quoted for another.
- `lines` — the exact rendered text of every line of the band, so an orphan is a
  fact about the pixels rather than an opinion about the source.
- `chrome` — the height of the fixed bands above and below the workspace and their
  share of the viewport. A large footprint is a reason to investigate, not a verdict.
"""

import argparse
import hashlib
import json
import re
import sys
import urllib.request

from playwright.sync_api import sync_playwright

VIEWPORTS = [(390, 844), (1024, 768), (1440, 900)]

# Bands whose text breaks under compression. Each is (selector, label).
BANDS = [
    (".terrain-caption .caption-top > span:first-child", "caption status"),
    (".terrain-caption .caption-bottom", "caption references"),
    (".exercise-boundary", "exercise boundary"),
    (".rehearsal-readout", "crowd readout"),
    (".field-note", "field note"),
    (".route-cue", "route cue"),
    (".route-profile > span", "route profile readout"),
]

# Elements that must never be narrower than a readable measure.
PROSE_MIN_CHARS = 40

# An orphan is a last line carrying a single word: the typographic meaning of the
# word, stranded. A two-word closing phrase is a phrase, not an orphan.
ORPHAN_MAX_WORDS = 1

READ_LINES = """
(selector) => {
  const out = [];
  // Glyph boxes of different weights sit a pixel or two apart, so lines are
  // clustered by vertical centre with a tolerance rather than by an exact top.
  const cluster = (marks, tolerance) => {
    const sorted = [...marks].sort((a, b) => a.centre - b.centre);
    const lines = [];
    for (const mark of sorted) {
      const last = lines[lines.length - 1];
      if (last && mark.centre - last.centre <= tolerance) {
        last.marks.push(mark);
        last.centre = last.marks.reduce((s, m) => s + m.centre, 0) / last.marks.length;
      } else {
        lines.push({ centre: mark.centre, marks: [mark] });
      }
    }
    return lines.map(line => {
      const glyphs = line.marks.sort((a, b) => a.left - b.left);
      let text = '';
      let previous = null;
      let size = 0;
      for (const g of glyphs) {
        size = Math.max(size, g.size);
        if (previous && g.left - previous.right > size * 0.28) text += ' ';
        text += g.text;
        previous = g;
      }
      return {
        top: Math.round(line.centre),
        text: text.replace(/\\s+/g, ' ').trim(),
        left: glyphs[0].left,
        right: glyphs[glyphs.length - 1].right,
      };
    });
  };
  for (const el of document.querySelectorAll(selector)) {
    if (!el.getClientRects().length) continue;
    if (el.closest('[hidden]')) continue;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const marks = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue;
      if (!text) continue;
      const size = parseFloat(getComputedStyle(node.parentElement).fontSize) || 15;
      const range = document.createRange();
      let inSpace = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const space = /\s/.test(ch);
        if (space) {
          // A run of whitespace is one space; skipping it would weld a label to
          // the value that follows it.
          if (inSpace) continue;
          inSpace = true;
        } else inSpace = false;
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        if (!rect.width && !rect.height) continue;
        marks.push({ centre: rect.top + rect.height / 2, left: rect.left, right: rect.right, text: space ? ' ' : ch, size });
      }
    }
    const rect = el.getBoundingClientRect();
    out.push({
      text: el.innerText.replace(/\\s+/g, ' ').trim(),
      lines: cluster(marks, 5),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom },
      fontSize: parseFloat(getComputedStyle(el).fontSize),
    });
  }
  return out;
}
"""

READ_CHROME = """
() => {
  const doc = document.documentElement;
  const header = document.querySelector('header.soonami-masthead');
  const main = document.querySelector('#main');
  const r = header ? header.getBoundingClientRect() : null;
  const m = main ? main.getBoundingClientRect() : null;
  const bands = [...document.querySelectorAll('header.soonami-masthead, .banner-dock, .terrain-caption, .masthead-status')]
    .filter(el => el.getClientRects().length && !el.closest('[hidden]'))
    .map(el => { const b = el.getBoundingClientRect(); return { cls: el.className, top: b.top, bottom: b.bottom, height: b.height }; });
  return {
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    documentHeight: doc.scrollHeight,
    scrollable: doc.scrollHeight > window.innerHeight + 1,
    header: r ? { top: r.top, height: r.height, bottom: r.bottom } : null,
    main: m ? { top: m.top, bottom: m.bottom, height: m.height } : null,
    bands,
  };
}
"""

# Elements whose text must never be crushed below a readable measure.
READ_PROSE = """
() => {
  const out = [];
  const sel = 'p, li, dd, dt, label, td, th, figcaption, .finding-line, .masthead-status, .card-subhead, .exercise-boundary, .field-note, .route-cue';
  for (const el of document.querySelectorAll(sel)) {
    if (!el.getClientRects().length) continue;
    if (el.closest('[hidden]')) continue;
    // A form control's text is a list of options, not a rendered measure.
    if (['SELECT', 'OPTION', 'INPUT', 'TEXTAREA'].includes(el.tagName)) continue;
    if (el.querySelector('select, input, textarea')) continue;
    const text = (el.innerText || '').replace(/\\s+/g, ' ').trim();
    if (text.length < 24) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1) continue;
    const cs = getComputedStyle(el);
    // Measure by the widest single rendered line of the element.
    const range = document.createRange();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const marks = [];
    let node;
    while ((node = walker.nextNode())) {
      const t = node.nodeValue;
      if (!t || !t.trim()) continue;
      for (let i = 0; i < t.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        marks.push({ centre: r.top + r.height / 2 });
      }
    }
    const sorted = [...marks].sort((a, b) => a.centre - b.centre);
    const lines = [];
    for (const mark of sorted) {
      const last = lines[lines.length - 1];
      if (last && mark.centre - last.centre <= 5) {
        last.count += 1;
        last.centre = (last.centre * (last.count - 1) + mark.centre) / last.count;
      } else {
        lines.push({ centre: mark.centre, count: 1 });
      }
    }
    const counts = lines.map(l => l.count);
    if (!counts.length) continue;
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 60),
      width: Math.round(rect.width),
      chars: text.length,
      lines: counts.length,
      maxCharsPerLine: Math.max(...counts),
      minCharsPerLine: Math.min(...counts),
      fontSize: parseFloat(cs.fontSize),
      sample: text.slice(0, 70),
    });
  }
  return out;
}
"""


def sha256(url: str) -> str | None:
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return hashlib.sha256(response.read()).hexdigest()
    except Exception:
        return None


def served_bundles(base: str) -> dict:
    """The sha256 of the bundles the host actually served, or {} if it would not answer.

    A receipt with an empty `served` map is still a measurement of the pixels; it is
    just not tied to a release, and must not be quoted as one.
    """
    try:
        html = urllib.request.urlopen(base.rstrip("/") + "/", timeout=60).read().decode("utf-8", "replace")
    except Exception as error:  # a host that will not answer is not a measurement failure
        print(f"warning: could not read {base}: {error}", file=sys.stderr)
        return {}
    bundles = sorted(set(re.findall(r'assets/index-[A-Za-z0-9_-]+\.(?:js|css)', html)))
    out = {}
    for name in bundles:
        out[name] = sha256(base.rstrip("/") + "/" + name)
    return out


def capture(page, base: str, width: int, height: int) -> dict:
    page.set_viewport_size({"width": width, "height": height})
    page.goto(base.rstrip("/") + "/#explore", wait_until="load", timeout=120000)
    page.wait_for_timeout(2500)
    # The map is waited out: a receipt taken while the terrain loads measures the
    # loading state, not the workspace.
    try:
        page.wait_for_function(
            "() => { const el = document.querySelector('.terrain-rehearsal');"
            " return el && (el.dataset.state === 'ready' || el.dataset.state === 'flat'); }",
            timeout=90000,
        )
    except Exception:
        pass
    page.wait_for_timeout(1200)

    bands = {}
    for selector, label in BANDS:
        try:
            found = page.evaluate(READ_LINES, selector)
        except Exception:
            found = []
        for index, band in enumerate(found):
            lines = band["lines"]
            if not lines:
                continue
            last = lines[-1]
            words = [w for w in re.split(r"\s+", last["text"]) if w]
            bands[f"{label}#{index}"] = {
                "label": label,
                "selector": selector,
                "rect": band["rect"],
                "fontSize": band["fontSize"],
                "lineCount": len(lines),
                "lines": lines,
                "charsPerLine": [len(l["text"]) for l in lines],
                "lastLineWords": len(words),
                "orphan": len(lines) > 1 and len(words) <= ORPHAN_MAX_WORDS,
                "width": round(band["rect"]["width"], 1),
            }

    prose = page.evaluate(READ_PROSE)
    chrome = page.evaluate(READ_CHROME)

    return {
        "viewport": {"width": width, "height": height},
        "chrome": chrome,
        "bands": bands,
        "crushed": [p for p in prose if p["maxCharsPerLine"] < PROSE_MIN_CHARS and p["chars"] >= 40],
        "proseBlocks": len(prose),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("base", help="served origin, e.g. https://tsunami.nonarkara.org")
    parser.add_argument("out", help="path of the JSON receipt to write")
    parser.add_argument("--local", help="local dist directory to serve for the run")
    parser.add_argument("--port", type=int, default=4173)
    args = parser.parse_args()

    server = None
    base = args.base
    if args.local:
        import functools
        import http.server
        import socketserver
        import threading

        handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=args.local)
        handler.directory = args.local

        class Quiet(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def __init__(self, *a, **kw):
                super().__init__(*a, directory=args.local, **kw)

        socketserver.TCPServer.allow_reuse_address = True
        server = socketserver.TCPServer(("127.0.0.1", args.port), Quiet)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{args.port}"

    args_seen = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=[
                "--single-process",
                "--no-sandbox",
                "--use-gl=angle",
                "--use-angle=swiftshader",
                "--enable-unsafe-swiftshader",
            ])
            page = browser.new_page()
            for width, height in VIEWPORTS:
                print(f"measuring {width}x{height} …", file=sys.stderr)
                args_seen.append(capture(page, base, width, height))
            browser.close()
    finally:
        if server:
            server.shutdown()

    receipt = {
        "tool": "tools/viewport/bands.py",
        "base": args.base,
        "served": served_bundles(base),
        "viewports": args_seen,
    }
    with open(args.out, "w") as handle:
        json.dump(receipt, handle, indent=2)

    for view in args_seen:
        chrome = view["chrome"]
        share = round((chrome["header"]["height"] / chrome["viewportHeight"]) * 100, 1) if chrome.get("header") else 0
        print(f"{view['viewport']['width']}x{view['viewport']['height']}: "
              f"header {chrome['header']['height']:.0f}px ({share}% of viewport), "
              f"scrollable={chrome['scrollable']}, "
              f"crushed prose blocks={len(view['crushed'])}")
        for key, band in view["bands"].items():
            flag = " ORPHAN" if band["orphan"] else ""
            print(f"  {key}: {band['lineCount']} lines {band['charsPerLine']} chars{flag}")
            if flag:
                print(f"    last line: {band['lines'][-1]['text']!r}")
        for p_ in view["crushed"]:
            print(f"  CRUSHED {p_['cls'][:40]}: {p_['maxCharsPerLine']} chars/line, width {p_['width']}px — {p_['sample']!r}")
    print(f"\nwrote {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
