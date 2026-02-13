import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

export async function listIntegrations() {
  const { rows } = await pool.query(
    `SELECT id, key, name, status, config, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM v2.integrations
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function upsertIntegration(payload, user) {
  const key = String(payload?.key || "").trim();
  const name = String(payload?.name || "").trim();
  if (!key || !name) {
    const err = new Error("KEY_AND_NAME_REQUIRED");
    err.statusCode = 400;
    err.code = "KEY_AND_NAME_REQUIRED";
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO v2.integrations (key, name, status, config)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (key)
     DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, config = EXCLUDED.config, updated_at = now()
     RETURNING id, key, name, status, config, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [key, name, payload?.status || "inactive", payload?.config || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "INTEGRATION_UPSERT",
    operation: "upsert",
    entityId: rows[0].id,
    afterState: rows[0],
  });

  return rows[0];
}

export async function createSyncJob(integrationId, payload, user) {
  const status = payload?.status || "queued";
  const { rows } = await pool.query(
    `INSERT INTO v2.integration_sync_jobs (integration_id, status, result)
     VALUES ($1,$2,$3)
     RETURNING id, integration_id AS "integrationId", status, started_at AS "startedAt", ended_at AS "endedAt", result`,
    [integrationId, status, payload?.result || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "INTEGRATION_SYNC_CREATE",
    operation: "sync",
    entityId: rows[0].id,
    afterState: rows[0],
  });

  return rows[0];
}
