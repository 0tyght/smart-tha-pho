const POINTS = Object.freeze([
  {
    id: "raw-water", sequence: 1, name: "แหล่งน้ำดิบและสถานีสูบน้ำแรงต่ำ", shortName: "น้ำดิบ", type: "source", status: "normal",
    description: "รับน้ำดิบเข้าสู่ระบบผลิตและตรวจปริมาณน้ำก่อนเริ่มกระบวนการ",
    metrics: [
      { id: "level", label: "ระดับแหล่งน้ำ", value: 3.72, unit: "ม." },
      { id: "flow", label: "อัตราน้ำเข้า", value: 42.6, unit: "ลบ.ม./ชม." },
      { id: "turbidity", label: "ความขุ่นน้ำดิบ", value: 18.4, unit: "NTU" },
    ],
    equipment: [{ label: "ปั๊มน้ำดิบ 1", state: "ทำงาน" }, { label: "ปั๊มน้ำดิบ 2", state: "พร้อม" }],
  },
  {
    id: "chemical", sequence: 2, name: "ระบบจ่ายสารเคมี", shortName: "สารเคมี", type: "chemical", status: "normal",
    description: "จ่ายสารช่วยตกตะกอนและปรับสภาพน้ำให้เหมาะกับการผลิต",
    metrics: [
      { id: "coagulant", label: "อัตราจ่ายสารส้ม", value: 22, unit: "มก./ล." },
      { id: "chlorine", label: "อัตราจ่ายคลอรีน", value: 1.8, unit: "มก./ล." },
      { id: "ph", label: "ค่า pH", value: 7.2, unit: "" },
    ],
    equipment: [{ label: "ปั๊มจ่ายสารส้ม", state: "ทำงาน" }, { label: "ปั๊มคลอรีน", state: "ทำงาน" }],
  },
  {
    id: "clarifier", sequence: 3, name: "ถังตกตะกอน", shortName: "ตกตะกอน", type: "clarifier", status: "normal",
    description: "แยกตะกอนและสิ่งแขวนลอยออกจากน้ำก่อนเข้าสู่ถังกรอง",
    metrics: [
      { id: "level", label: "ระดับน้ำ", value: 82, unit: "%" },
      { id: "turbidity", label: "ความขุ่นน้ำออก", value: 2.8, unit: "NTU" },
      { id: "sludge", label: "รอบระบายตะกอน", value: 36, unit: "นาที" },
    ],
    equipment: [{ label: "มอเตอร์กวนช้า", state: "ทำงาน" }, { label: "วาล์วระบายตะกอน", state: "พร้อม" }],
  },
  {
    id: "filter", sequence: 4, name: "ถังกรองน้ำ", shortName: "กรองน้ำ", type: "filter", status: "watch",
    description: "กรองอนุภาคละเอียดและติดตามความดันสูญเสียของชั้นกรอง",
    metrics: [
      { id: "turbidity", label: "ความขุ่นหลังกรอง", value: 0.34, unit: "NTU" },
      { id: "headloss", label: "ความดันสูญเสีย", value: 1.62, unit: "ม." },
      { id: "runtime", label: "เวลาหลังล้างกรอง", value: 46, unit: "ชม." },
    ],
    equipment: [{ label: "ถังกรอง 1", state: "ทำงาน" }, { label: "ถังกรอง 2", state: "เตรียมล้าง" }],
  },
  {
    id: "clear-well", sequence: 5, name: "ถังน้ำใส", shortName: "น้ำใส", type: "reservoir", status: "normal",
    description: "พักน้ำที่ผ่านการกรองและฆ่าเชื้อก่อนสูบขึ้นหอถังสูง",
    metrics: [
      { id: "level", label: "ระดับถังน้ำใส", value: 74, unit: "%" },
      { id: "chlorine", label: "คลอรีนคงเหลือ", value: 0.72, unit: "มก./ล." },
      { id: "turbidity", label: "ความขุ่น", value: 0.28, unit: "NTU" },
    ],
    equipment: [{ label: "เซนเซอร์ระดับ", state: "ออนไลน์" }, { label: "เครื่องวัดคุณภาพน้ำ", state: "ออนไลน์" }],
  },
  {
    id: "high-lift", sequence: 6, name: "สถานีสูบน้ำแรงสูง", shortName: "ปั๊มส่ง", type: "pump", status: "normal",
    description: "สูบน้ำสะอาดจากถังน้ำใสขึ้นหอถังสูงและรักษาแรงดันระบบ",
    metrics: [
      { id: "flow", label: "อัตราสูบส่ง", value: 39.8, unit: "ลบ.ม./ชม." },
      { id: "pressure", label: "แรงดันขาออก", value: 3.4, unit: "บาร์" },
      { id: "power", label: "กำลังไฟฟ้า", value: 18.7, unit: "กิโลวัตต์" },
    ],
    equipment: [{ label: "ปั๊มส่ง 1", state: "ทำงาน" }, { label: "ปั๊มส่ง 2", state: "พร้อม" }],
  },
  {
    id: "water-tower", sequence: 7, name: "หอถังสูง", shortName: "หอถังสูง", type: "tower", status: "normal",
    description: "เก็บน้ำสะอาดและสร้างแรงดันด้วยระดับความสูงก่อนจ่ายสู่ชุมชน",
    metrics: [
      { id: "level", label: "ระดับน้ำในหอถัง", value: 68, unit: "%" },
      { id: "volume", label: "ปริมาตรคงเหลือ", value: 204, unit: "ลบ.ม." },
      { id: "outlet", label: "อัตราจ่ายออก", value: 36.2, unit: "ลบ.ม./ชม." },
    ],
    equipment: [{ label: "วาล์วน้ำเข้า", state: "เปิด" }, { label: "วาล์วจ่ายน้ำ", state: "เปิด" }],
  },
  {
    id: "distribution", sequence: 8, name: "ระบบท่อจ่ายน้ำและพื้นที่บริการ", shortName: "เขตจ่ายน้ำ", type: "network", status: "normal",
    description: "จ่ายน้ำสู่ผู้ใช้น้ำและเฝ้าระวังแรงดัน อัตราการไหล และคุณภาพปลายสาย",
    metrics: [
      { id: "pressure", label: "แรงดันเครือข่าย", value: 2.3, unit: "บาร์" },
      { id: "flow", label: "อัตราจ่ายรวม", value: 35.7, unit: "ลบ.ม./ชม." },
      { id: "chlorine", label: "คลอรีนคงเหลือ", value: 0.42, unit: "มก./ล." },
    ],
    equipment: [{ label: "จุดวัดแรงดันหลัก", state: "ออนไลน์" }, { label: "มิเตอร์แม่ข่าย", state: "ออนไลน์" }],
  },
]);

export class InMemoryWaterTelemetryRepository {
  constructor({ clock = () => new Date() } = {}) {
    this.clock = clock;
  }

  async getLatestSnapshot() {
    const updatedAt = this.clock().toISOString();
    return {
      updatedAt,
      dataMode: "simulation",
      points: POINTS.map((point) => ({ ...point, updatedAt })),
    };
  }
}
