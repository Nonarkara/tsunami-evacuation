# Decision geometry budget gate

Canonical source: [Non-Slop](https://github.com/Nonarkara/Non-Slop/tree/main/tools/decision-geometry), MIT. Version 1.0, 27 October 2026. Identical copies are distributed with the design frameworks so the check works offline. Change the Non-Slop source first, then synchronize the capsule; do not hand-tune a framework copy to clear a failure.

This is the measurable part of the spatial law. It checks task-specific budgets against real DOM measurements. `BUDGETS_PASS` means those budgets passed, not that the interface, accessibility or design has passed review.

## Adopt in a product

1. Copy `contract.example.json` to the product's `design/decision-geometry.json`. Replace the fixture selectors, reasons, numbers and state selectors with the real task. Never apply the example's map/title dimensions as universal design rules.
2. Name required states, including important expanded, loading, missing-data and long-label states. Use a state selector that proves that state has rendered. Declare the primary information/action pair, the useful region that must be preserved, and any bands whose combined chrome needs a budget.
3. In the approved browser for your environment, open the actual page, set the exact case viewport, complete the UI actions for its state, wait for ready content and `document.fonts.ready`, and capture at scroll origin. Evaluate the read-only exported `measureDecisionGeometry` function with that case as its argument. Save each result in a captures array alongside screenshots. The collector does not navigate, click, inject styles, scroll or collect page text.
4. Run `node tools/decision-geometry/check.mjs design/decision-geometry.json design/decision-captures.json`. Exit 0 = declared budgets pass; 2 = geometry failure; 1 = malformed contract/report. Missing cases, selectors and unready fonts are failures, not skipped passes.
5. Reintroduce the previous oversized region, sibling stretch or action separation in an isolated fixture/local test. Recapture; the same budget must fail. Then restore the repair and obtain independent screenshot/task review. Record each finding's disposition.

A capture is evidence, not a trusted authority. These tools cannot establish whether you chose honest budgets or actually performed the stated task. A stale/handwritten capture is not a browser test. Never feed private page text or personal information into the report; this collector records geometry and declared IDs only.

## Run the instrument's tests

```sh
node --test tools/decision-geometry/test.mjs
```

The unit tests exercise the decision rules and invalid/missing measurements. `fixture.html` provides a separate real DOM with selectable layout faults. `browser-test.mjs` exercises it in CI with isolated Playwright tooling; it requires no application dependencies. Use your environment's approved browser control for interactive local validation.

## What the numbers mean

- Region limits bound the named element's rectangle. A minimum protects its operating area; a maximum detects unexplained expansion. Set `firstScreen:true` for each preserved region that must remain in the initial operating view; this catches an intact map translated offscreen or covered. Do not apply it to every long reading region.
- Chrome cost is the union of the declared vertical intervals clipped to the viewport. A header with a nested nav is not counted twice; separately stacked bars are not reduced to the tallest bar.
- Decision gap is the shortest edge-to-edge distance between the declared information and action rectangles. It is not a universal whitespace quota.
- First-screen visibility requires both complete rectangles and an unobstructed centre point. Ancestor and own-content scroll/clipping are checked for declared targets. This does not prove every pixel, line or interactive subregion is unoccluded.
- Preserve readable labels, full explanations, maps, charts and usable targets. The gate is not permission to clip, shrink text, remove controls, add fillers or dump content into nested scrolling.
- A long essay, a full-viewport Palette colour field, a real map or a detailed chart may rightly need a large area. State its role and use budgets suited to it. Color, alignment and type compliance do not clear a failed task composition.
