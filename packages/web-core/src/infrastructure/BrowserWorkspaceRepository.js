// Prototype-only storage. Deliberately isolated from the production API/database.
export class BrowserWorkspaceRepository {
  constructor({ storage, key, seed }) {
    this.storage = storage;
    this.key = key;
    this.seed = seed;
    this.revision = null;
  }

  load() {
    const raw = this.storage.getItem(this.key);
    if (!raw) {
      this.revision = 0;
      return structuredClone(this.seed());
    }
    try {
      const envelope = JSON.parse(raw);
      if (
        envelope.version !== 1 ||
        !Number.isInteger(envelope.revision) ||
        !envelope.data
      )
        throw new Error();
      this.revision = envelope.revision;
      return structuredClone(envelope.data);
    } catch {
      throw new Error(
        "ข้อมูลในเบราว์เซอร์อ่านไม่ได้ กรุณาสำรองข้อมูลและติดต่อผู้พัฒนา ระบบจะไม่เขียนทับข้อมูลเดิม",
      );
    }
  }

  save(data) {
    const current = this.storage.getItem(this.key);
    const revision = current ? JSON.parse(current).revision : 0;
    if (revision !== this.revision)
      throw new Error(
        "ข้อมูลถูกแก้จากอีกแท็บ กรุณารีเฟรชหน้าก่อนบันทึกอีกครั้ง",
      );
    const next = revision + 1;
    try {
      this.storage.setItem(
        this.key,
        JSON.stringify({ version: 1, revision: next, data }),
      );
    } catch {
      throw new Error(
        "บันทึกไม่ได้ พื้นที่เบราว์เซอร์อาจเต็มหรือถูกปิดกั้น ข้อมูลที่แก้ยังไม่ได้บันทึก",
      );
    }
    this.revision = next;
  }
}
