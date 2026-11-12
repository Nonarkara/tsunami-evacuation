#!/usr/bin/env python3
"""Prove the critical components work in a real browser, not in a unit test.

The gates in `scripts/` read receipts. This script produces a fresh one: it drives a
built site in Chromium and checks the things a release would be broken without.

    python3 scripts/verify-components.py --local dist --out /tmp/components.json

What it checks
--------------
- the terrain reaches a ready state, so a receipt is never taken mid-load;
- an imported research replay actually re-shades the water as the frame advances
  (the depth ramp is measured on the rendered pixels, because a ramp scaled to its
  own current maximum looks fine and shows nothing);
- the crowd roster conserves its total;
- a drill record survives a reload on the device that entered it;
- every research index link resolves to a section that exists;
- the data-and-sources dialog opens and stays inside the viewport;
- the masthead is one row and has room for its controls.

It exits non-zero when a check fails, so it can be run before a release.
"""

import argparse
import functools
import http.server
import json
import socketserver
import sys
import threading
import time
from pathlib import Path

from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
CHROMIUM_ARGS = [
    "--single-process",
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
]

# A synthetic replay. It is not a tsunami scenario and says so in its own title:
# its only job is to give the browser a file whose depth changes over time.
REPLAY = {
    "schemaVersion": 1,
    "areaId": "khao-lak",
    "title": "Synthetic depth replay for component verification. Not a tsunami scenario.",
    "sourceUrl": "https://example.org/synthetic-depth-replay",
    "model": "verification fixture",
    "license": "CC0",
    "timeOrigin": "warning",
    "verticalDatum": "MSL",
    "depthUnit": "m",
    "grid": {
        "west": 98.245,
        "east": 98.300,
        "south": 8.660,
        "north": 8.760,
        "rows": 12,
        "cols": 12,
        "rowOrder": "north-to-south",
    },
    "frames": [],
}

