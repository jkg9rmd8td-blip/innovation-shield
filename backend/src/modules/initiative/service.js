import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

const LIST_SQL = `
  SELECT i.id,
         i.title,
         i.owner_id AS "ownerId",
         i.owner_name AS "ownerName",
         i.stage,
         i.status,
         i.average_score AS "averageScore",
         i.judging_locked AS "judgingLocked",
         i.created_at AS "createdAt",
         i.updated_at AS "updatedAt",
         COALESCE(jsonb_agg(s.*) FILTER (WHERE s.id IS NOT NULL), '[]'::jsonb) AS "stageHistory"
  FROM v2.initiatives i
  LEFT JOIN v2.initiative_stage_events s ON s.initiative_id = i.id
  GROUP BY i.id
  ORDER BY i.created_at DESC
`;

export async function listInitiatives() {
  const { rows } = await pool.query(LIST_SQL);
  return rows;
}

export async function createInitiative(payload, user) {
  const title = String(payload?.title || "").trim();
  if (!title) {
    const err = new Error("TITLE_REQUIRED");
    err.statusCode = 400;
    err.code = "TITLE_REQUIRED";
    throw err;
  }

  const ownerId = payload?.ownerId || user?.id || "demo-user";
  const ownerName = payload?.ownerName || user?.name || "Demo User";
  const stage = payload?.stage || "idea_submission";
  const status = payload?.status || "draft";

  const insertSql = `
    INSERT INTO v2.initiatives (title, owner_id, owner_name, stage, status)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING id, title, owner_id AS "ownerId", owner_name AS "ownerName", stage, status, average_score AS "averageScore", judging_locked AS "judgingLocked", created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(insertSql, [title, ownerId, ownerName, stage, status]);
  const row = rows[0];

  await pool.query(
    `INSERT INTO v2.initiative_stage_events (initiative_id, stage, stage_label, by_user_id, by_user_name, note)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [row.id, stage, stage, user?.id || null, user?.name || null, "Initiative created"]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "INITIATIVE_CREATE",
    operation: "create",
    entityId: row.id,
    afterState: row,
  });

  return row;
}

export async function patchInitiative(id, patch, user) {
  const { rows: beforeRows } = await pool.query("SELECT * FROM v2.initiatives WHERE id = $1", [id]);
  if (!beforeRows.length) {
    const err = new Error("INITIATIVE_NOT_FOUND");
    err.statusCode = 404;
    err.code = "INITIATIVE_NOT_FOUND";
    throw err;
  }

  const before = beforeRows[0];
  const nextTitle = patch?.title ?? before.title;
  const nextStage = patch?.stage ?? before.stage;
  const nextStatus = patch?.status ?? before.status;
  const nextLocked = patch?.judgingLocked ?? before.judging_locked;

  const sql = `
    UPDATE v2.initiatives
    SET title = $2,
        stage = $3,
        status = $4,
        judging_locked = $5,
        updated_at = now()
    WHERE id = $1
    RETURNING id, title, owner_id AS "ownerId", owner_name AS "ownerName", stage, status, average_score AS "averageScore", judging_locked AS "judgingLocked", created_at AS "createdAt", updated_at AS "updatedAt"
  `;

  const { rows } = await pool.query(sql, [id, nextTitle, nextStage, nextStatus, nextLocked]);
  const updated = rows[0];

  if (nextStage !== before.stage) {
    await pool.query(
      `INSERT INTO v2.initiative_stage_events (initiative_id, stage, stage_label, by_user_id, by_user_name, note)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, nextStage, nextStage, user?.id || null, user?.name || null, "Stage updated"]
    );
  }

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "INITIATIVE_UPDATE",
    operation: "patch",
    entityId: id,
    beforeState: before,
    afterState: updated,
  });

  return updated;
}
