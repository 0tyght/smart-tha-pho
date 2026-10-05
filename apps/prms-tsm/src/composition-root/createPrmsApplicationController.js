import { navigationService } from "@smart-thapho/web-core/navigation";
import { sessionStore } from "@smart-thapho/web-core/session";
import { PrmsApplicationController } from "../application/PrmsApplicationController.js";

export function createPrmsApplicationController() {
  return new PrmsApplicationController({
    session: sessionStore,
    navigation: navigationService,
    windowObject: window,
  });
}
