function volume(value, label) {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0 ||
    Number(value) > 1e10
  )
    throw new Error(`${label}ต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป`);
  return Math.round(Number(value) * 100) / 100;
}
const rounded = (value) => Math.round(value * 100) / 100;
export class WaterBillingRound {
  #data;
  constructor(data) {
    if (
      !data?.id ||
      !Array.isArray(data.zones) ||
      !data.zones.length ||
      !Array.isArray(data.households) ||
      !data.households.length
    )
      throw new Error("ข้อมูลรอบใช้น้ำไม่ครบ");
    const validDate = (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value;
    if (!validDate(data.start) || !validDate(data.end) || data.start > data.end)
      throw new Error("ช่วงเวลารอบใช้น้ำไม่ถูกต้อง");
    this.#data = structuredClone(data);
  }
  #editable() {
    if (this.#data.closedAt)
      throw new Error("รอบนี้ยืนยันแล้ว ไม่สามารถแก้ข้อมูลย้อนหลังได้");
  }
  recordReading(id, current) {
    this.#editable();
    const household = this.#data.households.find((item) => item.id === id);
    if (!household) throw new Error("ไม่พบเลขผู้ใช้น้ำ");
    if (current === "") {
      household.current = null;
      return;
    }
    const value = volume(current, "เลขมิเตอร์");
    if (value < household.previous)
      throw new Error(
        `${id}: เลขครั้งนี้ต่ำกว่าครั้งก่อน กรุณาตรวจเลขหรือแจ้งกรณีเปลี่ยนมิเตอร์ก่อน`,
      );
    household.current = value;
  }
  recordOutput(id, command) {
    this.#editable();
    const zone = this.#data.zones.find((item) => item.id === id);
    if (!zone) throw new Error("ไม่พบเขตจ่ายน้ำ");
    const previous = volume(command.previous, "เลขมาตรหลักครั้งก่อน");
    const current = volume(command.current, "เลขมาตรหลักครั้งนี้");
    if (current < previous)
      throw new Error("เลขมาตรหลักครั้งนี้ต้องไม่ต่ำกว่าครั้งก่อน");
    const authorized = volume(command.authorized, "น้ำใช้ที่ไม่เรียกเก็บ");
    if (authorized > 0 && !String(command.note || "").trim())
      throw new Error("กรุณาระบุรายละเอียดน้ำใช้ที่อนุญาตแต่ไม่เรียกเก็บ");
    Object.assign(zone, {
      previous,
      current,
      authorized,
      note: String(command.note || "").trim(),
    });
  }
  summarize(zoneId = "all") {
    const zones = this.#data.zones
      .filter((zone) => zoneId === "all" || zone.id === zoneId)
      .map((zone) => {
        const rows = this.#data.households.filter(
          (item) => item.zoneId === zone.id,
        );
        const recorded = rows.filter((item) => item.current !== null);
        const output =
          zone.current === null || zone.previous === null
            ? null
            : rounded(zone.current - zone.previous);
        const usage = rounded(
          recorded.reduce((sum, row) => sum + row.current - row.previous, 0),
        );
        const complete =
          rows.length > 0 && recorded.length === rows.length && output !== null;
        const difference = complete
          ? rounded(output - usage - zone.authorized)
          : null;
        return {
          ...zone,
          total: rows.length,
          recorded: recorded.length,
          output,
          usage,
          complete,
          difference,
          percent:
            complete && output > 0
              ? rounded((difference / output) * 100)
              : null,
        };
      });
    const sum = (key) =>
      rounded(zones.reduce((total, zone) => total + (zone[key] ?? 0), 0));
    const complete = zones.length > 0 && zones.every((zone) => zone.complete);
    const output = zones.every((zone) => zone.output !== null)
      ? sum("output")
      : null;
    const difference = complete ? sum("difference") : null;
    return {
      zones,
      total: sum("total"),
      recorded: sum("recorded"),
      output,
      usage: sum("usage"),
      authorized: sum("authorized"),
      complete,
      difference,
      percent:
        complete && output > 0 ? rounded((difference / output) * 100) : null,
      suspicious: zones.some(
        (zone) => zone.complete && (zone.difference < 0 || zone.output === 0),
      ),
    };
  }
  close(now) {
    this.#editable();
    const summary = this.summarize();
    if (!summary.complete)
      throw new Error(
        "ยังยืนยันไม่ได้ กรุณาบันทึกน้ำจ่ายออกและจดมิเตอร์ให้ครบทุกเขต",
      );
    if (summary.suspicious)
      throw new Error(
        "ปริมาณส่วนต่างติดลบหรือน้ำจ่ายเป็นศูนย์ กรุณาตรวจข้อมูลก่อนยืนยัน",
      );
    this.#data.closedAt = now;
  }
  getReadings() {
    return this.#data.households.map((row) => ({
      ...row,
      usage: row.current === null ? null : rounded(row.current - row.previous),
    }));
  }
  toJSON() {
    return structuredClone(this.#data);
  }
}
