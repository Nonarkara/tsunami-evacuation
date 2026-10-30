import { useState } from 'react';
import { dhakaBoundary, FLOOD_SCENARIO_LIMITATIONS, type FloodScenario } from './research';
import { ProvenancePanel, ShelterReadinessPanel } from './ProvenancePanel';
import { emptyStationObservation } from './ffwc';
import { emptyShelterRecord, shelterReviewStatus, type ShelterRegister } from './shelter';
/** Provenance-first Dhaka planning mode.
 *
 * Starts with no coordinates, no routes and no designated shelters. Every
 * imported feature carries its source, retrieval date, licence, geometry
 * method and verification status. The timing and queue engine runs only as
 * a labelled exercise scenario over unvalidated mapped features.
 */
export function DhakaPanel({ language }: { language: string }) {
  const t = (en: string, bn: string) => language === 'bn' ? bn : en;
  const [scenario, setScenario] = useState<FloodScenario>("river_flood");

  const station = emptyStationObservation("ffwc-demo-001", "Example FFWC station");
  const shelter = emptyShelterRecord("ddm-demo-001", "Example shelter", "উদাহরণ আশ্রয়কেন্দ্র", null, null);
  const register: ShelterRegister = {
    shelters: [shelter],
    retrievedAt: new Date().toISOString(),
    sourceName: "DDM AWARE",
    sourceUrl: "https://rapid.ddm.gov.bd/service/shelter_info",
    license: null,
    limitations: [
      "Imported from official inventory without coordinate verification.",
      "covering_people is source-reported, not verified available capacity.",
      "No pin created until geometry is reviewed.",
    ],
    dhakaCoverageReviewed: false,
  };

  const { total, located, reviewed, fieldVerified } = shelterReviewStatus(register);

  const floodScenarios: FloodScenario[] = ["river_flood", "rainfall_waterlogging", "compound_flood"];
  const scenarioLimitations = FLOOD_SCENARIO_LIMITATIONS[scenario];

  return (
    <section className="dhaka-panel" lang={language} aria-label="Dhaka flood planning · ঢাকা বন্যা পরিকল্পনা">
      <header className="dhaka-head">
        <span className="dhaka-eyebrow">{t('Dhaka flood planning — provenance-first', 'ঢাকা বন্যা পরিকল্পনা — উৎস-প্রথম')}</span>
        <h2>{t('Planning demonstrator — not operational guidance', 'পরিকল্পনা প্রদর্শনী — অপারেশনাল নির্দেশনা নয়')}</h2>
      </header>

      <div className="dhaka-boundary">
        <h3>{t('Study boundary', 'অভ্যাস সীমা')}</h3>
        <dl className="boundary-list">
          <div>
            <dt>{t('Scope', 'ক্ষেত্র')}</dt>
            <dd>{dhakaBoundary.scope}</dd>
          </div>
          <div>
            <dt>{t('Status', 'অবস্থা')}</dt>
            <dd>{dhakaBoundary.status}</dd>
          </div>
          <div>
            <dt>{t('Retrieved', 'প্রাপ্তি')}</dt>
            <dd>{dhakaBoundary.retrievedAt ?? "not retrieved"}</dd>
          </div>
        </dl>
        <p className="dhaka-note">{t('No coordinates accepted without sourced geometry and extraction date. A mapped road is not a verified evacuation route.', 'সূত্রযুক্ত জ্যামিতি এবং নিষ্কৃদ্ধন ছাড়াপ্রদত্ত নদার্সস্ব bodies ন।')}</p>
      </div>

      <div className="dhaka-scenarios">
        <h3>{t('Flood scenario types', 'বন্যা পরিস্থিতি প্রকার')}</h3>
        <div className="scenario-selector">
          {floodScenarios.map((s) => (
            <button
              key={s}
              className={scenario === s ? "scenario-btn active" : "scenario-btn"}
              aria-pressed={scenario === s}
              onClick={() => setScenario(s)}
            >
              {t(
                s === "river_flood" ? "River flood" : s === "rainfall_waterlogging" ? "Rainfall waterlogging" : "Compound flood",
                s === "river_flood" ? "নদী বন্যা" : s === "rainfall_waterlogging" ? "বৃষ্টijal জলাঙন" : "মিশ্র বন্যা",
              )}
            </button>
          ))}
        </div>
        <div className="scenario-limitations">
          <strong>{t('Limitations for this scenario', 'এই পরিস্থিতির সীমাবদ্ধতা')}</strong>
          <ul>
            {scenarioLimitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="dhaka-ffwc">
        <h3>{t('FFWC station observation', 'এফডব্লিউসি স্টেশন পর্যবেক্ষণ')}</h3>
        <ProvenancePanel evidence={station.geometry} />
        <p className="dhaka-caution">
          {t('Contract untested. The live FFWC payload shape, authentication and reuse terms have not been verified. River observation only — not a street flood depth.', 'চুক্তি পরীক্ষিত হয়নি। vivent FFWC পেলোড আকৃতি, প্রমাণীকরণ এবং পুনঃ ব্যবহার sharja যাচাই করা হয়নি। নদী পর্যবেক্ষণ শুধুমাত্র — রাস্তার বন্যা গভীরতা নয়।')}
        </p>
      </div>

      <div className="dhaka-shelters">
        <h3>{t('DDM shelter register', 'ডিডিএম আশ্রয় তালিকা')}</h3>
        <div className="shelter-stats">
          <span>{t('Total', 'মোট')} : {total}</span>
          <span>{t('Located', 'অবস্থান') } : {located}</span>
          <span>{t('Reviewed', 'সংশোধন') } : {reviewed}</span>
          <span>{t('Field-verified', 'ক্ষেত্র-যাচাইকৃত') } : {fieldVerified}</span>
        </div>
        <p>{t('No shelter pin created without source geometry or a reviewed building-level match.', 'উৎস জ্যামিতি বা পর্যালোচিত ভবন-স্তরের মিল ছাড়া কোন অশ্রয় পাইন সৃষ্টি করা হয় না।')}</p>
        <ShelterReadinessPanel readiness={shelter.readiness} />
        <p className="dhaka-caution">
          {t('Listed in official inventory ≠ confirmed operational for this event.', 'আধायरিক তালিকা ≠ এই সংকটের জন্য নিশ্চিত অপারেশনাল নয়।')}
        </p>
      </div>

      <div className="dhaka-engine">
        <h3>{t('Timing and queue engine', 'সময় এবং লাইন mekanizm')}</h3>
        <p>{t('Runs only as a labelled exercise scenario over unvalidated mapped features.', 'শুধুমাত্র একটি লেবেলযুক্ত ব্যায়াম পরিস্থিতি হিসাবে অযাচাইকৃত নকশা বৈশিষ্ট্য Bry 4d।')}</p>
        <p className="dhaka-caution">
          {t('"Time to destination" is the defensible initial claim. "Time to safety" requires additional evidence.', '"গন্তব্য পর্যন্ত সময়" প্রাথমিক দাবি। "নিরাপত্তা পর্যন্ত সময়" Further প্রমাণ প্রয়োজন।')}
        </p>
      </div>
    </section>
  );
}
