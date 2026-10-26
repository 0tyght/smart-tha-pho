import { BrowserWorkspaceRepository } from "@smart-thapho/web-core/workspace-storage";
import { SystemApplicationController } from "@smart-thapho/web-core/application";
import { DisasterOperationsController } from "../application/DisasterOperationsController.js";
import { createDisasterSeed } from "../infrastructure/disasterSeed.js";
export function createDisasterApplication({
  storage = window.localStorage,
} = {}) {
  return {
    system: new SystemApplicationController(),
    operations: new DisasterOperationsController({
      repository: new BrowserWorkspaceRepository({
        storage,
        key: "smart_thapho_disaster_prototype_v1",
        seed: createDisasterSeed,
      }),
    }),
  };
}
