import assert from "node:assert/strict";
import test from "node:test";

import {
  LineChannelSettingsRegistry,
  decryptLineSecret,
  encryptLineSecret,
  webhookPathFor,
} from "../src/modules/line/lineChannelSettings.js";
import {
  lineAudienceForWasteNotification,
  lineChannelKindForWasteNotification,
} from "../src/modules/waste/infrastructure/WasteLineNotificationQueue.js";

function emptyDatabase() {
  return {
    async execute(sql) {
      if (/FROM\s+system_line_channels/i.test(sql)) return [[], []];
      throw new Error(`Unexpected SQL in test: ${sql}`);
    },
  };
}

test("LINE settings encrypt secrets without storing plaintext", () => {
  const encrypted = encryptLineSecret("very-sensitive-token-value");
  assert.ok(encrypted);
  assert.equal(encrypted.includes("very-sensitive-token-value"), false);
  assert.equal(decryptLineSecret(encrypted), "very-sensitive-token-value");
});

test("LINE settings test validates token without returning secrets", async () => {
  let request = null;
  const registry = new LineChannelSettingsRegistry({
    database: emptyDatabase(),
    cacheTtlMs: 0,
    fetchImplementation: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            userId: "U0123456789abcdef0123456789abcdef",
            basicId: "@123abcde",
            displayName: "Smart Tha Pho Staff",
          };
        },
      };
    },
  });

  const result = await registry.test("DRIVER", {
    channelId: "2001234567",
    channelSecret: "driver-secret",
    channelAccessToken: "driver-access-token",
  });

  assert.equal(request.url, "https://api.line.me/v2/bot/info");
  assert.equal(request.options.headers.Authorization, "Bearer driver-access-token");
  assert.equal(result.kind, "SMART");
  assert.equal(result.displayName, "Smart Tha Pho Staff");
  assert.equal(result.basicId, "@123abcde");
  assert.equal(result.webhookPath, "/api/line/webhook");
  assert.equal(Object.hasOwn(result, "channelSecret"), false);
  assert.equal(Object.hasOwn(result, "channelAccessToken"), false);
});


test("LINE settings list never exposes saved secret fields", async () => {
  const registry = new LineChannelSettingsRegistry({ database: emptyDatabase(), cacheTtlMs: 0 });
  const channels = await registry.listSafe();
  assert.deepEqual(channels.map((item) => item.kind), ["SMART"]);
  for (const channel of channels) {
    assert.equal(Object.hasOwn(channel, "channelSecret"), false);
    assert.equal(Object.hasOwn(channel, "channelAccessToken"), false);
    assert.equal(typeof channel.hasChannelSecret, "boolean");
    assert.equal(typeof channel.hasAccessToken, "boolean");
  }
});

test("all LINE audience aliases resolve to the unified Smart Tha Pho webhook", () => {
  assert.equal(webhookPathFor("SMART"), "/api/line/webhook");
  assert.equal(webhookPathFor("CITIZEN"), "/api/line/webhook");
  assert.equal(webhookPathFor("DRIVER"), "/api/line/webhook");
});

test("waste notifications use one OA while retaining the target audience", () => {
  for (const type of ["PLAN_ASSIGNMENT", "COLLECTION_STATUS", "CHARGE_NOTICE", "PAYMENT_REMINDER"]) {
    assert.equal(lineChannelKindForWasteNotification(type), "SMART");
  }
  assert.equal(lineAudienceForWasteNotification("PLAN_ASSIGNMENT"), "DRIVER");
  assert.equal(lineAudienceForWasteNotification("COLLECTION_STATUS"), "CITIZEN");
});
