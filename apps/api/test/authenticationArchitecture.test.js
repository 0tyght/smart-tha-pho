import assert from "node:assert/strict";
import test from "node:test";
import { AuthenticateRequestUseCase } from "../src/application/security/AuthenticateRequestUseCase.js";
import { AuthenticationError } from "../src/application/security/AuthenticationError.js";
import { MariaDbStaffAccountRepository } from "../src/infrastructure/security/MariaDbStaffAccountRepository.js";

test("authentication use case returns a citizen session without querying staff accounts", async () => {
  let staffLookupCount = 0;
  const useCase = new AuthenticateRequestUseCase({
    sessionTokenService: {
      verify: () => ({ sub: "citizen-1", role: "CITIZEN", staffSession: false }),
    },
    staffAccountRepository: {
      findActiveById: async () => {
        staffLookupCount += 1;
        return null;
      },
    },
  });

  const session = await useCase.execute({ token: "valid-token" });

  assert.equal(session.sub, "citizen-1");
  assert.equal(staffLookupCount, 0);
});

test("authentication use case refreshes staff authorization from the repository", async () => {
  const useCase = new AuthenticateRequestUseCase({
    sessionTokenService: {
      verify: () => ({ sub: "staff-1", role: "VIEWER", staffSession: true }),
    },
    staffAccountRepository: {
      findActiveById: async () => ({
        id: "staff-1",
        fullName: "เจ้าหน้าที่ ท่าโพธิ์",
        email: "staff@thapho.go.th",
        role: "OFFICER",
        villageId: 4,
      }),
    },
  });

  const session = await useCase.execute({ token: "valid-token" });

  assert.equal(session.role, "OFFICER");
  assert.equal(session.name, "เจ้าหน้าที่ ท่าโพธิ์");
  assert.equal(session.villageId, 4);
});

test("authentication use case rejects an inactive staff account", async () => {
  const useCase = new AuthenticateRequestUseCase({
    sessionTokenService: {
      verify: () => ({ sub: "staff-1", staffSession: true }),
    },
    staffAccountRepository: {
      findActiveById: async () => null,
    },
  });

  await assert.rejects(
    () => useCase.execute({ token: "valid-token" }),
    (error) =>
      error instanceof AuthenticationError &&
      error.code === "INACTIVE_STAFF_ACCOUNT",
  );
});

test("MariaDB staff repository maps persistence rows to immutable application data", async () => {
  const database = {
    execute: async () => [[{
      id: "staff-1",
      fullName: "เจ้าหน้าที่ ท่าโพธิ์",
      email: "staff@thapho.go.th",
      role: "OFFICER",
      villageId: null,
    }]],
  };
  const repository = new MariaDbStaffAccountRepository({ database });

  const account = await repository.findActiveById("staff-1");

  assert.deepEqual(account, {
    id: "staff-1",
    fullName: "เจ้าหน้าที่ ท่าโพธิ์",
    email: "staff@thapho.go.th",
    role: "OFFICER",
    villageId: null,
  });
  assert.equal(Object.isFrozen(account), true);
});
