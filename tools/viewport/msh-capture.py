#!/usr/bin/env python3
"""Capture MSH evidence for the workspace: geometry report plus screenshots.

Renders the deployed site at the widths the owner's law names, writes a
geometry report per viewport and a screenshot per viewport, so a layout pass
can be judged on measurements and on what the interface actually looks like.

Usage:
  python3 tools/viewport/msh-capture.py [origin]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
MEASURE = (ROOT / "tools" / "viewport" / "msh-measure.mjs").read_text(encoding="utf-8")
OUT = ROOT / "docs" / "evidence" / "msh-current"

# The law's first-screen widths, plus the intermediate 1024 px width.
VIEWPORTS = [(390, 844), (1024, 768), (1440, 900)]
PAGES = ["explore", "satellite", "prepare", "drill", "research"]
NAV = {"explore":"Model / แบบจำลอง", "satellite":"Satellite / ดาวเทียม", "prepare":"Plan / แผน", "drill":"Drill / ซ้อมอพยพ", "research":"Research / งานวิจัย"}

LAUNCH_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]


def measure_script() -> str:
    body = MEASURE.replace("export function measureMsh", "function measureMsh")
    return f"(() => {{\n{body}\nreturn measureMsh();\n}})()"


def main() -> int:
    origin = (sys.argv[1] if len(sys.argv) > 1 else "https://tsunami.nonarkara.org").rstrip("/")
    OUT.mkdir(parents=True, exist_ok=True)
    report: dict = {"origin": origin, "viewports": {}}

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=LAUNCH_ARGS)
        for width, height in VIEWPORTS:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                device_scale_factor=1,
            )
            page = context.new_page()
            for tab in PAGES:
                page.goto(f"{origin}/#{tab}", wait_until="domcontentloaded", timeout=120000)
                page.wait_for_selector("header.soonami-masthead", timeout=90000)
                page.get_by_role("button", name=NAV[tab], exact=True).click()
                assert page.locator("header.soonami-masthead").get_attribute("data-page") == tab, "Wrong workspace reached"
                page.wait_for_timeout(2500)
                if tab == "explore":
                    try:
                        page.wait_for_selector(
                            '.terrain-rehearsal[data-state="ready"],.terrain-rehearsal[data-state="flat"]',
                            timeout=60000,
                        )
                    except Exception as error:
                        raise RuntimeError("Terrain did not reach a rendered state; no receipt written") from error
                page.wait_for_timeout(800)
                data = page.evaluate(measure_script())
                data["tab"] = tab
                key = f"{width}x{height}/{tab}"
                report["viewports"][key] = data
                page.screenshot(
                    path=str(OUT / f"{tab}-{width}.png"),
                    animations="disabled",
                    scale="css",
                    timeout=180000,
                )
                print(
                    f"{key} chrome={data['chrome']['top']}+{data['chrome']['bottom']}px "
                    f"({data['chrome']['costPercent']}%) map={data['task']['mapVisible']} "
                    f"action={data['task']['actionVisible']} gaps={len(data['gaps'])} "
                    f"stretched={len(data['stretched'])} inflated={len(data['inflated'])} "
                    f"overflow={data['overflow']}",
                    flush=True,
                )
            context.close()
        browser.close()

    (OUT / "msh-report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"wrote {OUT/'msh-report.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
