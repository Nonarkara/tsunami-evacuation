// Canonical source: Nonarkara/Non-Slop/tools/decision-geometry (MIT).
// The DOM collector is read-only and self-contained for approved browser tools.
const number = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0;
const nonempty = (s) => typeof s === "string" && s.trim().length > 0;
export function validateContract(contract) {
  if (
    !contract ||
    contract.version !== 1 ||
    !Array.isArray(contract.cases) ||
    !contract.cases.length
  )
    throw new Error("A version:1 contract with named cases is required.");
  const ids = new Set();
  for (const c of contract.cases) {
    if (
      !nonempty(c.id) ||
      ids.has(c.id) ||
      !nonempty(c.state) ||
      !nonempty(c.stateSelector) ||
      !nonempty(c.reason)
    )
      throw new Error(
        "Each case needs a unique id, explicit state selector and task-specific reason.",
      );
    ids.add(c.id);
    if (!number(c.width) || !number(c.height) || c.width < 1 || c.height < 1)
      throw new Error(`${c.id}: viewport dimensions must be positive.`);
    if (!Array.isArray(c.regions) || !c.regions.length)
      throw new Error(`${c.id}: name the regions to measure and preserve.`);
    const regionIds = new Set();
    for (const r of c.regions) {
      if (
        !nonempty(r.id) ||
        regionIds.has(r.id) ||
        !nonempty(r.selector) ||
        !nonempty(r.reason)
      )
        throw new Error(
          `${c.id}: each region needs a unique id, selector and reason.`,
        );
      regionIds.add(r.id);
      if (r.firstScreen !== undefined && typeof r.firstScreen !== "boolean")
        throw new Error(`${c.id}/${r.id}: firstScreen must be boolean.`);
      const limits = ["maxHeight", "maxWidth", "minHeight", "minWidth"];
      if (!limits.some((k) => r[k] !== undefined))
        throw new Error(`${c.id}/${r.id}: a measurable budget is required.`);
      for (const k of limits)
        if (r[k] !== undefined && !number(r[k]))
          throw new Error(
            `${c.id}/${r.id}: ${k} must be finite and nonnegative.`,
          );
      if (
        (r.minHeight ?? 0) > (r.maxHeight ?? Infinity) ||
        (r.minWidth ?? 0) > (r.maxWidth ?? Infinity)
      )
        throw new Error(`${c.id}/${r.id}: minimum exceeds maximum.`);
    }
    if (
      !c.decision ||
      !nonempty(c.decision.information) ||
      !nonempty(c.decision.action) ||
      !nonempty(c.decision.reason) ||
      !number(c.decision.maxGap) ||
      typeof c.decision.firstScreen !== "boolean"
    )
      throw new Error(
        `${c.id}: bind information to an action, with a gap budget, firstScreen decision and reason.`,
      );
    if (
      c.chrome &&
      (!Array.isArray(c.chrome.selectors) ||
        !c.chrome.selectors.length ||
        !c.chrome.selectors.every(nonempty) ||
        !number(c.chrome.maxHeight) ||
        !nonempty(c.chrome.reason))
    )
      throw new Error(
        `${c.id}: chrome needs selectors, a height budget and a reason.`,
      );
  }
  return contract;
}

