import assert from "node:assert/strict";
import test from "node:test";
import { ListActiveVillagesUseCase } from "../src/application/reference/ListActiveVillagesUseCase.js";

test("public village use case delegates the active-village query to a repository", async () => {
  const useCase = new ListActiveVillagesUseCase({
    villageRepository: {
      listActive: async () => [{ id: 1, villageNo: 1, name: "วัดพริก" }],
    },
  });

  assert.deepEqual(await useCase.execute(), [
    { id: 1, villageNo: 1, name: "วัดพริก" },
  ]);
});
