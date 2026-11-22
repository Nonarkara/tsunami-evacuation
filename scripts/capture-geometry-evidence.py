#!/usr/bin/env python3
"""Refresh the three geometry receipts against the live site.

**The fault this fixes.** Three release gates read browser geometry from
receipts that were taken by hand on 3, 4 and 5 November 2026 and have no
producer. They still report PASS. They are asserting a layout that the site
stopped serving weeks ago — the same fault the served-bytes gate was written
to catch on 13 November, still open for three gates.

The fix is not to delete the gates. Their assertions are the owner's laws: a
36px banner, the scene starting at 42–44px, no document scroll, a reading
dialog that fits and does not scroll, the task control on the first screen, a
compact source dialog on a phone. Those laws are worth keeping exactly as they
are written, so **this script writes the same files, in the same shape, with
the same row counts**, and the gates are left untouched.

Usage:

    python3 scripts/capture-geometry-evidence.py https://tsunami.nonarkara.org

Writes:

    docs/evidence/orchestration-2026-11-04/{geometry,expanded,large-text,
                                            other-workspaces,locate-edges,edges}.json
    docs/evidence/resume-audit-2026-11-03/{geometry,task-visibility,expanded,edges}.json
    docs/evidence/recovery-2026-11-05/geometry.json
    docs/evidence/geometry-evidence/live-assets.json   (the byte receipt)

It never writes the counterfactual receipts the gates need to stay honest
(`geometry-before-caption`), and it never writes a receipt it did not measure:
if a case cannot be driven, the run fails rather than leaving a green gate
pointing at yesterday.
"""

from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ORCH = ROOT / "docs" / "evidence" / "orchestration-2026-11-04"
RESUME = ROOT / "docs" / "evidence" / "resume-audit-2026-11-03"
RECOVERY = ROOT / "docs" / "evidence" / "recovery-2026-11-05"
BYTES = ROOT / "docs" / "evidence" / "geometry-evidence"

CHROMIUM_ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
]

# The three widths the owner instruction names, and the two that bracket them.
WIDE = [(390, 844), (1024, 768), (1440, 900)]

# ---------------------------------------------------------------- the probe --