export function measureDecisionGeometry(spec) {
  // No state changes, innerText capture, injected styles, scrolling or network calls.
  const rect = (r) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
  const measure = (selector) => {
    let elements;
    try {
      elements = [...document.querySelectorAll(selector)];
    } catch {
      return { error: "invalid-selector", matches: 0 };
    }
    if (elements.length !== 1)
      return {
        error: elements.length ? "ambiguous-selector" : "missing-selector",
        matches: elements.length,
      };
    const el = elements[0],
      r = el.getBoundingClientRect();
    const ownStyle = getComputedStyle(el);
    let visible = r.width > 0 && r.height > 0;
    let clipped =
      (/(hidden|clip|auto|scroll)/.test(ownStyle.overflowX) &&
        el.scrollWidth > el.clientWidth + 1) ||
      (/(hidden|clip|auto|scroll)/.test(ownStyle.overflowY) &&
        el.scrollHeight > el.clientHeight + 1);
    for (let p = el; p; p = p.parentElement) {
      const style = getComputedStyle(p);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.visibility === "collapse" ||
        Number(style.opacity) === 0 ||
        p.hidden
      )
        visible = false;
      if (p === el) continue;
      const pr = p.getBoundingClientRect();
      if (
        /(hidden|clip|auto|scroll)/.test(style.overflowX) &&
        (r.left < pr.left - 1 || r.right > pr.right + 1)
      )
        clipped = true;
      if (
        /(hidden|clip|auto|scroll)/.test(style.overflowY) &&
        (r.top < pr.top - 1 || r.bottom > pr.bottom + 1)
      )
        clipped = true;
    }
    const firstScreen =
      visible &&
      r.left >= 0 &&
      r.top >= 0 &&
      r.right <= innerWidth + 1 &&
      r.bottom <= innerHeight + 1;
    const top = firstScreen
      ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      : null;
    const unobstructed =
      firstScreen && !!top && (top === el || el.contains(top));
    return {
      matches: 1,
      rect: rect(r),
      visible,
      clipped,
      firstScreen,
      unobstructed,
    };
  };
  return {
    id: spec.id,
    state: spec.state,
    width: innerWidth,
    height: innerHeight,
    scrollX,
    scrollY,
    stateElement: measure(spec.stateSelector),
    fontsReady: !document.fonts || document.fonts.status === "loaded",
    documentWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    ),
    regions: Object.fromEntries(
      spec.regions.map((r) => [r.id, measure(r.selector)]),
    ),
    chrome: (spec.chrome?.selectors ?? []).map(measure),
    information: measure(spec.decision.information),
    action: measure(spec.decision.action),
  };
}

