import {
  lineChannelSettings,
} from "../../apps/api/src/modules/line/lineChannelSettings.js";
import { database } from "../../apps/api/src/core/db.js";

import {
  syncSmartThaPhoDefaultRichMenu,
} from "../../apps/api/src/modules/line/CitizenSystemRichMenus.js";

try {
  await lineChannelSettings.refresh({
    force: true,
  });

  const smartChannel =
    await lineChannelSettings.get(
      "SMART",
    );

  if (!smartChannel.configured) {
    console.log(
      "[line-rich-menu-default] SMART: skipped (not configured or disabled)",
    );
  } else {
    const result =
      await syncSmartThaPhoDefaultRichMenu();

    console.log(
      `[line-rich-menu-default] SMART: Smart Tha Pho default (${result.richMenuId})`,
    );
  }
} catch (error) {
  console.error(
    `[line-rich-menu-default] SMART: failed: ${String(error?.message || error)}`,
  );
  process.exitCode = 1;
} finally {
  await database.end();
}