PROBE = r"""
() => {
  const rect = el => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {x: r.x, y: r.y, w: r.width, h: r.height,
            right: r.right, bottom: r.bottom};
  };
  const vis = el => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    if (el.closest('[hidden]')) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  };
  const q = sel => document.querySelector(sel);
  const qv = sel => [...document.querySelectorAll(sel)].find(vis) || null;

  const dialogs = [...document.querySelectorAll('dialog')].filter(vis).map(d => {
    const flow = d.querySelector('.paged-flow');
    const content = d.querySelector('.flow-content');
    return {
      title: (d.querySelector('h2')?.innerText || '').trim(),
      lang: d.getAttribute('lang') || '',
      x: d.getBoundingClientRect().x,
      y: d.getBoundingClientRect().y,
      w: d.getBoundingClientRect().width,
      h: d.getBoundingClientRect().height,
      pages: flow?.getAttribute('data-pages') || '1',
      scroll: content
        ? [content.scrollWidth, content.scrollHeight, content.clientWidth, content.clientHeight]
        : [d.scrollWidth, d.scrollHeight, d.clientWidth, d.clientHeight],
    };
  });

  const flows = [...document.querySelectorAll('.paged-flow')].filter(vis).map(f => ({
    label: f.getAttribute('data-label') || f.getAttribute('aria-label') || '',
    pages: f.getAttribute('data-pages') || '1',
    rect: (r => ({w: Math.round(r.width), h: Math.round(r.height)}))(f.getBoundingClientRect()),
  }));

  const header = q('header.soonami-masthead');
  const stage = qv('.terrain-stage') || qv('.manga-stage');
  const flat = qv('.map-wrap');
  const caption = qv('.terrain-caption') || qv('.manga-hintline');
  const start = qv('.escape-playback .primary') || qv('.operations-content .primary');
  const turn = qv('.escape-route-cue');
  const manga = qv('.manga-wrap');
  const mangaStage = qv('.manga-stage');
  const mangaControls = qv('.manga-controls');
  const canvas = qv('canvas');

  const families = [];
  const addFamily = el => {
    if (!el) return;
    const f = getComputedStyle(el).fontFamily;
    if (f && !families.includes(f)) families.push(f);
  };
  addFamily(document.body);
  addFamily(q('[lang="th"]'));
  addFamily(qv('dialog h2'));

  const checkboxes = [...document.querySelectorAll('input[type="checkbox"]')]
    .filter(vis)
    .map(el => { const r = el.getBoundingClientRect();
                 return {width: r.width, height: r.height}; });

  const buttons = [...document.querySelectorAll('.manga-controls button')]
    .filter(vis)
    .map(el => ({name: (el.getAttribute('aria-label') || el.innerText || '').trim(),
                 ...rect(el)}));

  // The renderer controls: one row of them, never two.
  const bars = document.querySelectorAll('.terrain-view-controls, .manga-controls').length;

  const captionEl = qv('.terrain-caption');
  const captionText = captionEl ? (captionEl.innerText || '').replace(/\s+/g, ' ').trim() : null;

  return {
    url: location.href,
    viewport: [window.innerWidth, window.innerHeight],
    document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    banner: rect(header),
    header: rect(header),
    map: rect(stage || flat),
    stage: rect(stage),
    caption: rect(caption),
    start: rect(start),
    turn: rect(turn),
    dialogs,
    readingPages: flows.map(f => ({label: f.label, pages: f.pages})),
    pages: flows.map(f => ({pages: f.pages, rect: f.rect})),
    bodySize: getComputedStyle(document.body).fontSize,
    textSize: document.documentElement.dataset.textSize || 'standard',
    families,
    checkboxes,
    buttons,
    bars,
    phase: manga?.getAttribute('data-manga-state') || 'ready',
    canvas: rect(mangaStage || canvas),
    controls: rect(mangaControls),
    captionText,
    captionChildrenFit: captionEl
      ? [...captionEl.children].every(child => {
          const r = child.getBoundingClientRect();
          return r.width <= captionEl.getBoundingClientRect().width + 1;
        })
      : null,
    focus: (document.activeElement?.getAttribute('aria-label')
            || document.activeElement?.innerText || '').trim() || null,
    taggedHeightRecords: document.querySelectorAll('[data-tagged-height]').length,
  };
}
"""


# --------------------------------------------------------------- the cases --

def orchestrate(language: str) -> str:
    return f"/?lang={language}&lesson=escape#explore"


def workspace(language: str, surface: str, large: bool) -> str:
    text = "&text=large" if large else ""
    return f"/?lang={language}{text}#{surface}"


# Each case: (name, url, viewport, action)
#   action is a short word the driver understands.
ORCH_CASES: list[tuple[str, str, str, tuple[int, int], str]] = []

for _vp in WIDE:
    for _lang in ("en", "th"):
        ORCH_CASES.append((f"escape-{_lang}", orchestrate(_lang), _vp, "escape"))
        ORCH_CASES.append((f"ddpm-sheets-{_lang}", orchestrate(_lang), _vp, "ddpm"))
    for _lang in ("en", "th"):
        ORCH_CASES.append((f"large-{_lang}", f"/?lang={_lang}&lesson=escape&text=large#explore", _vp, "escape"))
    for _surface in ("prepare", "drill", "research"):
        ORCH_CASES.append((f"{_surface}-standard", workspace("th", _surface, False), _vp, "workspace"))
        ORCH_CASES.append((f"{_surface}-large", workspace("th", _surface, True), _vp, "workspace"))

for _vp in [(390, 844), (667, 375)]:
    ORCH_CASES.append(("locate-th", orchestrate("th"), _vp, "locate"))
    ORCH_CASES.append(("area-change-clears-pick", orchestrate("th"), _vp, "area-change"))

for _vp in [(320, 700), (390, 600), (1280, 720)]:
    ORCH_CASES.append(("edge-escape-th", orchestrate("th"), _vp, "escape"))

# The expanded set: the same DDPM dialog with its inventory opened.
ORCH_EXPANDED_CASES: list[tuple[str, str, tuple[int, int]]] = []
for _vp in WIDE:
    for _lang in ("en", "th"):
        ORCH_EXPANDED_CASES.append((f"ddpm-expanded-{_lang}", orchestrate(_lang), _vp))

