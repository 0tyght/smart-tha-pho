import assert from "node:assert/strict";
import test from "node:test";
import { WaterMonitoringPoint, WaterTreatmentSystem } from "../src/domain/WaterMonitoringPoint.js";
import { WaterworksDashboardController } from "../src/application/WaterworksDashboardController.js";

test("WaterMonitoringPoint protects supported operational states", () => {
  assert.throws(() => new WaterMonitoringPoint({ id: "x", name: "x", type: "sensor", status: "unknown" }), RangeError);
  const point = new WaterMonitoringPoint({ id: "filter", sequence: 1, name: "ถังกรอง", type: "filter", status: "watch" });
  assert.equal(point.hasAlert(), true);
  assert.equal(point.toViewModel().statusLabel, "เฝ้าระวัง");
});

test("WaterTreatmentSystem summarizes production, tower, pressure and water quality", () => {
  const system = new WaterTreatmentSystem({ points: [
    { id: "raw-water", sequence: 1, name: "น้ำดิบ", type: "source", metrics: [{ id: "flow", value: 40, unit: "ลบ.ม./ชม." }] },
    { id: "water-tower", sequence: 2, name: "หอถังสูง", type: "tower", metrics: [{ id: "level", value: 70, unit: "%" }] },
    { id: "distribution", sequence: 3, name: "ระบบจ่าย", type: "network", status: "watch", metrics: [{ id: "pressure", value: 2.2, unit: "บาร์" }, { id: "chlorine", value: 0.4, unit: "มก./ล." }] },
  ] });
  const summary = system.summarize();
  assert.equal(summary.totalPoints, 3);
  assert.equal(summary.normalCount, 2);
  assert.equal(summary.alertCount, 1);
  assert.equal(summary.towerLevel.value, 70);
  assert.equal(summary.distributionPressure.value, 2.2);
});

test("WaterworksDashboardController builds a stable dashboard view model", async () => {
  const systemController = {
    getSession: () => ({ authenticated: true }),
    redirectToLogin() {}, switchSystem() {}, logout() {}, subscribeToExpiration() {},
  };
  const telemetryRepository = { getLatestSnapshot: async () => ({ updatedAt: "2026-09-14T00:00:00.000Z", points: [{ id: "raw-water", sequence: 1, name: "น้ำดิบ", type: "source" }] }) };
  const controller = new WaterworksDashboardController({ telemetryRepository, systemController });
  const result = await controller.loadDashboard();
  assert.equal(result.points[0].name, "น้ำดิบ");
  assert.equal(result.summary.totalPoints, 1);
});
