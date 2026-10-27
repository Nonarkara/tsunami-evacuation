/**
 * Soonami (สู้-nami) — Thailand Coastal Tsunami Defense Platform
 *
 * Platform design & synthesis by Dr. Non Arkaraprasertkul (Dr. Non)
 *
 * Inspired by & translating the empirical research:
 * Trumikaborworn, N., Warnitchai, P., & Latcharote, P. (2026).
 * "Agent-Based Modeling and Simulation for Identifying Effective Measures
 * on Tsunami Evacuation in Khao Lak, Thailand."
 * Asian Institute of Technology / Mahidol University. SSRN: https://ssrn.com/abstract=7270357
 *
 * Integrating satellite telemetry and meteorological gauge expertise from FloodDash (flood.nonarkara.org).
 */

export const PAPER = "https://ssrn.com/abstract=7270357";
export const CITATION =
  "Trumikaborworn, N., Warnitchai, P., & Latcharote, P. (2026). Agent-Based Modeling and Simulation for Identifying Effective Measures on Tsunami Evacuation in Khao Lak, Thailand. SSRN preprint, posted 12 August 2026. SSRN 7270357.";
export const CREATOR =
  "System design & synthesis by Dr. Non Arkaraprasertkul (based on Trumikaborworn et al., 2026)";

export const POPULATION = 39041;
export type Condition = "baseline" | "delayed";

