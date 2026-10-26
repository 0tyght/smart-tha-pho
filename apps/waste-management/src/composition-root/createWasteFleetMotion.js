import L from "leaflet";
import { WasteRoutePlayback } from "../domain/WasteRoutePlayback.js";
import { WasteFleetMotionController } from "../application/WasteFleetMotionController.js";
import { LeafletFleetVehicleRenderer } from "../infrastructure/LeafletFleetVehicleRenderer.js";
import { routeMapColor } from "../lib/wasteMapConfig.js";

export function createWasteFleetMotion(map, onSelect) {
  return new WasteFleetMotionController({ createPlayback: (options) => new WasteRoutePlayback(options),
    scheduler: { request: (callback) => window.requestAnimationFrame(callback), cancel: (id) => window.cancelAnimationFrame(id) },
    renderer: new LeafletFleetVehicleRenderer({ map, leaflet: L, colorForRoute: routeMapColor, onSelect }) });
}
