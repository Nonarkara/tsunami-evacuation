/**
 * Soonami (สู้-nami) — Thailand Coastal Tsunami Defense Platform
 *
 * Platform design & synthesis by Dr. Non Arkaraprasertkul (Dr. Non)
 *
 * Inspired by & translating the empirical research:
 * Trumikaborworn, N., Latcharote, P., & Warnitchai, P. (2024).
 * "Agent-Based Modeling and Simulation for Identifying Effective Measures
 * on Tsunami Evacuation in Khao Lak, Thailand."
 * Asian Institute of Technology / Mahidol University. SSRN: https://ssrn.com/abstract=7270357
 *
 * Integrating satellite telemetry and meteorological gauge expertise from FloodDash (flood.nonarkara.org).
 */

export const PAPER = "https://ssrn.com/abstract=7270357";
export const CITATION =
  "Trumikaborworn, N., Latcharote, P., & Warnitchai, P. (2024). Agent-Based Modeling and Simulation for Identifying Effective Measures on Tsunami Evacuation in Khao Lak, Thailand. AIT & Mahidol University. SSRN 7270357.";
export const CREATOR =
  "System design & synthesis by Dr. Non Arkaraprasertkul (based on Trumikaborworn et al., 2024)";

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
      "When people scramble into cars on a two-lane coastal highway, instant gridlock kills 1 in 5 people. Your car becomes a 2-ton metal trap.",
    action:
      "BAN personal car evacuation during coastal siren triggers. Establish mandatory immediate pedestrian dispersal.",
  },
  {
    id: "walk",
    label: "Mandatory walking on foot (PD50)",
    short: "Walking",
    affected: 7.0,
    delayed: 10.6,
    sites: 2,
    signs: 64,
    vertical: 32,
    reference: "§4.3, pp. 19–20; §4.5, p. 24",
    drNonFinding:
      "Forcing evacuation onto foot drops casualties from 21.8% to 7.0%—an immediate 68% drop in deaths with zero concrete poured.",
    action:
      "Pre-designate walking routes. Hotels must rehearse zero-vehicle foot departures to safe assembly zones within 10 minutes.",
  },
  {
    id: "refuges",
    label: "Add 14 vertical refuges (VS14)",
    short: "+ Refuges",
    affected: 3.7,
    delayed: 5.6,
    sites: 16,
    signs: 64,
    vertical: 32,
    reference: "§4.5, pp. 23–24",
    drNonFinding:
      "Instead of running 2 km inland, run 200 meters into an engineered 3+ story building. Deaths drop down to 3.7%.",
    action:
      "Formally certify 14 multi-story reinforced concrete hotels/schools as public tsunami vertical refuges with unlocked rooftop stairwells.",
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
      "People freeze or hesitate unless they have walked the stairs. Community rehearsals double vertical uptake and drop casualties to 1.3%.",
    action:
      "Conduct quarterly unannounced vertical stair drills. Audit night-time emergency lighting, panic bars, and disabled assist chairs.",
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
      "Tourists don't know the local roads. Continuous, multilingual signs eliminate hesitation, cutting casualties to 1.2% (94% total reduction).",
    action:
      "Install high-visibility bilingual (Thai/English/Chinese) directional route signs every 100 meters leading directly to designated refuges.",
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
  elevationM: number;
  safeDistM: number;
  description: string;
  actionableDirective: string;
  beachCoord?: [number, number];
  safeRidgeCoord?: [number, number];
  verticalRefuge?: {
    name: string;
    type: string;
    floors: number;
    capacity: number;
    distM: number;
  };
  walkMinutes?: number;
  gridlockWarning?: string;
};

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
          "Do not drive down the cape road. Evacuate immediately eastward to inland ridges on foot or take refuge in reinforced hotel towers.",
        beachCoord: [8.729, 98.219],
        safeRidgeCoord: [8.726, 98.242],
        verticalRefuge: {
          name: "Apsara Beachfront Tower B",
          type: "Reinforced Concrete Hotel",
          floors: 4,
          capacity: 450,
          distM: 280,
        },
        walkMinutes: 18,
        gridlockWarning:
          "Cape access road (Rural Rd 2008) dead-ends and chokes within 6 minutes of alert.",
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
          "Avoid Highway 4 vehicular bottlenecks. Use designated perpendicular walking paths to certified vertical hotel refuges.",
        beachCoord: [8.696, 98.242],
        safeRidgeCoord: [8.692, 98.265],
        verticalRefuge: {
          name: "JW Marriott North Refuge Pavilion",
          type: "Engineered Hotel Structure",
          floors: 3,
          capacity: 600,
          distM: 320,
        },
        walkMinutes: 12,
        gridlockWarning:
          "Khuk Khak intersection onto Highway 4 suffers gridlock standstill at minute 8.",
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
          "Tsunami waves carry massive debris here. Move immediately to 3rd-floor reinforced concrete structures or uphill past Highway 4.",
        beachCoord: [8.669, 98.243],
        safeRidgeCoord: [8.665, 98.266],
        verticalRefuge: {
          name: "La Flora Tower Refuges & Bang Niang School",
          type: "Certified Public Evacuation Towers",
          floors: 4,
          capacity: 850,
          distM: 380,
        },
        walkMinutes: 10,
        gridlockWarning:
          "Police Boat 813 market zone on Highway 4 completely blocks all southbound traffic.",
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
          "Direct access to mountain hillsides: follow designated trail markers up to >20m elevation within 15 minutes of shaking.",
        beachCoord: [8.649, 98.245],
        safeRidgeCoord: [8.644, 98.261],
        verticalRefuge: {
          name: "Khao Lak Seaview Resort Ridge Tower",
          type: "Hillside Concrete Hotel",
          floors: 5,
          capacity: 700,
          distM: 260,
        },
        walkMinutes: 8,
        gridlockWarning:
          "Narrow beach access soi causes vehicle jams right into the flood funnel.",
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
          "STRICTLY FORBIDDEN to use cars or motorbikes. Head immediately up the stairs of designated 4+ story hotels or eastward toward Hasip Pi Road.",
        beachCoord: [7.896, 98.292],
        safeRidgeCoord: [7.896, 98.306],
        verticalRefuge: {
          name: "Patong Hospital & Bangla High-Rise Refuges",
          type: "Engineered Concrete High-Rises",
          floors: 6,
          capacity: 1200,
          distM: 350,
        },
        walkMinutes: 6,
        gridlockWarning:
          "Thaweewong Beach Road chokes instantly; cars cannot move more than 5 meters.",
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
          "Use direct lateral resort roads toward Kata-Sai Yuan ridge. All beachfront hotel staff must trigger rooftop access gates.",
        beachCoord: [7.834, 98.292],
        safeRidgeCoord: [7.836, 98.305],
        verticalRefuge: {
          name: "Centara Grand Hillside Tower",
          type: "Reinforced Hillside Resort",
          floors: 5,
          capacity: 800,
          distM: 290,
        },
        walkMinutes: 5,
        gridlockWarning:
          "Kata-Karon roundabout becomes completely locked with tourist vans.",
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
          "Do not gather along the canal banks. Evacuate perpendicular to the coast into the foothills behind Kamala school.",
        beachCoord: [7.953, 98.277],
        safeRidgeCoord: [7.955, 98.291],
        verticalRefuge: {
          name: "Kamala Sub-District School & Municipal Tower",
          type: "Designated Tsunami Shelter",
          floors: 4,
          capacity: 550,
          distM: 420,
        },
        walkMinutes: 8,
        gridlockWarning:
          "Bridge over Kamala canal creates a single point of failure for vehicular escape.",
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
          "Lagoon bridges can choke during evacuation. Plan pedestrian egress across designated reinforced pedestrian crossovers.",
        beachCoord: [8.004, 98.288],
        safeRidgeCoord: [8.001, 98.306],
        verticalRefuge: {
          name: "Laguna Phuket Angsana Main Building",
          type: "Engineered Complex",
          floors: 4,
          capacity: 900,
          distM: 380,
        },
        walkMinutes: 14,
        gridlockWarning:
          "Lagoon ring road quickly gridlocks at resort exit gates.",
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
          "ZERO MOTOR VEHICLES. Run directly up the evacuation trail toward Viewpoint 1 (>100m elevation). Never attempt to board boats in the bay.",
        beachCoord: [7.738, 98.771],
        safeRidgeCoord: [7.742, 98.779],
        verticalRefuge: {
          name: "Phi Phi Viewpoint Ridge Pavilion",
          type: "Elevated Granite Terrain",
          floors: 3,
          capacity: 1500,
          distM: 320,
        },
        walkMinutes: 7,
        gridlockWarning:
          "Ton Sai pier causes crush stampedes; boats capsize in harbor surge.",
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
          "Walk inland along Ao Nang Road past the 15-meter elevation line near Krabi Resort or take shelter in reinforced hillside properties.",
        beachCoord: [8.030, 98.818],
        safeRidgeCoord: [8.033, 98.832],
        verticalRefuge: {
          name: "Krabi Resort Hillside Wing",
          type: "Reinforced Hillside Structure",
          floors: 4,
          capacity: 650,
          distM: 280,
        },
        walkMinutes: 6,
        gridlockWarning:
          "Ao Nang beachfront strip gridlocks within 5 minutes of siren.",
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
          "Boats cannot outrun an incoming tsunami in shallow water. Climb immediately to the cliff base trails and designated cave platforms above 15m.",
        beachCoord: [8.010, 98.835],
        safeRidgeCoord: [8.014, 98.842],
        verticalRefuge: {
          name: "Phra Nang Karst Cliff Safe Platform",
          type: "Natural Rock Platform (>25m MSL)",
          floors: 4,
          capacity: 800,
          distM: 180,
        },
        walkMinutes: 4,
        gridlockWarning:
          "Boats at Railay West get thrown onto beach by wave crests.",
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
          "Walk immediately toward the island's central high ground near the mobile tower ridge (elevation >25m).",
        beachCoord: [6.486, 99.301],
        safeRidgeCoord: [6.491, 99.305],
        verticalRefuge: {
          name: "Lipe Central Ridge Telecom Tower",
          type: "High Ground Granite Ridge",
          floors: 3,
          capacity: 700,
          distM: 220,
        },
        walkMinutes: 5,
        gridlockWarning:
          "Walking Street turns into crowded bottlenecks with motor-tricycles.",
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
          "Clear the pier apron immediately. Evacuate along Highway 4052 eastward away from the tidal river mouth.",
        beachCoord: [6.850, 99.728],
        safeRidgeCoord: [6.855, 99.742],
        verticalRefuge: {
          name: "Pak Bara Ferry Terminal Building",
          type: "Reinforced Port Facility",
          floors: 3,
          capacity: 500,
          distM: 350,
        },
        walkMinutes: 10,
        gridlockWarning:
          "Terminal parking lot completely traps vehicles during boarding surges.",
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
          "Move uphill into the central forested spine. Avoid mangrove tidal channels that funnel surge waters.",
        beachCoord: [9.736, 98.399],
        safeRidgeCoord: [9.741, 98.414],
        verticalRefuge: {
          name: "Phayam Central Rubber Plantation Ridge",
          type: "Forested Mountain Spine",
          floors: 3,
          capacity: 600,
          distM: 350,
        },
        walkMinutes: 8,
        gridlockWarning:
          "Narrow motorbike paths get blocked by fallen palm trees.",
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
          "Follow forest evacuation road eastward across the bridge to the mainland hills above 20m.",
        beachCoord: [9.604, 98.483],
        safeRidgeCoord: [9.607, 98.502],
        verticalRefuge: {
          name: "Park Headquarters Inland Facility",
          type: "Reinforced Government Post",
          floors: 3,
          capacity: 400,
          distM: 450,
        },
        walkMinutes: 12,
        gridlockWarning:
          "Park entrance bridge over tidal creek washes out in early surge.",
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
          "Manila Trench events provide 8-12 hours warning time. Move inland beyond Phetkasem Road or take vertical refuge in coastal high-rises.",
        beachCoord: [12.569, 99.963],
        safeRidgeCoord: [12.567, 99.954],
        verticalRefuge: {
          name: "Centara Grand & Phetkasem High-Rise Towers",
          type: "Reinforced Hotel High-Rise",
          floors: 7,
          capacity: 1500,
          distM: 250,
        },
        walkMinutes: 6,
        gridlockWarning:
          "Phetkasem Road traffic bottlenecks require managed pedestrian traffic light overrides.",
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
          "Do not linger near Chaweng Lake basin. Evacuate across the ring road onto the central granite mountain slopes.",
        beachCoord: [9.531, 100.065],
        safeRidgeCoord: [9.528, 100.052],
        verticalRefuge: {
          name: "Chaweng Central Hillside Complex",
          type: "Hillside Concrete Hotel",
          floors: 5,
          capacity: 1100,
          distM: 320,
        },
        walkMinutes: 7,
        gridlockWarning:
          "Chaweng Beach Road is one-way and chokes with delivery trucks immediately.",
      },
    ],
  },
];