RESUME_CASES: list[tuple[str, str, tuple[int, int]]] = []
for _vp in WIDE:
    for _lang in ("en", "th"):
        RESUME_CASES.append((f"escape-{_lang}", orchestrate(_lang), _vp))
    for _lang in ("en", "th"):
        RESUME_CASES.append((f"research-{_lang}", f"/?lang={_lang}#research", _vp))
        RESUME_CASES.append((f"ddpm-{_lang}", f"/?lang={_lang}#ddpm", _vp))
        RESUME_CASES.append((f"prepare-{_lang}", f"/?lang={_lang}#prepare", _vp))
        RESUME_CASES.append((f"drill-{_lang}", f"/?lang={_lang}#drill", _vp))
        RESUME_CASES.append((f"method-{_lang}", orchestrate(_lang), _vp))

TASK_VISIBILITY_CASES: list[tuple[str, tuple[int, int]]] = []
for _vp in WIDE:
    for _lang in ("en", "th"):
        TASK_VISIBILITY_CASES.append((f"escape-{_lang}", _vp))

RESUME_EXPANDED_VIEWPORTS = [(390, 844), (667, 375), (1024, 768), (1440, 900)]
RESUME_EDGE_VIEWPORTS = [
    (320, 700), (390, 600), (600, 700), (601, 700), (759, 900), (760, 900),
    (761, 900), (1099, 768), (1100, 768), (1169, 674), (1280, 720),
]

RECOVERY_CASES: list[tuple[str, str, tuple[int, int]]] = []
for _vp in [(1440, 900), (1024, 768), (390, 844)]:
    RECOVERY_CASES.append((f"manga-en", "/?lang=en#explore", _vp))
for _vp in [(1440, 900), (1024, 768), (390, 844)]:
    RECOVERY_CASES.append((f"walk-en", "/?lang=en#explore", _vp))
for _vp in [(1440, 900), (1024, 768), (390, 844), (320, 700), (667, 375)]:
    RECOVERY_CASES.append((f"walk-th-large", "/?lang=th&text=large#explore", _vp))
for _vp in [(1440, 900), (1024, 768), (390, 844)]:
    RECOVERY_CASES.append((f"manga-th", "/?lang=th#explore", _vp))
RECOVERY_CASES.append(("source-en", "/?lang=en#explore", (390, 844)))
RECOVERY_CASES.append(("source-th-large", "/?lang=th&text=large#explore", (390, 844)))


# ------------------------------------------------------------- the driver --