for index, seconds in enumerate((0, 600, 1200, 1800)):
    depth = []
    for row in range(12):
        for col in range(12):
            # A shallow sheet that deepens and spreads over the four frames.
            value = round(0.2 + 0.9 * index + 0.05 * ((row * 12 + col) % 7), 3)
            depth.append(value if (row + col + index) % 11 != 0 else None)
    REPLAY["frames"].append({"seconds": seconds, "depthM": depth})


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve(directory: str, port: int):
    handler = functools.partial(Quiet, directory=directory)
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def set_range(page, selector: str, value: float):
    """Set a range input the way React expects, then let the app react."""
    page.eval_on_selector(
        selector,
        """(el, value) => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(el, String(value));
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }""",
        value,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--local", default="dist", help="built site to serve")
    parser.add_argument("--port", type=int, default=4180)
    parser.add_argument("--out", default="/tmp/components.json")
    parser.add_argument("--fixture", default="/tmp/verify-replay.json")
    args = parser.parse_args()

    Path(args.fixture).write_text(json.dumps(REPLAY), encoding="utf-8")
    server = serve(args.local, args.port)
    base = f"http://127.0.0.1:{args.port}"
    checks = []

    def open_section(page, base: str, section: str) -> bool:
        """Open a section and reload, because a hash change alone does not re-read it."""
        page.goto(f"{base}/#{section}", wait_until="load", timeout=60000)
        page.reload(wait_until="load", timeout=60000)
        page.wait_for_timeout(1600)
        return page.get_attribute("header.soonami-masthead", "data-page") == section

    def check(name: str, ok: bool, detail: str = ""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})
        print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f" — {detail}" if detail else ""), flush=True)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=CHROMIUM_ARGS)
            page = browser.new_page(viewport={"width": 1440, "height": 900})

            # 1 — the terrain must reach a ready state before anything is measured.
            page.goto(base + "/#explore", wait_until="load", timeout=120000)
            page.wait_for_timeout(2000)
            try:
                page.wait_for_function(
                    "() => { const el = document.querySelector('.terrain-rehearsal');"
                    " return el && (el.dataset.state === 'ready' || el.dataset.state === 'flat'); }",
                    timeout=90000,
                )
            except Exception:
                pass
            state = page.get_attribute(".terrain-rehearsal", "data-state")
            check("terrain reaches a ready state", state in ("ready", "flat"), f"data-state={state}")

            # 2 — the crowd roster conserves its total.
            roster = page.evaluate(
                """() => {
                    const legend = [...document.querySelectorAll('.rehearsal-readout .stack-legend > div')];
                    const values = legend.map(d => {
                        const dd = d.querySelector('dd');
                        return dd ? Number(dd.textContent.replace(/[^0-9.]/g, '')) : 0;
                    });
                    const total = Number((document.querySelector('.stack-track')?.getAttribute('aria-label') || '')
                        .split('/').pop().replace(/[^0-9.]/g, ''));
                    return { values, total, labels: legend.map(d => d.innerText.trim()) };
                }"""
            )
            summed = sum(roster["values"])
            check(
                "crowd roster conserves its total",
                roster["total"] > 0 and summed == roster["total"],
                f"{roster['labels']} = {summed} of {roster['total']}",
            )

            # 3 — the masthead carries a symbol for every section, and each opens it.
            labels = page.eval_on_selector_all(
                ".masthead-nav .console-trigger", "els => els.map(e => e.getAttribute('aria-label'))")
            check(
                "the masthead carries five section symbols",
                len(labels) == 5,
                ", ".join(labels),
            )
            page.click(".masthead-nav .console-trigger[aria-label^='DDPM']")
            page.wait_for_timeout(1400)
            check(
                "the DDPM symbol opens the DDPM evidence page",
                page.get_attribute("header.soonami-masthead", "data-page") == "ddpm",
                f"data-page={page.get_attribute('header.soonami-masthead', 'data-page')}",
            )
            page.goto(base + "/#explore", wait_until="load", timeout=60000)
            page.reload(wait_until="load", timeout=60000)
            page.wait_for_timeout(2200)
            try:
                page.wait_for_function(
                    "() => { const el = document.querySelector('.terrain-rehearsal');"
                    " return el && el.dataset.state === 'ready'; }", timeout=60000)
            except Exception:
                pass

            # 4 — the rehearsal clock runs when the task is started.
            before = float(page.get_attribute(".terrain-rehearsal", "data-exercise-seconds"))
            page.evaluate(
                """() => {
                    const rate = document.querySelector("select[aria-label^='Playback speed']");
                    if (rate) { const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
                        setter.call(rate, '30'); rate.dispatchEvent(new Event('change', { bubbles: true })); }
                    const play = document.querySelector('.rehearsal-play');
                    if (play && !play.disabled) play.click();
                }"""
            )
            # Poll: a software renderer stalls past the 250 ms cap, so the clock can
            # take seconds of wall time to move. The contract is that it moves.
            after = before
            deadline = time.time() + 30
            while time.time() < deadline and after <= before:
                page.wait_for_timeout(1000)
                after = float(page.get_attribute(".terrain-rehearsal", "data-exercise-seconds"))
            check(
                "the rehearsal clock advances while the task runs",
                after > before,
                f"data-exercise-seconds {before} -> {after} "
                "(the clock ignores frame gaps over 250 ms by design, so a software "
                "renderer runs it slower than wall time)",
            )
            page.evaluate("() => { const play = document.querySelector('.rehearsal-play'); if (play) play.click(); }")
            page.wait_for_timeout(1200)
            paused = float(page.get_attribute(".terrain-rehearsal", "data-exercise-seconds"))
            page.wait_for_timeout(2500)
            still = float(page.get_attribute(".terrain-rehearsal", "data-exercise-seconds"))
            check(
                "pausing stops the exercise clock",
                still == paused,
                f"data-exercise-seconds {paused} -> {still}",
            )

            # 5 — an imported replay re-shades the water as the frame advances.
            try:
                page.set_input_files("input[type=file]", args.fixture)
            except Exception:
                page.eval_on_selector(
                    "input[type=file]",
                    """(el) => el.closest('details')?.setAttribute('open', '')""",
                )
                page.set_input_files("input[type=file]", args.fixture)
            page.wait_for_timeout(2500)
            source = page.get_attribute(".terrain-rehearsal", "data-water-source")
            check("research replay imports", source == "imported-replay", f"data-water-source={source}")

            stage = page.locator(".terrain-stage")
            box = stage.bounding_box()
            clip = {"x": box["x"], "y": box["y"], "width": box["width"], "height": box["height"]}
            # The exercise clock and the replay clock are the same clock in study mode.
            scrubber = None
            for candidate in (".rehearsal-timeline input[type=range]",
                              ".imported-replay-controls input[type=range]"):
                if page.locator(candidate).count():
                    scrubber = candidate
                    break
            check("a replay scrubber is reachable", scrubber is not None, str(scrubber))
            last_second = page.evaluate(
                "sel => { const el = document.querySelector(sel); return el ? Number(el.max) : 0; }",
                scrubber)
            depths = []
            captions = []
            for seconds in (0, last_second):
                set_range(page, scrubber, seconds)
                page.wait_for_timeout(1800)
                depths.append(page.get_attribute(".terrain-rehearsal", "data-water-seconds"))
                captions.append(page.inner_text(".terrain-caption .caption-top > span:first-child"))
                page.screenshot(path=f"/tmp/verify-water-{int(seconds)}.png", clip=clip)
            first = Image.open("/tmp/verify-water-0.png").convert("RGB")
            last = Image.open(f"/tmp/verify-water-{int(last_second)}.png").convert("RGB")
            diff = ImageChops.difference(first, last)
            stat = ImageStat.Stat(diff)
            moved = sum(1 for pixel in diff.getdata() if max(pixel) > 6)
            total_px = first.size[0] * first.size[1]
            check(
                "water shading changes across the replay",
                moved / total_px > 0.02 and max(stat.mean) > 1.0,
                f"{moved}/{total_px} pixels moved ({100*moved/total_px:.1f}%), "
                f"mean delta RGB {[round(v, 2) for v in stat.mean]}, "
                f"frames {depths}; caption {captions}",
            )
            check(
                "the caption reports the frame depth",
                len(set(captions)) == 2 and "depth" in captions[0].lower(),
                " | ".join(captions),
            )

            # 4 — the data-and-sources dialog opens and stays inside the viewport.
            page.goto(base + "/#explore", wait_until="load", timeout=60000)
            page.wait_for_timeout(1500)
            page.select_option("select[aria-label='Model view / มุมมอง']", "evidence")
            page.wait_for_timeout(1200)
            trigger = page.locator(".technical-data-trigger").first
            opened = False
            try:
                trigger.click(timeout=8000)
                opened = True
            except Exception:
                opened = page.evaluate(
                    "() => { const b = document.querySelector('.technical-data-trigger');"
                    " if (!b) return false; b.click(); return true; }"
                )
            page.wait_for_timeout(1200)
            dialog = page.evaluate(
                """() => {
                    const d = document.querySelector('dialog.reading-dialog[open]');
                    if (!d) return null;
                    const r = d.getBoundingClientRect();
                    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right,
                             width: r.width, height: r.height,
                             vw: window.innerWidth, vh: window.innerHeight,
                             text: d.innerText.length };
                }"""
            )
            fits = bool(dialog) and dialog["top"] >= -1 and dialog["bottom"] <= dialog["vh"] + 1 \
                and dialog["left"] >= -1 and dialog["right"] <= dialog["vw"] + 1
            check(
                "data-and-sources dialog opens inside the viewport",
                opened and fits,
                json.dumps({k: (round(v, 1) if isinstance(v, float) else v) for k, v in (dialog or {}).items()}),
            )
            if opened:
                page.keyboard.press("Escape")
                page.wait_for_timeout(500)

            # 5 — the research index resolves.
            opened = open_section(page, base, "research")
            links = page.evaluate(
                """() => [...document.querySelectorAll('.research-index a[href^="#research-"]')]
                    .filter(a => a.getClientRects().length)
                    .map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() }))"""
            )
            missing = [
                link for link in links
                if not page.evaluate(
                    "(id) => { const el = document.getElementById(id);"
                    " return !!el && el.getClientRects().length > 0; }",
                    link["href"][1:],
                )
            ]
            check(
                "every research index link resolves to a visible section",
                opened and len(links) >= 4 and not missing,
                f"research open={opened}, {len(links)} links, missing {[m['href'] for m in missing]}",
            )

            # 6 — a drill record survives a reload on the device that entered it.
            opened = open_section(page, base, "drill")
            fields = page.locator(".drill-counter-grid input")
            values = ["12", "11", "2", "7"]
            for index, value in enumerate(values):
                fields.nth(index).fill(value)
            page.locator(".drill-route input").fill("Beach road shelter point")
            page.wait_for_timeout(400)
            save = page.locator(".drill-actions button.primary")
            enabled = save.is_enabled()
            filled = page.eval_on_selector_all(
                ".drill-counter-grid input", "els => els.map(e => e.value)")
            if enabled:
                save.click()
                page.wait_for_timeout(800)
            page.reload(wait_until="load")
            page.wait_for_timeout(1800)
            stored = page.evaluate(
                """() => {
                    const raw = localStorage.getItem('soonami-drills-v1');
                    if (!raw) return null;
                    const parsed = JSON.parse(raw);
                    const list = Array.isArray(parsed) ? parsed : (parsed.records || []);
                    return list.length ? list[0] : null;
                }"""
            )
            check(
                "drill record saves and survives a reload",
                opened and enabled and bool(stored) and stored.get("participants") == 12
                and stored.get("reached") == 11 and stored.get("minutes") == 7
                and stored.get("route") == "Beach road shelter point",
                json.dumps({
                    "opened": opened, "buttonEnabled": enabled, "filled": filled,
                    "stored": stored,
                    "reconciliation": page.inner_text(".drill-reconciliation").replace("\n", " ")
                    if page.locator(".drill-reconciliation").count() else "",
                }),
            )

            # 7 — the masthead is one row, and the nav has room for its controls.
            page.goto(base + "/#explore", wait_until="load", timeout=60000)
            page.wait_for_timeout(1500)
            for width, height in ((320, 700), (360, 780), (390, 844), (681, 900),
                                  (800, 900), (1024, 768), (1440, 900)):
                page.set_viewport_size({"width": width, "height": height})
                page.wait_for_timeout(900)
                mast = page.evaluate(
                    """() => {
                        const header = document.querySelector('header.soonami-masthead');
                        const r = header.getBoundingClientRect();
                        const centres = [];
                        for (const child of header.children) {
                            if (!child.getClientRects().length) continue;
                            const r = child.getBoundingClientRect();
                            centres.push(r.top + r.height / 2);
                        }
                        const median = centres.slice().sort((a, b) => a - b)[Math.floor(centres.length / 2)] || 0;
                        const rows = centres.some(c => Math.abs(c - median) > 3) ? 2 : 1;
                        const nav = header.querySelector('.masthead-nav');
                        const navRect = nav ? nav.getBoundingClientRect() : null;
                        const brand = header.querySelector('.masthead-brand-group');
                        const brandRect = brand ? brand.getBoundingClientRect() : null;
                        const clock = header.querySelector('.masthead-clock-wrap');
                        const clockRect = clock ? clock.getBoundingClientRect() : null;
                        const action = header.querySelector('.masthead-action-group');
                        const actionRect = action && action.getClientRects().length ? action.getBoundingClientRect() : null;
                        const used = [brandRect, navRect, clockRect, actionRect].filter(Boolean)
                            .reduce((sum, r) => sum + r.width, 0);
                        return { height: r.height, rows: rows, used,
                                 available: r.width,
                                 navButtons: header.querySelectorAll('.masthead-nav button').length };
                    }"""
                )
                overflow = page.evaluate(
                    """() => {
                        const header = document.querySelector('header.soonami-masthead');
                        const doc = document.documentElement;
                        let worst = 0;
                        for (const child of header.children) {
                            if (!child.getClientRects().length) continue;
                            const r = child.getBoundingClientRect();
                            worst = Math.max(worst, r.right - header.getBoundingClientRect().right);
                        }
                        return { worst, pageOverflow: doc.scrollWidth - doc.clientWidth };
                    }"""
                )
                check(
                    f"masthead is one row at {width}px",
                    mast["height"] <= 48 and mast["rows"] == 1
                    and overflow["worst"] <= 1 and overflow["pageOverflow"] <= 1,
                    f"height {mast['height']:.0f}px, {mast['rows']} row(s), "
                    f"{mast['navButtons']} nav buttons, "
                    f"slack {mast['available'] - mast['used']:.0f}px, "
                    f"overflow {overflow['worst']:.0f}px, page {overflow['pageOverflow']}px",
                )

            browser.close()
    finally:
        server.shutdown()

    failed = [c for c in checks if not c["ok"]]
    Path(args.out).write_text(
        json.dumps({"base": base, "checks": checks}, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed — wrote {args.out}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
