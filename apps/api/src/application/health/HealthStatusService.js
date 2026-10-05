export class HealthStatusService {
  constructor({ healthRepository, organizationName, clock = () => new Date(), uptime }) {
    if (!healthRepository) throw new TypeError("HealthStatusService requires healthRepository");
    if (!uptime) throw new TypeError("HealthStatusService requires uptime provider");

    this.healthRepository = healthRepository;
    this.organizationName = organizationName;
    this.clock = clock;
    this.uptime = uptime;
  }

  liveness() {
    return {
      status: "alive",
      uptimeSeconds: Math.floor(this.uptime()),
      timestamp: this.clock().toISOString(),
    };
  }

  async readiness() {
    try {
      const state = await this.healthRepository.readinessState();
      const ready =
        state.presentTables === state.requiredTables &&
        state.secureAttachments &&
        state.tokenizedNationalId;

      return {
        httpStatus: ready ? 200 : 503,
        body: {
          status: ready ? "ready" : "not_ready",
          ...state,
          timestamp: this.clock().toISOString(),
        },
      };
    } catch {
      return {
        httpStatus: 503,
        body: {
          status: "not_ready",
          database: "unavailable",
          timestamp: this.clock().toISOString(),
        },
      };
    }
  }

  async health() {
    const database = await this.healthRepository.isAvailable()
      ? "ready"
      : "unavailable";

    return {
      service: "Smart Tha Pho API",
      version: "1.0.0",
      organization: this.organizationName,
      status: "ok",
      database,
      timestamp: this.clock().toISOString(),
    };
  }
}
