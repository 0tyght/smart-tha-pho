import { WaterTreatmentSystem } from "../domain/WaterMonitoringPoint.js";

export class WaterworksDashboardController {
  constructor({ telemetryRepository, systemController }) {
    if (!telemetryRepository || !systemController) throw new TypeError("Dashboard dependencies are required");
    this.telemetryRepository = telemetryRepository;
    this.systemController = systemController;
  }

  getSession() {
    return this.systemController.getSession();
  }

  redirectToLogin() {
    this.systemController.redirectToLogin();
  }

  switchSystem() {
    this.systemController.switchSystem();
  }

  logout() {
    this.systemController.logout();
  }

  subscribeToExpiration(callback) {
    return this.systemController.subscribeToExpiration(callback);
  }

  async loadDashboard() {
    const snapshot = await this.telemetryRepository.getLatestSnapshot();
    return new WaterTreatmentSystem(snapshot).toViewModel();
  }
}
