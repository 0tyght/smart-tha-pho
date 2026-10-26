export class WasteFleetTrackingController {
  #api; #policy; #historyPolicy; #clock; #listeners = new Set();
  #data = { vehicles: [], plans: [], routes: [] }; #selectedId = ""; #example = false;
  #loading = true; #refreshing = false; #error = ""; #updatedAt = null; #track = null;
  #disposed = false; #request = 0; #detailRequest = 0;
  #autoExample; #modeChosen = false; #motionPaused = false; #speedKph = 20;

  constructor({ api, policy, historyPolicy, clock, autoExample = false }) { this.#api = api; this.#policy = policy; this.#historyPolicy = historyPolicy; this.#clock = clock; this.#autoExample = autoExample; }
  subscribe(listener) { this.#disposed = false; this.#listeners.add(listener); listener(this.snapshot()); return () => this.#listeners.delete(listener); }
  #date() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(this.#clock()); }
  #fleet() { return this.#policy.resolve({ ...this.#data, now: this.#clock().getTime(), date: this.#date(), example: this.#example }); }

  async refresh({ silent = false } = {}) {
    const request = ++this.#request;
    if (!silent) this.#refreshing = true;
    this.#notify();
    try {
      const [vehicles, plans, routes] = await Promise.all([
        this.#api.get("/api/waste/vehicles"), this.#api.get(`/api/waste/plans?date=${this.#date()}`), this.#api.get("/api/waste/routes"),
      ]);
      if (this.#disposed || request !== this.#request) return;
      const previousPlanId = this.#fleet().vehicles.find((v) => v.id === this.#selectedId)?.plan?.id;
      this.#data = { vehicles, plans, routes }; this.#updatedAt = this.#clock(); this.#error = "";
      if (!this.#modeChosen && this.#autoExample) {
        this.#modeChosen = true;
        const initialFleet = this.#fleet();
        if (initialFleet.canShowExample && !initialFleet.vehicles.some((v) => ["live", "delayed"].includes(v.gpsKey))) this.#example = true;
      }
      const nextPlanId = this.#fleet().vehicles.find((v) => v.id === this.#selectedId)?.plan?.id;
      if (previousPlanId !== nextPlanId) this.#track = null;
      if (!vehicles.some((v) => v.id === this.#selectedId)) this.#selectedId = "";
      await this.#loadTrack();
    } catch (error) { if (!this.#disposed && request === this.#request) this.#error = error.message; }
    finally { if (!this.#disposed && request === this.#request) { this.#loading = false; this.#refreshing = false; this.#notify(); } }
  }

  selectVehicle(id) {
    if (id && !this.#data.vehicles.some((vehicle) => vehicle.id === id)) return;
    this.#selectedId = id; this.#track = null; ++this.#detailRequest; this.#notify();
    void this.#loadTrack();
  }
  showExample() {
    if (!this.#fleet().canShowExample) return;
    this.#example = true; this.#modeChosen = true; this.#motionPaused = false; this.#track = null; ++this.#detailRequest;
    this.#selectedId = ""; this.#notify();
  }
  showActual() { this.#example = false; this.#modeChosen = true; this.#selectedId = ""; this.#track = null; ++this.#detailRequest; this.#notify(); }
  toggleMotion() { this.#motionPaused = !this.#motionPaused; this.#notify(); }
  setSpeed(value) { const speed = Number(value); if (![10, 20, 30, 40].includes(speed)) return; this.#speedKph = speed; this.#notify(); }

  async #loadTrack() {
    const selected = this.#fleet().vehicles.find((vehicle) => vehicle.id === this.#selectedId);
    const request = ++this.#detailRequest;
    if (this.#example || !selected?.plan) { this.#track = null; this.#notify(); return; }
    const id = this.#selectedId, planId = selected.plan.id;
    try {
      const track = await this.#api.get(`/api/waste/plans/${planId}/track`);
      if (this.#disposed || request !== this.#detailRequest || id !== this.#selectedId || this.#example) return;
      this.#track = track; this.#error = ""; this.#notify();
    } catch (error) { if (!this.#disposed && request === this.#detailRequest) { this.#error = error.message; this.#notify(); } }
  }

  snapshot() {
    const fleet = this.#fleet();
    const selected = fleet.vehicles.find((v) => v.id === this.#selectedId) || null;
    const mapVehicles = fleet.vehicles.filter((v) => v.position).map((v) => ({
      id: v.id, vehicleCode: v.vehicleCode, routeName: v.route?.routeName || "ไม่มีงานที่กำลังปฏิบัติ", driverName: v.plan?.driverName,
      latitude: v.position.latitude, longitude: v.position.longitude, status: v.status, gpsLabel: v.gpsLabel,
    }));
    return { ...fleet, selected, selectedId: this.#selectedId, example: this.#example, loading: this.#loading,
      refreshing: this.#refreshing, error: this.#error, updatedAt: this.#updatedAt, mapVehicles, track: this.#track,
      motionPaused: this.#motionPaused, speedKph: this.#speedKph,
      routeGeojson: selected?.plan ? this.#track?.routeGeojson || selected?.route?.routeGeojson || null : null,
      stops: this.#track?.stops || [], history: this.#track?.locations || [],
      historySegments: this.#historyPolicy.createContinuousSegments(this.#track?.locations || []) };
  }
  #notify() { if (this.#disposed) return; const state = this.snapshot(); for (const listener of this.#listeners) listener(state); }
  dispose() { this.#disposed = true; ++this.#request; ++this.#detailRequest; this.#listeners.clear(); }
}
