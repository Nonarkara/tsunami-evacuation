#!/usr/bin/env python3
"""Compare visible playback frame intervals on identical browser setups."""

import argparse
import json
from pathlib import Path
from runpy import run_path

from playwright.sync_api import expect, sync_playwright

capture = run_path(str(Path(__file__).with_name("capture-playback-evidence.py")))
SAMPLE = """async ({ length }) => {
  const scene = document.querySelector('.terrain-rehearsal');
  const samples = [];
  const startClock = Number(scene.dataset.exerciseSeconds);
  const start = performance.now();
  let previous = start;
  let elapsed = 0;
  await new Promise(resolve => {
    const tick = now => {
      samples.push(now - previous);
      previous = now;
      elapsed = now - start;
      if (elapsed >= length) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const advanced = Number(scene.dataset.exerciseSeconds) - startClock;
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.ceil(samples.length * .95) - 1];
  return { p95Ms: +p95.toFixed(1), frames: samples.length,
    wallSeconds: +(elapsed / 1e3).toFixed(3), exerciseSeconds: +advanced.toFixed(3) };
}"""


def profile(page, origin, mode, people, rate, repeats):
    page.goto(f"{origin}/?lang=en#explore", wait_until="domcontentloaded")
    scene = page.locator('.terrain-rehearsal[data-state="ready"]')
    scene.wait_for(timeout=60000)
    page.get_by_label("People", exact=True).select_option(str(people))
    if mode == "escape":
        page.get_by_role("button", name="Escape / ฝึกอพยพ").click()
        play = page.locator(".escape-playback .primary")
        speed = page.get_by_label("Practice playback speed", exact=True)
        reset = page.get_by_role("button", name="Reset escape practice")
    else:
        play = page.locator(".rehearsal-play")
        speed = page.get_by_label("Playback speed / ความเร็ว", exact=True)
        reset = page.locator(".rehearsal-timeline").get_by_role("button", name="Reset")
    speed.select_option(str(rate))
    rows = []
    for _ in range(repeats):
        expect(play).to_be_enabled(timeout=75000)
        reset.dispatch_event("click")
        play.dispatch_event("click")
        expect(play).to_have_accessible_name("Pause escape practice" if mode == "escape" else "Pause rehearsal")
        rows.append(page.evaluate(SAMPLE, {"length": 3200}))
        play.dispatch_event("click")
    return {"mode": mode, "people": people, "rate": rate, "runs": rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", default="dist")
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument("--out", required=True)
    parser.add_argument("--headless", action="store_true", help="use software rendering for diagnostics")
    args = parser.parse_args()
    server = capture["serve"](args.dist, 0)
    origin = f"http://127.0.0.1:{server.server_address[1]}"
    try:
        with sync_playwright() as playwright:
            software = [flag for flag in capture["CHROMIUM_ARGS"] if flag != "--single-process"]
            browser = playwright.chromium.launch(
                headless=args.headless, args=software if args.headless else ["--use-gl=angle"]
            )
            rows = []
            for mode in ("escape", "crowd"):
                for people in (1500, 5000):
                    for rate in (1, 30):
                        page = browser.new_page(viewport={"width": 1280, "height": 720})
                        rows.append(profile(page, origin, mode, people, rate, args.repeats))
                        page.close()
                        print(json.dumps(rows[-1]), flush=True)
            browser.close()
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(rows, indent=2) + "\n")
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
