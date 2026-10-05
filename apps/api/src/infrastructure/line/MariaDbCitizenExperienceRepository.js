export class MariaDbCitizenExperienceRepository {
  constructor({ database }) {
    if (!database) {
      throw new TypeError("MariaDbCitizenExperienceRepository requires database");
    }
    this.database = database;
  }

  async findOwnerByLineUserId(lineUserId) {
    const [rows] = await this.database.execute(
      `SELECT
         o.id,
         o.full_name AS fullName,
         o.phone,
         h.id AS householdId,
         h.house_no AS houseNo,
         h.address_detail AS addressDetail,
         CAST(h.latitude AS DECIMAL(10, 7)) AS latitude,
         CAST(h.longitude AS DECIMAL(10, 7)) AS longitude,
         v.id AS villageId,
         v.village_no AS villageNo,
         v.name_th AS villageName
       FROM owners o
       INNER JOIN households h
         ON h.id = o.household_id
        AND h.deleted_at IS NULL
       INNER JOIN villages v
         ON v.id = h.village_id
       WHERE o.line_user_id = ?
         AND o.deleted_at IS NULL
       LIMIT 1`,
      [lineUserId],
    );

    return rows[0] || null;
  }

  async loadPetStats(ownerId) {
    const [rows] = await this.database.execute(
      `SELECT
         COUNT(*) AS pets,
         SUM(CASE WHEN p.status = 'MISSING' THEN 1 ELSE 0 END) AS missingPets,
         SUM(
           CASE
             WHEN p.status = 'ACTIVE'
              AND NOT EXISTS (
                SELECT 1 FROM sterilization_records sr WHERE sr.pet_id = p.id
              )
             THEN 1 ELSE 0
           END
         ) AS unsterilized,
         SUM(
           CASE
             WHEN p.status = 'ACTIVE'
              AND (
                NOT EXISTS (
                  SELECT 1 FROM vaccination_records vr0 WHERE vr0.pet_id = p.id
                )
                OR COALESCE(
                  (
                    SELECT vr.next_due_at
                    FROM vaccination_records vr
                    WHERE vr.pet_id = p.id
                    ORDER BY vr.vaccinated_at DESC
                    LIMIT 1
                  ),
                  DATE_ADD(
                    (
                      SELECT MAX(vr2.vaccinated_at)
                      FROM vaccination_records vr2
                      WHERE vr2.pet_id = p.id
                    ),
                    INTERVAL 1 YEAR
                  )
                ) <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
              )
             THEN 1 ELSE 0
           END
         ) AS vaccinationDue
       FROM pets p
       WHERE p.owner_id = ? AND p.deleted_at IS NULL`,
      [ownerId],
    );

    return rows[0] || {};
  }

  async loadRequestStats(ownerId) {
    const [rows] = await this.database.execute(
      `SELECT
         SUM(CASE WHEN request_status = 'NEED_MORE_INFO' THEN 1 ELSE 0 END) AS needsAttention,
         SUM(CASE WHEN request_status IN ('SUBMITTED', 'UNDER_REVIEW') THEN 1 ELSE 0 END) AS pending
       FROM (
         SELECT status AS request_status FROM registrations WHERE owner_id = ?
         UNION ALL
         SELECT status AS request_status FROM citizen_submissions WHERE owner_id = ?
       ) requests`,
      [ownerId, ownerId],
    );

    return rows[0] || {};
  }
}
