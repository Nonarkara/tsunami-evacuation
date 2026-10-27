// Real DOM falsification. Run in CI; use approved CUA tooling for local interactive review.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { measureDecisionGeometry, evaluateSuite } from "./index.mjs";
const { chromium } = await import(
  process.env.DECISION_GEOMETRY_PLAYWRIGHT || "playwright"
);
const contract = JSON.parse(
  await readFile(new URL("./contract.example.json", import.meta.url), "utf8"),
);
const browser = await chromium.launch({ headless: true });
try {
  const captures = [];
  for (const spec of contract.cases) {
    const page = await browser.newPage({
      viewport: { width: spec.width, height: spec.height },
    });
    await page.goto(new URL("./fixture.html", import.meta.url).href);
    await page.evaluate(() => document.fonts.ready);
    captures.push(await page.evaluate(measureDecisionGeometry, spec));
    await page.close();
  }
  const good = evaluateSuite(contract, captures);
  assert.equal(good.status, "BUDGETS_PASS", JSON.stringify(good));
  const expected = {
    hero: "maxHeight",
    stretch: "maxHeight",
    distance: "decision-gap",
    hidden: "hidden-content",
    overflow: "page-overflow",
    clip: "clipped-content",
    cover: "decision-not-visible",
    offscreen: "region-not-visible",
  };
  for (const [fault, code] of Object.entries(expected)) {
    const base = contract.cases[0],
      spec = {
        ...base,
        id: fault,
        state: fault,
        stateSelector: `body[data-fault="${fault}"]`,
      };
    const page = await browser.newPage({
      viewport: { width: spec.width, height: spec.height },
    });
    await page.goto(new URL("./fixture.html", import.meta.url).href);
    await page.locator("#fault").selectOption(fault);
    await page.evaluate(() => document.fonts.ready);
    const result = evaluateSuite({ version: 1, cases: [spec] }, [
      await page.evaluate(measureDecisionGeometry, spec),
    ]);
    assert.ok(
      result.failures.some((f) => f.code === code),
      `${fault}: expected ${code}; ${JSON.stringify(result)}`,
    );
    console.log(`Killed rendered mutation: ${fault} -> ${code}`);
    await page.close();
  }
  console.log(
    "All four viewport compositions pass; all eight rendered faults fail.",
  );
} finally {
  await browser.close();
}
