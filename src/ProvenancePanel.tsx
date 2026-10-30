import { evidenceSummary } from './provenance';

/** Renders the provenance and uncertainty block for any imported feature.
 *
 * Every feature panel answers: who supplied it, when it was retrieved,
 * how the geometry was obtained, what its verification status is, and
 * what limitations apply. Never suppress limitations.
 */
export function ProvenancePanel({ evidence }: { evidence: import('./provenance').SpatialEvidence }) {
  return (
    <section className="provenance-panel" aria-label="Source provenance and uncertainty">
      <div className="provenance-head">
        <span className="provenance-eyebrow">Provenance · প龍责</span>
        <span className={`provenance-status provenance-${evidence.verificationStatus}`}>
          {evidence.verificationStatus}
        </span>
      </div>
      <dl className="provenance-list">
        <div>
          <dt>Source</dt>
          <dd>
            <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">{evidence.sourceName}</a>
          </dd>
        </div>
        <div>
          <dt>Evidence class</dt>
          <dd>{evidence.evidenceClass}</dd>
        </div>
        <div>
          <dt>Geometry method</dt>
          <dd>{evidence.geometryMethod}</dd>
        </div>
        <div>
          <dt>Retrieved</dt>
          <dd>{evidence.retrievedAt ?? "not recorded"}</dd>
        </div>
        <div>
          <dt>Observed</dt>
          <dd>{evidence.observedAt ?? "not stated by source"}</dd>
        </div>
        <div>
          <dt>Licence</dt>
          <dd>{evidence.license ?? "licence unstated — reuse terms pending review"}</dd>
        </div>
        <div>
          <dt>Positional accuracy</dt>
          <dd>
            {evidence.positionalAccuracyM === null ? "not stated" : `${evidence.positionalAccuracyM} m`}
          </dd>
        </div>
        <div>
          <dt>Feature ID</dt>
          <dd>{evidence.sourceFeatureId ?? "none assigned"}</dd>
        </div>
      </dl>
      <div className="provenance-limitations">
        <strong>Limitations</strong>
        <ul>
          {evidence.limitations.map((lim, i) => (
            <li key={i}>{lim}</li>
          ))}
        </ul>
      </div>
      <p className="provenance-summary">{evidenceSummary(evidence)}</p>
    </section>
  );
}

/** Renders the shelter readiness block — separate from provenance.
 *
 * A feature can have excellent geographic provenance while its opening
 * status, capacity and accessibility remain unknown.
 */
export function ShelterReadinessPanel({ readiness }: { readiness: import('./provenance').ShelterReadiness }) {
  return (
    <section className="shelter-readiness-panel" aria-label="Shelter operational readiness">
      <h3>Operational readiness · অপারেশনাল připოჯ</h3>
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
          <strong>Limitations</strong>
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

/** Renders the FFWC station observation panel — river observations only. */
export function FfwcStationPanel({ observation }: { observation: import('./ffwc').FfwcStationObservation }) {
  return (
    <section className="ffwc-station-panel" aria-label="FFWC river station observation">
      <div className="ffwc-head">
        <span className="ffwc-eyebrow">River observation · নদী পর্যবেক্ষণ</span>
        <span className={`ffwc-freshness ffwc-${observation.freshness}`}>
          {observation.freshness}
        </span>
      </div>
      <dl className="ffwc-list">
        <div>
          <dt>Station</dt>
          <dd>{observation.name}{observation.bengaliName ? ` · ${observation.bengaliName}` : ""}</dd>
        </div>
        <div>
          <dt>Station ID</dt>
          <dd>{observation.stationId}</dd>
        </div>
        <div>
          <dt>Water level</dt>
          <dd>
            {observation.waterLevelM === null ? "not reported" : `${observation.waterLevelM} ${observation.unit ?? "m"}`}
          </dd>
        </div>
        <div>
          <dt>Danger level</dt>
          <dd>
            {observation.dangerLevelM === null ? "not stated" : `${observation.dangerLevelM} m`}
          </dd>
        </div>
        <div>
          <dt>Observed</dt>
          <dd>{observation.observationTime ?? "not stated by source"}</dd>
        </div>
        <div>
          <dt>Retrieved</dt>
          <dd>{observation.retrievalTime}</dd>
        </div>
        <div>
          <dt>Vertical datum</dt>
          <dd>{observation.verticalDatum ?? "not stated"}</dd>
        </div>
      </dl>
      <p className="ffwc-caution">
        River observation only. Not a street flood depth. No documented model
        relates this station reading to neighbourhood inundation.
      </p>
      <ProvenancePanel evidence={observation.geometry} />
    </section>
  );
}
