import test from "node:test";
import assert from "node:assert/strict";
import { BrowserWorkspaceRepository } from "../src/infrastructure/BrowserWorkspaceRepository.js";
function storage() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
}
test("seed is isolated and writes persist", () => {
  const s = storage(),
    a = new BrowserWorkspaceRepository({
      storage: s,
      key: "a",
      seed: () => ({ count: 1 }),
    });
  const v = a.load();
  v.count = 2;
  a.save(v);
  const b = new BrowserWorkspaceRepository({
    storage: s,
    key: "a",
    seed: () => ({ count: 0 }),
  });
  assert.equal(b.load().count, 2);
});
test("stale tabs cannot overwrite newer data", () => {
  const s = storage(),
    a = new BrowserWorkspaceRepository({
      storage: s,
      key: "a",
      seed: () => ({ count: 1 }),
    }),
    b = new BrowserWorkspaceRepository({
      storage: s,
      key: "a",
      seed: () => ({ count: 1 }),
    });
  a.load();
  b.load();
  a.save({ count: 2 });
  assert.throws(() => b.save({ count: 3 }), /อีกแท็บ/);
  assert.equal(a.load().count, 2);
});
test("malformed storage never gets silently replaced", () => {
  const s = storage();
  s.setItem("a", "bad-json");
  const a = new BrowserWorkspaceRepository({
    storage: s,
    key: "a",
    seed: () => ({}),
  });
  assert.throws(() => a.load(), /เขียนทับ/);
  assert.equal(s.getItem("a"), "bad-json");
});
