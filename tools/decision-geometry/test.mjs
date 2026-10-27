import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateSuite, validateContract } from "./index.mjs";
import { spec, good, box } from "./fixtures.mjs";
const contract = { version: 1, cases: [spec] };
function mutate(fn, code) {
  const snapshot = structuredClone(good);
  fn(snapshot);
  assert.ok(
    evaluateSuite(contract, [snapshot]).failures.some((f) => f.code === code),
  );
}
test("valid task composition clears declared budgets", () =>
  assert.equal(evaluateSuite(contract, [good]).status, "BUDGETS_PASS"));
test("restoring the oversized title fails its task budget", () =>
  mutate((s) => (s.regions.intro.rect.height = 193), "maxHeight"));
test("a map stretched by a long sibling fails even if the page does not overflow", () =>
  mutate((s) => (s.regions.map.rect.height = 650), "maxHeight"));
test("separating the action is not hidden by an aligned grid", () =>
  mutate((s) => (s.action.rect.y = 700), "decision-gap"));
test("shrinking or hiding the map cannot clear the layout gate", () => {
  mutate((s) => (s.regions.map.rect.height = 20), "minHeight");
  mutate((s) => (s.regions.map.visible = false), "hidden-content");
});
test("page bleed and clipping fail independently", () => {
  mutate((s) => (s.documentWidth = 1500), "page-overflow");
  mutate((s) => (s.action.clipped = true), "clipped-content");
});
test("a missing, ambiguous, occluded or scrolled target fails", () => {
  mutate(
    (s) => (s.action = { matches: 0, error: "missing-selector" }),
    "missing-measurement",
  );
  mutate(
    (s) => (s.action = { matches: 2, error: "ambiguous-selector" }),
    "missing-measurement",
  );
  mutate((s) => (s.action.unobstructed = false), "decision-not-visible");
  mutate((s) => (s.scrollY = 100), "scrolled-capture");
});
test("stacked chrome is measured as a union, not the tallest bar or double-counted overlap", () => {
  mutate((s) => (s.chrome[1] = box(0, 58, 1440, 80)), "chrome-height");
  const s = structuredClone(good);
  s.chrome[1] = box(0, 0, 1440, 42);
  assert.equal(evaluateSuite(contract, [s]).status, "BUDGETS_PASS");
});
test("missing viewport/state coverage cannot silently pass", () => {
  assert.equal(evaluateSuite(contract, []).status, "FAIL");
  mutate((s) => (s.state = "loading"), "missing-case");
  mutate((s) => (s.width = 390), "missing-case");
  assert.equal(evaluateSuite(contract, [good, good]).status, "FAIL");
});
test("invalid budgets are refused, not converted into zero findings", () => {
  for (const v of [NaN, Infinity, -1, "130"]) {
    const c = structuredClone(contract);
    c.cases[0].regions[0].maxHeight = v;
    assert.throws(() => validateContract(c));
  }
  const c = structuredClone(contract);
  delete c.cases[0].reason;
  assert.throws(() => validateContract(c));
});

test("unready fonts and unrendered states cannot be called a pass", () => {
  mutate((s) => (s.fontsReady = false), "fonts-not-ready");
  mutate(
    (s) => (s.stateElement = { matches: 0, error: "missing-selector" }),
    "state-not-ready",
  );
});

test("preserved first-screen regions cannot be translated offscreen or covered", () => {
  mutate((s) => {
    s.regions.map.rect.x = -5000;
    s.regions.map.firstScreen = false;
    s.regions.map.unobstructed = false;
  }, "region-not-visible");
  mutate((s) => (s.regions.map.unobstructed = false), "region-not-visible");
});
test("zero-area targets, zero document width and inconsistent first-screen flags fail", () => {
  mutate((s) => (s.action.rect.width = 0), "missing-measurement");
  mutate((s) => (s.documentWidth = 0), "invalid-measurement");
  mutate((s) => {
    s.information.rect.y = 1000;
    s.action.rect.y = 1080;
  }, "decision-not-visible");
});
