export type ManualPage = 'explore' | 'satellite' | 'prepare' | 'drill' | 'research' | 'ddpm';
export type ManualLanguage = 'en' | 'th';
const both = (en: string, th: string) => ({ en, th });

export const manualTopics = {
  explore: {
    name: both('Model · terrain & rehearsal', 'แบบจำลอง · ภูมิประเทศและแบบฝึก'),
    steps: [
      both('Choose a coastal region and place in the top banner; on a phone open Map controls (…). The walking-network rehearsal currently covers Bang Niang only; other places show terrain and their data gaps.', 'เลือกภูมิภาคและสถานที่ในแถบบน บนโทรศัพท์ให้เปิดเครื่องมือแผนที่ (…) แบบฝึกบนโครงข่ายทางเดินรองรับเฉพาะบางเนียงในขณะนี้ พื้นที่อื่นแสดงภูมิประเทศและข้อมูลที่ยังขาด'),
      both('Escape (door-and-arrow symbol) opens the warning-to-action lesson and a paused 1× practice walk. Start, pause, change playback speed, or seek on the marked time ruler. The picture button switches simplified terrain and existing Esri imagery without leaving the lesson. Turn arrows belong to the practice path; Confirm plan opens your on-device form. The water is an illustration, never a race, flood detector or instruction to wait for a level. An imported replay is retained but shown only outside Escape.', 'ฝึกอพยพ (รูปประตูกับลูกศร) เปิดบทเรียนสัญญาณเตือนสู่การปฏิบัติและการเดินฝึกที่หยุดไว้ที่ 1× กดเริ่ม หยุด เปลี่ยนความเร็วเล่น หรือเลื่อนแถบเวลาที่มีขีดแบ่ง ปุ่มรูปภาพสลับภูมิประเทศเรียบกับภาพ Esri เดิมโดยไม่ออกจากบทเรียน ลูกศรเลี้ยวเป็นของทางฝึก ปุ่มยืนยันแผนเปิดแบบฟอร์มในอุปกรณ์ น้ำเป็นภาพสาธิต ไม่ใช่การแข่งขัน ตัวตรวจน้ำท่วม หรือคำสั่งให้รอระดับน้ำ ไฟล์เล่นซ้ำที่นำเข้ายังเก็บไว้ แต่แสดงนอกโหมดฝึกอพยพ'),
      both('Use 2D map for orientation, Fly-by to follow the selected exercise route, or Walk-through for a coarse terrain perspective. Overview returns to the area; Queue inspects a model node. Walk-through is not street imagery.', 'ใช้ 2D map เพื่อดูภาพรวม ใช้ Fly-by เพื่อติดตามเส้นทางแบบฝึกที่เลือก หรือ Walk-through เพื่อมองภูมิประเทศแบบหยาบ Overview กลับไปดูพื้นที่ ส่วน Queue ใช้ดูจุดคิวในแบบจำลอง Walk-through ไม่ใช่ภาพระดับถนน'),
      both('On Khao Lak · Phang Nga, DDPM maps opens official evacuation-map links for sheets PG_6, PG_7 and PG_10. Those files stay on tsunami.disaster.go.th. Paper rings are a 28 October 2026 snapshot of DDPM-listed Phang Nga tsunami-risk villages. The source Height value is omitted.', 'ในมุมมองเขาหลัก · พังงา ปุ่ม DDPM maps เปิดลิงก์แผนที่อพยพทางการแผ่น PG_6, PG_7 และ PG_10 ไฟล์อยู่ที่ tsunami.disaster.go.th วงกระดาษคือภาพข้อมูล 28 ตุลาคม 2026 ของหมู่บ้านที่ ปภ. ระบุว่าเสี่ยงสึนามิในพังงา ค่า Height จากต้นทางไม่ถูกนำมาแสดง'),
      both('Walk-through uses a 1.65m eye camera above coarse terrain. Outside the Bang Niang route exercise, use arrow buttons or W/S to move, A/D to turn. The camera can pass through geometry and does not establish walkability. Manual movement pauses playback and exits follow mode. Only explicit source height tags make buildings 3D; missing heights and floor-based estimates remain flat. Building footprints do not prove entrances or refuge suitability.', 'Walk-through ใช้มุมมองระดับสายตา 1.65 เมตรเหนือภูมิประเทศแบบหยาบ นอกแบบฝึกบางเนียง ใช้ลูกศรหรือ W/S เพื่อเลื่อน และ A/D เพื่อหัน กล้องอาจผ่านรูปทรงได้ ไม่ได้ยืนยันว่าทางเดินได้จริง การเลื่อนด้วยตนเองหยุดการเล่นและออกจากการติดตาม อาคารสามมิติใช้เฉพาะความสูงที่ต้นทางระบุ ความสูงที่ไม่ทราบหรือประมาณจากจำนวนชั้นแสดงแบน รูปอาคารไม่ยืนยันทางเข้าหรือความเหมาะสมเป็นที่อพยพ'),
      both('Set People, Pace, Delay and Route. Start begins an exercise warning clock; Run resumes and Pause holds it. Drag the time slider to inspect a moment, change Rate to replay faster, or Reset to return to the start. Pause before opening this guide if you want to hold the frame.', 'ตั้งค่า People (จำนวนคน), Pace (ความเร็ว), Delay (เวลาเตรียมตัว) และ Route (เส้นทาง) Start เริ่มนาฬิกาคำเตือนของแบบฝึก Run เล่นต่อ และ Pause หยุดชั่วคราว เลื่อนแถบเวลาเพื่อดูช่วงที่ต้องการ เปลี่ยน Rate เพื่อเล่นเร็วขึ้น หรือ Reset เพื่อกลับจุดเริ่ม หากต้องการคงภาพเดิม ให้กด Pause ก่อนเปิดคู่มือ'),
    ],
    note: both('Route arrows point toward an unapproved exercise endpoint. Dots are modeled people; queued totals are at network nodes, not a physical crowd footprint. The default Water level and animated rise are illustrations, not wave forecasts. Imported research frames are an unverified model replay; water does not change agent movement. Open Sources, assumptions, settings & coverage for capacity, water-rise and local research-file controls.', 'ลูกศรชี้ไปยังปลายทางแบบฝึกที่ยังไม่ได้รับอนุมัติ จุดแทนคนในแบบจำลอง ยอดคิวอยู่ที่จุดบนโครงข่าย ไม่ใช่ขอบเขตฝูงชนจริง Water level และภาพน้ำสูงขึ้นตามค่าตั้งเริ่มต้นเป็นภาพประกอบ ไม่ใช่การพยากรณ์คลื่น ส่วนเฟรมวิจัยที่นำเข้าเป็นการเล่นซ้ำแบบจำลองที่ยังไม่ได้ตรวจสอบ และน้ำไม่เปลี่ยนการเคลื่อนที่ของตัวแทน เปิด Sources, assumptions, settings & coverage เพื่อดูค่าความจุ ภาพน้ำสูงขึ้น และการอ่านไฟล์วิจัยในอุปกรณ์'),
  },
  prepare: {
    name: both('Plan · make your own record', 'แผน · บันทึกข้อมูลของคุณ'),
    steps: [
      both('Enter where you stay, destinations confirmed with the local authority, route landmarks, a contact and assistance needs. A building’s height or number of floors does not establish safety.', 'กรอกที่พัก ปลายทางที่ยืนยันกับหน่วยงานท้องถิ่น จุดสังเกตตามทาง ผู้ติดต่อ และความช่วยเหลือที่ต้องการ ความสูงหรือจำนวนชั้นของอาคารเพียงอย่างเดียวไม่ยืนยันความปลอดภัย'),
      both('The walking estimate uses the distance and speed you enter. It excludes queues and hazards and is not a safe departure deadline. Complete the preparation checklist.', 'เวลาการเดินเป็นค่าประมาณจากระยะทางและความเร็วที่กรอก ไม่รวมคิวหรือภัย และไม่ใช่กำหนดเวลาออกเดินทางที่ปลอดภัย จากนั้นตรวจรายการเตรียมพร้อม'),
      both('Save to browser stores the plan on this device. Load saved plan restores that saved copy. Export JSON downloads a file; Print plan makes a printable copy. Saving is explicit; typing alone does not save.', 'Save to browser บันทึกแผนในอุปกรณ์นี้ Load saved plan เรียกสำเนาที่บันทึกไว้ Export JSON ดาวน์โหลดไฟล์ และ Print plan ใช้พิมพ์แผน ต้องกดบันทึกเอง การพิมพ์ข้อความอย่างเดียวยังไม่บันทึก'),
    ],
    note: both('Plans are not uploaded. Someone sharing this browser profile may read a saved plan. Opening or closing this guide keeps current entries in place.', 'ไม่มีการอัปโหลดแผน ผู้ที่ใช้โปรไฟล์เบราว์เซอร์ร่วมกันอาจอ่านแผนที่บันทึกไว้ได้ การเปิดหรือปิดคู่มือไม่ล้างข้อมูลที่กรอกอยู่'),
  },
  drill: {
    name: both('Drill · record a real practice', 'ซ้อมอพยพ · บันทึกการฝึกจริง'),
    steps: [
      both('After an organized practice, enter the participant count, arrivals, people assisted and elapsed minutes. Reconcile the counts before saving.', 'หลังการซ้อมที่จัดขึ้น กรอกจำนวนผู้เข้าร่วม ผู้ถึงจุดหมาย ผู้ที่ได้รับความช่วยเหลือ และเวลาที่ใช้เป็นนาที ตรวจยอดจำนวนคนให้ตรงกันก่อนบันทึก'),
      both('The reconciliation number shows who is not yet counted. Add an action, owner and review date, then choose Save drill record or Export current. Records stay on this browser; this is not a live headcount system.', 'ตัวเลขตรวจนับแสดงคนที่ยังนับไม่ครบ เพิ่มสิ่งที่ต้องแก้ ผู้รับผิดชอบ และวันทบทวน แล้วเลือกบันทึกผลการซ้อมหรือส่งออกบันทึกนี้ ข้อมูลอยู่ในเบราว์เซอร์นี้ ไม่ใช่ระบบนับคนแบบเวลาจริง'),
    ],
    note: both('This logger records your entries; it does not verify that a destination or route is safe.', 'ส่วนบันทึกนี้เก็บข้อมูลที่คุณกรอก ไม่ได้ตรวจยืนยันว่าปลายทางหรือเส้นทางปลอดภัย'),
  },
  research: {
    name: both('Research · inspect the evidence', 'งานวิจัย · ตรวจสอบหลักฐาน'),
    steps: [
      both('Switch ไทย / English in the research heading. Baseline and delayed results are shown together at equal prominence; no timing toggle is needed. Open Study & credits in the footer for the complete citation and outcome context.', 'สลับ ไทย / English ที่หัวข้องานวิจัย ผลเงื่อนไขฐานและล่าช้าแสดงพร้อมกันโดยไม่ต้องกดสลับ เปิดที่มาและผู้จัดทำในส่วนท้ายเพื่ออ่านบรรณานุกรมเต็มและบริบทผลแบบจำลอง'),
      both('Open definitions and uncertainty notes before interpreting percentages. Follow source IDs to the evidence ledger; Used here, Candidates and Reporting method have different roles.', 'อ่านนิยามและข้อจำกัดด้านความไม่แน่นอนก่อนตีความร้อยละ ตามรหัสแหล่งข้อมูลไปยังบัญชีหลักฐาน แหล่งที่ใช้ในระบบ แหล่งที่เสนอ และแนวทางรายงาน มีบทบาทต่างกัน'),
      both('Use Reproduce & cite to download the results CSV and BibTeX citation, inspect code or read the proposed validation agenda.', 'ใช้ ทำซ้ำและอ้างอิง เพื่อดาวน์โหลดผล CSV และข้อมูลอ้างอิง BibTeX ตรวจโค้ด หรืออ่านแผนตรวจสอบที่เสนอ'),
    ],
    note: both('The source is an unreviewed preprint about Khao Lak. Its modeled victim rates are not observed deaths, individual risk or results recomputed by this browser.', 'ต้นฉบับเป็นบทความเกี่ยวกับเขาหลักที่ยังไม่ผ่านการประเมินโดยผู้ทรงคุณวุฒิ สัดส่วนผู้ประสบภัยตามเกณฑ์แบบจำลองไม่ใช่จำนวนผู้เสียชีวิตจริง ความเสี่ยงรายบุคคล หรือผลที่เบราว์เซอร์นี้คำนวณซ้ำ'),
  },
  satellite: {
    name: both('Sensors · in Research › Sources', 'เซนเซอร์ · อยู่ในงานวิจัย › แหล่งข้อมูล'),
    steps: [both('Read this section as a catalogue of possible instruments and integrations. It does not show current buoy, tide-gauge, satellite inundation or warning observations.', 'ส่วนนี้เป็นรายการเครื่องมือและการเชื่อมต่อที่อาจใช้ได้ ไม่ได้แสดงข้อมูลทุ่น สถานีระดับน้ำ ขอบเขตน้ำท่วมจากดาวเทียม หรือคำเตือนปัจจุบัน')],
    note: both('A missing or disconnected feed is a data gap, not an all-clear. Follow official warnings independently of this website.', 'ข้อมูลที่ขาดหรือยังไม่ได้เชื่อมต่อคือช่องว่างของข้อมูล ไม่ใช่สัญญาณว่าปลอดภัย ให้ติดตามคำเตือนของทางการแยกจากเว็บไซต์นี้'),
  },
  ddpm: {
    name: both('DDPM tsunami-risk evidence · ข้อมูลเสี่ยงสึนามิ DDPM', 'ข้อมูลเสี่ยงสึนามิ DDPM · หลักฐาน'),
    steps: [
      both('Each row is one village-level record from the DDPM tsunami-risk dataset with source-supplied coordinates of unverified method and accuracy. Treat as historical risk evidence only — not an inundation zone, evacuation route, or shelter designation.', 'แต่ละแถวเป็นข้อมูลระดับหมู่บ้านจากชุดข้อมูลเสี่ยงสึนามิของ DDPM พิกัดจากต้นทางที่ยังไม่ยืนยันวิธีหรือความแม่นยำ ถือเป็นหลักฐานความเสี่ยงย้อนหลังเท่านั้น ไม่ใช่เขตน้ำท่วม เส้นทางอพยพ หรือที่หลบภัย'),
      both('The Height field meaning is undocumented by source — do not interpret as flood depth. Full-file Risk codes are 1–4; their interpretation is not verified here. Catalog-stated data update: 30 January 2024; currency unknown.', 'ความหมายของฟิลด์ Height ยังไม่มีเอกสารระบุจากต้นฉบับ — อย่าตีความเป็นความลึกน้ำท่วม รหัส Risk ในไฟล์ทั้งหมดมีค่า 1–4 แต่ยังไม่ยืนยันความหมาย ข้อมูลปรับปรุงล่าสุด 30 มกราคม 2567; ความทันสมัยไม่ทราบ'),
      both('The full CSV contains 1,416 rows across 22 provinces, including Phang Nga and Phuket. This is an inspection summary, not a mapped layer.', 'CSV ทั้งไฟล์มี 1,416 แถว ครอบคลุม 22 จังหวัด รวมพังงาและภูเก็ต แสดงผลสรุปการตรวจ ไม่ใช่ชั้นแผนที่'),
    ],
    note: both('Source: DDPM Disaster Information System via catalog.disaster.go.th. License label: Creative Commons Attributions; version unstated. Catalog-stated data update: 30 January 2024. Coordinates are source-supplied; placement method, CRS and positional accuracy are unverified.', 'แหล่งที่มา: ระบบข้อมูลสาธารณภัย กรมป้องกันและบรรเทาสาธารณภัย ผ่าน catalog.disaster.go.th อนุญาต: การแสดงที่มาแบบครีเอทีฟคอมมอนส์ ปรับปรุงล่าสุด 30 มกราคม 2567 พิกัดมาจากต้นทาง ยังไม่ยืนยันวิธีวางจุด ระบบพิกัด หรือความแม่นยำ'),
  },
} satisfies Record<ManualPage, { name: ReturnType<typeof both>; steps: ReturnType<typeof both>[]; note: ReturnType<typeof both> }>;

export const manualOrder: ManualPage[] = ['explore','prepare','drill','research','satellite','ddpm'];

export function manualLanguage(search: string, browserLanguage: string): ManualLanguage {
  const value = new URLSearchParams(search).get('lang');
  return value === 'en' || value === 'th' ? value : browserLanguage.toLowerCase().startsWith('th') ? 'th' : 'en';
}
