import test from "node:test";
import assert from "node:assert/strict";
import { DisasterOperationsController } from "../src/application/DisasterOperationsController.js";
import { createDisasterSeed } from "../src/infrastructure/disasterSeed.js";
function create() {
  const repo = {
    data: createDisasterSeed(),
    load() {
      return structuredClone(this.data);
    },
    save(data) {
      this.data = structuredClone(data);
    },
  };
  const c = new DisasterOperationsController({
    repository: repo,
    clock: () => new Date("2026-10-27T05:00:00Z"),
    idFactory: () => "12345678-abcd",
  });
  c.load();
  return { c, repo };
}
test("new events await verification before dispatch", () => {
  const { c } = create();
  const v = c.create({
    title: "น้ำท่วม",
    location: "หมู่1",
    description: "รายละเอียด",
    lat: "16.75",
    lng: "100.20",
    severity: "HIGH",
  });
  assert.equal(v.incidents[0].status, "NEW");
  assert.throws(() =>
    c.assign(v.incidents[0].id, { teamId: "team-2", vehicleId: "vehicle-2" }),
  );
});
test("invalid coordinates, fields and severity rejected", () => {
  const { c } = create();
  const cmd = {
    title: "test",
    location: "test",
    description: "test",
    lat: "16",
    lng: "100",
    severity: "HIGH",
  };
  for (const change of [
    { lat: "" },
    { lng: "" },
    { lat: 91 },
    { lng: 181 },
    { title: " " },
    { description: "" },
    { severity: "urgent" },
  ])
    assert.throws(() => c.create({ ...cmd, ...change }));
});
test("neither teams nor vehicles can be double booked", () => {
  const { c } = create();
  assert.throws(() =>
    c.assign("DIS-026", { teamId: "team-1", vehicleId: "vehicle-2" }),
  );
  assert.throws(() =>
    c.assign("DIS-026", { teamId: "team-2", vehicleId: "vehicle-1" }),
  );
  c.assign("DIS-026", { teamId: "team-2", vehicleId: "vehicle-2" });
  assert.equal(c.view().teams.find((t) => t.id === "team-2").busy, true);
});
test("workflow preserves history and releases resources", () => {
  const { c } = create();
  c.assign("DIS-026", { teamId: "team-2", vehicleId: "vehicle-2" });
  assert.throws(() => c.transition("DIS-026", "CLOSED", "skip"));
  for (const s of ["EN_ROUTE", "ON_SITE", "RESOLVED", "CLOSED"])
    c.transition("DIS-026", s, "ผลการปฏิบัติ");
  const v = c.view();
  assert.equal(v.incidents.find((i) => i.id === "DIS-026").history.length, 7);
  assert.equal(v.teams.find((t) => t.id === "team-2").busy, false);
  assert.throws(() => c.transition("DIS-026", "ON_SITE", "reopen"));
});
test("resolved incidents cannot steal reassigned resources", () => {
  const { c } = create();
  c.transition("DIS-025", "ON_SITE", "ถึงที่เกิดเหตุ");
  c.transition("DIS-025", "RESOLVED", "รอตรวจผล");
  c.assign("DIS-026", { teamId: "team-1", vehicleId: "vehicle-1" });
  assert.throws(() => c.transition("DIS-025", "ON_SITE", "ต้องทำต่อ"));
});
test("mandatory notes and failed storage leave state intact", () => {
  const { c, repo } = create();
  assert.throws(() => c.transition("DIS-024", "VERIFIED", " "));
  repo.save = () => {
    throw new Error("full");
  };
  assert.throws(() => c.transition("DIS-024", "VERIFIED", "ตรวจแล้ว"));
  assert.equal(
    c.view().incidents.find((i) => i.id === "DIS-024").status,
    "NEW",
  );
});