/* ── §1 Published Research Scenarios ──────────────────────── */
export const scenarios = [
  {
    id: "base",
    label: "Study baseline (Vehicle gridlock)",
    short: "Baseline",
    affected: 21.8,
    delayed: 22.6,
    sites: 2,
    signs: 64,
    vertical: 32,
    reference: "§4.1–4.2, pp. 16–18",
    drNonFinding:
      "The published baseline victim share is 21.8%, or 22.6% with delayed timing, among 39,041 modeled agents. These are scenario outcomes, not a forecast.",
    action:
      "Assess congestion on designated routes and plan accessible departures with local emergency managers. Do not infer an evacuation deadline from this model.",
  },
  {
    id: "walk",
    label: "Increase walking preference to 50% (PD50)",
    short: "Walking",
    affected: 7.0,
    delayed: 10.6,
    sites: 2,
    signs: 64,
    vertical: 32,
    reference: "§4.3, pp. 19–20; §4.5, p. 24",
    drNonFinding:
      "Increasing pedestrian preference to 50% (PD50) reduces the modeled baseline victim share to 7.0%; it does not represent banning all vehicles.",
    action:
      "Walk and inspect designated routes, crossings and gates. Arrange transport or assistance for people who cannot walk; rehearse the locally approved protocol.",
  },
  {
    id: "refuges",
    label: "Add 14 candidate vertical sites (VS14)",
    short: "+ Refuges",
    affected: 3.7,
    delayed: 5.6,
    sites: 16,
    signs: 64,
    vertical: 32,
    reference: "§4.5, pp. 23–24",
    drNonFinding:
      "Adding 14 candidate vertical-evacuation buildings to PD50 reduces the modeled baseline victim share to 3.7%. Candidates are not certified public refuges.",
    action:
      "Ask qualified engineers and local authorities to assess structure, hazard exposure, capacity, access and designation before using any building as a public refuge.",
  },
  {
    id: "practice",
    label: "Practise vertical evacuation (VE50)",
    short: "+ Practice",
    affected: 1.3,
    delayed: 3.4,
    sites: 16,
    signs: 64,
    vertical: 50,
    reference: "§4.5, pp. 23–24",
    drNonFinding:
      "Increasing modeled vertical-evacuation preference to 50% reduces the cumulative baseline victim share to 1.3%. Real drills require local planning and accessible assistance.",
    action:
      "Plan accessible drills with participants and local authorities; check stair access, lighting and assistance. The model does not prescribe a universal drill frequency.",
  },
  {
    id: "signs",
    label: "Complete package: 135 signs (SG135)",
    short: "+ Signs",
    affected: 1.2,
    delayed: 2.9,
    sites: 16,
    signs: 135,
    vertical: 50,
    reference: "§4.5, p. 24",
    drNonFinding:
      "The cumulative package with 135 signs has a modeled baseline victim share of 1.2%, and 2.9% under delayed timing. Results are specific to Khao Lak and the study assumptions.",
    action:
      "Audit continuous, locally approved multilingual signs to designated destinations. The paper\u2019s sign count is a study input, not a universal spacing standard.",
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

/* ── §2 All Coastal Risk Regions Across Thailand ───────────── */
export type Place = {
  name: string;
  thaiName: string;
  lat: number;
  lng: number;
  elevationM: number; // Legacy unsurveyed placeholder; never display as measured elevation
  safeDistM: number; // Legacy unverified distance; never use for routing
  description: string;
  actionableDirective: string;
  refugeStrategy: string;
  spatialContext: string;
};

// Unverified landmark/contour constants removed: they must never be restored as ground truth.

export type CoastalRegion = {
  id: string;
  name: string;
  shortName: string;
  thaiName: string;
  basin: "Andaman Sea" | "Gulf of Thailand";
  riskTier: "Severe (High-Impact)" | "Critical (Dense Tourism)" | "Elevated (Archipelago)" | "Moderate (Delayed Surge)";
  waveEtaMin: number;
  expectedRunupM: string;
  center: [number, number];
  zoom: number;
  places: Place[];
};

export const coastalRegions: CoastalRegion[] = [
  {
    id: "khao-lak",
    name: "Phang Nga · Khao Lak (Default Study)",
    shortName: "Khao Lak (Phang Nga)",
    thaiName: "พังงา (เขาหลัก - ตะกั่วป่า)",
    basin: "Andaman Sea",
    riskTier: "Severe (High-Impact)",
    waveEtaMin: 125,
    expectedRunupM: "8 – 15m",
    center: [8.682, 98.264],
    zoom: 12,
    places: [
      {
        name: "Pakarang Cape",
        thaiName: "แหลมปะการัง",
        lat: 8.727,
        lng: 98.226,
        elevationM: 2.2,
        safeDistM: 1400,
        description:
          "Northern low-lying sand peninsula. Surrounded by shallow coral reefs; wave amplification is extreme.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Khuk Khak",
        thaiName: "คึกคัก",
        lat: 8.694,
        lng: 98.253,
        elevationM: 3.5,
        safeDistM: 950,
        description:
          "Dense beachfront resorts and residential corridors flanking Highway 4.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Bang Niang",
        thaiName: "บางเนียง",
        lat: 8.667,
        lng: 98.253,
        elevationM: 4.1,
        safeDistM: 800,
        description:
          "Primary tourist, dining, and hotel hub. Memorial police boat 813 washed 2 km inland here in 2004.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Nang Thong",
        thaiName: "นางทอง",
        lat: 8.647,
        lng: 98.253,
        elevationM: 4.8,
        safeDistM: 600,
        description:
          "Southern tourist core backed by steep granite hills of Khao Lak-Lam Ru National Park.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
    ],
  },
  {
    id: "phuket",
    name: "Phuket · West Coast Beaches",
    shortName: "Phuket (West Coast)",
    thaiName: "ภูเก็ต (ชายฝั่งตะวันตก)",
    basin: "Andaman Sea",
    riskTier: "Critical (Dense Tourism)",
    waveEtaMin: 110,
    expectedRunupM: "5 – 10m",
    center: [7.896, 98.297],
    zoom: 12,
    places: [
      {
        name: "Patong Beach",
        thaiName: "หาดป่าตอง",
        lat: 7.896,
        lng: 98.297,
        elevationM: 2.8,
        safeDistM: 500,
        description:
          "Thailand's densest beach tourist corridor. Narrow streets between Thaweewong and Rat-U-Thit roads.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Karon & Kata",
        thaiName: "หาดกะรน - กะตะ",
        lat: 7.835,
        lng: 98.298,
        elevationM: 3.2,
        safeDistM: 400,
        description:
          "Broad sandy bays with large resort complexes backed by steep hillsides.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Kamala",
        thaiName: "หาดกมลา",
        lat: 7.954,
        lng: 98.283,
        elevationM: 3.0,
        safeDistM: 650,
        description:
          "Crescent bay with central canal that can draw incoming waves further inland.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Bang Tao & Laguna",
        thaiName: "หาดบางเทา - ลากูน่า",
        lat: 8.003,
        lng: 98.295,
        elevationM: 2.4,
        safeDistM: 1200,
        description:
          "Long open coastline with interconnected lagoons and luxury villas.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
    ],
  },
  {
    id: "krabi",
    name: "Krabi · Phi Phi Islands & Ao Nang",
    shortName: "Krabi (Phi Phi & Ao Nang)",
    thaiName: "กระบี่ (เกาะพีพี - อ่าวนาง - ไร่เลย์)",
    basin: "Andaman Sea",
    riskTier: "Severe (High-Impact)",
    waveEtaMin: 95,
    expectedRunupM: "6 – 12m",
    center: [7.740, 98.778],
    zoom: 13,
    places: [
      {
        name: "Phi Phi Don (Ton Sai sandspit)",
        thaiName: "เกาะพีพีดอน (หาดต้นไทร - โละดาลัม)",
        lat: 7.739,
        lng: 98.773,
        elevationM: 1.8,
        safeDistM: 350,
        description:
          "CRITICAL GEOMETRY: Ton Sai and Loh Dalum bays meet at a narrow 150m sandspit. Waves hit from BOTH sides simultaneously.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Ao Nang Beach",
        thaiName: "อ่าวนาง",
        lat: 8.031,
        lng: 98.824,
        elevationM: 3.6,
        safeDistM: 500,
        description:
          "Main mainland tourism pier and promenade with limestone karsts.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Railay & Phra Nang",
        thaiName: "ไร่เลย์ - อ่าวพระนาง",
        lat: 8.012,
        lng: 98.839,
        elevationM: 2.0,
        safeDistM: 200,
        description:
          "Isolated peninsula cut off from roads by high limestone cliffs. Egress is boat or cliff trails only.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
    ],
  },
  {
    id: "satun-trang",
    name: "Satun & Trang · Southern Archipelago",
    shortName: "Satun & Trang",
    thaiName: "สตูล และ ตรัง (เกาะหลีเป๊ะ - ปากบารา - เกาะลันตา)",
    basin: "Andaman Sea",
    riskTier: "Elevated (Archipelago)",
    waveEtaMin: 140,
    expectedRunupM: "3 – 6m",
    center: [6.840, 99.500],
    zoom: 10,
    places: [
      {
        name: "Koh Lipe (Pattaya & Sunrise Beach)",
        thaiName: "เกาะหลีเป๊ะ",
        lat: 6.488,
        lng: 99.303,
        elevationM: 2.2,
        safeDistM: 250,
        description:
          "Small island in Tarutao National Marine Park with heavy seasonal tourist population.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Pak Bara Port",
        thaiName: "ท่าเรือปากบารา",
        lat: 6.852,
        lng: 99.733,
        elevationM: 2.5,
        safeDistM: 800,
        description:
          "Major ferry gateway to Andaman islands; high concentration of parked vehicles and transit passengers.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
    ],
  },
  {
    id: "ranong",
    name: "Ranong · Northern Andaman Coast",
    shortName: "Ranong Coast",
    thaiName: "ระนอง (แหลมสน - เกาะพยาม - สุขสำราญ)",
    basin: "Andaman Sea",
    riskTier: "Severe (High-Impact)",
    waveEtaMin: 120,
    expectedRunupM: "5 – 9m",
    center: [9.600, 98.500],
    zoom: 10,
    places: [
      {
        name: "Koh Phayam",
        thaiName: "เกาะพยาม",
        lat: 9.738,
        lng: 98.406,
        elevationM: 2.5,
        safeDistM: 400,
        description:
          "Northern Andaman island with extensive rubber plantations and tourist beaches (Aow Yai).",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Laem Son National Park",
        thaiName: "อุทยานแห่งชาติแหลมสน",
        lat: 9.605,
        lng: 98.490,
        elevationM: 1.9,
        safeDistM: 700,
        description:
          "Flat pine-forested coastal strip heavily impacted in 2004.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
    ],
  },
  {
    id: "gulf-thailand",
    name: "Gulf of Thailand · Secondary Seismic Zone",
    shortName: "Gulf of Thailand",
    thaiName: "อ่าวไทย (หัวหิน - เกาะสมุย - พัทยา - สงขลา)",
    basin: "Gulf of Thailand",
    riskTier: "Moderate (Delayed Surge)",
    waveEtaMin: 480,
    expectedRunupM: "1.5 – 3m",
    center: [12.568, 99.960],
    zoom: 10,
    places: [
      {
        name: "Hua Hin Coastline",
        thaiName: "ชายหาดหัวหิน",
        lat: 12.568,
        lng: 99.960,
        elevationM: 3.5,
        safeDistM: 600,
        description:
          "Shallow Sunda shelf bathymetry dramatically dissipates open-ocean tsunami energy, but storm surges and Manila Trench tsunamis remain potential hazards.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
      {
        name: "Koh Samui (Chaweng Beach)",
        thaiName: "เกาะสมุย (หาดเฉวง)",
        lat: 9.530,
        lng: 100.060,
        elevationM: 2.8,
        safeDistM: 500,
        description:
          "Dense beachfront resort strip flanked by Chaweng Lake.",
        actionableDirective:
          "Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.",
        refugeStrategy:
          "Authority-designated refuge and access require local confirmation.",
        spatialContext:
          "Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.",
      },
    ],
  },
];

// Preserving legacy single-region 'places' export for existing code compatibility
export const places = coastalRegions[0].places;

/* ── §3 Satellite & Meteorological Toolkits (from FloodDash) ─── */
export type SatelliteFeed = {
  id: string; name: string; type: "ocean-buoy" | "tide-gauge" | "sar-radar" | "dem-elevation";
  agency: string; updateFreq: string; status: "NOT_CONNECTED"; value: string;
  significance: string; sourceUrl: string;
};

export const satelliteToolkits: SatelliteFeed[] = [
  { id:"dart-23401", name:"DART pressure-buoy reference", type:"ocean-buoy", agency:"NOAA / NDBC reference", updateFreq:"No connected observation", status:"NOT_CONNECTED", value:"Not connected",
    significance:"Deep-ocean pressure observations can support tsunami detection. Station identity, operational status and latency must be checked before connecting a feed; no 15-minute detection guarantee is inferred.", sourceUrl:"https://www.noaa.gov/explainers/us-tsunami-warning-system" },
  { id:"rtn-phuket", name:"Ko Taphao Noi tide-gauge candidate", type:"tide-gauge", agency:"Station/feed validation pending", updateFreq:"No connected observation", status:"NOT_CONNECTED", value:"Not connected",
    significance:"A candidate coastal station reference. Verify the station, data provider, timestamps and vertical datum before interpreting water levels. No live gauge adapter is connected here.", sourceUrl:"https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/tsunamis" },
  { id:"sentinel-1", name:"Sentinel-1 SAR imagery", type:"sar-radar", agency:"ESA / Copernicus reference", updateFreq:"Acquisition-dependent; not connected", status:"NOT_CONNECTED", value:"Not connected",
    significance:"Candidate imagery for flood mapping after acquisition and validation. Acquisition timing, processing and local conditions constrain use; no daily image or current flood extent is promised.", sourceUrl:"https://dataspace.copernicus.eu/explore-data/data-collections/sentinel-data/sentinel-1" },
  { id:"dem-elevation", name:"Copernicus DEM candidate", type:"dem-elevation", agency:"Copernicus reference", updateFreq:"Static dataset; not ingested", status:"NOT_CONNECTED", value:"Not connected",
    significance:"Candidate terrain data. This browser currently uses Mapzen terrain; it does not use this candidate DEM. Elevation alone does not establish safe routes or refuge suitability.", sourceUrl:"https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model" },
];

/* ── §4 Plan & Drill Validation (Preserved strict boundaries) ─ */
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
