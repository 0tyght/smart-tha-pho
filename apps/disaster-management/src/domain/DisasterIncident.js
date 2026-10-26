export const INCIDENT_STATUS = Object.freeze({
  NEW: "รอตรวจสอบ",
  VERIFIED: "รอมอบหมาย",
  ASSIGNED: "มอบหมายแล้ว",
  EN_ROUTE: "กำลังเดินทาง",
  ON_SITE: "ถึงจุดเกิดเหตุ",
  RESOLVED: "รอตรวจผล",
  CLOSED: "ปิดเหตุ",
  CANCELLED: "ยกเลิก",
});
export const ACTIVE_STATUSES = Object.freeze([
  "ASSIGNED",
  "EN_ROUTE",
  "ON_SITE",
]);
const NEXT = {
  NEW: ["VERIFIED", "CANCELLED"],
  VERIFIED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["EN_ROUTE", "CANCELLED"],
  EN_ROUTE: ["ON_SITE"],
  ON_SITE: ["RESOLVED"],
  RESOLVED: ["CLOSED", "ON_SITE"],
  CLOSED: [],
  CANCELLED: [],
};
export class DisasterIncident {
  #data;
  constructor(data) {
    if (
      !String(data.title || "").trim() ||
      !String(data.location || "").trim() ||
      !String(data.description || "").trim()
    )
      throw new Error("กรุณากรอกประเภทเหตุ สถานที่ และรายละเอียดให้ครบ");
    if (!["HIGH", "MEDIUM", "LOW"].includes(data.severity))
      throw new Error("ระดับความเร่งด่วนไม่ถูกต้อง");
    if (!Object.hasOwn(NEXT, data.status))
      throw new Error("สถานะเหตุไม่ถูกต้อง");
    if (
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng) ||
      Math.abs(data.lat) > 90 ||
      Math.abs(data.lng) > 180
    )
      throw new Error("พิกัดต้องเป็นละติจูดและลองจิจูดที่ถูกต้อง");
    this.#data = structuredClone(data);
  }
  assign({ teamId, vehicleId }, now) {
    if (this.#data.status !== "VERIFIED")
      throw new Error("ต้องตรวจสอบข้อมูลเหตุก่อนมอบหมายทีม");
    if (!teamId || !vehicleId) throw new Error("กรุณาเลือกทีมและรถ");
    this.#data.teamId = teamId;
    this.#data.vehicleId = vehicleId;
    this.transition("ASSIGNED", "มอบหมายทีมและรถ", now);
  }
  transition(status, note, now) {
    if (!NEXT[this.#data.status].includes(status))
      throw new Error("ไม่สามารถเปลี่ยนสถานะตามลำดับนี้ได้");
    if (!String(note || "").trim())
      throw new Error("กรุณาบันทึกรายละเอียดการดำเนินงาน");
    if (status === "ASSIGNED" && (!this.#data.teamId || !this.#data.vehicleId))
      throw new Error("กรุณามอบหมายทีมและรถก่อน");
    this.#data.status = status;
    this.#data.history.push({ status, note: String(note).trim(), at: now });
  }
  toJSON() {
    return structuredClone(this.#data);
  }
  get allowedStatuses() {
    return NEXT[this.#data.status].filter((status) => status !== "ASSIGNED");
  }
}
