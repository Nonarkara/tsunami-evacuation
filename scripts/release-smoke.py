#!/usr/bin/env python3
"""Check the first Escape action and record the production files it exercised."""

import argparse
import json
from pathlib import Path
from runpy import run_path
from urllib.parse import urlsplit
import gzip
import hashlib

from playwright.sync_api import expect, sync_playwright

capture = run_path(str(Path(__file__).with_name("capture-playback-evidence.py")))

BOUNDS = """element => {
    const rect = element.getBoundingClientRect();
    const hits = document.elementsFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return rect.width > 0 && rect.height > 0 && rect.left >= 0 && rect.top >= 0
        && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1
        && (element.contains(hits[0]) || hits.some(hit => hit.contains(element) && hit === hits[0]));
}"""


def require_first_screen(target):
    target.wait_for(state="visible", timeout=45000)
    if not target.evaluate(BOUNDS):
        raise RuntimeError(f"{target} is clipped or covered on the first Escape screen")


def require_walk(scene):
    if scene.get_attribute("data-camera") != "walk":
        raise RuntimeError("Escape opened with the wrong camera")


def verify_bytes(entries):
    for entry in entries:
        local = Path("dist") / (entry["path"].lstrip("/") or "index.html")
        if entry.get("sha256") != hashlib.sha256(local.read_bytes()).hexdigest():
            raise RuntimeError(f"Served bytes differ from dist for {entry['path']}")


def reject_mutation(check, reason):
    try:
        check()
    except RuntimeError as error:
        if reason in str(error):
            return
        raise
    raise RuntimeError(f"Smoke check accepted a deliberate regression: {reason}")


def smoke(page, origin, language, width, height, falsify):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(f"{origin}/?lang={language}&lesson=escape#explore", wait_until="domcontentloaded")
    start = page.locator(".escape-playback .primary")
    cue = page.locator(".escape-route-cue")
    scene = page.locator('.terrain-rehearsal[data-experiment="escape"]')
    scene.wait_for(timeout=45000)
    require_walk(scene)
    require_first_screen(start)
    require_first_screen(cue)
    if falsify:
        scene.evaluate("el => { el.dataset.camera = 'overview'; }")
        reject_mutation(lambda: require_walk(scene), "wrong camera")
        scene.evaluate("el => { el.dataset.camera = 'walk'; }")
        cue.evaluate("el => { el.style.transform = 'translateY(200vh)'; }")
        reject_mutation(lambda: require_first_screen(cue), "clipped or covered")
        cue.evaluate("el => { el.style.removeProperty('transform'); }")
    page.locator(".terrain-canvas[data-eye-viewport]").wait_for(state="attached", timeout=45000)
    start.click()
    expect(start).to_have_accessible_name(
        "หยุดแบบฝึกอพยพชั่วคราว" if language == "th" else "Pause escape practice",
        timeout=15000,
    )
    if page.locator("html").get_attribute("lang") != language:
        raise RuntimeError("Escape opened in the wrong language")
    return {"view": "escape", "camera": "walk", "language": language, "viewport": [width, height]}


def check_entry(browser, origin, tab, assets):
    page = browser.new_page(viewport={"width": 667, "height": 375})
    scripts = set()

    def record(response):
        if response.url.startswith(f"{origin}/assets/") and response.url.endswith(".js"):
            path = urlsplit(response.url).path
            scripts.add(path)
            assets.add(path)

    page.on("response", record)
    page.goto(f"{origin}/?lang=th&text=large#{tab}", wait_until="domcontentloaded")
    page.locator(f'main[data-page="{tab}"]').wait_for()
    if tab == "research":
        panel = page.locator(".research-dossier")
        trigger = panel.locator(".technical-data-trigger")
        trigger.click()
        dialog = page.locator("dialog[open]")
        dialog.wait_for()
        for name in ("เส้นทาง JSON", "GeoJSON", "ดาวน์โหลดผล CSV", "ดาวน์โหลด BibTeX"):
            link = dialog.get_by_text(name, exact=True)
            if not link.evaluate(BOUNDS):
                raise RuntimeError(f"Research file {name} is inaccessible in Thai landscape")
        with page.expect_download() as pending:
            dialog.get_by_text("ดาวน์โหลดผล CSV", exact=True).click()
        if pending.value.suggested_filename != "khao-lak-reported-results.csv":
            raise RuntimeError("Results download returned the wrong file")
        body = pending.value.path().read_text(encoding="utf-8")
        if not all(value in body for value in ("21.8", "22.6", "1.2", "2.9")):
            raise RuntimeError("Results download is missing the model timing pairs")
        page.keyboard.press("Escape")
        expect(trigger).to_be_focused()
    page.close()
    return {
        "view": tab, "language": "th", "viewport": [667, 375],
        "gzipJsBytes": sum(len(gzip.compress((Path("dist") / path[1:]).read_bytes())) for path in scripts),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--origin")
    parser.add_argument("--out", default="output/release-smoke.json")
    parser.add_argument("--falsify", action="store_true", help="prove camera, cue and stale byte checks reject deliberately bad evidence")
    args = parser.parse_args()
    server = None if args.origin else capture["serve"]("dist", 0)
    origin = args.origin or f"http://127.0.0.1:{server.server_address[1]}"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(args=[flag for flag in capture["CHROMIUM_ARGS"] if flag != "--single-process"])
            assets = set()

            def record_asset(response):
                url = urlsplit(response.url)
                if response.url.startswith(f"{origin}/assets/") and url.path.endswith((".js", ".css")):
                    assets.add(url.path)

            cases = []
            for lang, size in (("th", (390, 844)), ("en", (1440, 900))):
                page = browser.new_page()
                page.on("response", record_asset)
                print(f"Checking Escape {lang} {size[0]}×{size[1]}", flush=True)
                cases.append(smoke(page, origin, lang, *size, args.falsify))
                page.close()
            cases.extend(check_entry(browser, origin, tab, assets) for tab in ("prepare", "research"))
            browser.close()
        receipt = capture["live_assets"](origin)
        known = {entry["path"] for entry in receipt["receipts"]}
        for path in sorted(assets - known):
            raw = capture["fetch"](f"{origin}{path}")
            receipt["receipts"].append({"path": path, "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)})
        verify_bytes(receipt["receipts"])
        if args.falsify:
            stale = {**receipt["receipts"][0], "sha256": "0" * 64}
            reject_mutation(lambda: verify_bytes([stale]), "Served bytes differ")
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps({**receipt, "cases": cases}, indent=2) + "\n")
        print(f"PASS Escape first cue and Start in Thai on phone and English on desktop · {out}")
    finally:
        if server:
            server.shutdown()


if __name__ == "__main__":
    main()
