import { Router } from "express";

export class PublicReferenceHttpModule {
  constructor({ listActiveVillagesUseCase }) {
    if (!listActiveVillagesUseCase) {
      throw new TypeError("PublicReferenceHttpModule requires listActiveVillagesUseCase");
    }
    this.listActiveVillagesUseCase = listActiveVillagesUseCase;
    this.router = this.createRouter();
  }

  createRouter() {
    const router = Router();
    router.get("/villages", async (_req, res, next) => {
      try {
        return res.json({ data: await this.listActiveVillagesUseCase.execute() });
      } catch (error) {
        return next(error);
      }
    });
    return router;
  }

  getRouter() {
    return this.router;
  }
}
