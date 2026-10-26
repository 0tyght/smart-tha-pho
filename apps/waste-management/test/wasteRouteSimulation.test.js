import assert from "node:assert/strict";
import test from "node:test";
import { WasteRoutePlayback } from "../src/domain/WasteRoutePlayback.js";
import { WasteRouteSimulationController } from "../src/application/WasteRouteSimulationController.js";
import { LeafletWasteSimulationRenderer } from "../src/infrastructure/LeafletWasteSimulationRenderer.js";

const line = { type: "LineString", coordinates: [[100.22, 16.77], [100.221, 16.77], [100.221, 16.771]] };

test("truck follows each road segment at a distance-based speed", () => {
  const model = new WasteRoutePlayback({ geometry: line, speedKph: 20 });
  model.play(); model.advance(1000);
  const result = model.snapshot();
  assert.ok(Math.abs(result.distanceMeters - 20 / 3.6) < 0.00001);
  assert.equal(result.position.latitude, 16.77);
  assert.ok(result.position.longitude > 100.22 && result.position.longitude < 100.221);
  model.step(120);
  assert.equal(model.snapshot().position.longitude, 100.221);
  assert.ok(model.snapshot().position.latitude > 16.77);
});

test("pause, reset and replay do not drift or overshoot the destination", () => {
  const model = new WasteRoutePlayback({ geometry: line });
  model.play(); model.advance(1000); model.pause();
  const distance = model.snapshot().distanceMeters;
  model.advance(30000);
  assert.equal(model.snapshot().distanceMeters, distance);
  model.play(); model.advance(1_000_000);
  assert.equal(model.snapshot().status, "completed");
  assert.equal(model.snapshot().progressPercent, 100);
  assert.equal(model.snapshot().position.latitude, 16.771);
  model.play(); assert.equal(model.snapshot().distanceMeters, 0);
  model.reset(); assert.equal(model.snapshot().status, "idle");
});

test("optional looping turns at the endpoint without a jump and keeps playing", () => {
  const geometry = { type: "LineString", coordinates: [[100.2, 16.75], [100.201, 16.75]] };
  const model = new WasteRoutePlayback({ geometry, loop: true, speedKph: 20 });
  const total = model.snapshot().totalDistanceMeters;
  model.play(); model.advance(total / (20 / 3.6) * 1000);
  const atEnd = model.snapshot();
  assert.equal(atEnd.status, "playing"); assert.ok(Math.abs(atEnd.distanceMeters - total) < 0.000001);
  model.advance(1000);
  const returning = model.snapshot();
  assert.equal(returning.status, "playing"); assert.equal(returning.direction, -1); assert.equal(returning.position.facingWest, true);
  assert.ok(returning.position.longitude < atEnd.position.longitude && returning.position.longitude > 100.2);
  assert.ok(Math.abs(total - returning.distanceMeters - 20 / 3.6) < 0.000001);
});

test("looping handles multiple round trips, pause and reset without ever completing", () => {
  const model = new WasteRoutePlayback({ geometry: line, loop: true });
  const total = model.snapshot().totalDistanceMeters;
  model.play(); model.advance((total * 8.25) / (20 / 3.6) * 1000);
  assert.equal(model.snapshot().status, "playing"); assert.equal(model.snapshot().direction, 1);
  assert.ok(Math.abs(model.snapshot().distanceMeters - total * 0.25) < 0.000001);
  model.pause(); const paused = model.snapshot(); model.advance(100000); assert.deepEqual(model.snapshot(), paused);
  model.reset(); assert.equal(model.snapshot().direction, 1); assert.equal(model.snapshot().distanceMeters, 0);
  const empty = new WasteRoutePlayback({ geometry: null, loop: true }); empty.play(); empty.advance(10000);
  assert.equal(empty.snapshot().hasRoute, false); assert.equal(empty.snapshot().distanceMeters, 0);
});

test("supports Feature, FeatureCollection, GeometryCollection and serialized GeoJSON", () => {
  for (const geometry of [line, { type: "Feature", geometry: line },
    { type: "FeatureCollection", features: [{ type: "Feature", geometry: line }] },
    { type: "GeometryCollection", geometries: [line] }, JSON.stringify(line)]) {
    assert.equal(new WasteRoutePlayback({ geometry }).snapshot().hasRoute, true);
  }
});

test("disconnected route parts never create an invented straight-line connector", () => {
  const model = new WasteRoutePlayback({ geometry: { type: "MultiLineString", coordinates: [
    [[0, 0], [0.001, 0]], [[1, 0], [1.001, 0]],
  ] } });
  assert.ok(model.snapshot().totalDistanceMeters < 230);
  model.step(model.snapshot().totalDistanceMeters * 0.75);
  assert.ok(model.snapshot().position.longitude >= 1);
});

test("empty, invalid, duplicate, null and non-line geometry stay disabled", () => {
  for (const geometry of [null, "invalid-json", { type: "Point", coordinates: [100, 16] },
    { type: "LineString", coordinates: [[0, 0], [null, 0], [0.001, 0]] },
    { type: "LineString", coordinates: [[0, 0], [0, 0]] },
    { type: "LineString", coordinates: [[181, 16], [100, 91]] }]) {
    const model = new WasteRoutePlayback({ geometry });
    model.play(); model.step(); model.advance(1000);
    assert.equal(model.snapshot().hasRoute, false);
    assert.equal(model.snapshot().distanceMeters, 0);
  }
});

