const STATUS_LABELS = Object.freeze({ idle: "พร้อมแสดงการวิ่ง", playing: "กำลังแสดงการวิ่ง", paused: "พักการแสดง", completed: "ถึงปลายทางแล้ว" });

export class WasteRouteSimulationController {
  #createPlayback;
  #scheduler;
  #renderer;
  #playback = null;
  #signature = "";
  #listeners = new Set();
  #frame = null;
  #lastTime = null;
  #lastNotification = 0;
  #active = false;
  #reducedMotion = false;
  #label = "";
  #emptyReason = "เลือกเส้นทางหนึ่งเส้นก่อนแสดงการวิ่ง";
  #speedKph = 20;

  constructor({ createPlayback, scheduler, renderer }) {
    this.#createPlayback = createPlayback;
    this.#scheduler = scheduler;
    this.#renderer = renderer;
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    listener(this.snapshot());
    return () => this.#listeners.delete(listener);
  }

  configureSource({ routeGeojson, routes = [], selectedRouteId = "", routeLabel = "", focusKey = "" }) {
    const route = routes.find((item) => String(item.id) === String(selectedRouteId));
    const geometry = routeGeojson || route?.routeGeojson || null;
    const identity = routeGeojson ? focusKey || "selected-plan" : String(selectedRouteId);
    this.#label = routeGeojson ? routeLabel || "เส้นทางของแผนที่เลือก"
      : route ? [route.routeCode, route.routeName].filter(Boolean).join(" · ") : "";
    this.#emptyReason = routeGeojson || route
      ? "เส้นทางนี้ยังไม่มีแนวถนนสำหรับแสดงการวิ่ง" : "เลือกเส้นทางหนึ่งเส้นก่อนแสดงการวิ่ง";
    const signature = JSON.stringify([identity, geometry]);
    // API polling supplies new object references; unchanged routes must not rewind.
    if (signature === this.#signature) return;
    this.#signature = signature;
    this.#cancel();
    this.#renderer.clear();
    this.#active = false;
    this.#playback = this.#createPlayback({ geometry, speedKph: this.#speedKph });
    this.#notify();
  }

  setReducedMotion(enabled) {
    this.#reducedMotion = Boolean(enabled);
    if (enabled) this.pause();
    this.#notify();
  }

  play() {
    if (!this.#playback?.snapshot().hasRoute) return;
    if (this.#reducedMotion) { this.step(); return; }
    if (this.#playback.snapshot().status === "playing") return;
    this.#active = true;
    this.#playback.play();
    this.#lastTime = null;
    this.#render();
    this.#notify();
    this.#frame = this.#scheduler.request(this.#tick);
  }

  pause() {
    this.#cancel();
    this.#playback?.pause();
    this.#notify();
  }

  reset() {
    this.#cancel();
    this.#playback?.reset();
    this.#render();
    this.#notify();
  }

  stop() {
    this.#cancel();
    this.#active = false;
    this.#playback?.reset();
    this.#renderer.clear();
    this.#notify();
  }

  step() {
    if (!this.#playback?.snapshot().hasRoute) return;
    this.#cancel();
    this.#active = true;
    this.#playback.step(50);
    this.#render();
    this.#notify();
  }

  setSpeed(speedKph) {
    this.#playback?.setSpeed(speedKph);
    this.#speedKph = Number(speedKph);
    this.#notify();
  }

  snapshot() {
    const state = this.#playback?.snapshot() || { hasRoute: false, status: "idle", progressPercent: 0, speedKph: this.#speedKph };
    return { ...state, active: this.#active, reducedMotion: this.#reducedMotion,
      label: this.#label, emptyReason: this.#emptyReason, statusLabel: STATUS_LABELS[state.status] };
  }

  #tick = (time) => {
    this.#frame = null;
    if (this.#playback?.snapshot().status !== "playing") return;
    if (this.#lastTime != null) this.#playback.advance(Math.min(250, Math.max(0, time - this.#lastTime)));
    this.#lastTime = time;
    this.#render();
    const finished = this.#playback.snapshot().status === "completed";
    if (finished || time - this.#lastNotification >= 250) {
      this.#lastNotification = time;
      this.#notify();
    }
    if (!finished) this.#frame = this.#scheduler.request(this.#tick);
  };

  #cancel() {
    if (this.#frame != null) this.#scheduler.cancel(this.#frame);
    this.#frame = null;
    this.#lastTime = null;
  }

  #render() {
    if (this.#active) this.#renderer.render(this.#playback.snapshot());
  }

  #notify() {
    const state = this.snapshot();
    for (const listener of this.#listeners) listener(state);
  }

  dispose() {
    this.stop();
    this.#listeners.clear();
  }
}
