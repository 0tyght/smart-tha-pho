import { WasteRoutePlayback } from "./WasteRoutePlayback.js";

/** Resolves fleet observations without manufacturing GPS or operational state. */
export class WasteFleetPolicy {
  #bounds;
  constructor({ bounds }) { this.#bounds = bounds; }

  #position(vehicle) {
    const lat = vehicle.lastLatitude;
    const lng = vehicle.lastLongitude;
    if (lat == null || lng == null || String(lat).trim() === "" || String(lng).trim() === "" || !vehicle.lastGpsAt) return null;
    const latitude = Number(lat), longitude = Number(lng);
    const b = this.#bounds;
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      && latitude >= b.south && latitude <= b.north && longitude >= b.west && longitude <= b.east
      && Number.isFinite(Date.parse(vehicle.lastGpsAt)) ? { latitude, longitude } : null;
  }

  #exampleRoute(route) {
    const playback = new WasteRoutePlayback({ geometry: route.routeGeojson });
    const state = playback.snapshot();
    return state.hasRoute ? { route, position: state.position } : null;
  }

  resolve({ vehicles = [], plans = [], routes = [], now, date, example = false }) {
    const exampleRoutes = routes.filter((route) => route.isActive !== false).map((route) => this.#exampleRoute(route)).filter(Boolean);
    const activePlans = plans.filter((plan) => plan.scheduledDate === date && plan.publicationStatus === "PUBLISHED"
      && ["IN_PROGRESS", "INTERRUPTED"].includes(plan.status))
      .sort((a, b) => String(b.actualStartAt || b.id).localeCompare(String(a.actualStartAt || a.id)));
    const fleet = vehicles.map((vehicle, index) => {
      const sample = example ? exampleRoutes[index % exampleRoutes.length] : null;
      const canOperate = !["MAINTENANCE", "OUT_OF_SERVICE"].includes(vehicle.status);
      const plan = sample && canOperate ? { id: `example:${vehicle.id}`, vehicleId: vehicle.id, vehicleCode: vehicle.vehicleCode,
        routeId: sample.route.id, routeName: sample.route.routeName, status: "IN_PROGRESS", planNo: "ตัวอย่างการปฏิบัติงาน" }
        : example ? null : activePlans.find((item) => item.vehicleId === vehicle.id) || null;
      const route = sample?.route || routes.find((item) => item.id === plan?.routeId) || null;
      const position = sample?.position || (example ? null : this.#position(vehicle));
      const age = position && !example ? Math.max(0, now - Date.parse(vehicle.lastGpsAt)) : null;
      const gpsKey = example ? "example" : !position ? "unknown" : age <= 90_000 ? "live" : age <= 300_000 ? "delayed" : "stale";
      const gpsLabel = { example: "แสดงตามเส้นทางที่กำหนด", unknown: "ยังไม่มีตำแหน่ง", live: "GPS สด", delayed: "GPS ช้ากว่าปกติ", stale: "ตำแหน่งล่าสุด · GPS ขาดการอัปเดต" }[gpsKey];
      return { ...vehicle, position, plan, route, gpsKey, gpsLabel, status: plan?.status || vehicle.status };
    });
    return { vehicles: fleet, canShowExample: vehicles.length > 0 && exampleRoutes.length > 0,
      total: fleet.length, positioned: fleet.filter((v) => v.position).length,
      operating: fleet.filter((v) => v.plan?.status === "IN_PROGRESS").length,
      unknown: fleet.filter((v) => !v.position).length };
  }
}
