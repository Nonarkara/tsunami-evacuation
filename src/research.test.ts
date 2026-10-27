import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scenarios,
  resultFor,
  outcomes,
  reduction,
  validatePlan,
  blankPlan,
  walkingMinutes,
  validateDrill,
  coastalRegions,
  satelliteToolkits,
  CITATION,
  CREATOR,
} from "./research";
test("both condition series preserve the exact reported victim shares", () => {
  assert.deepEqual(
    scenarios.map((_, i) => resultFor(i, "baseline")),
    [21.8, 7, 3.7, 1.3, 1.2],
  );
  assert.deepEqual(
    scenarios.map((_, i) => resultFor(i, "delayed")),
    [22.6, 10.6, 5.6, 3.4, 2.9],
  );
});
test("reached-site and outside-affected-area outcomes are never conflated", () => {
  for (const c of ["baseline", "delayed"] as const)
    for (const i of [0, 4]) {
      const o = outcomes(i, c);
      assert.equal(
        Math.round((o.affected + o.reached! + o.outside!) * 10),
        1000,
      );
    }
  assert.equal(outcomes(0, "baseline").reached, 60.7);
  assert.equal(outcomes(0, "baseline").outside, 17.5);
  assert.equal(outcomes(2, "baseline").reached, null);
  assert.equal(Math.round(reduction(4, "baseline")), 94);
});
test("route calculation rejects empty, negative and non-finite distances and does no hazard arithmetic", () => {
  assert.equal(walkingMinutes(1000, 0.8), 21);
  assert.equal(walkingMinutes(1000, 0.5), 34);
  for (const n of [0, -1, NaN, Infinity])
    assert.equal(walkingMinutes(n, 0.8), null);
  assert.equal(walkingMinutes(1000, 0), null);
});
test("saved plan boundary rejects corrupt shapes and oversized text", () => {
  assert.ok(validatePlan(blankPlan));
  assert.equal(validatePlan(null), false);
  assert.equal(validatePlan({}), false);
  assert.equal(validatePlan({ ...blankPlan, checked: [true] }), false);
  assert.equal(validatePlan({ ...blankPlan, place: "a".repeat(2001) }), false);
});
test("headcounts reconcile and fractional/negative/overflow counts are refused", () => {
  const log = { participants: 30, reached: 28, assisted: 3, minutes: 12.5 };
  assert.ok(validateDrill(log));
  for (const patch of [
    { participants: 0 },
    { reached: 31 },
    { reached: -1 },
    { assisted: 31 },
    { participants: 30.1 },
    { minutes: 0 },
    { minutes: NaN },
  ])
    assert.equal(validateDrill({ ...log, ...patch }), false);
  assert.ok(validateDrill({ ...log, reached: 0 }));
});
test("all national coastal regions and satellite feeds are well-formed", () => {
  assert.ok(coastalRegions.length >= 6);
  assert.ok(coastalRegions.some((r) => r.id === "khao-lak"));
  assert.ok(coastalRegions.some((r) => r.id === "phuket"));
  assert.ok(coastalRegions.some((r) => r.id === "krabi"));
  assert.ok(coastalRegions.some((r) => r.id === "gulf-thailand"));
  for (const r of coastalRegions) {
    assert.ok(r.places.length > 0);
    for (const p of r.places) {
      assert.ok(p.lat >= 5 && p.lat <= 15);
      assert.ok(p.lng >= 97 && p.lng <= 103);
      assert.ok(p.safeDistM > 0);
      assert.ok(p.actionableDirective.length > 10);
    }
  }
  assert.ok(satelliteToolkits.some((s) => s.id === "dart-23401"));
  assert.ok(satelliteToolkits.some((s) => s.id === "rtn-phuket"));
  assert.ok(CITATION.includes("Trumikaborworn"));
  assert.ok(CREATOR.includes("Dr. Non"));
});