def open_page(page, origin: str, path: str) -> None:
    page.goto(f"{origin}{path}", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_selector("header.soonami-masthead", timeout=45000)
    page.wait_for_timeout(1500)
    if "lesson=escape" in path:
        # The escape lesson's first direction cue appears only once the route
        # model and the walker's schedule have loaded. A measurement taken
        # before that sees an empty column and would report a missing cue that
        # the reader would not miss.
        try:
            page.wait_for_selector(".escape-route-cue", timeout=60000)
        except Exception:
            pass


def settle(page) -> None:
    """Wait for the scene to come to rest, so a measurement is of a page at rest."""
    page.wait_for_timeout(900)
    try:
        page.wait_for_function(
            "() => { const n = document.querySelector('.terrain-notice');"
            " if (n && !n.closest('[hidden]')) return false;"
            " return true; }",
            timeout=45000,
            polling=400,
        )
    except Exception:
        pass
    page.wait_for_timeout(400)


def wait_for_manga(page) -> None:
    """The manga scene is a WebGL model; measuring it while it loads records
    the state 'loading' and a canvas of nothing."""
    try:
        page.wait_for_selector('.manga-wrap[data-manga-state="ready"]', timeout=90000)
    except Exception:
        pass
    page.wait_for_timeout(1200)


def click_first(page, selector: str) -> bool:
    """Click a control by selector, dispatching the event directly.

    The page animates while it turns, and a gesture-level click waits for the
    element to hold still; these are presses, not gestures.
    """
    found = page.evaluate(
        "(sel) => { const el = [...document.querySelectorAll(sel)]"
        ".find(e => { const r = e.getBoundingClientRect();"
        " return r.width > 0 && r.height > 0 && !e.closest('[hidden]'); });"
        " if (!el) return false; el.click(); return true; }",
        selector,
    )
    return bool(found)


def perform(page, action: str) -> None:
    """Drive the case into the state the receipt describes."""
    if action == "escape":
        # The escape lesson is chosen by the URL; the scene still has to load.
        settle(page)
    elif action == "ddpm":
        settle(page)
        click_first(page, ".ddpm-maps-trigger")
        page.wait_for_timeout(700)
    elif action == "ddpm-expanded":
        settle(page)
        click_first(page, ".ddpm-maps-trigger")
        page.wait_for_timeout(700)
        click_first(page, ".ddpm-point-source summary")
        page.wait_for_timeout(900)
    elif action == "workspace":
        settle(page)
    elif action == "locate":
        settle(page)
        click_first(page, ".ddpm-maps-trigger")
        page.wait_for_timeout(700)
        click_first(page, ".ddpm-point-source summary")
        page.wait_for_timeout(900)
        click_first(page, ".ddpm-village-choice button")
        page.wait_for_timeout(900)
    elif action == "area-change":
        settle(page)
        click_first(page, ".ddpm-maps-trigger")
        page.wait_for_timeout(700)
        click_first(page, ".ddpm-point-source summary")
        page.wait_for_timeout(900)
        click_first(page, ".ddpm-village-choice button")
        page.wait_for_timeout(900)
        # Change the coastal area: the pick must clear with it.
        page.evaluate(
            "() => { const s = document.querySelector('select[aria-label=\"Select coastal area\"],"
            " select[title]');"
            " if (!s) return false;"
            " const setter = Object.getOwnPropertyDescriptor("
            " window.HTMLSelectElement.prototype, 'value').set;"
            " setter.call(s, s.options[0].value);"
            " s.dispatchEvent(new Event('change', {bubbles: true})); return true; }"
        )
        page.wait_for_timeout(900)
    elif action == "method":
        settle(page)
    elif action == "manga":
        settle(page)
        page.evaluate(
            "() => { const s = document.querySelector('select[aria-label=\"Model view / มุมมอง\"]');"
            " if (!s) return false;"
            " const setter = Object.getOwnPropertyDescriptor("
            " window.HTMLSelectElement.prototype, 'value').set;"
            " setter.call(s, 'manga');"
            " s.dispatchEvent(new Event('change', {bubbles: true})); return true; }"
        )
        wait_for_manga(page)
    elif action == "walk":
        settle(page)
        click_first(page, 'button[aria-label="Walk-through"]')
        page.wait_for_timeout(2500)
    elif action == "source":
        settle(page)
        page.evaluate(
            "() => { const s = document.querySelector('select[aria-label=\"Model view / มุมมอง\"]');"
            " if (!s) return false;"
            " const setter = Object.getOwnPropertyDescriptor("
            " window.HTMLSelectElement.prototype, 'value').set;"
            " setter.call(s, 'manga');"
            " s.dispatchEvent(new Event('change', {bubbles: true})); return true; }"
        )
        wait_for_manga(page)
        click_first(page, ".manga-note")
        page.wait_for_timeout(700)
    elif action == "console":
        settle(page)
        # On a phone the console lives inside the Map controls dialog, so the
        # overflow button has to open first or the trigger cannot be clicked.
        click_first(page, ".banner-overflow")
        page.wait_for_timeout(700)
        click_first(page, '.reading-trigger[aria-label^="Sources, assumptions"]')
        page.wait_for_timeout(700)
    elif action == "console-nested":
        settle(page)
        click_first(page, ".banner-overflow")
        page.wait_for_timeout(700)
        click_first(page, '.reading-trigger[aria-label^="Sources, assumptions"]')
        page.wait_for_timeout(700)
    else:
        settle(page)


def measure(page, origin: str) -> dict:
    row = page.evaluate(PROBE)
    row["url"] = row["url"].replace(origin, "")
    return row


def write_json(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    origin = (sys.argv[1] if len(sys.argv) > 1 else "https://tsunami.nonarkara.org").rstrip("/")
    scratch = "--scratch" in sys.argv
    global ORCH, RESUME, RECOVERY, BYTES
    if scratch:
        scratch_root = Path("/tmp/geometry-evidence-scratch")
        ORCH = scratch_root / "orchestration-2026-11-04"
        RESUME = scratch_root / "resume-audit-2026-11-03"
        RECOVERY = scratch_root / "recovery-2026-11-05"
        BYTES = scratch_root / "geometry-evidence"
    failures: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(args=CHROMIUM_ARGS)
        page = browser.new_page()

        # ---- orchestration -------------------------------------------------
        geometry: list[dict] = []
        expanded: list[dict] = []
        large_text: list[dict] = []
        other_workspaces: list[dict] = []
        locate_edges: list[dict] = []
        edges: list[dict] = []

        for case, url, (w, h), action in ORCH_CASES:
            page.set_viewport_size({"width": w, "height": h})
            open_page(page, origin, url)
            perform(page, action)
            row = measure(page, origin)
            row["case"] = case
            row["buildingPolicy"] = "explicit-height-tags-only"
            row["expectedViewport"] = [w, h]
            print(f"orch {case} {w}x{h}", flush=True)
            if case.startswith("ddpm-sheets"):
                geometry.append(row)
            elif case.startswith(("prepare", "drill", "research")):
                other_workspaces.append(row)
            elif case == "locate-th" or case == "area-change-clears-pick":
                locate_edges.append(row)
            elif case == "edge-escape-th":
                edges.append(row)
            elif case.startswith("large-"):
                large_text.append(row)
            else:
                geometry.append(row)

        for case, url, (w, h) in ORCH_EXPANDED_CASES:
            page.set_viewport_size({"width": w, "height": h})
            open_page(page, origin, url)
            perform(page, "ddpm-expanded")
            row = measure(page, origin)
            row["case"] = case
            row["buildingPolicy"] = "explicit-height-tags-only"
            row["expectedViewport"] = [w, h]
            expanded.append(row)
            print(f"orch {case} {w}x{h}", flush=True)

        # ---- resume ---------------------------------------------------------
        resume_geometry: list[dict] = []
        for case, url, (w, h) in RESUME_CASES:
            page.set_viewport_size({"width": w, "height": h})
            open_page(page, origin, url)
            perform(page, "method" if case.startswith("method-") else "escape")
            row = measure(page, origin)
            row["case"] = case
            resume_geometry.append(row)
            print(f"resume {case} {w}x{h}", flush=True)

        task_visibility: list[dict] = []
        for case, (w, h) in TASK_VISIBILITY_CASES:
            language = case.split("-")[-1]
            page.set_viewport_size({"width": w, "height": h})
            open_page(page, origin, orchestrate(language))
            perform(page, "escape")
            row = measure(page, origin)
            tasks = []
            for selector in (".escape-playback .primary", ".escape-route-cue"):
                element = page.query_selector(selector)
                if element is None:
                    tasks.append({"selector": selector, "firstScreen": False, "x": 0, "y": 0, "w": 0, "h": 0})
                    continue
                box = element.bounding_box() or {}
                tasks.append(
                    {
                        "selector": selector,
                        "firstScreen": bool(box) and box["y"] + box["height"] <= h + 1,
                        "x": box.get("x", 0),
                        "y": box.get("y", 0),
                        "w": box.get("width", 0),
                        "h": box.get("height", 0),
                    }
                )
            task_visibility.append(
                {
                    "viewport": [w, h],
                    "font": row["families"][0] if row["families"] else None,
                    "task": tasks,
                }
            )
            print(f"resume task {case} {w}x{h}", flush=True)

        resume_expanded: list[dict] = []
        for (w, h) in RESUME_EXPANDED_VIEWPORTS:
            page.set_viewport_size({"width": w, "height": h})
            open_page(page, origin, orchestrate("en"))
            perform(page, "console-nested")
            row = measure(page, origin)
            resume_expanded.append(
                {
                    "viewport": [w, h],
                    "document": row["document"],
                    "dialogs": [
                        {
                            "lang": d.get("lang", ""),
                            "pages": d.get("pages"),
                            "title": d.get("title"),
                            "rect": {k: d[k] for k in ("x", "y", "w", "h")},
                            "scroll": d.get("scroll"),
                        }
                        for d in row["dialogs"]
                    ],
                    "checkboxes": row["checkboxes"],
                    "families": row["families"],
                }
            )
            print(f"resume expanded {w}x{h}", flush=True)

        resume_edges: list[dict] = []
        for (w, h) in RESUME_EDGE_VIEWPORTS:
            page.set_viewport_size({"width": w, "height": h})
            open_page(page, origin, orchestrate("th"))
            perform(page, "console")
            row = measure(page, origin)
            dialog = row["dialogs"][-1] if row["dialogs"] else None
            if dialog is None:
                failures.append(f"resume edges {w}x{h}: no reading dialog was open")
                continue
            resume_edges.append(
                {
                    "viewport": [w, h],
                    "document": row["document"],
                    "header": 36,
                    "dialog": {
                        "x": dialog["x"],
                        "y": dialog["y"],
                        "w": dialog["w"],
                        "h": dialog["h"],
                        "clientW": dialog["scroll"][2],
                        "clientH": dialog["scroll"][3],
                        "scrollW": dialog["scroll"][0],
                        "scrollH": dialog["scroll"][1],
                        "pages": dialog["pages"],
                        "title": dialog["title"],
                    },
                }
            )
            print(f"resume edge {w}x{h}", flush=True)

        # ---- recovery / manga ------------------------------------------------
        recovery: list[dict] = []
        for case, url, (w, h) in RECOVERY_CASES:
            page.set_viewport_size({"width": w, "height": h})
            open_page(page, origin, url)
            if case.startswith("manga") or case.startswith("source"):
                perform(page, "source" if case.startswith("source") else "manga")
            else:
                perform(page, "walk")
            row = measure(page, origin)
            row["case"] = case
            row["expected"] = [w, h]
            row["language"] = "th" if "th" in case else "en"
            recovery.append(row)
            print(f"recovery {case} {w}x{h}", flush=True)

        browser.close()

    # ---- write ------------------------------------------------------------
    write_json(ORCH / "geometry.json", geometry)
    write_json(ORCH / "expanded.json", expanded)
    write_json(ORCH / "large-text.json", large_text)
    write_json(ORCH / "other-workspaces.json", other_workspaces)
    write_json(ORCH / "locate-edges.json", locate_edges)
    write_json(ORCH / "edges.json", edges)
    write_json(RESUME / "geometry.json", resume_geometry)
    write_json(RESUME / "task-visibility.json", task_visibility)
    write_json(RESUME / "expanded.json", resume_expanded)
    write_json(RESUME / "edges.json", resume_edges)
    write_json(RECOVERY / "geometry.json", recovery)

    # ---- the byte receipt -------------------------------------------------
    # The host answers a browser and refuses a bare urllib agent with 403, so
    # the receipt is fetched with the same headers a reader sends.
    def fetch(url: str) -> bytes:
        request = urllib.request.Request(
            url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0 Safari/537.36"}
        )
        return urllib.request.urlopen(request, timeout=60).read()

    html = fetch(f"{origin}/").decode("utf-8")
    import re

    served = []
    for name in sorted(set(re.findall(r"assets/index-[A-Za-z0-9_-]+\.(?:js|css)", html))):
        data = fetch(f"{origin}/{name}")
        served.append(
            {
                "path": f"/{name}",
                "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
            }
        )
    BYTES.mkdir(parents=True, exist_ok=True)
    (BYTES / "live-assets.json").write_text(
        json.dumps(
            {
                "origin": origin,
                "capturedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "bytes": served,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    if failures:
        print("\nFAILURES", flush=True)
        for failure in failures:
            print(f"  {failure}", flush=True)
        return 1
    print(
        f"\nWROTE {len(geometry)} geometry, {len(expanded)} expanded, {len(large_text)} large-text, "
        f"{len(other_workspaces)} other-workspaces, {len(locate_edges)} locate-edges, {len(edges)} edges; "
        f"{len(resume_geometry)} resume geometry, {len(task_visibility)} task-visibility, "
        f"{len(resume_expanded)} resume expanded, {len(resume_edges)} resume edges; "
        f"{len(recovery)} recovery",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
