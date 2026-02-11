import { pool } from "../db/pool.js";

export async function writeAudit({ user, action, operation, entityId, before, after }) {
  await pool.query(
    `INSERT INTO audit_logs (user_id, user_name, user_role, action, operation, entity_id, before_state, after_state)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      user?.id || null,
      user?.name || null,
      user?.role || null,
      action,
      operation,
      entityId || null,
      before ?? null,
      after ?? null,
    ]
  );
}

export async function listAudits(limit = 100) {
  const { rows } = await pool.query(
    `SELECT id, user_id, user_name, user_role, action, operation, entity_id, before_state, after_state, created_at
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}
