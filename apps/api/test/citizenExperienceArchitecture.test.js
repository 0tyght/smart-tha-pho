import assert from "node:assert/strict";
import test from "node:test";
import { CitizenExperienceService } from "../src/application/line/CitizenExperienceService.js";

test("citizen experience returns the guest state without repository access for an empty LINE id", async () => {
  let repositoryCalls = 0;
  const service = new CitizenExperienceService({
    citizenExperienceRepository: {
      findOwnerByLineUserId: async () => {
        repositoryCalls += 1;
        return null;
      },
    },
  });

  const state = await service.loadByLineUserId("");

  assert.equal(state.linked, false);
  assert.equal(state.menuKey, "guest");
  assert.equal(repositoryCalls, 0);
});

test("citizen experience derives actions and menu state from repository data", async () => {
  const service = new CitizenExperienceService({
    citizenExperienceRepository: {
      findOwnerByLineUserId: async () => ({
        id: "owner-1",
        fullName: "สมหมาย ใจดี",
        phone: "0990000001",
        houseNo: "12/1",
        addressDetail: "หมู่บ้านตัวอย่าง",
        villageId: 1,
        villageNo: 1,
        villageName: "วัดพริก",
        latitude: null,
        longitude: null,
      }),
      loadPetStats: async () => ({
        pets: 2,
        vaccinationDue: 1,
        unsterilized: 0,
        missingPets: 0,
      }),
      loadRequestStats: async () => ({ pending: 1, needsAttention: 0 }),
    },
  });

  const state = await service.loadByLineUserId("U0123456789abcdef0123456789abcdef");

  assert.equal(state.linked, true);
  assert.equal(state.menuKey, "action");
  assert.deepEqual(state.actions, ["VACCINATION_DUE", "LOCATION_REQUIRED", "PENDING"]);
  assert.equal(state.counts.pets, 2);
});
