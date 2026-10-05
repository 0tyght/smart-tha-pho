export class MariaDbLineConversationRepository {
  constructor({ database }) {
    if (!database) {
      throw new TypeError("MariaDbLineConversationRepository requires database");
    }
    this.database = database;
  }

  async clearPendingFlows(lineUserId) {
    await Promise.all([
      this.database.execute(
        "DELETE FROM line_conversation_sessions WHERE line_user_id = ?",
        [lineUserId],
      ),
      this.database.execute(
        "DELETE FROM waste_line_sessions WHERE line_user_id = ?",
        [lineUserId],
      ),
    ]);
  }
}
