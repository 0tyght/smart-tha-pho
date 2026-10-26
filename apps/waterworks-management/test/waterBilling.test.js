import test from "node:test";
import assert from "node:assert/strict";
import { WaterBillingRound } from "../src/domain/WaterBillingRound.js";
import { WaterBillingController } from "../src/application/WaterBillingController.js";
import { createWaterBillingSeed } from "../src/infrastructure/waterBillingSeed.js";
test("invalid calendar dates are rejected",()=>{for(const date of ["2026-02-30","2026-99-01"]){const f=fixture();f.start=date;assert.throws(()=>new WaterBillingRound(f));}});
test("one bad zone cannot be hidden by a positive overall balance",()=>{const f=fixture();f.zones.push({id:"z2",name:"z2",previous:0,current:200,authorized:0,note:""});f.households.push({id:"c",zoneId:"z2",previous:0,current:10});f.zones[0].current=120;const r=new WaterBillingRound(f);assert.ok(r.summarize().difference>0);assert.equal(r.summarize().suspicious,true);assert.throws(()=>r.close("today"));});
function fixture() {
  return {
    id: "round",
    name: "test",
    start: "2026-09-01",
    end: "2026-09-30",
    zones: [
      {
        id: "z",
        name: "test",
        previous: 100,
        current: 200,
        authorized: 10,
        note: "ล้างระบบ",
      },
    ],
    households: [
      { id: "a", zoneId: "z", previous: 100, current: 130 },
      { id: "b", zoneId: "z", previous: 20, current: 50 },
    ],
    closedAt: null,
  };
}
function repository(seed) {
  return {
    data: structuredClone(seed),
    load() {
      return structuredClone(this.data);
    },
    save(data) {
      this.data = structuredClone(data);
    },
  };
}
test("balance subtracts authorized use and uses input denominator", () => {
  const s = new WaterBillingRound(fixture()).summarize();
  assert.equal(s.output, 100);
  assert.equal(s.usage, 60);
  assert.equal(s.difference, 30);
  assert.equal(s.percent, 30);
});
test("missing reading must not become water loss", () => {
  const f = fixture();
  f.households[1].current = null;
  const r = new WaterBillingRound(f);
  assert.equal(r.summarize().difference, null);
  assert.equal(r.summarize().percent, null);
  assert.throws(() => r.close("today"));
});
test("missing output blocks final balance", () => {
  const f = fixture();
  f.zones[0].current = null;
  assert.equal(new WaterBillingRound(f).summarize().difference, null);
});
test("negative delta, invalid values and unknown IDs rejected", () => {
  const r = new WaterBillingRound(fixture());
  for (const v of [-1, NaN, "bad", Infinity, 99])
    assert.throws(() => r.recordReading("a", v));
  assert.throws(() => r.recordReading("missing", 150));
});
test("cleared reading restores incomplete state", () => {
  const r = new WaterBillingRound(fixture());
  r.recordReading("a", "");
  assert.equal(r.summarize().difference, null);
});
test("master readings and authorized usage validated", () => {
  const r = new WaterBillingRound(fixture());
  assert.throws(() =>
    r.recordOutput("z", { previous: 200, current: 100, authorized: 0 }),
  );
  assert.throws(() =>
    r.recordOutput("z", {
      previous: 100,
      current: 200,
      authorized: 10,
      note: "",
    }),
  );
});
test("zero output and negative balance block close", () => {
  for (const current of [100, 120]) {
    const f = fixture();
    f.zones[0].current = current;
    const r = new WaterBillingRound(f);
    assert.equal(r.summarize().suspicious, true);
    assert.throws(() => r.close("today"));
  }
});
test("finalized rounds cannot be edited", () => {
  const r = new WaterBillingRound(fixture());
  r.close("2026-10-27");
  assert.throws(() => r.recordReading("a", 150));
  assert.throws(() => r.recordOutput("z", {}));
  assert.throws(() => r.close("later"));
});
test("seed reconciles exactly: 50000-42000-1000=7000 (14%)", () => {
  const s = new WaterBillingRound(
    createWaterBillingSeed().rounds[0],
  ).summarize();
  assert.equal(s.total, 400);
  assert.equal(s.output, 50000);
  assert.equal(s.usage, 42000);
  assert.equal(s.authorized, 1000);
  assert.equal(s.difference, 7000);
  assert.equal(s.percent, 14);
});
test("reading batch and failed storage are atomic", () => {
  const repo = repository({ rounds: [fixture()] });
  const c = new WaterBillingController({ repository: repo });
  c.load();
  assert.throws(() => c.saveReadings("round", { a: 150, b: 1 }));
  assert.equal(c.view().summary.usage, 60);
  repo.save = () => {
    throw new Error("full");
  };
  assert.throws(() => c.saveReadings("round", { a: 150 }));
  assert.equal(c.view().summary.usage, 60);
});
test("next round is non-overlapping and carries prior endpoints", () => {
  const c = new WaterBillingController({
    repository: repository({ rounds: [fixture()] }),
  });
  c.load();
  assert.throws(() =>
    c.createRound({ name: "next", start: "2026-10-01", end: "2026-10-31" }),
  );
  c.closeRound("round");
  assert.throws(() =>
    c.createRound({ name: "bad", start: "2026-09-15", end: "2026-10-31" }),
  );
  const v = c.createRound({
    name: "next",
    start: "2026-10-01",
    end: "2026-10-31",
  });
  assert.equal(v.round.households[0].previous, 130);
  assert.equal(v.round.households[0].current, null);
  assert.equal(v.round.zones[0].previous, 200);
  assert.equal(v.summary.difference, null);
});
