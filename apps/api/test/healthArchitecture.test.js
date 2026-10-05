import assert from "node:assert/strict";
import test from "node:test";
import { HealthStatusService } from "../src/application/health/HealthStatusService.js";
import { MariaDbHealthRepository } from "../src/infrastructure/health/MariaDbHealthRepository.js";

const fixedClock = () => new Date("2026-09-01T02:00:00.000Z");

test("health application service evaluates readiness without SQL knowledge", async () => {
  const service = new HealthStatusService({
    healthRepository: {
      readinessState: async () => ({
        requiredTables: 8,
        presentTables: 8,
        secureAttachments: true,
        tokenizedNationalId: true,
      }),
      isAvailable: async () => true,
    },
    organizationName: "เทศบาลเมืองท่าโพธิ์",
    clock: fixedClock,
    uptime: () => 42.9,
  });

  assert.deepEqual(service.liveness(), {
    status: "alive",
    uptimeSeconds: 42,
    timestamp: "2026-09-01T02:00:00.000Z",
  });

  const readiness = await service.readiness();
  assert.equal(readiness.httpStatus, 200);
  assert.equal(readiness.body.status, "ready");
});

test("health application service reports database failure as unavailable", async () => {
  const service = new HealthStatusService({
    healthRepository: {
      readinessState: async () => {
        throw new Error("database offline");
      },
      isAvailable: async () => false,
    },
    organizationName: "เทศบาลเมืองท่าโพธิ์",
    clock: fixedClock,
    uptime: () => 0,
  });

  const readiness = await service.readiness();
  assert.equal(readiness.httpStatus, 503);
  assert.equal(readiness.body.database, "unavailable");

  const health = await service.health();
  assert.equal(health.database, "unavailable");
});

test("MariaDB health repository maps readiness metadata", async () => {
  const repository = new MariaDbHealthRepository({
    database: {
      query: async (sql) =>
        sql === "SELECT 1"
          ? [[]]
          : [[{ present: 8, secureAttachments: 1, tokenizedNationalId: 1 }]],
    },
  });

  assert.deepEqual(await repository.readinessState(), {
    requiredTables: 8,
    presentTables: 8,
    secureAttachments: true,
    tokenizedNationalId: true,
  });
  assert.equal(await repository.isAvailable(), true);
});
