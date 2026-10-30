/** DDPM (Thailand Department of Disaster Prevention and Mitigation) tsunami-risk data.
 *
 * CONTRACT STATUS: PARTIALLY VERIFIED. The CKAN dataset page and CSV were inspected.
 * This inspection uses the CSV resource; no runtime FeatureServer connection is made.
 * The preceding review reported an unavailable FeatureServer, not a validated live feed.
 *
 * This module defines the provenance model for imported DDPM village-level risk records.
 * The inspection summary carries source, retrieval date, licence and verification
 * status. The data is treated as evidence — never as a tsunami inundation zone, never
 * as a shelter designation, and never as an evacuation route.
 *
 * Source: https://catalog.disaster.go.th/dataset/risk_tsunami
 * CSV download: https://catalog.disaster.go.th/dataset/920e3932-203b-4568-9acb-ac7978a78b20/resource/033cdf9d-2357-4683-9ce6-ae3b378bc9f1/download/ddpm_risk_tsunami.csv
 * FeatureServer (not connected): https://gis-portal.disaster.go.th/arcgis/rest/services/DDPM_RISK_TSUNAMI/FeatureServer/0
 */

import type { SpatialEvidence } from './provenance';

import summary from './data/ddpm-summary.json';
export const ddpmInspection = summary;
/** Display translations only; numeric identifiers and Thai names remain source-derived. */
export const provinceNamesEn: Record<number,string> = {
  11:'Samut Prakan',20:'Chonburi',21:'Rayong',22:'Chanthaburi',23:'Trat',24:'Chachoengsao',
  74:'Samut Sakhon',75:'Samut Songkhram',76:'Phetchaburi',77:'Prachuap Khiri Khan',
  80:'Nakhon Si Thammarat',81:'Krabi',82:'Phang Nga',83:'Phuket',84:'Surat Thani',
  85:'Ranong',86:'Chumphon',90:'Songkhla',91:'Satun',92:'Trang',94:'Pattani',96:'Narathiwat',
};
/** Numeric pcode is the province key; PV abbreviations are not unique. */
export type DdpmProvinceCode = number;
export interface DdpmProvince { pcode:number; nameTh:string; rows:number; }
export const DDPM_PROVINCES: DdpmProvince[] = summary.provinces;
export function provinceByCode(pcode:number): DdpmProvince|undefined {
  return DDPM_PROVINCES.find(p=>p.pcode===pcode);
}

/** One DDPM village-level risk record, parsed from the CSV (raw file hash retained in the inspection summary).
 * No field is reinterpreted — Height and Risk are passed through with their
 * numeric values and an explicit "meaning undocumented" caveat.
 */
export interface DdpmRiskVillage {
  oid: string;
  oid1: string;
  order: string;
  pv: string;           // source abbreviation; not a unique province key
  pcode: number | null;
  pname: string;        // province name Thai
  acode: string;        // amphoe code
  aname: string;        // amphoe name Thai
  tcode: string;        // tambon code
  tname: string;        // tambon name Thai
  mcode: string;        // village/muban code
  village: string;      // village name Thai
  height: number | null;   // source "Height" field — meaning undocumented
  risk: number | null;        // source code; classification meaning not verified
  side: string | null;        // "ฝั่งอ่าวไทย" = Gulf of Thailand side
  peopleM: number | null;
  peopleF: number | null;
  peopleAll: number | null;
  house: number | null;
  sourceX: number | null;    // source X; CRS not verified
  sourceY: number | null;    // source Y; CRS not verified
  lat: number | null;     // source Y_Lat; CRS not independently verified
  lng: number | null;     // source X_Long; CRS not independently verified
  globalId: string | null;
  raw: Record<string,string>; // retains original strings, blanks and source fields
}

/** Parse one CSV row into a DdpmRiskVillage. Numeric blanks remain null; source fields are not inferred. */
export function parseDdpmRow(row: Record<string, string>): DdpmRiskVillage {
  const toNum = (v: string | undefined): number | null => {
    if (v === undefined || v.trim() === '' || v.trim().toLowerCase() === 'null') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    oid: row.OID_ ?? '',
    oid1: row.OID1 ?? '',
    order: row.Order_ ?? '',
    pv: row.PV ?? '',
    pcode: toNum(row.pcode),
    pname: row.pname ?? '',
    acode: row.acode ?? '',
    aname: row.aname ?? '',
    tcode: row.tcode ?? '',
    tname: row.tname ?? '',
    mcode: row.mcode ?? '',
    village: row.Village ?? '',
    height: toNum(row.Height),
    risk: toNum(row.Risk),
    side: row.side ?? null,
    peopleM: toNum(row.People_M),
    peopleF: toNum(row.People_F),
    peopleAll: toNum(row.People_All),
    house: toNum(row.House),
    sourceX: toNum(row.X),
    sourceY: toNum(row.Y),
    lat: toNum(row.Y_Lat),
    lng: toNum(row.X_Long),
    globalId: row.GlobalID ?? null,
    raw: {...row},
  };
}

/** Dated full-file inspection, not a runtime fetch or imported map layer. */
export const ddpmDatasetEvidence: SpatialEvidence = {
  sourceName: 'DDPM · กรมป้องกันและบรรเทาสาธารณภัย',
  sourceUrl: summary.datasetUrl,
  sourceFeatureId: null,
  retrievedAt: summary.retrievedAt,
  observedAt: null,
  license: `${summary.licenseLabel} (version unstated)`,
  evidenceClass: 'official_inventory',
  geometryMethod: 'source_geometry',
  positionalAccuracyM: null,
  verificationStatus: 'unreviewed',
  limitations: [
    'Full CSV inspected; no records are mapped or used for routing.',
    'Source point method, coordinate reference system and positional accuracy are not independently verified.',
    'Height units and meaning are not verified; Risk codes are not interpreted as severity or probability.',
    'Dataset update date, resource modification and catalog modification are separate dates; observation dates remain unknown.',
  ],
};
export const DDPM_DATASET_LIMITATIONS = ddpmDatasetEvidence.limitations;
