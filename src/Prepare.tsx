import { useState } from 'react';
import { PaceRuler } from './charts';
import { walkingMinutes, blankPlan, validatePlan, checklist, type Plan } from './research';
import { checklistThai } from './research-ledger';

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Prepare({language}:{language:string}) {
  const t = (en: string, th: string) => language === 'th' ? th : en;
  const [plan, setPlan] = useState<Plan>(structuredClone(blankPlan)),
    [message, setMessage] = useState(""),
    [distance, setDistance] = useState("1000"),
    [speed, setSpeed] = useState("0.8");
  const minutes = walkingMinutes(Number(distance), Number(speed));

  function field(key: keyof Omit<Plan, "checked">, value: string) {
    setPlan((p) => ({ ...p, [key]: value }));
    setMessage(t("Unsaved changes.","ยังไม่ได้บันทึกการเปลี่ยนแปลง"));
  }

  function save() {
    try {
      localStorage.setItem("soonami-plan-v1", JSON.stringify(plan));
      setMessage(t("Saved on this device. Use Load saved plan when you return.","บันทึกในอุปกรณ์นี้แล้ว เมื่อกลับมาให้เลือกโหลดแผนที่บันทึกไว้"));
    } catch {
      setMessage(t("Device storage unavailable. Download or print your plan instead.","พื้นที่จัดเก็บไม่พร้อม ให้ดาวน์โหลดหรือพิมพ์แผนแทน"));
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem("soonami-plan-v1");
      if (!raw) {
        setMessage(t("No saved plan on this device.","ไม่มีแผนที่บันทึกในอุปกรณ์นี้"));
        return;
      }
      const data: unknown = JSON.parse(raw);
      if (!validatePlan(data)) throw Error();
      setPlan(data);
      setMessage(t("Saved plan loaded.","โหลดแผนที่บันทึกแล้ว"));
    } catch {
      setMessage(t("Could not load a valid plan. Current entries have been kept.","โหลดแผนที่ถูกต้องไม่ได้ ระบบเก็บข้อมูลที่กรอกอยู่ไว้"));
    }
  }

  return (
    <div className="planning-grid">
      <section className="plan-form" id="plan-form">
        <div className="section-head-compact">
          <h1>{t('My evacuation plan','แผนอพยพของฉัน')}</h1>
          <span className="meta">{t('Private, on this device · practical steps','ส่วนตัวบนอุปกรณ์นี้ · คำแนะนำที่ปฏิบัติได้')}</span>
        </div>
        <p>
          {t('Confirm destinations, routes and assisted transport needs with local authorities before an emergency.','ยืนยันปลายทาง เส้นทาง และการเดินทางสำหรับผู้ต้องการความช่วยเหลือกับหน่วยงานท้องถิ่นก่อนเกิดเหตุ')}
        </p>

        <div className="field-grid">
          {(
            [
              ["place", t("Where are you staying?","พักอยู่ที่ไหน?"), t("Hotel, home or workplace","โรงแรม บ้าน หรือที่ทำงาน")],
              ["destination", t("Locally confirmed destination","ปลายทางที่ยืนยันในพื้นที่แล้ว"), t("Authority-designated destination and access point","ปลายทางและทางเข้าที่หน่วยงานกำหนด")],
              ["backup", t("Backup destination","จุดอพยพสำรอง"), t("Alternative authority-designated destination","ปลายทางสำรองที่หน่วยงานกำหนด")],
              ["contact", t("Contact outside the area","ผู้ติดต่อนอกพื้นที่"), t("Name and mobile number","ชื่อและหมายเลขโทรศัพท์")],
            ] as const
          ).map(([key, label, placeholder]) => (
            <label key={key}>
              {label}
              <input
                maxLength={2000}
                value={plan[key]}
                placeholder={placeholder}
                onChange={(e) => field(key, e.target.value)}
              />
              <span className="print-value">{plan[key] || t("Not entered","ยังไม่ได้กรอก")}</span>
            </label>
          ))}
        </div>

        <label>
          {t("Walking route and landmarks","เส้นทางเดินและจุดสังเกต")}
          <textarea
            maxLength={2000}
            value={plan.route}
            placeholder={t("Confirmed signs, crossings, gates and accessible alternatives","ป้าย ทางข้าม ประตู และทางเลือกที่เข้าถึงได้ซึ่งยืนยันแล้ว")}
            onChange={(e) => field("route", e.target.value)}
          />
          <span className="print-value">{plan.route || t("Not entered","ยังไม่ได้กรอก")}</span>
        </label>

        <div className="plan-assistance-timing">
          <label>
            {t("Who needs help, and how","ความช่วยเหลือที่ต้องการและแผนสำหรับผู้ต้องพึ่งพิง")}
            <input
              maxLength={2000}
              value={plan.assistance}
              placeholder={t("Mobility aid, baby carrier, older relative","เช่น อุปกรณ์ช่วยเดิน เป้อุ้มเด็ก การช่วยผู้สูงอายุ")}
              onChange={(e) => field("assistance", e.target.value)}
            />
            <span className="print-value">{plan.assistance || t("Not entered","ยังไม่ได้กรอก")}</span>
          </label>

          <div className="calc-block">
            <span className="label">{t("Walking time","ประมาณเวลาเดิน")}</span>
            <div className="calc-inputs">
              <label>
                {t("Meters","ระยะทาง (เมตร)")}
                <input
                  type="number"
                  min="50"
                  max="10000"
                  step="50"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </label>
              <label>
                {t("Speed","ความเร็ว")}
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                >
                  <option value="1.0">1.0 m/s</option>
                  <option value="0.8">0.8 m/s</option>
                  <option value="0.5">{t("0.5 m/s · assistance example","0.5 ม./วิ · ตัวอย่างกรณีมีผู้ช่วย")}</option>
                </select>
              </label>
            </div>
            <div className="calc-result" aria-live="polite">
              {minutes !== null ? (
                <span>
                  {t("Estimated walking time:","ประมาณเวลาเดิน:")} <strong>~{minutes} {t("minutes","นาที")}</strong>
                </span>
              ) : (
                <span className="error">{t("Enter valid positive numbers","กรอกค่าตัวเลขบวกที่ถูกต้อง")}</span>
              )}
            </div>
            {minutes !== null && <PaceRuler
              unitLabel={t('Pace m/s → minutes (rounded up)','จังหวะ ม./วิ → นาที (ปัดขึ้น)')}
              ariaLabel={t(`Walking time for ${distance} m: ${[0.5, 0.8, 1.0].map(v => `${v} m/s ${walkingMinutes(Number(distance), v)} min`).join(', ')}`,`เวลาเดินสำหรับระยะ ${distance} เมตร: ${[0.5,0.8,1.0].map(v=>`${v} ม./วิ ${walkingMinutes(Number(distance),v)} นาที`).join(', ')}`)}
              marks={[0.5, 0.8, 1.0].map(v => ({ label: `${v} → ${walkingMinutes(Number(distance), v)}′`, minutes: walkingMinutes(Number(distance), v)!, kind: Number(speed) === v ? 'own' : 'walk' }))} />}
          </div>
        </div>

        <fieldset className="checklist-block">
          <legend>{t("Readiness checklist","รายการเตรียมพร้อม")} <span className="check-count">{plan.checked.filter(Boolean).length}/{checklist.length}{plan.checked.every(Boolean) ? ' ✓' : ''}</span></legend>
          {checklist.map((item, i) => (
            <label key={item} className="checkbox-label">
              <input
                type="checkbox"
                checked={plan.checked[i]}
                onChange={(e) => {
                  const copy = [...plan.checked];
                  copy[i] = e.target.checked;
                  setPlan((p) => ({ ...p, checked: copy }));
                  setMessage(t("Unsaved changes.","ยังไม่ได้บันทึกการเปลี่ยนแปลง"));
                }}
              />
              <span>{language === "th" ? checklistThai[i] : item}</span>
            </label>
          ))}
        </fieldset>

        <div className="plan-actions">
          <button className="primary" onClick={save}>
            {t("Save to browser","บันทึกในเบราว์เซอร์")}
          </button>
          <button onClick={load}>{t('Load saved plan','โหลดแผนที่บันทึกไว้')}</button>
          <button onClick={() => download("soonami-evacuation-plan.json", JSON.stringify(plan, null, 2), "application/json")}>
            {t("Export JSON","ส่งออก JSON")}
          </button>
          <button onClick={() => window.print()}>{t('Print plan','พิมพ์แผน')}</button>
        </div>

        {message && (
          <div className="form-message" role="status">
            {message}
          </div>
        )}
      </section>

      <aside className="plan-aside">
        <h3>{t('Four local checks','สิ่งที่ต้องยืนยันในพื้นที่ 4 ข้อ')}</h3>
        <ul className="axioms-list">
          <li>
            <strong>{t('1. Plan for congestion:','1. วางแผนรับความแออัด:')}</strong> {t('Confirm an accessible departure plan and designated routes with local emergency managers.','ยืนยันแผนการออกเดินทางและเส้นทางที่กำหนดกับผู้จัดการฉุกเฉินในพื้นที่')}
          </li>
          <li>
            <strong>{t('2. Confirm refuge access:','2. ยืนยันการเข้าถึงที่หลบภัย:')}</strong> {t('Confirm an authority-designated vertical refuge and access before a drill.','ยืนยันอาคารสูงที่ใช้หลบภัยและการเข้าถึงก่อนซ้อม')}
          </li>
          <li>
            <strong>{t('3. Rehearse and review:','3. ซ้อมและทบทวน:')}</strong> {t('Rehearse staircases and exit gates before a real event.','ซ้อมขึ้นบันไดและออกประตูก่อนเหตุการณ์จริง')}
          </li>
          <li>
            <strong>{t('4. Help dependents first:','4. ช่วยผู้ต้องพึ่งพิงก่อน:')}</strong> {t('Assign specific buddies for elderly, children, and visitors.','มอบหมายผู้ช่วยเฉพาะคนสำหรับผู้สูงอายุ เด็ก และนักท่องเที่ยว')}
          </li>
        </ul>
      </aside>
    </div>
  );
}

