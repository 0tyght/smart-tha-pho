import assert from "node:assert/strict";
import test from "node:test";

import { LineChannelProfile } from "../src/application/line/LineChannelProfile.js";

test("represents the shared Smart Tha Pho LINE credentials", () => {
  const smart = new LineChannelProfile({ kind: "SMART", channelSecret: "smart-secret", channelAccessToken: "smart-token" });
  assert.equal(smart.configured, true);
  assert.equal(smart.channelAccessToken, "smart-token");
});

test("legacy audience aliases report the shared Smart Tha Pho environment keys", () => {
  const driver = new LineChannelProfile({ kind: "DRIVER" });
  assert.throws(() => driver.requireSecret(), /LINE_CHANNEL_SECRET/);
  assert.throws(() => driver.requireAccessToken(), /LINE_CHANNEL_ACCESS_TOKEN/);
});
