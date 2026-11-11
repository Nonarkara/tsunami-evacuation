import { ReadingDialog } from './ReadingDialog';
import { bibtex, evidenceCsv, type ResearchLanguage } from './research-ledger';

function save(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ResearchDownloads({ language }: { language: ResearchLanguage }) {
  const thai = language === 'th';
  return <div className="research-downloads">
    <button onClick={() => save('khao-lak-reported-results.csv', evidenceCsv(), 'text/csv;charset=utf-8')}>
      {thai ? 'ดาวน์โหลดผล CSV' : 'Download results CSV'}
    </button>
    <button onClick={() => save('khao-lak-citation.bib', bibtex, 'application/x-bibtex;charset=utf-8')}>
      {thai ? 'ดาวน์โหลด BibTeX' : 'Download BibTeX'}
    </button>
    <a href="https://github.com/Nonarkara/tsunami-evacuation" target="_blank" rel="noreferrer">
      {thai ? 'โค้ดและชุดทดสอบ' : 'Code & tests'}
    </a>
  </div>;
}

export function TechnicalFiles({ language }: { language: ResearchLanguage }) {
  const thai = language === 'th';
  return <div className="technical-files">
    <section>
      <h3>{thai ? 'ผลจากบทความเขาหลัก' : 'Reported Khao Lak results'}</h3>
      <p>{thai ? 'เงื่อนไขเวลาทั้งสองแบบ' : 'Both warning and preparation schedules'} · <a href="https://ssrn.com/abstract=7270357" target="_blank" rel="noreferrer">SSRN 7270357 ↗</a></p>
      <ResearchDownloads language={language} />
    </section>
    <section>
      <h3>{thai ? 'ข้อมูลแบบฝึกบางเนียง' : 'Bang Niang practice inputs'}</h3>
      <p>{thai ? 'โครงข่าย OSM และกริดความสูง Mapzen · ปลายทางแบบฝึกยังไม่รับรอง' : 'OSM network and Mapzen elevation grid · unapproved practice endpoint'}</p>
      <div className="research-downloads">
        <a href="/data/rehearsal-routes.json" download>{thai ? 'เส้นทาง JSON' : 'Routes JSON'}</a>
        <a href="/data/terrain.json" download>{thai ? 'ความสูง JSON' : 'Elevation JSON'}</a>
        <a href="/data/hazard-replay.schema.json" download>{thai ? 'โครงสร้างไฟล์เล่นซ้ำ' : 'Replay file schema'}</a>
        <a href="/data/README.md" target="_blank" rel="noreferrer">{thai ? 'ที่มาของไฟล์' : 'File provenance'}</a>
      </div>
    </section>
    <section>
      <h3>{thai ? 'บัญชีหมู่บ้านพังงา' : 'Phang Nga village inventory'}</h3>
      <p>{thai ? 'ปภ. · ภาพข้อมูล 28 ต.ค. 2026 · พิกัดในบัญชีหมู่บ้าน' : 'DDPM snapshot · 28 Oct 2026 · village inventory coordinates'}</p>
      <div className="research-downloads">
        <a href="/data/ddpm-phang-nga-risk-villages-2026-10-28.geojson" download>GeoJSON</a>
      </div>
    </section>
  </div>;
}

export function TechnicalData({ language }: { language: ResearchLanguage }) {
  return <ReadingDialog compact language={language} className="technical-data-trigger"
    title={language === 'th' ? 'ข้อมูลและไฟล์ต้นทาง' : 'Data & sources'}>
    <TechnicalFiles language={language} />
  </ReadingDialog>;
}
