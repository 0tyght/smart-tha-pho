import { lineChannelSettings } from "../../apps/api/src/modules/line/lineChannelSettings.js";
import { database } from "../../apps/api/src/core/db.js";

const input = String(process.argv[2] || "").trim();
if (!input) {
  console.error("[line-webhook-sync] missing public API URL");
  process.exit(2);
}

let origin;
try {
  origin = new URL(input).origin;
} catch {
  console.error(`[line-webhook-sync] invalid public API URL: ${input}`);
  process.exit(2);
}

try {
  await lineChannelSettings.refresh({ force: true });

  for (const kind of ["SMART"]) {
    const channel = await lineChannelSettings.get(kind);
    if (!channel.configured) {
      console.log(`[line-webhook-sync] ${kind}: skipped (not configured or disabled)`);
      continue;
    }

    try {
      const result = await lineChannelSettings.configureWebhook(kind, origin, { audit: false });
      console.log(`[line-webhook-sync] ${kind}: ${result.endpoint}${result.active ? " (active)" : " (Use webhook is OFF)"}`);
    } catch (error) {
      console.warn(`[line-webhook-sync] ${kind}: warning: ${String(error?.message || error)}`);
    }
  }
} finally {
  await database.end();
}
