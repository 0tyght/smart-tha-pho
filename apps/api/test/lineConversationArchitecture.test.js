import assert from "node:assert/strict";
import test from "node:test";
import { ClearLineConversationUseCase } from "../src/application/line/ClearLineConversationUseCase.js";

test("clearing a LINE conversation delegates persistence through its repository", async () => {
  const cleared = [];
  const useCase = new ClearLineConversationUseCase({
    lineConversationRepository: {
      clearPendingFlows: async (lineUserId) => cleared.push(lineUserId),
    },
  });

  assert.deepEqual(await useCase.execute({ lineUserId: "" }), { cleared: false });
  assert.deepEqual(
    await useCase.execute({ lineUserId: "U0123456789abcdef0123456789abcdef" }),
    { cleared: true },
  );
  assert.deepEqual(cleared, ["U0123456789abcdef0123456789abcdef"]);
});
