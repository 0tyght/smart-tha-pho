import { createWasteApplication } from "./createWasteApplication.js";
import { WasteFleetTrackingController } from "../application/WasteFleetTrackingController.js";
import { WasteFleetPolicy } from "../domain/WasteFleetPolicy.js";
import { LocationHistoryPolicy } from "../application/LocationHistoryPolicy.js";
import { THA_PHO_SERVICE_BOUNDS } from "../lib/wasteMapConfig.js";

export function createWasteFleetTracking(token) {
  const previewRequested = new URLSearchParams(window.location.search).get("preview") === "1";
  return new WasteFleetTrackingController({ api: createWasteApplication(token),
    policy: new WasteFleetPolicy({ bounds: THA_PHO_SERVICE_BOUNDS }),
    historyPolicy: new LocationHistoryPolicy({ maximumGapMinutes: 5 }), clock: () => new Date(),
    autoExample: previewRequested || ["localhost", "127.0.0.1"].includes(window.location.hostname) });
}
