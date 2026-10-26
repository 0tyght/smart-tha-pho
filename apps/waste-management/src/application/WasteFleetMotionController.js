/** Coordinates independent vehicle playbacks; selection never restarts a route. */
export class WasteFleetMotionController {
  #createPlayback; #scheduler; #renderer; #entries = new Map();
  #frame = null; #lastTime = null; #enabled = false; #example = false; #speed = 20;
  constructor({ createPlayback, scheduler, renderer }) { this.#createPlayback = createPlayback; this.#scheduler = scheduler; this.#renderer = renderer; }

  configure({ vehicles = [], example = false, selectedId = "", speedKph = 20 }) {
    if (!Number.isFinite(Number(speedKph)) || speedKph < 1 || speedKph > 80) throw new RangeError("Invalid fleet speed");
    if (example !== this.#example) { this.#cancel(); this.#entries.clear(); this.#renderer.clear(); }
    this.#example = example; this.#speed = Number(speedKph);
    const next = new Map();
    vehicles.forEach((vehicle, index) => {
      if (!vehicle.position) return;
      const identity = JSON.stringify([example, vehicle.plan?.id, vehicle.route?.routeGeojson || null]);
      let entry = this.#entries.get(vehicle.id);
      if (!entry || entry.identity !== identity) {
        const playback = example && vehicle.plan && vehicle.route ? this.#createPlayback({ geometry: vehicle.route.routeGeojson, speedKph: this.#speed, loop: true }) : null;
        if (playback?.snapshot().hasRoute) {
          // Give each vehicle an independent position within its own route.
          playback.step(playback.snapshot().totalDistanceMeters * ((index + 1) * 0.137 % 0.68));
        }
        entry = { identity, playback };
      }
      entry.vehicle = vehicle; entry.selected = vehicle.id === selectedId;
      entry.moving = example && vehicle.plan?.status === "IN_PROGRESS" && entry.playback?.snapshot().hasRoute;
      if (entry.playback) {
        entry.playback.setSpeed(this.#speed);
        if (entry.moving && entry.playback.snapshot().status !== "completed") entry.playback.play();
        else entry.playback.pause();
      }
      next.set(vehicle.id, entry);
    });
    this.#entries = next; this.#render(); this.#schedule();
  }

  setEnabled(enabled) {
    this.#enabled = Boolean(enabled);
    if (!enabled) this.#cancel(); else this.#schedule();
  }
  step() {
    for (const entry of this.#entries.values()) if (entry.moving && entry.playback.snapshot().status !== "completed") { entry.playback.step(50); if (entry.playback.snapshot().status !== "completed") entry.playback.play(); }
    this.#render();
  }
  positions() {
    return [...this.#entries.values()].map((entry) => ({ ...entry.vehicle, selected: entry.selected,
      position: entry.playback?.snapshot().position || entry.vehicle.position }));
  }
  #render() { this.#renderer.render(this.positions()); }
  #schedule() {
    if (!this.#enabled || !this.#example || this.#frame != null || ![...this.#entries.values()].some((e) => e.moving && e.playback.snapshot().status === "playing")) return;
    this.#frame = this.#scheduler.request(this.#tick);
  }
  #tick = (time) => {
    this.#frame = null;
    if (!this.#enabled || !this.#example) return;
    const elapsed = this.#lastTime == null ? 0 : Math.max(0, Math.min(250, time - this.#lastTime));
    this.#lastTime = time;
    for (const entry of this.#entries.values()) if (entry.moving) entry.playback.advance(elapsed);
    this.#render(); this.#schedule();
  };
  #cancel() { if (this.#frame != null) this.#scheduler.cancel(this.#frame); this.#frame = null; this.#lastTime = null; }
  dispose() { this.#enabled = false; this.#cancel(); this.#entries.clear(); this.#renderer.clear(); }
}
