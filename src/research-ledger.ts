import { scenarios, PAPER, POPULATION } from './research';

export type ResearchLanguage = 'th' | 'en';
export type Bilingual = { th: string; en: string };
export const reviewedOn = '2026-10-27';
export const bi = (en: string, th: string): Bilingual => ({ en, th });
export const paperCitation = 'Trumikaborworn, N., Warnitchai, P., & Latcharote, P. (2026). Agent-Based Modeling and Simulation for Identifying Effective Measures on Tsunami Evacuation in Khao Lak, Thailand. SSRN preprint, posted 12 August 2026. https://ssrn.com/abstract=7270357';
export const sourceRows = [
  { id:'R1', kind:'used', name:bi('Khao Lak evacuation manuscript', 'ต้นฉบับงานวิจัยการอพยพเขาหลัก'), url:PAPER, locator:bi('§3.1–3.2; §4.1–4.5; Table 1, Table 3', 'หัวข้อ 3.1–3.2 และ 4.1–4.5; ตาราง 1 และ 3'), status:bi('Preprint · posted 12 Aug 2026 · not peer reviewed', 'บทความก่อนตีพิมพ์ · เผยแพร่ 12 ส.ค. 2026 · ยังไม่ผ่านการประเมินโดยผู้ทรงคุณวุฒิ'), use:bi('Source of the reported scenario outcomes. Original model, input files and independent replication are unavailable here. The supplied manuscript is not redistributed.', 'แหล่งผลลัพธ์ของฉากทัศน์ที่รายงาน ยังไม่มีแบบจำลองต้นฉบับ ไฟล์นำเข้า หรือการทำซ้ำโดยอิสระในระบบนี้ และไม่เผยแพร่ไฟล์ต้นฉบับซ้ำ') },
  { id:'R2', kind:'used', name:bi('OpenStreetMap walking network', 'โครงข่ายทางเดิน OpenStreetMap'), url:'https://www.openstreetmap.org/copyright', locator:bi('API 0.6 snapshot · 27 Oct 2026 · ODbL', 'ข้อมูลจาก API 0.6 ณ 27 ต.ค. 2026 · ODbL'), status:bi('Used · Bang Niang exercise only', 'ใช้งานแล้ว · เฉพาะแบบฝึกบางเนียง'), use:bi('Mapped paths retain node/way IDs. Access, barriers, widths and endpoint suitability have not been surveyed. Not approved evacuation routes.', 'เก็บรหัสจุดและเส้นทางจากแผนที่ไว้ ยังไม่ได้สำรวจการเข้าถึง สิ่งกีดขวาง ความกว้าง หรือความเหมาะสมของปลายทาง ไม่ใช่เส้นทางอพยพที่ได้รับอนุมัติ') },
  { id:'R3', kind:'used', name:bi('Mapzen terrain / Esri imagery', 'ภูมิประเทศ Mapzen / ภาพถ่าย Esri'), url:'https://github.com/tilezen/joerd/blob/master/docs/attribution.md', locator:bi('Local grid sampled 27 Oct 2026 · about 100m spacing', 'กริดในระบบเก็บตัวอย่าง 27 ต.ค. 2026 · ระยะห่างประมาณ 100 เมตร'), status:bi('Used · terrain and visual orientation', 'ใช้งานแล้ว · ภูมิประเทศและการมองพื้นที่'), use:bi('Coarse elevation and satellite backdrop; acquisition dates vary by source and are not established here. Not a surveyed refuge elevation or inundation model.', 'ระดับความสูงแบบหยาบและภาพพื้นหลัง วันที่ถ่ายหรือสำรวจแตกต่างตามแหล่งและยังไม่ได้ยืนยันในระบบนี้ ไม่ใช่ระดับอาคารที่สำรวจหรือแบบจำลองน้ำท่วม') },
  { id:'R4', kind:'candidate', name:bi('NOAA historical tsunami database', 'ฐานข้อมูลสึนามิในอดีต NOAA'), url:'https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/tsunamis', locator:bi('DOI 10.7289/V5PN93H7 · event/runup/gauge records', 'DOI 10.7289/V5PN93H7 · เหตุการณ์ ระดับน้ำขึ้นฝั่ง และสถานีวัด'), status:bi('Candidate · not connected', 'แหล่งที่เสนอ · ยังไม่ได้เชื่อมต่อ'), use:bi('Potential historical validation evidence. Event quality, coordinates, datum and timestamps require record-level checks; not a live warning feed.', 'อาจใช้ตรวจสอบแบบจำลองกับเหตุการณ์ในอดีต ต้องตรวจคุณภาพ พิกัด ระบบอ้างอิงความสูง และเวลาของแต่ละระเบียน ไม่ใช่ข้อมูลเตือนภัยสด') },
  { id:'R5', kind:'candidate', name:bi('GEBCO 2026 bathymetry', 'ความลึกท้องทะเล GEBCO 2026'), url:'https://www.gebco.net/data-products/gridded-bathymetry-data', locator:bi('15 arc-second global grid · source-type grid available', 'กริดทั่วโลกขนาด 15 พิลิปดา · มีกริดระบุชนิดแหล่งข้อมูล'), status:bi('Candidate · not ingested', 'แหล่งที่เสนอ · ยังไม่ได้นำเข้า'), use:bi('Potential offshore model input. Grid spacing is not local survey accuracy; shoreline and nearshore resolution require assessment.', 'อาจใช้เป็นข้อมูลนำเข้าแบบจำลองนอกชายฝั่ง ระยะห่างกริดไม่ใช่ค่าความแม่นยำจากการสำรวจ ต้องประเมินข้อมูลแนวชายฝั่งและน้ำตื้นเพิ่มเติม') },
  { id:'R6', kind:'candidate', name:bi('GeoClaw tsunami data guidance', 'แนวทางข้อมูลสึนามิ GeoClaw'), url:'https://www.clawpack.org/tsunamidata.html', locator:bi('Clawpack 5.14.x · terrain, fault sources and gauges', 'Clawpack 5.14.x · ภูมิประเทศ แหล่งกำเนิดแผ่นดินไหว และสถานีวัด'), status:bi('Candidate workflow · solver not running here', 'กระบวนการที่เสนอ · ระบบนี้ยังไม่ได้รันตัวแก้สมการ'), use:bi('Documents inputs and datum checks for a future hydrodynamic workflow. Linking the documentation does not establish model validation.', 'อธิบายข้อมูลนำเข้าและการตรวจระบบอ้างอิงความสูงสำหรับแบบจำลองพลศาสตร์น้ำในอนาคต การเชื่อมโยงเอกสารไม่ได้แปลว่าได้ตรวจสอบแบบจำลองแล้ว') },
  { id:'R7', kind:'method', name:bi('Grimm et al. (2020): ODD protocol', 'Grimm และคณะ (2020): กรอบ ODD'), url:'https://www.jasss.org/23/2/7.html', locator:bi('JASSS 23(2), 7 · DOI 10.18564/jasss.4259', 'JASSS 23(2), 7 · DOI 10.18564/jasss.4259'), status:bi('Reporting reference · not a certification', 'เอกสารอ้างอิงด้านการรายงาน · ไม่ใช่การรับรอง'), use:bi('Overview, Design concepts and Details guide the proposed reproducibility record. ODD documentation alone does not validate predictions.', 'ใช้โครงสร้างภาพรวม แนวคิดการออกแบบ และรายละเอียด เพื่อจัดทำบันทึกสำหรับการทำซ้ำ การมีเอกสาร ODD เพียงอย่างเดียวไม่ได้ยืนยันความถูกต้องของการพยากรณ์') },
] as const;

