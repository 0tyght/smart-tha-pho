const HEALTH_LEVELS = Object.freeze({
  normal: Object.freeze({ label: "ปกติ", priority: 0 }),
  watch: Object.freeze({ label: "เฝ้าระวัง", priority: 1 }),
  critical: Object.freeze({ label: "ผิดปกติ", priority: 2 }),
  offline: Object.freeze({ label: "ขาดการเชื่อมต่อ", priority: 3 }),
});

export class WaterMonitoringPoint {
  constructor({ id, sequence, name, shortName, type, description, status = "normal", metrics = [], equipment = [], updatedAt }) {
    if (!id || !name || !type) throw new TypeError("Monitoring point requires id, name and type");
    if (!HEALTH_LEVELS[status]) throw new RangeError(`Unsupported monitoring status: ${status}`);

    this.id = id;
    this.sequence = Number(sequence);
    this.name = name;
    this.shortName = shortName || name;
    this.type = type;
    this.description = description || "";
    this.status = status;
    this.metrics = Object.freeze(metrics.map((metric) => Object.freeze({ ...metric })));
    this.equipment = Object.freeze(equipment.map((item) => Object.freeze({ ...item })));
    this.updatedAt = updatedAt;
    Object.freeze(this);
  }

  get health() {
    return HEALTH_LEVELS[this.status];
  }

  hasAlert() {
    return this.health.priority > 0;
  }

  toViewModel() {
    return Object.freeze({
      id: this.id,
      sequence: this.sequence,
      name: this.name,
      shortName: this.shortName,
      type: this.type,
      description: this.description,
      status: this.status,
      statusLabel: this.health.label,
      metrics: this.metrics,
      equipment: this.equipment,
      updatedAt: this.updatedAt,
    });
  }
}

export class WaterTreatmentSystem {
  constructor({ points = [], updatedAt, dataMode = "simulation" }) {
    this.points = Object.freeze(points.map((point) => point instanceof WaterMonitoringPoint ? point : new WaterMonitoringPoint(point)));
    this.updatedAt = updatedAt;
    this.dataMode = dataMode;
    Object.freeze(this);
  }

  getPoint(pointId) {
    return this.points.find((point) => point.id === pointId) || this.points[0] || null;
  }

  summarize() {
    const findMetric = (pointId, metricId) => this.getPoint(pointId)?.metrics.find((metric) => metric.id === metricId);
    const normalCount = this.points.filter((point) => point.status === "normal").length;
    const alerts = this.points.filter((point) => point.hasAlert());

    return Object.freeze({
      totalPoints: this.points.length,
      normalCount,
      alertCount: alerts.length,
      onlinePercent: Math.round((this.points.filter((point) => point.status !== "offline").length / Math.max(this.points.length, 1)) * 100),
      productionFlow: findMetric("raw-water", "flow"),
      towerLevel: findMetric("water-tower", "level"),
      distributionPressure: findMetric("distribution", "pressure"),
      residualChlorine: findMetric("distribution", "chlorine"),
    });
  }

  toViewModel() {
    return Object.freeze({
      points: Object.freeze(this.points.map((point) => point.toViewModel())),
      updatedAt: this.updatedAt,
      dataMode: this.dataMode,
      summary: this.summarize(),
    });
  }
}

export { HEALTH_LEVELS };