test("speed and elapsed-time validation prevent invalid animation state", () => {
  const model = new WasteRoutePlayback({ geometry: line });
  for (const speed of [0, -1, 100, NaN, Infinity]) assert.throws(() => model.setSpeed(speed), RangeError);
  model.play();
  for (const elapsed of [NaN, Infinity, -1, 0]) model.advance(elapsed);
  assert.equal(model.snapshot().distanceMeters, 0);
  model.setSpeed(10); model.advance(1000);
  assert.ok(Math.abs(model.snapshot().distanceMeters - 10 / 3.6) < 0.00001);
});

function controllerFixture() {
  let id = 0;
  const frames = new Map();
  const renders = [];
  let clears = 0;
  const controller = new WasteRouteSimulationController({
    createPlayback: (options) => new WasteRoutePlayback(options),
    scheduler: { request: (callback) => { const next = id++; frames.set(next, callback); return next; }, cancel: (handle) => frames.delete(handle) },
    renderer: { render: (state) => renders.push(state), clear: () => { clears += 1; } },
  });
  const configure = () => controller.configureSource({ routes: [{ id: "route-1", routeName: "ทดสอบ", routeGeojson: structuredClone(line) }], selectedRouteId: "route-1" });
  const fire = (time) => { const [handle, callback] = frames.entries().next().value; frames.delete(handle); callback(time); };
  return { controller, frames, renders, configure, fire, clearCount: () => clears };
}

test("simulation starts only on request and unchanged polling does not rewind it", () => {
  const f = controllerFixture(); f.configure();
  assert.equal(f.frames.size, 0); assert.equal(f.renders.length, 0);
  f.controller.play(); f.fire(0); f.fire(1000);
  const distance = f.controller.snapshot().distanceMeters;
  assert.ok(distance > 0 && distance < 2); // a stalled frame never teleports the truck
  f.configure();
  assert.equal(f.controller.snapshot().distanceMeters, distance);
  assert.equal(f.controller.snapshot().status, "playing");
  assert.equal(f.frames.size, 1);
});

test("pause, stop, route change and disposal cancel pending frames", () => {
  const f = controllerFixture(); f.configure(); f.controller.play(); f.controller.play();
  assert.equal(f.frames.size, 1);
  f.controller.pause(); assert.equal(f.frames.size, 0);
  f.controller.play();
  f.controller.configureSource({ routeGeojson: line, focusKey: "different-plan" });
  assert.equal(f.frames.size, 0); assert.equal(f.controller.snapshot().active, false);
  f.controller.play(); f.controller.stop(); assert.equal(f.frames.size, 0);
  f.controller.play(); f.controller.dispose(); assert.equal(f.frames.size, 0);
  assert.ok(f.clearCount() >= 3);
});

test("reduced motion uses explicit 50-metre steps, never autoplay", () => {
  const f = controllerFixture(); f.configure(); f.controller.setReducedMotion(true);
  f.controller.play();
  assert.equal(f.frames.size, 0);
  assert.equal(f.controller.snapshot().distanceMeters, 50);
  assert.equal(f.controller.snapshot().status, "paused");
  f.controller.play(); assert.equal(f.controller.snapshot().distanceMeters, 100);
  f.controller.setReducedMotion(false); f.controller.play();
  assert.equal(f.frames.size, 1);
  f.controller.setReducedMotion(true); assert.equal(f.frames.size, 0);
});

test("missing selection and absent road geometry provide an honest disabled state", () => {
  const f = controllerFixture();
  f.controller.configureSource({ routes: [{ id: "a", routeGeojson: line }] });
  assert.equal(f.controller.snapshot().hasRoute, false);
  f.controller.play(); assert.equal(f.frames.size, 0);
  f.controller.configureSource({ routes: [{ id: "a" }], selectedRouteId: "a" });
  assert.match(f.controller.snapshot().emptyReason, /ไม่มีแนวถนน/);
});

test("subscriptions clean up and controller supports React StrictMode remount", () => {
  const f = controllerFixture(); let notifications = 0;
  const unsubscribe = f.controller.subscribe(() => { notifications += 1; });
  f.configure(); assert.ok(notifications > 1);
  unsubscribe(); const count = notifications; f.controller.play();
  assert.equal(notifications, count);
  f.controller.dispose(); f.configure(); f.controller.play();
  assert.equal(f.frames.size, 1);
});

test("renderer moves one explicitly labelled demo marker and removes it on close", () => {
  let creations = 0; let removed = 0; const positions = []; const facing = { style: {} };
  const marker = {
    addTo: () => marker, bindTooltip: (label) => assert.equal(label, "รถเก็บขยะ"),
    setLatLng: (point) => positions.push(point), getElement: () => ({ querySelector: () => facing }), remove: () => { removed += 1; },
  };
  const renderer = new LeafletWasteSimulationRenderer({ map: {}, leaflet: {
    divIcon: (options) => options, marker: (_point, options) => { creations += 1; assert.match(options.title, /แสดงตามเส้นทางที่กำหนด/); return marker; },
  } });
  renderer.render({ position: { latitude: 16, longitude: 100, facingWest: false } });
  renderer.render({ position: { latitude: 16, longitude: 100.001, facingWest: true } });
  assert.equal(creations, 1); assert.equal(positions.length, 2);
  assert.equal(facing.style.transform, "scaleX(-1)");
  renderer.clear(); assert.equal(removed, 1);
});
