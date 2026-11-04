import type { Place } from './research';
import type { ManualLanguage } from './manual-content';

/** Local coverage, not the legacy editorial hazard claims retained in research.ts. */
const commonTh:Record<string,string>={
  'Confirm local evacuation instructions, accessible assistance and a designated destination with the local authority. This place record is geographic context, not an approved route.':'ยืนยันคำแนะนำอพยพ การช่วยเหลือที่ทุกคนเข้าถึงได้ และปลายทางที่กำหนดกับหน่วยงานในพื้นที่ บันทึกสถานที่นี้เป็นบริบททางภูมิศาสตร์ ไม่ใช่เส้นทางที่ได้รับอนุมัติ',
  'Authority-designated refuge and access require local confirmation.':'ต้องยืนยันจุดอพยพที่หน่วยงานกำหนดและทางเข้ากับผู้รับผิดชอบในพื้นที่',
  'Road access, walking distances, pinch points and refuge suitability have not been field-verified in this application.':'ระบบนี้ยังไม่ได้ตรวจสอบภาคสนามเรื่องการเข้าถึงถนน ระยะเดิน คอขวด หรือความเหมาะสมของจุดอพยพ',
};
export function localPlaceCopy(place:Place,language:ManualLanguage) {
  const study=place.name==='Bang Niang';
  const description=language==='th'
    ? study?'มีแบบฝึกโครงข่ายเดินที่อ้างอิง OpenStreetMap แต่เส้นทางและปลายทางยังไม่ได้รับอนุมัติให้อพยพจริง':'มุมมองนี้ใช้สำรวจบริบททางภูมิศาสตร์ ยังไม่เชื่อมต่อเส้นทางอพยพที่ได้รับอนุมัติ บัญชีจุดอพยพ หรือแบบจำลองน้ำท่วมเฉพาะสถานที่นี้'
    : study?'A sourced OpenStreetMap walking-network exercise is available. Its paths and endpoint have not been approved for evacuation.':'This view provides geographic context. No approved evacuation route, refuge inventory or local inundation model is connected for this place.';
  if(language==='en')return {...place,description};
  return {...place,description,
    actionableDirective:commonTh[place.actionableDirective]??place.actionableDirective,
    refugeStrategy:commonTh[place.refugeStrategy]??place.refugeStrategy,
    spatialContext:commonTh[place.spatialContext]??place.spatialContext};
}
