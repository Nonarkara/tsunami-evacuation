#!/usr/bin/env python3
"""Audit the Escape exercise's run+wave clock on the live site.

The animation MSH audit (docs/AUDIT-ANIMATION-MSH-2026-11-17.md) recorded the
geometry, and the unit tests assert the readout markup. Neither proves the
clock behaviour a visitor gets on the live release: that the time-to-endpoint
readout is hidden before Start, advances only with the clock, clamps at the
endpoint, and that pause and seek freeze the exercise clock and the water
clock together — one clock drives the walker and the illustrative surface.

This script drives the real Escape exercise in Chromium and writes one JSON
receipt per run:

    docs/evidence/escape-sync-2026-11-17/report.json

Each record carries the served bundle hashes, so `check-served-bytes` logic
applies: a receipt describes exactly one release.

Checks per viewport (390x844, 1024x768, 1440x900):
  1. no `.escape-time-to-endpoint` before Start
  2. after Start: readout appears, exercise clock and water clock both advance
  3. after Pause: both clocks frozen
  4. seek to 30 s: `data-exercise-seconds` follows, readout == finish - 30
  5. seek to duration: readout clamps to +0:00, review shows the unapproved
     endpoint note
  6. zero console errors and page errors for the whole session

Usage:
  python3 scripts/audit-escape-sync.py [origin]     # default: the live domain
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
EVIDENCE = ROOT / "docs" / "evidence" / "escape-sync-2026-11-17"

VIEWPORTS = [(390, 844), (1024, 768), (1440, 900)]

LAUNCH_ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
]

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0 Safari/537.36 tsunami-evacuation-evidence/1.0"
)

CLOCK_RE = re.compile(r"\+(\d+):(\d{2})")


def parse_clock(text: str) -> float | None:
    m = CLOCK_RE.search(text or "")
    return None if not m else int(m.group(1)) * 60 + int(m.group(2))


def fetch_retry(url: str, attempts: int = 3, timeout: int = 60) -> bytes:
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as exc:
            last = exc
    raise last  # type: ignore[misc]


def served_bundles(origin: str) -> list[dict]:
    page = fetch_retry(f"{origin}/").decode("utf-8")
    names = sorted({m for m in re.findall(r"assets/index-[A-Za-z0-9_-]+\.(?:js|css)", page)})
    out = [{"path": "/", "sha256": hashlib.sha256(page.encode()).hexdigest()}]
    for name in names:
        raw = fetch_retry(f"{origin}/{name}", timeout=120)
        out.append({"path": f"/{name}", "bytes": len(raw),
                    "sha256": hashlib.sha256(raw).hexdigest()})
    return out


def attrs(page) -> dict:
    return page.evaluate("""(() => {
      const t = document.querySelector('.terrain-rehearsal');
      const clock = document.querySelector('.escape-clock');
      const readout = document.querySelector('.escape-time-to-endpoint');
      const review = document.querySelector('.escape-review');
      const scrubber = document.querySelector('.time-scrubber input[type=range]');
      return {
        exercise: t ? Number(t.dataset.exerciseSeconds) : null,
        water: t ? Number(t.dataset.waterSeconds) : null,
        clock: clock ? clock.textContent : null,
        readout: readout ? readout.textContent : null,
        review: review ? review.textContent : null,
        duration: scrubber ? Number(scrubber.max) : null,
      };
    })()""")


def set_scrubber(page, value: float) -> None:
    page.evaluate("""value => {
      const input = document.querySelector('.time-scrubber input[type=range]');
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, String(value));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }""", value)


def click_escape_mode(page) -> None:
    """Reach Escape the way a visitor does and leave no modal open.

    The rehearsal controls dock into the banner. At every width they may sit
    behind the map-controls (⋯) reading dialog; selecting Escape from inside it
    leaves that dialog open, and an open modal keeps `playbackAllowed` false —
    the eye-view camera never aligns and Start stays on its loading label. So
    after choosing Escape the script closes the dialog, as a reader would.
    Clicks are dispatched from JS: the audit asserts clock behaviour, not
    Playwright's pointer-actionability heuristics.
    """
    route = page.evaluate("""(() => {
      const visible = b => b && b.offsetParent !== null;
      const byLabel = prefix => [...document.querySelectorAll('button')]
        .find(b => (b.getAttribute('aria-label') || '').startsWith(prefix));
      const esc = byLabel('Escape');
      if (visible(esc)) { esc.click(); return 'direct'; }
      const toggle = byLabel('Map controls');
      if (!toggle) return 'no-controls';
      toggle.click();
      return 'toggle';
    })()""")
    if route == 'toggle':
        page.wait_for_function(
            "() => [...document.querySelectorAll('button')]"
            ".some(b => (b.getAttribute('aria-label') || '').startsWith('Escape') && b.offsetParent !== null)",
            timeout=15000,
        )
        page.evaluate("""(() => {
          const esc = [...document.querySelectorAll('button')]
            .find(b => (b.getAttribute('aria-label') || '').startsWith('Escape'));
          if (esc) esc.click();
        })()""")
    closed = page.evaluate("""(() => {
      const close = [...document.querySelectorAll('button')]
        .find(b => (b.getAttribute('aria-label') || '').startsWith('Close reading'));
      if (close && close.offsetParent !== null) { close.click(); return true; }
      return false;
    })()""")
    if closed:
        page.wait_for_function(
            "() => ![...document.querySelectorAll('dialog')].some(d => d.open)",
            timeout=10000,
        )


def wait_for_play_armed(page, timeout: int = 90000) -> None:
    """Wait for Start to leave its loading label and become pressable.

    Switching to Escape eases the camera to the 1.65 m eye view; Start stays on
    'Loading terrain, practice not ready yet' until the ground heights are
    queryable. That leg is part of what a visitor waits through.
    """
    page.wait_for_function(
        """(() => {
          const b = document.querySelector('.escape-playback button');
          return b && b.getAttribute('aria-label') === 'Play escape practice' && !b.disabled;
        })()""",
        timeout=timeout,
    )


def load_page(context, origin: str, width: int, height: int):
    """Load the site and wait for the banner, retrying a flaky first paint."""
    page = context.new_page()
    last: Exception | None = None
    for attempt in range(3):
        try:
            page.goto(f"{origin}/?capture=model#model", wait_until="domcontentloaded",
                      timeout=90000)
            page.wait_for_selector("header.soonami-masthead", timeout=45000)
            return page
        except Exception as exc:
            last = exc
            print(f"  load attempt {attempt + 1} failed: {exc}", flush=True)
            try:
                page.close()
            except Exception:
                pass
            page = context.new_page()
    raise RuntimeError(f"could not load {origin} at {width}x{height}: {last}")


def js_click(page, selector: str) -> None:
    """Dispatch a click from JS.

    The audit asserts clock behaviour, not pointer actionability; a Playwright
    locator click can hang on the fixed-screen layout where the target needs no
    scroll and none is possible.
    """
    clicked = page.evaluate("""sel => {
      const el = document.querySelector(sel);
      if (!el) return false;
      el.click();
      return true;
    }""", selector)
    if not clicked:
        raise RuntimeError(f"no element for {selector}")


def check_viewport(browser, origin: str, width: int, height: int) -> dict:
    failures: list[str] = []
    context = browser.new_context(viewport={"width": width, "height": height},
                                  device_scale_factor=1)
    page = load_page(context, origin, width, height)
    console_errors: list[str] = []
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

    try:
        page.wait_for_selector('.terrain-rehearsal[data-state="ready"]', timeout=60000)
    except Exception:
        failures.append("terrain never reached ready")
    page.wait_for_timeout(1500)

    state = page.evaluate("document.querySelector('.terrain-rehearsal')?.dataset.state")

    # 1. readout hidden before Start
    if attrs(page)["readout"] is not None:
        failures.append("time-to-endpoint readout visible before Start")

    if not failures:
        click_escape_mode(page)
        try:
            wait_for_play_armed(page)
        except Exception:
            failures.append("escape playback controls did not arm (Start stayed loading)")

    if not failures:
        js_click(page, 'button[aria-label="Play escape practice"]')
        try:
            page.wait_for_selector(".escape-time-to-endpoint", timeout=20000)
        except Exception:
            failures.append("readout did not appear after Start")

    if not failures:
        # Warm-up: the first frames after Start are the eye-camera re-alignment
        # and the heaviest renders of the session; the anti-teleport guard
        # (src/playback.ts) refuses those >250 ms gaps, so the clock starts
        # moving once rendering settles. Assert steady state, not cold start.
        try:
            page.wait_for_function(
                "() => { const t = document.querySelector('.terrain-rehearsal');"
                " return t && Number(t.dataset.exerciseSeconds) > 2; }",
                timeout=30000,
            )
        except Exception:
            failures.append("exercise clock never passed 2 s after Start")
        a1 = attrs(page)
        page.wait_for_timeout(2000)
        a2 = attrs(page)
        e1, e2 = a1["exercise"], a2["exercise"]
        w1, w2 = a1["water"], a2["water"]
        r1, r2 = parse_clock(a1["readout"]), parse_clock(a2["readout"])
        if e2 is None or e2 <= e1:
            failures.append(f"exercise clock did not advance: {e1} -> {e2}")
        if w2 is None or w2 <= w1:
            failures.append(f"water clock did not advance: {w1} -> {w2}")
        if r1 is None or r2 is None or r2 >= r1:
            failures.append(f"time-to-endpoint readout did not decrease: {r1} -> {r2}")

        # 3. pause freezes both clocks together
        js_click(page, 'button[aria-label="Pause escape practice"]')
        page.wait_for_timeout(300)
        p1 = attrs(page)
        page.wait_for_timeout(1400)
        p2 = attrs(page)
        if p1["exercise"] != p2["exercise"] or p1["water"] != p2["water"]:
            failures.append(
                f"pause did not freeze clocks: exercise {p1['exercise']}->{p2['exercise']}, "
                f"water {p1['water']}->{p2['water']}")

        # 4. seek to 30 s: clock follows, readout == finish - 30
        paused_seconds = p2["exercise"]
        paused_readout = parse_clock(p2["readout"])
        if paused_seconds is not None and paused_readout is not None:
            finish = paused_seconds + paused_readout
            set_scrubber(page, 30)
            page.wait_for_timeout(400)
            s1 = attrs(page)
            got = parse_clock(s1["readout"])
            want = max(0.0, finish - 30)
            if s1["exercise"] is None or abs(s1["exercise"] - 30) > 1.5:
                failures.append(f"seek left exercise clock at {s1['exercise']}, expected ~30")
            if got is None or abs(got - want) > 1.5:
                failures.append(f"readout after seek {got}, expected ~{want}")

            # 5. seek to the end: readout clamps, review names the unapproved endpoint
            set_scrubber(page, s1["duration"])
            page.wait_for_timeout(600)
            s2 = attrs(page)
            if s2["readout"] is None or parse_clock(s2["readout"]) != 0:
                failures.append(f"readout did not clamp at endpoint: {s2['readout']!r}")
            review = s2["review"] or ""
            if "Finished at" not in review:
                failures.append("arrival review did not appear at the endpoint")
            if "Endpoint unapproved" not in review and "endpoint unapproved" not in review:
                failures.append("unapproved-endpoint qualification missing at arrival")
        else:
            failures.append("could not derive finish time from the paused readout")

    result = {
        "viewport": [width, height],
        "state": state,
        "checks": {
            "readoutHiddenBeforeStart": "time-to-endpoint readout visible before Start" not in failures,
            "clocksAdvanceTogether": not any("did not advance" in f for f in failures),
            "readoutDecreases": not any("readout did not decrease" in f for f in failures),
            "pauseFreezesClocks": not any("pause did not freeze" in f for f in failures),
            "seekFollowsAndReadoutExact": not any("seek" in f or "readout after seek" in f for f in failures),
            "readoutClampsAtEndpoint": not any("clamp" in f for f in failures),
            "arrivalShowsUnapprovedEndpoint": not any("review" in f or "unapproved" in f for f in failures),
        },
        "failures": failures,
        "consoleErrors": console_errors,
    }
    if console_errors:
        result["failures"].append(f"{len(console_errors)} console/page error(s)")
    context.close()
    return result


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    origin = (args[0] if args else "https://tsunami.nonarkara.org").rstrip("/")
    headless = "--headless" in sys.argv

    records = []
    all_failures = []
    with sync_playwright() as pw:
        # Headed by default: the app refuses to advance its clock past a >250 ms
        # frame gap (the anti-teleport guard in src/playback.ts), and a
        # software-rendered 3D terrain frame cannot beat that limit. So a headed
        # run gets the real GPU (plain ANGLE/Metal), and only `--headless` forces
        # SwiftShader — an environment that measures the guard, not the exercise.
        browser = pw.chromium.launch(
            headless=not headless,
            args=LAUNCH_ARGS if headless else ["--use-gl=angle"],
        )
        for width, height in VIEWPORTS:
            print(f"{width}x{height} …", flush=True)
            record = check_viewport(browser, origin, width, height)
            records.append(record)
            all_failures.extend(f"{width}x{height}: {f}" for f in record["failures"])
            print(f"  {width}x{height} failures={record['failures']}", flush=True)
        browser.close()

    EVIDENCE.mkdir(parents=True, exist_ok=True)
    try:
        bundles = served_bundles(origin)
    except Exception as exc:
        bundles = []
        all_failures.append(f"byte receipt failed: {exc}")
    report = {
        "origin": origin,
        "capturedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "render": "headless" if headless else "headed-gpu",
        "checks": records,
        "bytes": bundles,
    }
    (EVIDENCE / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"origin": origin, "viewports": len(records),
                      "status": "ESCAPE_SYNC_FAIL" if all_failures else "ESCAPE_SYNC_PASS",
                      "failures": all_failures}, indent=2))
    return 1 if all_failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
