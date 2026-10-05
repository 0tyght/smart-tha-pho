import { createApp as createExpressApplication } from "../app.js";
import { LineBotAdapter } from "../infrastructure/line/LineBotAdapter.js";
import { LineNotificationAdapter } from "../infrastructure/line/LineNotificationAdapter.js";
import { NativeCitizenAdapter } from "../infrastructure/line/NativeCitizenAdapter.js";
import { ReportExportAdapter } from "../infrastructure/reports/ReportExportAdapter.js";
import { MfaAdapter } from "../infrastructure/security/MfaAdapter.js";
import { CitizenSubmissionApprovalService } from "../application/submissions/CitizenSubmissionApprovalService.js";
import { database } from "../core/db.js";
import { config } from "../core/config.js";
import { createWasteManagementServices } from "./createWasteManagementServices.js";
import { WasteHttpModule } from "../modules/waste/waste.router.js";
import { HealthStatusService } from "../application/health/HealthStatusService.js";
import { MariaDbHealthRepository } from "../infrastructure/health/MariaDbHealthRepository.js";
import { HealthHttpModule } from "../presentation/http/HealthHttpModule.js";
import { ORGANIZATION } from "@smart-thapho/shared";
import { ListActiveVillagesUseCase } from "../application/reference/ListActiveVillagesUseCase.js";
import { MariaDbVillageRepository } from "../infrastructure/reference/MariaDbVillageRepository.js";
import { PublicReferenceHttpModule } from "../presentation/http/PublicReferenceHttpModule.js";

export function createHttpApplicationServices() {
  const nativeCitizen =
    new NativeCitizenAdapter();

  const wasteManagement =
    createWasteManagementServices({
      database,
      config,
    });

  const wasteHttpModule =
    new WasteHttpModule({
      services:
        wasteManagement,
    });

  const healthHttpModule =
    new HealthHttpModule({
      healthStatusService:
        new HealthStatusService({
          healthRepository:
            new MariaDbHealthRepository({
              database,
            }),
          organizationName:
            ORGANIZATION.shortName,
          uptime:
            () => process.uptime(),
        }),
    });

  const publicReferenceHttpModule =
    new PublicReferenceHttpModule({
      listActiveVillagesUseCase:
        new ListActiveVillagesUseCase({
          villageRepository:
            new MariaDbVillageRepository({ database }),
        }),
    });

  return Object.freeze({
    lineNotifications:
      new LineNotificationAdapter(),

    nativeCitizen,

    citizenSubmissionApproval:
      new CitizenSubmissionApprovalService({
        nativeCitizenService:
          nativeCitizen,
      }),

    lineBot:
      new LineBotAdapter(),

    reportExports:
      new ReportExportAdapter(),

    mfa:
      new MfaAdapter(),

    wasteManagement,
    wasteHttpModule,
    healthHttpModule,
    publicReferenceHttpModule,
  });
}

export function createApp(
  options = {},
) {
  return createExpressApplication({
    ...options,

    services:
      options.services ||
      createHttpApplicationServices(),
  });
}