export const packageNames: Bilingual[] = [
  bi('Study baseline', 'กรณีฐานของงานวิจัย'),
  bi('PD50 · walking preference', 'PD50 · ความต้องการเดินเท้า'),
  bi('+ VS14 · candidate buildings', '+ VS14 · อาคารที่เสนอเพิ่มเติม'),
  bi('+ VE50 · vertical preference', '+ VE50 · ความต้องการอพยพแนวดิ่ง'),
  bi('+ SG135 · total signs', '+ SG135 · ป้ายรวม 135 จุด'),
];
export const glossary = [
  [bi('Modeled victim share','สัดส่วนผู้ประสบภัยตามเกณฑ์แบบจำลอง'), bi('A source-defined modeled outcome, not observed deaths or individual risk.','ผลลัพธ์ตามเกณฑ์ที่ผู้วิจัยกำหนด ไม่ใช่จำนวนผู้เสียชีวิตจริงหรือความเสี่ยงของแต่ละคน')],
  [bi('Water depth / surface elevation','ความลึกน้ำ / ระดับผิวน้ำ'), bi('Depth is above local ground; surface elevation is relative to a named vertical datum.','ความลึกวัดจากพื้นดิน ณ จุดนั้น ส่วนระดับผิวน้ำเทียบกับระบบอ้างอิงความสูงที่ระบุ')],
  [bi('Wave height / runup','ความสูงคลื่น / ระดับน้ำขึ้นฝั่ง'), bi('Crest-to-trough wave height and maximum coastal runup are different quantities.','ความสูงคลื่นจากท้องคลื่นถึงยอดคลื่น กับระดับสูงสุดที่น้ำขึ้นถึงบนฝั่งเป็นคนละปริมาณ')],
  [bi('Verification / validation','การตรวจการทำงาน / การตรวจความสอดคล้องกับข้อมูลจริง'), bi('Software tests check implementation; independent observations test fitness for a stated purpose.','การทดสอบซอฟต์แวร์ตรวจการทำงาน ส่วนข้อมูลสังเกตอิสระใช้ตรวจความเหมาะสมสำหรับวัตถุประสงค์ที่กำหนด')],
];

export function evidenceCsv() {
  const rows = [['package_en','package_th','baseline_victim_percent','delayed_victim_percent','modeled_population','source','locator','tier','reviewed_on'], ...scenarios.map((s,i)=>[packageNames[i].en,packageNames[i].th,s.affected.toFixed(1),s.delayed.toFixed(1),String(POPULATION),PAPER,s.reference,'reported model result',reviewedOn])];
  return '\uFEFF'+rows.map(row=>row.map(value=>'"'+value.replaceAll('"','""')+'"').join(',')).join('\r\n');
}
export const bibtex = `@misc{trumikaborworn2026khaolak,
  author = {Trumikaborworn, Nattapon and Warnitchai, Pennung and Latcharote, Panon},
  title = {Agent-Based Modeling and Simulation for Identifying Effective Measures on Tsunami Evacuation in Khao Lak, Thailand},
  year = {2026},
  note = {SSRN preprint, posted 12 August 2026; accessed 27 October 2026},
  url = {https://ssrn.com/abstract=7270357}
}`;
