#!/usr/bin/env python3
"""Render every reading page of a flow as a picture, so the audit can be read.

The fill instrument (`pagefill.py`) measures a page and says how full it is. A
number is evidence; a picture is something a person can look at and judge. This
script takes the second kind of evidence: it opens the live site at the widths
the owner instruction names, walks the pager of the reading flow, and writes one
PNG per page.

It exists because of a fault it would have caught by eye and no gate had: the
phone's Explore flow used to end in a **blank** page, and its page before that
carried the route profile's title alone. Both pages passed every geometry gate,
because a blank page and a title with a void beneath it are both within the
bounds of a 390 × 844 screen.

Usage:

    python3 tools/viewport/msh-shots.py [origin]
    python3 tools/viewport/msh-shots.py https://tsunami.nonarkara.org

Writes to `docs/evidence/msh-shots/`. It writes nothing else and touches no
release state; it is evidence, not a gate.
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "evidence" / "msh-shots"

# The widths the owner instruction names.
VIEWPORTS = [(390, 844), (1024, 768), (1440, 900)]

CHROMIUM_ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
]

# The flow to walk: Explore is the surface the 19 November audit changed.
SURFACE = "explore"

# The pager's own state, read from the page the reader sees.
PAGER_STATE = """
() => {
  const turner = [...document.querySelectorAll('.page-turner')]
    .find(e => e.offsetParent !== null);
  if (!turner) return null;
  const m = (turner.innerText || '').match(/(\\d+)\\s*\\/\\s*(\\d+)/);
  const next = turner.querySelector('button:last-of-type');
  return {
    page: m ? parseInt(m[1], 10) : null,
    total: m ? parseInt(m[2], 10) : null,
    nextDisabled: next ? next.disabled : null,
  };
}
"""


def settle(page) -> None:
    """Wait for the page to come to rest, so a picture is not of a transition."""
    page.wait_for_timeout(1200)
    try:
        page.wait_for_function(
            "() => { const c = document.querySelector('.flow-content');"
            " if (!c) return true;"
            " const t = getComputedStyle(c).transform;"
            " if (!t || t === 'none') return true;"
            " const m = t.match(/matrix\\(([^)]+)\\)/);"
            " if (!m) return true;"
            " const key = m[1].split(',').slice(4).map(v => v.trim()).join(',');"
            " return key.length > 0 && previous === key; }",
            timeout=30000,
            polling=250,
        )
    except Exception:
        pass


def wait_for_pager(page, timeout: float = 60.0) -> dict | None:
    """Wait until the pager stops changing its mind about the page count.

    The flow derives its column count from the width it was given, so after a
    viewport change the pager can briefly read "1 / 1" before the column has
    been laid out. Photographing that moment would record a page that does not
    exist, and would stop the walk at one page for a flow that has two.
    """
    deadline = time.time() + timeout
    last = None
    stable = 0
    while time.time() < deadline:
        state = page.evaluate(PAGER_STATE)
        if state and state == last:
            stable += 1
            if stable >= 2:
                return state
        else:
            stable = 0
        last = state
        page.wait_for_timeout(700)
    return last


def reset_to_first_page(page, limit: int = 12) -> None:
    """Wind the flow back to its first page.

    The page a flow is on is remembered by the app, and it survives a change of
    viewport. The phone walk ends on the phone's last page, so when the window
    widens the same flow is already on its last page — two of two — and its
    next button is disabled. Photographing that would label the last page as
    the first.
    """
    for _ in range(limit):
        state = page.evaluate(PAGER_STATE)
        if not state or not state.get("page") or state["page"] <= 1:
            return
        moved = page.evaluate(
            "() => { const t = [...document.querySelectorAll('.page-turner')]"
            ".find(e => e.offsetParent !== null);"
            " if (!t) return false;"
            " const b = t.querySelector('button:first-of-type');"
            " if (!b || b.disabled) return false;"
            " b.click(); return true; }"
        )
        if not moved:
            return
        settle(page)
        wait_for_pager(page)


def main() -> int:
    origin = (sys.argv[1] if len(sys.argv) > 1 else "https://tsunami.nonarkara.org").rstrip("/")
    OUT.mkdir(parents=True, exist_ok=True)
    written: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(args=CHROMIUM_ARGS)
        page = browser.new_page()
        for width, height in VIEWPORTS:
            page.set_viewport_size({"width": width, "height": height})
            page.goto(f"{origin}/?capture={SURFACE}#{SURFACE}", wait_until="domcontentloaded", timeout=90000)
            page.wait_for_selector("header.soonami-masthead", timeout=45000)
            page.wait_for_timeout(3000)
            settle(page)

            state = wait_for_pager(page)
            if not state or not state.get("total"):
                print(f"no pager at {width}x{height}", flush=True)
                continue
            reset_to_first_page(page)
            state = wait_for_pager(page)
            total = int(state["total"])
            print(f"{width}x{height}: {total} pages, starting at {state.get('page')}", flush=True)

            for index in range(total):
                name = f"{width}x{height}-page-{index + 1}.png"
                path = OUT / name
                page.screenshot(path=str(path))
                written.append(
                    {
                        "viewport": [width, height],
                        "page": index + 1,
                        "pages": total,
                        "file": name,
                    }
                )
                print(f"wrote {name}", flush=True)
                if index + 1 >= total:
                    break
                # The pager is re-rendered when the page turns, so the button
                # from the previous turn is detached by now. Ask the page for a
                # fresh one rather than holding on to it.
                clicked = page.evaluate(
                    "() => { const t = [...document.querySelectorAll('.page-turner')]"
                    ".find(e => e.offsetParent !== null);"
                    " if (!t) return 'no-turner';"
                    " const b = t.querySelector('button:last-of-type');"
                    " if (!b) return 'no-button';"
                    " if (b.disabled) return 'disabled';"
                    " b.click(); return 'clicked'; }"
                )
                if clicked != "clicked":
                    print(
                        f"    could not turn from {name}: {clicked} · pager now {page.evaluate(PAGER_STATE)}",
                        flush=True,
                    )
                    break
                settle(page)
                wait_for_pager(page)
        browser.close()

    (OUT / "shots.json").write_text(
        json.dumps(
            {
                "origin": origin,
                "capturedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "surface": SURFACE,
                "shots": written,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"{len(written)} shots written to {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
