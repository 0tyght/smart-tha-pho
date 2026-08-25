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

  const citizen =
    await lineChannelSettings.get(
      "CITIZEN",
    );

  if (!citizen.configured) {
    console.log(
      "[line-rich-menu-default] CITIZEN: skipped (not configured or disabled)",
    );
  } else {
    const result =
      await syncSmartThaPhoDefaultRichMenu();

    console.log(
      `[line-rich-menu-default] CITIZEN: Smart Tha Pho default (${result.richMenuId})`,
    );
  }
} catch (error) {
  console.error(
    `[line-rich-menu-default] CITIZEN: failed: ${String(error?.message || error)}`,
  );
  process.exitCode = 1;
} finally {
  await database.end();
}
