import { ClearLineConversationUseCase } from "../application/line/ClearLineConversationUseCase.js";
import { MariaDbLineConversationRepository } from "../infrastructure/line/MariaDbLineConversationRepository.js";
import { SmartThaPhoLineMenu } from "../modules/line/SmartThaPhoLineMenu.js";
import { database } from "../core/db.js";

export const smartThaPhoLineMenu = new SmartThaPhoLineMenu({
  clearLineConversationUseCase: new ClearLineConversationUseCase({
    lineConversationRepository: new MariaDbLineConversationRepository({ database }),
  }),
});
