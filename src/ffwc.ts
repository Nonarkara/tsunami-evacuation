/** FFWC (Bangladesh Flood Forecasting and Warning Centre) station observations.
 *
 * CONTRACT STATUS: UNTESTED. The API landing page documents the resource family
 * (water levels, warnings, forecasts, station geometry) but the live payload
 * shape, authentication requirements, rate limits and reuse terms have not been
 * verified by this client. Treat every function here as a structural proposal,
 * not a working integration.
 *
 * The intended use is a station observation panel: river observations remain
 * river observations until an explicitly documented model relates them to
 * neighbourhood inundation. Never derive street flood depths from a station
 * reading here.
 */
export type FfwcFreshness = "current" | "stale" | "missing";

export interface FfwcStationObservation {
  stationId: string;
  name: string;
  bengaliName: string | null;
  geometry: import("./provenance").SpatialEvidence;
  waterLevelM: number | null;
  unit: string | null;
  observationTime: string | null;   // source-stated ISO-8601
  retrievalTime: string;            // when this client fetched it
  dangerLevelM: number | null;
  verticalDatum: string | null;
  forecastIssueTime: string | null;
  forecastValidTime: string | null;
  sourceUrl: string;
  freshness: FfwcFreshness;
  limitations: string[];
}

export interface FfwcStationRegister {
  stations: FfwcStationObservation[];
  retrievedAt: string;
  sourceName: "BWDB/FFWC";
  sourceUrl: string;
  license: string | null;
  limitations: string[];
}

export function emptyStationObservation(stationId: string, name: string): FfwcStationObservation {
  return {
    stationId,
    name,
    bengaliName: null,
    geometry: {
      sourceName: "BWDB/FFWC",
      sourceUrl: "https://api3.ffwc.gov.bd/data_load/",
      sourceFeatureId: stationId,
      retrievedAt: new Date().toISOString(),
      observedAt: null,
      license: null,
      evidenceClass: "official_inventory",
      geometryMethod: "source_geometry",
      positionalAccuracyM: null,
      verificationStatus: "unreviewed",
      limitations: ["Station geometry and vertical datum not yet verified against the live payload."],
    },
    waterLevelM: null,
    unit: null,
    observationTime: null,
    retrievalTime: new Date().toISOString(),
    dangerLevelM: null,
    verticalDatum: null,
    forecastIssueTime: null,
    forecastValidTime: null,
    sourceUrl: `https://api3.ffwc.gov.bd/data_load/?station=${stationId}`,
    freshness: "missing",
    limitations: ["Live payload not yet inspected; freshness unknown."],
  };
}

export function freshnessFromRetrieval(retrievalTime: string | null): FfwcFreshness {
  if (!retrievalTime) return "missing";
  const ageMs = Date.now() - Date.parse(retrievalTime);
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours > 24) return "stale";
  return "current";
}

export function parseStationObservation(
  _raw: unknown,
  stationId: string,
  name: string,
  sourceUrl: string,
): FfwcStationObservation {
  // Structural proposal only: the live payload shape is unknown.
  // This function must be rewritten once the actual FFWC response is inspected.
  const observation = emptyStationObservation(stationId, name);
  observation.retrievalTime = new Date().toISOString();
  observation.freshness = freshnessFromRetrieval(observation.retrievalTime);
  observation.sourceUrl = sourceUrl;
  observation.limitations = [
    "Payload shape unverified — this parser is a structural placeholder.",
    "River observation only; not a street flood depth.",
  ];
  return observation;
}
