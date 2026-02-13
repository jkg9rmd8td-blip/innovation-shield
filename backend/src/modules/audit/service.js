import { pool } from "../../db/pool.js";

export async function listAuditLogs({ limit = 100 } = {}) {
  const sql = `
    SELECT id, user_id AS "userId", user_name AS "userName", user_role AS "userRole", action, operation,
           entity_id AS "entityId", before_state AS "beforeState", after_state AS "afterState", created_at AS "createdAt"
    FROM v2.audit_logs
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const { rows } = await pool.query(sql, [Math.min(Number(limit) || 100, 500)]);
  return rows;
}

export async function pushAuditLog(entry) {
  const sql = `
    INSERT INTO v2.audit_logs (user_id, user_name, user_role, action, operation, entity_id, before_state, after_state)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id, created_at AS "createdAt"
  `;

  const params = [
    entry.userId || null,
    entry.userName || null,
    entry.userRole || null,
    entry.action,
    entry.operation,
    entry.entityId || null,
    entry.beforeState ? JSON.stringify(entry.beforeState) : null,
    entry.afterState ? JSON.stringify(entry.afterState) : null,
  ];

  const { rows } = await pool.query(sql, params);
  return rows[0];
}
