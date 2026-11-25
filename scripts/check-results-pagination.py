"""Results pagination in Chromium AND WebKit: no control split across pages, no control that moves.

Usage:
    python3 scripts/check-results-pagination.py http://127.0.0.1:4173
    python3 scripts/check-results-pagination.py https://tsunami.nonarkara.org

Release-time, like the other evidence gates (needs Playwright with chromium and webkit).
It guards four faults found on 15 November 2026, each invisible to a Chromium-only receipt:
  - WebKit will not fragment a flex box across columns, so the package card jumped whole
    to page 2 and left ~170px empty on the phone opening page;
  - the measure ladder split across two pages;
  - choosing a package made its row bold, the ladder grew a line and jumped to the next
    page under the reader's finger;
  - in phone landscape the 160px chart could never sit whole on a 163px page.
"""
import argparse
import os
import sys
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("origin", nargs="?", default="http://127.0.0.1:4173")
parser.add_argument("--engine", choices=("chromium", "webkit"))
args = parser.parse_args()
BASE = args.origin.rstrip("/")
SIZES = [(390, 844), (393, 659), (390, 600), (320, 700), (667, 375), (844, 390), (1024, 768)]

PLACE = r"""() => {
  const pane = document.querySelector('.evidence-pane');
  const win = pane.querySelector('.flow-window').getBoundingClientRect();
  const pages = sel => {
    const e = pane.querySelector(sel); if (!e) return null;
    const rs = [...e.getClientRects()].filter(r => r.width > 20 && r.height > 2);
    return [...new Set(rs.map(r => Math.floor((r.left - win.left + 4) / (win.width + 16))))];
  };
  const l = pane.querySelector('.measure-ladder');
  return { ladder: pages('.measure-ladder'), chart: pages('.comparison-selector'),
           ladderBox: [...l.getClientRects()].map(r => `${Math.round(r.left)}/${Math.round(r.height)}`).join(' ') };
}"""


def open_results(page, lang):
    page.goto(f"{BASE}/?lang={lang}#explore", wait_until="domcontentloaded", timeout=120000)
    page.wait_for_timeout(2000)
    page.evaluate("""() => { const s = document.querySelector('select:has(option[value="evidence"])');
      s.value = 'evidence'; s.dispatchEvent(new Event('change', { bubbles: true })); }""")
    page.wait_for_selector(".evidence-pane .paged-flow[data-pages]", state="attached", timeout=30000)
    page.wait_for_timeout(1200)


failures, cases = [], 0
with sync_playwright() as p:
    engines = (getattr(p, args.engine),) if args.engine else (p.chromium, p.webkit)
    headed = os.environ.get("SOONAMI_SMOKE_HEADED") == "1"
    for engine in engines:
        launch_args = ["--use-gl=angle"] if headed and engine.name == "chromium" else []
        browser = engine.launch(headless=not headed, args=launch_args)
        for lang in ("en", "th"):
            for w, h in SIZES:
                page = browser.new_page(viewport={"width": w, "height": h})
                open_results(page, lang)
                tag = f"{engine.name} {lang} {w}x{h}"
                seen = []
                for i in (4, 0, 1, 2, 3):
                    page.locator(".evidence-pane .measure-ladder button").nth(i).dispatch_event("click")
                    page.wait_for_timeout(400)
                    r = page.evaluate(PLACE)
                    seen.append(r["ladderBox"])
                    for name in ("ladder", "chart"):
                        if r[name] is not None and len(r[name]) != 1:
                            failures.append(f"{tag} package {i}: the {name} spans pages {r[name]}")
                if len(set(seen)) != 1:
                    failures.append(f"{tag}: the ladder moves when a package is chosen {seen}")
                cases += 1
                print(f"Checked {tag}", flush=True)
                page.close()
        browser.close()

if failures:
    print("RESULTS_PAGINATION_FAIL")
    for f in dict.fromkeys(failures):
        print("  " + f)
    sys.exit(1)
print(f"RESULTS_PAGINATION_PASS: {cases} cases ({args.engine or 'chromium + webkit'}, en + th), every package choice, "
      "ladder and chart each on one page, ladder fixed in place")
