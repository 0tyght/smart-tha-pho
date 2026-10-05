import { Router } from "express";

export class HealthHttpModule {
  constructor({ healthStatusService }) {
    if (!healthStatusService) {
      throw new TypeError("HealthHttpModule requires healthStatusService");
    }

    this.healthStatusService = healthStatusService;
    this.router = this.createRouter();
  }

  createRouter() {
    const router = Router();

    router.get("/live", (_req, res) => {
      res.json(this.healthStatusService.liveness());
    });

    router.get("/ready", async (_req, res) => {
      const result = await this.healthStatusService.readiness();
      res.status(result.httpStatus).json(result.body);
    });

    router.get("/", async (_req, res) => {
      res.json(await this.healthStatusService.health());
    });

    return router;
  }

  getRouter() {
    return this.router;
  }
}
