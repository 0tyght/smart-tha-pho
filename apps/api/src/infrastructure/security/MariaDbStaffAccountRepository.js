export class MariaDbStaffAccountRepository {
  constructor({ database }) {
    if (!database) throw new TypeError("MariaDbStaffAccountRepository requires database");
    this.database = database;
  }

  async findActiveById(id) {
    const [rows] = await this.database.execute(
      `SELECT id,
              full_name AS fullName,
              email,
              role,
              scope_village_id AS villageId
       FROM users
       WHERE id = ? AND is_active = 1
       LIMIT 1`,
      [id],
    );

    const account = rows[0];
    if (!account) return null;

    return Object.freeze({
      id: account.id,
      fullName: account.fullName,
      email: account.email,
      role: account.role,
      villageId: account.villageId || null,
    });
  }
}
