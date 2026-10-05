export class ClearLineConversationUseCase {
  constructor({ lineConversationRepository }) {
    if (!lineConversationRepository) {
      throw new TypeError("ClearLineConversationUseCase requires lineConversationRepository");
    }
    this.lineConversationRepository = lineConversationRepository;
  }

  async execute({ lineUserId }) {
    const normalizedLineUserId = String(lineUserId || "").trim();
    if (!normalizedLineUserId) return { cleared: false };

    await this.lineConversationRepository.clearPendingFlows(normalizedLineUserId);
    return { cleared: true };
  }
}
