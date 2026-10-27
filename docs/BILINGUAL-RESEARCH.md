# Thai / English research dossier

Released 28 October 2026; source inspection began 27 October. Scope: the Research section, its two-language content model, query-addressable language selection, Thai font support, source ledger, result comparison and exports. Other application views retain their existing content; this release does not claim complete translation of every screen. Thai/English presentation is not evidence of user comprehension or native human review.

## Research question and source hierarchy

Under the Khao Lak manuscript's assumptions, how do cumulative walking, refuge, preference and signage interventions change modeled victim share? The supplied manuscript is the source for numeric outcomes; primary provider documentation establishes source metadata and possible input uses. Public-source links do not independently corroborate the manuscript's outcome rates. This is a critical single-study synthesis with separate candidate data/method references, not a systematic literature review.

The supplied PDF SHA-256 is `bb1a67fdae2fc6eb4ce390453532b8e4273d3b7067e36beb02fa5137b81e77ec`. It is not redistributed. Inspect §§3.1–3.2, 4.1–4.5, Table 1 and Table 3. The explicit unreviewed-preprint footer, 30×30m/minute hazard input, modeled depth>0.5m outcome rule, building-based population estimate and limited run ensemble constrain interpretation.

Primary metadata inspected 27 October 2026:

- [SSRN record](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7270357): posted12August2026; author order Trumikaborworn, Warnitchai, Latcharote. Corrects the site's earlier2024/year and author-order error. The paper is treated as an unreviewed preprint; peer review or a later version has not been established. Corrected active source citation, masthead/footer, HTML description and downloaded BibTeX; older release receipts remain historical evidence.
- [NOAA NCEI](https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/tsunamis): historical events/runup/gauges, DOI10.7289/V5PN93H7; candidate historical validation evidence.
- [GEBCO](https://www.gebco.net/data-products/gridded-bathymetry-data): 2026 15arc-second global terrain/bathymetry grid with source-type information; not ingested.
- [GeoClaw data guidance](https://www.clawpack.org/tsunamidata.html): sources, coordinate/datum and gauge checks; no solver runs here.
- [ODD reporting protocol](https://www.jasss.org/23/2/7.html): Grimm etal.(2020), JASSS23(2),7, DOI10.18564/jasss.4259. Reporting guidance, not scientific certification.
- [OSM license](https://www.openstreetmap.org/copyright), [Mapzen lineage](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) and [Esri attribution](https://www.esri.com/en-us/legal/terms/data-attributions): used source roles remain separate from approved routes or certified elevations. Snapshot collection dates do not establish acquisition dates of all underlying measurements.

No new physics, forecasts or field observations were generated. The browser's point queues, illustrative water and source-study results are explicitly separate. Model repeatability is distinct from external validation. Cumulative scenarios do not isolate causal effects. The source Table3/§4.3 25%/27% pedestrian-preference discrepancy remains open; no unreported combinations are inferred.

## Product and localization

`src/research-ledger.ts` supplies bilingual source status, scope, names, locators and glossary; shared numeric outcomes come from the existing canonical scenario series. `src/ResearchSection.tsx` renders semantic tables, proportional bars, timing/method comparisons, uncertainty disclosures, a filterable ledger and a five-part proposed validation agenda. This preserves the content of the old three diagrams while removing unsupported rhetoric and separating source results from operational recommendations.

Both columns remain visible when the selected timing condition changes emphasis. The 0–25% bar scale is explicit. Definition/accounting and uncertainty text is available in both languages. Sources distinguish used, candidate and reporting-method status. A cited record can still be reached after filtering. Deep research/source hashes reopen the research view on reload. `?lang=th#research` and `?lang=en#research` are shareable; no language preference or personal record is uploaded.

Prompt Thai fonts (400/500/600/700) are self-hosted beside existing Jost. Thai uses correct lang metadata, normal dictionary word breaking, no uppercase transformation and1.75line height. Dates use the unambiguous Gregorian source year2026 in both versions. Paper titles and citations retain their original English. English public source/provider names are not fabricated Thai institutional names.

## Validation and review

26 tests passed after the update: existing crowd/source/plan invariants plus CSV numeric/denominator/provenance retention, Unicode BOM for Thai exports, checked citation metadata and bilingual ledger records. Production build and contrast roles passed. An initial test incorrectly demanded Thai characters in the unchanged international JASSS/DOI locator; it was corrected to require nonempty bilingual fields while preserving the canonical locator.

Real browser trial: delayed series displayed22.6/10.6/5.6/3.4/2.9%; candidate filter displayedR4/R5/R6 only; clicking SourceR1 restored all seven records and scrolled toR1; real CSV/BibTeX downloads contained correct UTF-8 Thai, both timing series, population39041, source locators and corrected author order. All four disclosures were opened at390px with no horizontal overflow. Source/method reading is intentionally long and section-addressable.

Eight current geometry cases (Thai/English ×390×844,1024×768,1280×720,1440×900) passed `design/research-contract.json`. Captures and results are in `design/research-captures.json` and `research-result.json`. In an isolated copy on localhost5174, restoring an oversized253.9px header failed four checks: heading, first-screen table visibility, chrome and decision visibility. No production site was changed for the fault test; no budgets were widened. The first phone draft put too much explanation before the comparison; the research question was retained below the result and the heading regrouped with its language controls. Final screenshots are `docs/evidence/research-{th,en}-*.png`.

Independent reviewer `bilingual_research_review` checked original PDF extraction, content parity and Thai/English screenshots. Findings closed: corrected timing locators, source-navigation/filter interaction, Thai runup terminology and prominent preprint status. No remaining code/content/visual blockers were reported. Seven design rules: content-sized controls, balanced table/reading composition, bounded prose, Jost/Prompt, no decorative cards, evidence-led hierarchy and no padded hero. Human native-language/community review, independent scientific replication and field validation remain unverified and are explicitly part of the proposed validation agenda. None is presented as already completed.

Canonical source commit, Worker version and live checks are appended after deployment.
