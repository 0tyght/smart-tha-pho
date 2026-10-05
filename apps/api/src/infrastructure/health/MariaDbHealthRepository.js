const REQUIRED_TABLES = 8;

export class MariaDbHealthRepository {
  constructor({ database }) {
    if (!database) throw new TypeError("MariaDbHealthRepository requires database");
    this.database = database;
  }

  async readinessState() {
    const [rows] = await this.database.query(
      `SELECT
         (SELECT COUNT(*) FROM information_schema.tables
          WHERE table_schema = DATABASE()
            AND table_name IN ('users','owners','pets','registrations','citizen_submissions','notifications','audit_logs','idempotency_keys')) AS present,
         EXISTS(SELECT 1 FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = 'attachments' AND column_name = 'checksum_sha256') AS secureAttachments,
         (EXISTS(SELECT 1 FROM information_schema.columns
                 WHERE table_schema = DATABASE() AND table_name = 'owners' AND column_name = 'national_id_hash')
          AND NOT EXISTS(SELECT 1 FROM information_schema.columns
                         WHERE table_schema = DATABASE() AND table_name = 'owners' AND column_name = 'national_id')) AS tokenizedNationalId`,
    );

    return Object.freeze({
      requiredTables: REQUIRED_TABLES,
      presentTables: Number(rows[0]?.present || 0),
      secureAttachments: Boolean(Number(rows[0]?.secureAttachments || 0)),
      tokenizedNationalId: Boolean(Number(rows[0]?.tokenizedNationalId || 0)),
    });
  }

  async isAvailable() {
    try {
      await this.database.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }
}
