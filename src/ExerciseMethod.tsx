import type { ManualLanguage } from './manual-content';

/** The browser model contract, separate from the preprint and operational guidance. */
export function ExerciseMethod({language,speed,preparation,width,accessed,terrainAccessed}:{language:ManualLanguage;speed:number;preparation:number;width:number;accessed:string;terrainAccessed?:string}) {
  const t=(en:string,th:string)=>language==='th'?th:en;
  return <>
    <h4>{t('Mapped paths','เส้นทางในแผนที่')}</h4>
    <p><a href="https://www.openstreetmap.org/copyright">OpenStreetMap / ODbL</a> · {accessed}. {t('Three shortest mapped walking paths converge on a selected inland network endpoint. Access, crossings, obstructions and destination suitability have not been surveyed. No route is recommended for emergency use.','เส้นทางเดินที่สั้นที่สุดในแผนที่สามเส้นรวมที่ปลายโครงข่ายด้านในแผ่นดิน ยังไม่ได้สำรวจการเข้าถึง ทางข้าม สิ่งกีดขวาง หรือความเหมาะสมของปลายทาง ไม่แนะนำให้ใช้เส้นทางนี้ในเหตุฉุกเฉิน')}</p>
    <h4>{t('Point queues · current assumptions','คิวที่จุดโครงข่าย · สมมติฐานปัจจุบัน')}</h4>
    <dl className="method-parameters">
      <div><dt>{t('Pace','ความเร็ว')}</dt><dd>{speed} m/s</dd></div>
      <div><dt>{t('Preparation after warning','เตรียมตัวหลังคำเตือน')}</dt><dd>{preparation} s</dd></div>
      <div><dt>{t('Release per approach','ปล่อยตัวต่อทางเข้า')}</dt><dd>0.15 s</dd></div>
      <div><dt>{t('Pinch / other width','ความกว้างคอขวด / ส่วนอื่น')}</dt><dd>{width} / 6 m</dd></div>
      <div><dt>{t('Assumed flow','อัตราการไหลสมมติ')}</dt><dd>1.2 {t('people/m/s','คน/ม./วินาที')}</dd></div>
    </dl>
    <p>{t('Deterministic first-in, first-out (FIFO): each white point is one moving synthetic person; amber or gray points aggregate waiting people at exact network nodes. No physical queue shape, density, collision, storage, spillback, slope penalty, mobility mix, injury or water interaction is modeled. No decorative offsets or crowd rings. Running is an experiment, not advice. This is separate from the paper’s 39,041-agent Unity model.','คิวแบบเข้าก่อนออกก่อน (FIFO) ให้ผลแน่นอนเมื่อใช้ค่าเดิม จุดสีขาวคือตัวแทนจำลองที่กำลังเคลื่อนที่หนึ่งคน จุดอำพันหรือเทารวมจำนวนผู้รอที่ตำแหน่งจุดโครงข่ายจริง ไม่จำลองรูปร่างคิว ความหนาแน่น การชน พื้นที่เก็บคิว คิวล้นย้อน ผลความชัน ความสามารถในการเคลื่อนที่ที่หลากหลาย การบาดเจ็บ หรือปฏิสัมพันธ์กับน้ำ ไม่เลื่อนจุดหรือวาดวงฝูงชนเพื่อความสวยงาม การวิ่งเป็นการทดลอง ไม่ใช่คำแนะนำ แยกจากแบบจำลอง Unity ของบทความที่มีตัวแทน 39,041 ราย')}</p>
    <h4>{t('Walk-through and water','มุมมองเดินและน้ำ')}</h4>
    <p>{t('Follows the first synthetic walker at an approximate 1.65 m eye height over available DEM and imagery. It is not street-view photography and cannot resolve kerbs, stairs or doors. Arrows follow the selected practice path, not approved signs. User-chosen water levels illustrate terrain screening, not tsunami dynamics. Imported depth frames remain research results; moving people are point markers, not a physical crowd.','ติดตามตัวแทนจำลองคนแรกที่ระดับสายตาประมาณ 1.65 เมตรเหนือ DEM และภาพถ่ายที่มี ไม่ใช่ภาพระดับถนน และแยกขอบทาง บันได หรือประตูไม่ได้ ลูกศรตามเส้นทางฝึกที่เลือก ไม่ใช่ป้ายที่ได้รับอนุมัติ ระดับน้ำที่ผู้ใช้ตั้งเป็นการสาธิตเทียบภูมิประเทศ ไม่ใช่พลศาสตร์สึนามิ เฟรมความลึกที่นำเข้ายังเป็นผลวิจัย คนที่เคลื่อนที่เป็นสัญลักษณ์จุด ไม่ใช่ฝูงชนทางกายภาพ')}</p>
    <h4>{t('Terrain and validation gaps','ภูมิประเทศและข้อมูลที่ยังต้องยืนยัน')}</h4>
    <p><a href="https://registry.opendata.aws/terrain-tiles/">Mapzen Terrain Tiles / AWS</a> · {t('1× relief; sampled z12 Terrarium screening grid','ขยายความสูง 1 เท่า กริดคัดกรองจากค่าตัวอย่าง Terrarium z12')} · {terrainAccessed}. {t('Heights are approximate. Inundation replay and approved evacuation guidance require georeferenced scenario flood grids, surveyed routes and authority-approved refuges from the research team.','ความสูงเป็นค่าประมาณ การเล่นซ้ำน้ำท่วมและคำแนะนำอพยพที่ได้รับอนุมัติต้องมีกริดน้ำท่วมของฉากทัศน์ที่อ้างอิงพิกัด เส้นทางที่สำรวจ และจุดอพยพที่หน่วยงานอนุมัติจากทีมวิจัย')}</p>
  </>;
}
