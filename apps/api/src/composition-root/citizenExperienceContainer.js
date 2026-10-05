import { CitizenExperienceService } from "../application/line/CitizenExperienceService.js";
import { MariaDbCitizenExperienceRepository } from "../infrastructure/line/MariaDbCitizenExperienceRepository.js";
import { database } from "../core/db.js";

export const citizenExperienceService = new CitizenExperienceService({
  citizenExperienceRepository: new MariaDbCitizenExperienceRepository({ database }),
});
