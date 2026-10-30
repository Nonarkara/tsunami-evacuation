/** DDM (Department of Disaster Management) shelter inventory register.
 *
 * CONTRACT STATUS: UNREVIEWED. The DDM public table lists cyclone shelters,
 * flood shelters and disaster killas with name, area, construction info,
 * covering_people, location, contact and status. The visible table does not
 * expose latitude/longitude columns or explain every field; zero-valued and
 * repeated entries have been observed. Import records as unlocated candidates
 * first; create no shelter pin without source geometry or a reviewed
 * building-level match.
 *
 * Keep official listing separate from operational readiness: a shelter can be
 * listed in the inventory while its opening status, capacity and accessibility
 * remain unknown.
 */
export type ShelterType = "cyclone" | "flood" | "killa" | null;

export interface ShelterRecord {
  shelterId: string;
  name: string;
  bengaliName: string | null;
  type: ShelterType;
  coveringPeople: number | null;        // source-reported, NOT verified capacity
  geometry: import("./provenance").SpatialEvidence | null; // null until reviewed
  readiness: import("./provenance").ShelterReadiness;
  sourceUrl: string;
  retrievedAt: string;
  limitations: string[];
}

export interface ShelterRegister {
  shelters: ShelterRecord[];
  retrievedAt: string;
  sourceName: "DDM AWARE";
  sourceUrl: string;
  license: string | null;
  limitations: string[];
  dhakaCoverageReviewed: boolean;       // false until DNCC/DSCC scope confirmed
}

export function emptyShelterRecord(
  shelterId: string,
  name: string,
  bengaliName: string | null,
  type: ShelterType,
  coveringPeople: number | null,
): ShelterRecord {
  return {
    shelterId,
    name,
    bengaliName,
    type,
    coveringPeople,
    geometry: null,
    readiness: {
      operationalStatus: "unreviewed",
      accessibleEntry: "unreviewed",
      usableRefugeElevationM: null,
      ownerOperatorPermission: "unreviewed",
      limitations: ["Not yet reviewed for operational status."],
    },
    sourceUrl: "https://rapid.ddm.gov.bd/service/shelter_info",
    retrievedAt: new Date().toISOString(),
    limitations: [
      "Imported from official inventory without coordinate verification.",
      "covering_people is source-reported, not verified available capacity.",
      "No pin created until geometry is reviewed.",
    ],
  };
}

export function shelterReviewStatus(register: ShelterRegister): {
  total: number;
  located: number;
  reviewed: number;
  fieldVerified: number;
} {
  const total = register.shelters.length;
  const located = register.shelters.filter(s => s.geometry !== null).length;
  const reviewed = register.shelters.filter(
    s => s.geometry?.verificationStatus === "reviewed" ||
         s.geometry?.verificationStatus === "field_verified",
  ).length;
  const fieldVerified = register.shelters.filter(
    s => s.geometry?.verificationStatus === "field_verified",
  ).length;
  return { total, located, reviewed, fieldVerified };
}

export function shelterIsDesignatable(shelter: ShelterRecord): boolean {
  // A shelter may only be designated as an exercise destination after
  // geometry review AND operational review AND accessibility review AND
  // owner/operator permission.
  return (
    shelter.geometry !== null &&
    shelter.geometry.verificationStatus === "reviewed" &&
    shelter.readiness.operationalStatus === "reviewed" &&
    shelter.readiness.accessibleEntry === "reviewed" &&
    shelter.readiness.ownerOperatorPermission === "reviewed"
  );
}
