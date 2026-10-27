export type ManualPage = 'explore' | 'satellite' | 'prepare' | 'drill' | 'research';
export type ManualLanguage = 'en' | 'th';
const both = (en: string, th: string) => ({ en, th });

export const manualTopics = {
  explore: {
    name: both('Model · terrain & rehearsal', 'แบบจำลอง · ภูมิประเทศและแบบฝึก'),
    steps: [
      both('Choose a coastal region, then a place below the map. The walking-network rehearsal currently covers Bang Niang only; other places show terrain and their data gaps.', 'เลือกพื้นที่ชายฝั่ง แล้วเลือกสถานที่ใต้แผนที่ แบบฝึกบนโครงข่ายทางเดินรองรับเฉพาะบางเนียงในขณะนี้ พื้นที่อื่นแสดงภูมิประเทศและข้อมูลที่ยังขาด'),
      both('Use 2D map for orientation, Fly-by to follow the selected exercise route, or Walk-through for a coarse terrain perspective. Overview returns to the area; Queue inspects a model node. Walk-through is not street imagery.', 'ใช้ 2D map เพื่อดูภาพรวม ใช้ Fly-by เพื่อติดตามเส้นทางแบบฝึกที่เลือก หรือ Walk-through เพื่อมองภูมิประเทศแบบหยาบ Overview กลับไปดูพื้นที่ ส่วน Queue ใช้ดูจุดคิวในแบบจำลอง Walk-through ไม่ใช่ภาพระดับถนน'),
      both('Set People, Pace, Delay and Route. Start begins an exercise warning clock; Run resumes and Pause holds it. Drag the time slider to inspect a moment, change Rate to replay faster, or Reset to return to the start. Pause before opening this guide if you want to hold the frame.', 'ตั้งค่า People (จำนวนคน), Pace (ความเร็ว), Delay (เวลาเตรียมตัว) และ Route (เส้นทาง) Start เริ่มนาฬิกาคำเตือนของแบบฝึก Run เล่นต่อ และ Pause หยุดชั่วคราว เลื่อนแถบเวลาเพื่อดูช่วงที่ต้องการ เปลี่ยน Rate เพื่อเล่นเร็วขึ้น หรือ Reset เพื่อกลับจุดเริ่ม หากต้องการคงภาพเดิม ให้กด Pause ก่อนเปิดคู่มือ'),
    ],
    note: both('Route arrows point toward an unapproved exercise endpoint. Dots are modeled people; queued totals are at network nodes, not a physical crowd footprint. The default Water level and animated rise are illustrations, not wave forecasts. Imported research frames are an unverified model replay; water does not change agent movement. Open Scenario settings, data and coverage for capacity, water-rise and local research-file controls.', 'ลูกศรชี้ไปยังปลายทางแบบฝึกที่ยังไม่ได้รับอนุมัติ จุดแทนคนในแบบจำลอง ยอดคิวอยู่ที่จุดบนโครงข่าย ไม่ใช่ขอบเขตฝูงชนจริง Water level และภาพน้ำสูงขึ้นตามค่าตั้งเริ่มต้นเป็นภาพประกอบ ไม่ใช่การพยากรณ์คลื่น ส่วนเฟรมวิจัยที่นำเข้าเป็นการเล่นซ้ำแบบจำลองที่ยังไม่ได้ตรวจสอบ และน้ำไม่เปลี่ยนการเคลื่อนที่ของตัวแทน เปิด Scenario settings, data and coverage เพื่อดูค่าความจุ ภาพน้ำสูงขึ้น และการอ่านไฟล์วิจัยในอุปกรณ์'),
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
      both('Choose Record Drill Result to save the record on this browser. Use the record to discuss delays, barriers and assistance with the organizers; it is not a live headcount system.', 'เลือก Record Drill Result เพื่อบันทึกการซ้อมไว้ในเบราว์เซอร์นี้ ใช้ทบทวนความล่าช้า สิ่งกีดขวาง และการช่วยเหลือร่วมกับผู้จัด ไม่ใช่ระบบนับคนแบบเวลาจริง'),
    ],
    note: both('This logger records your entries; it does not verify that a destination or route is safe.', 'ส่วนบันทึกนี้เก็บข้อมูลที่คุณกรอก ไม่ได้ตรวจยืนยันว่าปลายทางหรือเส้นทางปลอดภัย'),
  },
  research: {
    name: both('Research · inspect the evidence', 'งานวิจัย · ตรวจสอบหลักฐาน'),
    steps: [
      both('Switch ไทย / English in the research heading. Compare baseline and delayed conditions; both columns show reported study results, while the selected condition is emphasized.', 'สลับ ไทย / English ที่หัวข้องานวิจัย เปรียบเทียบเงื่อนไขฐานกับเงื่อนไขล่าช้า ทั้งสองคอลัมน์เป็นผลที่บทความรายงาน โดยเน้นเงื่อนไขที่เลือก'),
      both('Open definitions and uncertainty notes before interpreting percentages. Follow source IDs to the evidence ledger; Used here, Candidates and Reporting method have different roles.', 'อ่านนิยามและข้อจำกัดด้านความไม่แน่นอนก่อนตีความร้อยละ ตามรหัสแหล่งข้อมูลไปยังบัญชีหลักฐาน แหล่งที่ใช้ในระบบ แหล่งที่เสนอ และแนวทางรายงาน มีบทบาทต่างกัน'),
      both('Use Reproduce & cite to download the results CSV and BibTeX citation, inspect code or read the proposed validation agenda.', 'ใช้ ทำซ้ำและอ้างอิง เพื่อดาวน์โหลดผล CSV และข้อมูลอ้างอิง BibTeX ตรวจโค้ด หรืออ่านแผนตรวจสอบที่เสนอ'),
    ],
    note: both('The source is an unreviewed preprint about Khao Lak. Its modeled victim rates are not observed deaths, individual risk or results recomputed by this browser.', 'ต้นฉบับเป็นบทความเกี่ยวกับเขาหลักที่ยังไม่ผ่านการประเมินโดยผู้ทรงคุณวุฒิ สัดส่วนผู้ประสบภัยตามเกณฑ์แบบจำลองไม่ใช่จำนวนผู้เสียชีวิตจริง ความเสี่ยงรายบุคคล หรือผลที่เบราว์เซอร์นี้คำนวณซ้ำ'),
  },
  satellite: {
    name: both('Satellite · understand available sources', 'ดาวเทียม · ทำความเข้าใจแหล่งข้อมูล'),
    steps: [both('Read this section as a catalogue of possible instruments and integrations. It does not show current buoy, tide-gauge, satellite inundation or warning observations.', 'ส่วนนี้เป็นรายการเครื่องมือและการเชื่อมต่อที่อาจใช้ได้ ไม่ได้แสดงข้อมูลทุ่น สถานีระดับน้ำ ขอบเขตน้ำท่วมจากดาวเทียม หรือคำเตือนปัจจุบัน')],
    note: both('A missing or disconnected feed is a data gap, not an all-clear. Follow official warnings independently of this website.', 'ข้อมูลที่ขาดหรือยังไม่ได้เชื่อมต่อคือช่องว่างของข้อมูล ไม่ใช่สัญญาณว่าปลอดภัย ให้ติดตามคำเตือนของทางการแยกจากเว็บไซต์นี้'),
  },
} satisfies Record<ManualPage, { name: ReturnType<typeof both>; steps: ReturnType<typeof both>[]; note: ReturnType<typeof both> }>;

export const manualOrder: ManualPage[] = ['explore','prepare','drill','research','satellite'];

export function manualLanguage(search: string, browserLanguage: string): ManualLanguage {
  const value = new URLSearchParams(search).get('lang');
  return value === 'en' || value === 'th' ? value : browserLanguage.toLowerCase().startsWith('th') ? 'th' : 'en';
}
