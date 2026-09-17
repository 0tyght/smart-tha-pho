import { SystemApplicationController } from "@smart-thapho/web-core/application";
import { WaterworksDashboardController } from "../application/WaterworksDashboardController.js";
import { InMemoryWaterTelemetryRepository } from "../infrastructure/InMemoryWaterTelemetryRepository.js";

export function createWaterworksApplication({ windowObject = window } = {}) {
  return new WaterworksDashboardController({
    telemetryRepository: new InMemoryWaterTelemetryRepository(),
    systemController: new SystemApplicationController({ windowObject }),
  });
}
