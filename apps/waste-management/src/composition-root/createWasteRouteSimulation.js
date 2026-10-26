import L from "leaflet";
import { WasteRoutePlayback } from "../domain/WasteRoutePlayback.js";
import { WasteRouteSimulationController } from "../application/WasteRouteSimulationController.js";
import { LeafletWasteSimulationRenderer } from "../infrastructure/LeafletWasteSimulationRenderer.js";

export function createWasteRouteSimulation(map) {
  return new WasteRouteSimulationController({
    createPlayback: (options) => new WasteRoutePlayback(options),
    scheduler: {
      request: (callback) => window.requestAnimationFrame(callback),
      cancel: (handle) => window.cancelAnimationFrame(handle),
    },
    renderer: new LeafletWasteSimulationRenderer({ map, leaflet: L }),
  });
}
