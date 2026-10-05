export class MariaDbVillageRepository {
  constructor({ database }) {
    if (!database) throw new TypeError("MariaDbVillageRepository requires database");
    this.database = database;
  }

  async listActive() {
    const [rows] = await this.database.query(
      `SELECT id, village_no AS villageNo, name_th AS name
       FROM villages
       WHERE is_active = 1
       ORDER BY village_no`,
    );
    return rows;
  }
}
