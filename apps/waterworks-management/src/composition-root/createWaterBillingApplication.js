import { BrowserWorkspaceRepository } from "@smart-thapho/web-core/workspace-storage";
import { WaterBillingController } from "../application/WaterBillingController.js";
import { createWaterBillingSeed } from "../infrastructure/waterBillingSeed.js";
export function createWaterBillingApplication({
  storage = window.localStorage,
} = {}) {
  return new WaterBillingController({
    repository: new BrowserWorkspaceRepository({
      storage,
      key: "smart_thapho_water_billing_prototype_v1",
      seed: createWaterBillingSeed,
    }),
  });
}
