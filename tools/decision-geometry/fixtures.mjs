// Synthetic measurements for rule tests; real DOM falsification lives in browser-test.mjs.
export const spec = {
  id: "desktop-default",
  state: "default",
  stateSelector: "body[data-fault=none]",
  width: 1440,
  height: 900,
  reason: "Keep the choice and its next action together.",
  regions: [
    {
      id: "intro",
      selector: "#intro",
      maxHeight: 130,
      reason: "A task title needs one compact band.",
    },
    {
      id: "map",
      selector: "#map",
      firstScreen: true,
      minWidth: 300,
      minHeight: 250,
      maxHeight: 450,
      reason:
        "The reference map must stay usable without inheriting evidence height.",
    },
  ],
  chrome: {
    selectors: ["header", "#status"],
    maxHeight: 115,
    reason: "Identity and warning remain compact.",
  },
  decision: {
    information: "#result",
    action: "#primary",
    maxGap: 32,
    firstScreen: true,
    reason: "Read the outcome and act without reconstructing context.",
  },
};
export const box = (x, y, width, height) => ({
  matches: 1,
  rect: { x, y, width, height },
  visible: true,
  clipped: false,
  firstScreen: true,
  unobstructed: true,
});
export const good = {
  id: spec.id,
  state: spec.state,
  width: 1440,
  height: 900,
  scrollX: 0,
  scrollY: 0,
  fontsReady: true,
  stateElement: box(0, 0, 1440, 900),
  documentWidth: 1440,
  regions: { intro: box(0, 100, 1440, 100), map: box(0, 220, 800, 390) },
  chrome: [box(0, 0, 1440, 58), box(0, 58, 1440, 42)],
  information: box(850, 250, 350, 70),
  action: box(850, 332, 180, 44),
};
