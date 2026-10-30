import type { ManualLanguage } from './manual-content';

/** Renders the provenance and uncertainty block for any imported feature.
 *
 * Every feature panel answers: who supplied it, when it was retrieved,
 * how the geometry was obtained, what its verification status is, and
 * what limitations apply. Never suppress limitations.
 */
export function ProvenancePanel({ evidence, language='en', showLimitations=true, compact=false }: { evidence: import('./provenance').SpatialEvidence; language?:ManualLanguage; showLimitations?:boolean; compact?:boolean }) {
  const t=(en:string,th:string)=>language==='th'?th:en;
  return (
    <section className="provenance-panel" aria-label={t('Source provenance and uncertainty','ที่มาและความไม่แน่นอน')}>
      <div className="provenance-head">
        <span className="provenance-eyebrow">Provenance · แหล่งที่มา</span>
        <span className={`provenance-status provenance-${evidence.verificationStatus}`}>
          {evidence.verificationStatus==='unreviewed'?t('Location unreviewed','ยังไม่ตรวจยืนยันตำแหน่ง'):evidence.verificationStatus==='reviewed'?t('Desk reviewed','ตรวจเอกสารแล้ว'):t('Field verified','ยืนยันภาคสนามแล้ว')}
        </span>
      </div>
      <dl className="provenance-list">
        <div>
          <dt>{t('Source','แหล่งข้อมูล')}</dt>
          <dd>
            <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">{evidence.sourceName}</a>
          </dd>
        </div>
        <div hidden={compact}>
          <dt>{t('Evidence class','ประเภทหลักฐาน')}</dt>
          <dd>{evidence.evidenceClass==='official_inventory'?t('Official inventory','บัญชีข้อมูลหน่วยงาน'):evidence.evidenceClass}</dd>
        </div>
        <div hidden={compact}>
          <dt>{t('Geometry method','วิธีได้พิกัด')}</dt>
          <dd>{evidence.geometryMethod==='source_geometry'?t('Source coordinate fields','ช่องพิกัดจากต้นทาง'):evidence.geometryMethod}</dd>
        </div>
        <div>
          <dt>{t('Retrieved','ตรวจต้นฉบับเมื่อ')}</dt>
          <dd>{evidence.retrievedAt ? `${new Date(evidence.retrievedAt).toISOString().replace('T',' ').slice(0,19)} UTC` : t('not recorded','ไม่ได้บันทึก')}</dd>
        </div>
        <div hidden={compact}>
          <dt>{t('Observed','วันที่สังเกต')}</dt>
          <dd>{evidence.observedAt ?? t('not stated by source','ต้นทางไม่ระบุ')}</dd>
        </div>
        <div>
          <dt>{t('Licence','สัญญาอนุญาต')}</dt>
          <dd>{evidence.license ?? "licence unstated — reuse terms pending review"}</dd>
        </div>
        <div hidden={compact}>
          <dt>{t('Positional accuracy','ความแม่นยำตำแหน่ง')}</dt>
          <dd>
            {evidence.positionalAccuracyM === null ? t('not stated','ไม่ระบุ') : `${evidence.positionalAccuracyM} m`}
          </dd>
        </div>
        <div hidden={compact}>
          <dt>{t('Feature ID','รหัสวัตถุ')}</dt>
          <dd>{evidence.sourceFeatureId ?? t('dataset summary','สรุปชุดข้อมูล')}</dd>
        </div>
      </dl>
      {showLimitations && <div className="provenance-limitations">
        <strong>{t('Limitations','ข้อจำกัด')}</strong>
        <ul>
          {evidence.limitations.map((lim, i) => (
            <li key={i}>{lim}</li>
          ))}
        </ul>
      </div>}
      <p className="provenance-summary">{t('Source attribution does not verify coordinates or operational readiness.','การระบุที่มาไม่ได้ยืนยันพิกัดหรือความพร้อมใช้งานจริง')}</p>
    </section>
  );
}

/** Renders the shelter readiness block — separate from provenance.
 *
 * A feature can have excellent geographic provenance while its opening
 * status, capacity and accessibility remain unknown.
 */
export function ShelterReadinessPanel({ readiness, language='en' }: { readiness: import('./provenance').ShelterReadiness; language?:ManualLanguage }) {
  const t=(en:string,th:string)=>language==='th'?th:en;
  return (
    <section className="shelter-readiness-panel" aria-label="Shelter operational readiness">
      <h3>Operational readiness · ความพร้อมในการดำเนินการ</h3>
      <dl className="readiness-list">
        <div>
          <dt>Operational status</dt>
          <dd>{readiness.operationalStatus}</dd>
        </div>
        <div>
          <dt>Accessible entry</dt>
          <dd>{readiness.accessibleEntry}</dd>
        </div>
        <div>
          <dt>Usable refuge elevation</dt>
          <dd>
            {readiness.usableRefugeElevationM === null ? "not assessed" : `${readiness.usableRefugeElevationM} m`}
          </dd>
        </div>
        <div>
          <dt>Owner / operator permission</dt>
          <dd>{readiness.ownerOperatorPermission}</dd>
        </div>
      </dl>
      {readiness.limitations.length > 0 && (
        <div className="readiness-limitations">
          <strong>{t('Limitations','ข้อจำกัด')}</strong>
          <ul>
            {readiness.limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
