#!/usr/bin/env python3
"""Capture the live Escape practice view at target viewports and dump geometry.

Usage:
  python3 scripts/capture-escape.py [url] [outdir]

Requires the Homebrew Playwright Python package and its Chromium build.
Reports layout numbers that a screenshot alone cannot prove: masthead height,
stage share of viewport, document overflow, task-column scroll, and box area
against text area for the compact controls.
"""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "https://tsunami.nonarkara.org/?lang=th&lesson=escape#explore"
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "docs/evidence/escape-capture")

VIEWPORTS = [
    ("390x844", 390, 844),
    ("1024x768", 1024, 768),
    ("1440x900", 1440, 900),
]

MEASURE = """
() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) };
  };
  const textArea = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) +
                parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const scale = parseFloat(cs.fontSize) * 1.45;
    const glyphs = (el.textContent || "").trim().length;
    return {
      boxArea: Math.round(r.width * r.height),
      padArea: Math.round(pad * Math.max(r.width, 1)),
      textAreaEstimate: Math.round(glyphs * scale * scale * 0.55),
      glyphs,
    };
  };
  const boxes = {};
  const sels = [
    "header.masthead", ".terrain-stage", ".terrain-canvas", ".terrain-operations",
    ".escape-guide", ".escape-playback", ".terrain-caption", ".escape-route-cue",
    ".escape-route-progress", ".escape-review", ".terrain-analysis-row",
  ];
  for (const s of sels) boxes[s] = box(s);
  const play = document.querySelector(".escape-playback .primary");
  const guide = document.querySelector(".escape-guide");
  const overflow = [];
  for (const el of document.querySelectorAll("*")) {
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX !== "visible") {
      overflow.push({ tag: el.tagName, cls: el.className && el.className.toString().slice(0, 60), by: el.scrollWidth - el.clientWidth });
    }
    if (overflow.length > 12) break;
  }
  return {
    viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
    document: { scrollH: document.documentElement.scrollHeight, scrollW: document.documentElement.scrollWidth },
    mastheadShare: +(document.querySelector("header.masthead") ? document.querySelector("header.masthead").getBoundingClientRect().height / innerHeight : 0).toFixed(3),
    stageShare: +(document.querySelector(".terrain-stage") ? document.querySelector(".terrain-stage").getBoundingClientRect().height / innerHeight : 0).toFixed(3),
    boxes,
    play: textArea(play),
    guide: textArea(guide),
    opsScroll: (() => { const o = document.querySelector(".terrain-operations"); return o ? { clientH: o.clientHeight, scrollH: o.scrollHeight } : null; })(),
    overflow,
    guideText: (document.querySelector(".escape-guide")?.innerText || "").slice(0, 1200),
  };
}
"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, width, height in VIEWPORTS:
            page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=2)
            page.goto(URL, wait_until="networkidle")
            page.wait_for_timeout(3500)  # terrain tiles and DEM settle
            results[name] = page.evaluate(MEASURE)
            page.screenshot(path=str(OUT / f"{name}.png"))
            page.close()
        browser.close()
    (OUT / "geometry.json").write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
