export const PAPER = "https://ssrn.com/abstract=7270357";
export const POPULATION = 39041;
export type Condition = "baseline" | "delayed";
export const scenarios = [
  {
    id: "base",
    label: "Study baseline",
    short: "Baseline",
    affected: 21.8,
    delayed: 22.6,
    sites: 2,
    signs: 64,
    vertical: 32,
    reference: "§4.1–4.2, pp. 16–18",
    action:
      "Check road bottlenecks and plan assistance for people who cannot walk.",
  },
  {
    id: "walk",
    label: "Promote walking",
    short: "Walking",
    affected: 7.0,
    delayed: 10.6,
    sites: 2,
    signs: 64,
    vertical: 32,
    reference: "§4.3, pp. 19–20; §4.5, p. 24",
    action:
      "Practise walking with residents and hotel staff; arrange assisted evacuation in advance.",
  },
  {
    id: "refuges",
    label: "Add vertical refuges",
    short: "+ Refuges",
    affected: 3.7,
    delayed: 5.6,
    sites: 16,
    signs: 64,
    vertical: 32,
    reference: "§4.5, pp. 23–24",
    action:
      "Obtain engineering assessment, owner agreements, access and capacity approval for candidate buildings.",
  },
  {
    id: "practice",
    label: "Practise vertical evacuation",
    short: "+ Practice",
    affected: 1.3,
    delayed: 3.4,
    sites: 16,
    signs: 64,
    vertical: 50,
    reference: "§4.5, pp. 23–24",
    action:
      "Run inclusive drills to approved vertical refuges and test gates, stairs and night access.",
  },
  {
    id: "signs",
    label: "Complete the package",
    short: "+ Signs",
    affected: 1.2,
    delayed: 2.9,
    sites: 16,
    signs: 135,
    vertical: 50,
    reference: "§4.5, p. 24",
    action:
      "Audit route continuity and multilingual signs; test whether a first-time visitor can follow them.",
  },
] as const;
export function resultFor(index: number, condition: Condition) {
  return condition === "baseline"
    ? scenarios[index].affected
    : scenarios[index].delayed;
}
export function reduction(index: number, condition: Condition) {
  return (1 - resultFor(index, condition) / resultFor(0, condition)) * 100;
}
export function outcomes(index: number, condition: Condition) {
  const affected = resultFor(index, condition);
  const reached =
    index === 0
      ? condition === "baseline"
        ? 60.7
        : 56.8
      : index === 4
        ? condition === "baseline"
          ? 93.6
          : 88.9
        : null;
  return {
    affected,
    reached,
    outside:
      reached === null ? null : Number((100 - affected - reached).toFixed(1)),
  };
}
export const places = [
  {
    name: "Pakarang Cape",
    lat: 8.727,
    lng: 98.226,
    description:
      "Northern part of the study area. Ask your accommodation or local authority for its approved evacuation plan.",
  },
  {
    name: "Khuk Khak",
    lat: 8.694,
    lng: 98.253,
    description:
      "Coastal accommodation and residential area. Confirm a destination, an alternative and an assisted evacuation arrangement.",
  },
  {
    name: "Bang Niang",
    lat: 8.667,
    lng: 98.253,
    description:
      "A busy visitor and residential area. Walk the locally approved route before an emergency.",
  },
  {
    name: "Nang Thong",
    lat: 8.647,
    lng: 98.253,
    description:
      "Southern part of this orientation view. Check route signs and access conditions at your designated destination.",
  },
] as const;
export const checklist = [
  "Confirm a designated destination with the hotel or local authority",
  "Walk the route and check the signs, crossings and gates",
  "Agree how children and anyone needing assistance will evacuate",
  "Choose a backup destination and a contact outside the area",
  "Keep shoes, essential medication and a small ready-to-go bag accessible",
  "Practise the plan and keep a printed copy",
];
export type Plan = {
  place: string;
  destination: string;
  backup: string;
  route: string;
  assistance: string;
  contact: string;
  checked: boolean[];
};
export const blankPlan: Plan = {
  place: "",
  destination: "",
  backup: "",
  route: "",
  assistance: "",
  contact: "",
  checked: checklist.map(() => false),
};
export function validatePlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    ["place", "destination", "backup", "route", "assistance", "contact"].every(
      (k) => typeof p[k] === "string" && (p[k] as string).length <= 2000,
    ) &&
    Array.isArray(p.checked) &&
    p.checked.length === checklist.length &&
    p.checked.every((v) => typeof v === "boolean")
  );
}
export function walkingMinutes(distance: number, speed: number) {
  return !Number.isFinite(distance) ||
    !Number.isFinite(speed) ||
    distance <= 0 ||
    speed <= 0
    ? null
    : Math.ceil(distance / speed / 60);
}
export type DrillLog = {
  participants: number;
  reached: number;
  assisted: number;
  minutes: number;
};
export function validateDrill(log: DrillLog) {
  return (
    Object.values(log).every(Number.isFinite) &&
    Number.isInteger(log.participants) &&
    Number.isInteger(log.reached) &&
    Number.isInteger(log.assisted) &&
    log.participants > 0 &&
    log.reached >= 0 &&
    log.reached <= log.participants &&
    log.assisted >= 0 &&
    log.assisted <= log.participants &&
    log.minutes > 0
  );
}
