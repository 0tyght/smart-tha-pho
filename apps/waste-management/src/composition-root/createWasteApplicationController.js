import { navigationService } from "@smart-thapho/web-core/navigation";
import { sessionStore } from "@smart-thapho/web-core/session";
import { WasteApplicationController } from "../application/WasteApplicationController.js";

export function createWasteApplicationController(pageIds) {
  return new WasteApplicationController({
    pageIds,
    session: sessionStore,
    navigation: navigationService,
    windowObject: window,
  });
}