function validRect(r) {
  return (
    r &&
    Number.isFinite(r.x) &&
    Number.isFinite(r.y) &&
    number(r.width) &&
    r.width > 0 &&
    number(r.height) &&
    r.height > 0
  );
}
export function evaluateCase(spec, observed) {
  const failures = [];
  const fail = (code, detail) => failures.push({ case: spec.id, code, detail });
  if (
    !observed ||
    observed.id !== spec.id ||
    observed.state !== spec.state ||
    observed.width !== spec.width ||
    observed.height !== spec.height
  )
    return [
      {
        case: spec.id,
        code: "missing-case",
        detail: "No measurement for the exact named state and viewport.",
      },
    ];
  if (observed.fontsReady !== true)
    fail("fonts-not-ready", "Wait for fonts before recording geometry.");
  if (
    !observed.stateElement ||
    observed.stateElement.error ||
    observed.stateElement.matches !== 1 ||
    observed.stateElement.visible !== true
  )
    fail(
      "state-not-ready",
      "The named state selector must exist uniquely and be visible.",
    );
  if (observed.scrollX !== 0 || observed.scrollY !== 0)
    fail(
      "scrolled-capture",
      "Capture the initial task composition at scroll origin.",
    );
  if (!number(observed.documentWidth) || observed.documentWidth <= 0)
    fail("invalid-measurement", "Document width was not measured.");
  else if (observed.documentWidth > spec.width + 1)
    fail(
      "page-overflow",
      `${observed.documentWidth}px document exceeds ${spec.width}px viewport.`,
    );
  const withinViewport = (m) =>
    validRect(m?.rect) &&
    m.rect.x >= 0 &&
    m.rect.y >= 0 &&
    m.rect.x + m.rect.width <= spec.width + 1 &&
    m.rect.y + m.rect.height <= spec.height + 1;
  function requireElement(m, name) {
    if (
      !m ||
      m.error ||
      m.matches !== 1 ||
      !validRect(m.rect) ||
      typeof m.clipped !== "boolean" ||
      typeof m.visible !== "boolean"
    ) {
      fail(
        "missing-measurement",
        `${name}: selector missing, ambiguous, invalid or unmeasured.`,
      );
      return false;
    }
    if (!m.visible)
      fail("hidden-content", `${name} is hidden or has no operating area.`);
    if (m.clipped)
      fail("clipped-content", `${name} crosses a clipping/scroll ancestor.`);
    return true;
  }
  for (const r of spec.regions) {
    const m = observed.regions?.[r.id];
    if (!requireElement(m, r.id)) continue;
    if (
      r.firstScreen &&
      (!withinViewport(m) || m.firstScreen !== true || m.unobstructed !== true)
    )
      fail(
        "region-not-visible",
        `${r.id}: the preserved operating region must fit the initial viewport without a centre obstruction.`,
      );
    for (const [budget, dimension, comparison] of [
      ["maxHeight", "height", "max"],
      ["maxWidth", "width", "max"],
      ["minHeight", "height", "min"],
      ["minWidth", "width", "min"],
    ]) {
      if (r[budget] === undefined) continue;
      const actual = m.rect[dimension],
        limit = r[budget];
      if (comparison === "max" ? actual > limit : actual < limit)
        fail(
          budget,
          `${r.id}: ${actual}px violates ${budget} ${limit}px. ${r.reason}`,
        );
    }
  }
  if (spec.chrome) {
    if (
      !Array.isArray(observed.chrome) ||
      observed.chrome.length !== spec.chrome.selectors.length
    )
      fail(
        "missing-chrome",
        "Every declared chrome selector must be measured.",
      );
    else {
      const intervals = [];
      for (let i = 0; i < observed.chrome.length; i++) {
        const m = observed.chrome[i];
        if (requireElement(m, `chrome ${spec.chrome.selectors[i]}`))
          intervals.push([
            Math.max(0, m.rect.y),
            Math.min(spec.height, m.rect.y + m.rect.height),
          ]);
      }
      intervals.sort((a, b) => a[0] - b[0]);
      let total = 0,
        end = -Infinity;
      for (const [start, stop] of intervals)
        if (stop > start) {
          total += Math.max(0, stop - Math.max(start, end));
          end = Math.max(end, stop);
        }
      if (total > spec.chrome.maxHeight)
        fail(
          "chrome-height",
          `${total}px union exceeds ${spec.chrome.maxHeight}px. ${spec.chrome.reason}`,
        );
    }
  }
  const infoOK = requireElement(observed.information, "decision information"),
    actionOK = requireElement(observed.action, "decision action");
  if (infoOK && actionOK) {
    const a = observed.information.rect,
      b = observed.action.rect;
    const dx = Math.max(0, a.x - (b.x + b.width), b.x - (a.x + a.width));
    const dy = Math.max(0, a.y - (b.y + b.height), b.y - (a.y + a.height));
    const gap = Math.hypot(dx, dy);
    if (gap > spec.decision.maxGap)
      fail(
        "decision-gap",
        `${gap.toFixed(1)}px edge separation exceeds ${spec.decision.maxGap}px. ${spec.decision.reason}`,
      );
    if (
      spec.decision.firstScreen &&
      [observed.information, observed.action].some(
        (m) =>
          !withinViewport(m) ||
          m.firstScreen !== true ||
          m.unobstructed !== true,
      )
    )
      fail(
        "decision-not-visible",
        "Information and action must both fit and have an unobstructed centre on the initial screen.",
      );
  }
  return failures;
}
export function evaluateSuite(contract, snapshots) {
  validateContract(contract);
  if (!Array.isArray(snapshots))
    throw new Error("Expected an array of captured snapshots.");
  const failures = [];
  for (const c of contract.cases) {
    const found = snapshots.filter((s) => s?.id === c.id);
    if (found.length !== 1)
      failures.push({
        case: c.id,
        code: "missing-case",
        detail: "Each required case needs exactly one capture.",
      });
    else failures.push(...evaluateCase(c, found[0]));
  }
  return {
    status: failures.length ? "FAIL" : "BUDGETS_PASS",
    cases: contract.cases.length,
    failures,
    scope:
      "Declared geometry budgets only; screenshots, task trial and independent review remain required.",
  };
}
