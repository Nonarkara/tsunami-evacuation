/** Provenance contract for every imported spatial feature.
 *
 * Every feature carried by the system retains its source, retrieval date,
 * licence, transformation history and uncertainty. No feature is promoted
 * from "mapped" to "designated evacuation route" or "verified shelter"
 * without a separate approval record.
 */
export type EvidenceClass =
  | "official_inventory"
  | "community_mapped"
  | "remote_sensing_derived"
  | "model_output"
  | "field_verified";

export type VerificationStatus = "unreviewed" | "reviewed" | "field_verified";

export type GeometryMethod =
  | "source_geometry"
  | "reviewed_geocode"
  | "documented_derivation";

export interface SpatialEvidence {
  sourceName: string;
  sourceUrl: string;
  sourceFeatureId: string | null;
  retrievedAt: string;           // ISO-8601 when this client retrieved the record
  observedAt: string | null;     // ISO-8601 when the source observed it, if stated
  license: string | null;
  evidenceClass: EvidenceClass;
  geometryMethod: GeometryMethod;
  positionalAccuracyM: number | null;
  verificationStatus: VerificationStatus;
  limitations: string[];         // honest limits, never suppressed
}

/** A feature can carry excellent geographic provenance while its opening
 *  status, capacity and accessibility remain unknown. Keep them separate. */
export interface ShelterReadiness {
  operationalStatus: VerificationStatus;
  accessibleEntry: VerificationStatus;
  usableRefugeElevationM: number | null;
  ownerOperatorPermission: VerificationStatus;
  limitations: string[];
}

export function emptyEvidence(sourceName: string, sourceUrl: string): SpatialEvidence {
  return {
    sourceName,
    sourceUrl,
    sourceFeatureId: null,
    retrievedAt: new Date().toISOString(),
    observedAt: null,
    license: null,
    evidenceClass: "community_mapped",
    geometryMethod: "documented_derivation",
    positionalAccuracyM: null,
    verificationStatus: "unreviewed",
    limitations: ["Retrieved without source geometry; coordinates unconfirmed."],
  };
}

export function evidenceSummary(evidence: SpatialEvidence): string {
  const parts = [
    evidence.sourceName,
    evidence.verificationStatus,
    evidence.geometryMethod,
    evidence.license ?? "licence unstated",
  ];
  return parts.filter(Boolean).join(" · ");
}
