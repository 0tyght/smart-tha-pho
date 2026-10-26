import { WaterBillingRound } from "../domain/WaterBillingRound.js";
export class WaterBillingController {
  constructor({ repository, clock = () => new Date() }) {
    this.repository = repository;
    this.clock = clock;
    this.state = null;
  }
  load() {
    this.state = this.repository.load();
    return this.view();
  }
  view(roundId = this.state.rounds.at(-1).id, zoneId = "all") {
    const data = this.state.rounds.find((round) => round.id === roundId);
    if (!data) throw new Error("ไม่พบรอบใช้น้ำ");
    const round = new WaterBillingRound(data);
    return {
      round: { ...structuredClone(data), households: round.getReadings() },
      summary: round.summarize(zoneId),
      rounds: this.state.rounds.map(({ id, name, start, end, closedAt }) => ({
        id,
        name,
        start,
        end,
        closedAt,
      })),
    };
  }
  #change(roundId, action) {
    const draft = structuredClone(this.state);
    const index = draft.rounds.findIndex((round) => round.id === roundId);
    if (index < 0) throw new Error("ไม่พบรอบใช้น้ำ");
    const round = new WaterBillingRound(draft.rounds[index]);
    action(round);
    draft.rounds[index] = round.toJSON();
    this.repository.save(draft);
    this.state = draft;
    return this.view(roundId);
  }
  saveReadings(roundId, changes) {
    return this.#change(roundId, (round) => {
      for (const [id, value] of Object.entries(changes))
        round.recordReading(id, value);
    });
  }
  saveOutput(roundId, zoneId, command) {
    return this.#change(roundId, (round) =>
      round.recordOutput(zoneId, command),
    );
  }
  closeRound(roundId) {
    return this.#change(roundId, (round) =>
      round.close(this.clock().toISOString()),
    );
  }
  createRound({ name, start, end }) {
    const last = this.state.rounds.at(-1);
    if (!last.closedAt) throw new Error("กรุณายืนยันรอบล่าสุดก่อนสร้างรอบใหม่");
    if (!String(name).trim() || start <= last.end || start > end)
      throw new Error(
        "ชื่อรอบต้องไม่ว่าง และช่วงเวลาใหม่ต้องอยู่หลังรอบล่าสุด",
      );
    const id = `${start}_${end}`;
    if (this.state.rounds.some((round) => round.id === id))
      throw new Error("มีรอบนี้แล้ว");
    const data = {
      id,
      name: String(name).trim(),
      start,
      end,
      closedAt: null,
      zones: last.zones.map((zone) => ({
        ...zone,
        previous: zone.current,
        current: null,
        authorized: 0,
        note: "",
      })),
      households: last.households.map((row) => ({
        ...row,
        previous: row.current,
        current: null,
      })),
    };
    new WaterBillingRound(data);
    const next = { rounds: [...this.state.rounds, data] };
    this.repository.save(next);
    this.state = next;
    return this.view(id);
  }
}