// Preserving legacy single-region 'places' export for existing code compatibility
export const places = coastalRegions[0].places;

/* ── §3 Satellite & Meteorological Toolkits (from FloodDash) ─── */
export type SatelliteFeed = {
  id: string;
  name: string;
  type: "ocean-buoy" | "tide-gauge" | "sar-radar" | "dem-elevation";
  agency: string;
  updateFreq: string;
  status: "ONLINE" | "STANDBY" | "ACTIVE";
  value: string;
  significance: string;
};

export const satelliteToolkits: SatelliteFeed[] = [
  {
    id: "dart-23401",
    name: "DART Buoy 23401 (Andaman Sea)",
    type: "ocean-buoy",
    agency: "NDBC / NOAA & Thai TMD",
    updateFreq: "15 min (Real-time in trigger mode)",
    status: "ONLINE",
    value: "Sea Column Normal (Deviation < 0.02m)",
    significance:
      "Detects deep-water tsunami wave trains within 15 minutes of an Indian Ocean earthquake before waves reach the continental shelf.",
  },
  {
    id: "rtn-phuket",
    name: "Ko Taphao Noi Tide Station",
    type: "tide-gauge",
    agency: "Hydrographic Dept, Royal Thai Navy",
    updateFreq: "10 min relay (FloodDash)",
    status: "ONLINE",
    value: "Tidal Level +1.42m MSL (Astronomical cycle)",
    significance:
      "Measures coastal sea level anomalies, drawdown precursors, and wave crest arrivals along Phuket and Phang Nga shores.",
  },
  {
    id: "sentinel-1",
    name: "Sentinel-1 SAR Coastal Radar",
    type: "sar-radar",
    agency: "ESA Copernicus & GISTDA",
    updateFreq: "Daily / On-demand Rapid Mapping",
    status: "STANDBY",
    value: "Synthetic Aperture Radar Cloud-Penetrating Mode",
    significance:
      "All-weather radar imaging cuts through rain and storm clouds to map actual coastal inundation extent and breached infrastructure.",
  },
  {
    id: "dem-elevation",
    name: "Copernicus 30m Coastal DEM",
    type: "dem-elevation",
    agency: "GISTDA / ESA Earth Observation",
    updateFreq: "Calibrated Ground Elevation Model",
    status: "ACTIVE",
    value: "15-Meter High Ground Safe Contour Identified",
    significance:
      "Determines precise topographic safe zones. Any location above 15m elevation is considered safe from 2004-magnitude tsunami run-up.",
  },
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
