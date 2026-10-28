import { useState } from 'react';
import { satelliteToolkits } from './research';
import { manualLanguage } from './manual-content';
const thai: Record<string, [string,string]> = {
  'dart-23401':['ข้อมูลอ้างอิงทุ่นความดัน DART','ข้อมูลความดันในทะเลลึกช่วยตรวจจับสึนามิได้ ต้องตรวจรหัสสถานี สถานะการทำงาน และความล่าช้าก่อนเชื่อมต่อ ไม่ได้ยืนยันว่าจะตรวจจับได้ภายใน 15 นาที'],
  'rtn-phuket':['แหล่งข้อมูลสถานีระดับน้ำเกาะตะเภาน้อยที่เสนอ','ข้อมูลอ้างอิงสถานีชายฝั่งที่เสนอ ต้องยืนยันสถานี ผู้ให้ข้อมูล เวลา และระบบอ้างอิงความสูงก่อนตีความระดับน้ำ ยังไม่มีการเชื่อมข้อมูลสถานีแบบเวลาจริง'],
  'sentinel-1':['ภาพเรดาร์ SAR จาก Sentinel-1','ภาพที่อาจใช้ทำแผนที่น้ำท่วมหลังได้รับและตรวจสอบข้อมูล เวลาเก็บภาพ การประมวลผล และสภาพพื้นที่เป็นข้อจำกัด ไม่รับรองภาพรายวันหรือขอบเขตน้ำท่วมปัจจุบัน'],
  'dem-elevation':['ข้อมูลความสูง Copernicus DEM ที่เสนอ','ข้อมูลภูมิประเทศที่เสนอ ระบบนี้ใช้ Mapzen อยู่ในปัจจุบัน ยังไม่ได้นำ DEM ชุดนี้มาใช้ ระดับความสูงเพียงอย่างเดียวไม่ยืนยันเส้นทางปลอดภัยหรือความเหมาะสมของจุดอพยพ'],
};
export function SatelliteCatalogue() {
  const [language,setLanguage] = useState(()=>manualLanguage(location.search,navigator.language));
  const t=(en:string,th:string)=>language==='th'?th:en;
  return <article className="satellite-view-wrap source-catalogue" lang={language}>
    <div className="catalogue-heading"><h1>{t('Sources & sensors','แหล่งข้อมูลดาวเทียมและเซนเซอร์')}</h1><div className="research-language" role="group" aria-label="Catalogue language / ภาษารายการแหล่งข้อมูล"><button lang="th" aria-pressed={language==='th'} onClick={()=>setLanguage('th')}>ไทย</button><button lang="en" aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>English</button></div></div>
    <p className="catalogue-scope">{t('Reference catalogue. All four sources are disconnected; there are no current observations or live warnings here.','รายการแหล่งข้อมูลอ้างอิง ทั้งสี่แหล่งยังไม่ได้เชื่อมต่อ ไม่มีข้อมูลสังเกตการณ์ปัจจุบันหรือคำเตือนแบบเวลาจริงในส่วนนี้')}</p>
    <div className="sensor-ledger">{satelliteToolkits.map(s=><article className="sensor-record" key={s.id}><div><h2>{language==='th'?thai[s.id][0]:s.name}</h2><span lang="en">{s.agency}</span><a href={s.sourceUrl} target="_blank" rel="noreferrer">{t('Source reference','เอกสารอ้างอิง')}</a></div><p>{language==='th'?thai[s.id][1]:s.significance}</p></article>)}</div>
    <section className="catalogue-physics" id="catalogue-physics"><h2>{t('What these sources can tell us','แหล่งข้อมูลเหล่านี้บอกอะไรได้')}</h2><p>{t('Tsunami speed depends on water depth. In shallow water waves slow, while wave height and currents can increase. Coastal appearance and inundation depend on the event and local geography; a fixed wave height cannot be read from this catalogue.','ความเร็วสึนามิขึ้นกับความลึกน้ำ ในน้ำตื้นคลื่นจะช้าลง ขณะที่ความสูงคลื่นและกระแสน้ำอาจเพิ่มขึ้น ลักษณะคลื่นและน้ำท่วมชายฝั่งขึ้นกับเหตุการณ์และภูมิประเทศ จึงอ่านค่าความสูงคลื่นตายตัวจากรายการนี้ไม่ได้')} <a href="https://www.noaa.gov/jetstream/tsunamis/tsunami-propagation" target="_blank" rel="noreferrer">NOAA</a></p><p>{t('Pressure buoys and coastal gauges are complementary observations. Reliable local predictions need timestamped measurements, source scenarios and validated models. Those live inputs are not connected here.','ทุ่นความดันและสถานีชายฝั่งให้ข้อมูลที่เสริมกัน การพยากรณ์เฉพาะพื้นที่ต้องมีข้อมูลวัดที่ระบุเวลา ฉากทัศน์แหล่งกำเนิด และแบบจำลองที่ผ่านการตรวจสอบ ระบบนี้ยังไม่ได้เชื่อมข้อมูลแบบเวลาจริงเหล่านั้น')}</p></section>
  </article>;
}
