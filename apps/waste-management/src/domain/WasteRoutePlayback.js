const EARTH_RADIUS_METERS = 6_371_000;
const radians = (degrees) => degrees * Math.PI / 180;

function coordinate(value) {
  if (!Array.isArray(value) || value.length < 2 || value[0] == null || value[1] == null) return null;
  const [longitude, latitude] = value.map(Number);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? { latitude, longitude } : null;
}

function distanceBetween(a, b) {
  const lat = radians(b.latitude - a.latitude);
  const lng = radians(b.longitude - a.longitude);
  const h = Math.sin(lat / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(lng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, h)));
}

function lineParts(value) {
  if (!value || typeof value !== "object") return [];
  if (value.type === "FeatureCollection") return (value.features || []).flatMap(lineParts);
  if (value.type === "Feature") return lineParts(value.geometry);
  if (value.type === "GeometryCollection") return (value.geometries || []).flatMap(lineParts);
  if (value.type === "LineString") return [value.coordinates || []];
  if (value.type === "MultiLineString") return value.coordinates || [];
  return [];
}

/** Local preview state only. Never represents a vehicle GPS observation. */
export class WasteRoutePlayback {
  #segments = [];
  #total = 0;
  #distance = 0;
  #status = "idle";
  #speedKph = 20;
  #loop = false;
  #direction = 1;

  constructor({ geometry, speedKph = 20, loop = false } = {}) {
    this.#loop = Boolean(loop);
    this.setSpeed(speedKph);
    let source = geometry;
    if (typeof source === "string") {
      try { source = JSON.parse(source); } catch { source = null; }
    }
    for (const line of lineParts(source)) {
      let previous = null;
      for (const value of line) {
        const next = coordinate(value);
        if (previous && next) {
          const length = distanceBetween(previous, next);
          if (length > 0) {
            this.#segments.push({ start: previous, end: next, from: this.#total, length });
            this.#total += length;
          }
        }
        // Invalid points and separate lines break continuity; never invent a chord.
        previous = next;
      }
    }
  }

  setSpeed(speedKph) {
    const value = Number(speedKph);
    if (!Number.isFinite(value) || value < 1 || value > 80) throw new RangeError("Invalid simulation speed");
    this.#speedKph = value;
  }

  play() {
    if (!this.#segments.length) return;
    if (this.#status === "completed") this.#distance = 0;
    this.#status = "playing";
  }

  pause() {
    if (this.#status === "playing") this.#status = "paused";
  }

  reset() {
    this.#distance = 0;
    this.#direction = 1;
    this.#status = "idle";
  }

  advance(elapsedMs) {
    if (this.#status !== "playing" || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
    this.#move(this.#speedKph / 3.6 * elapsedMs / 1000);
  }

  step(distanceMeters = 50) {
    if (!this.#segments.length || !Number.isFinite(distanceMeters) || distanceMeters <= 0) return;
    if (this.#status === "completed") this.#distance = 0;
    this.#status = "paused";
    this.#move(distanceMeters);
  }

  #move(distance) {
    if (this.#loop && this.#total > 0) {
      // Traverse back over the same road instead of teleporting to its start.
      const period = this.#total * 2;
      const phase = this.#direction > 0 ? this.#distance : period - this.#distance;
      const next = (phase + distance) % period;
      this.#direction = next < this.#total ? 1 : -1;
      this.#distance = next <= this.#total ? next : period - next;
      return;
    }
    this.#distance = Math.min(this.#total, this.#distance + distance);
    if (this.#distance >= this.#total) this.#status = "completed";
  }

  snapshot() {
    const segment = this.#segments.find((item) => this.#distance <= item.from + item.length)
      || this.#segments.at(-1);
    let position = null;
    if (segment) {
      const fraction = Math.max(0, Math.min(1, (this.#distance - segment.from) / segment.length));
      position = {
        latitude: segment.start.latitude + (segment.end.latitude - segment.start.latitude) * fraction,
        longitude: segment.start.longitude + (segment.end.longitude - segment.start.longitude) * fraction,
        facingWest: this.#direction > 0
          ? segment.end.longitude < segment.start.longitude
          : segment.start.longitude < segment.end.longitude,
      };
    }
    return {
      status: this.#status, hasRoute: Boolean(segment), position,
      looping: this.#loop, direction: this.#direction,
      speedKph: this.#speedKph, distanceMeters: this.#distance, totalDistanceMeters: this.#total,
      progressPercent: this.#total ? this.#distance / this.#total * 100 : 0,
    };
  }
}
