import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

function boardFromProgress(progress = 0) {
  const p = Number(progress) || 0;
  if (p < 25) return { todo: 6, doing: 2, review: 0, done: 1 };
  if (p < 50) return { todo: 4, doing: 4, review: 2, done: 2 };
  if (p < 75) return { todo: 2, doing: 3, review: 3, done: 5 };
  return { todo: 1, doing: 1, review: 2, done: 8 };
}

export async function getWorkspace(initiativeId) {
  const { rows: initiativeRows } = await pool.query(
    `SELECT id, title, stage, status, COALESCE(average_score, 0) AS "averageScore"
     FROM v2.initiatives
     WHERE id = $1`,
    [initiativeId]
  );

  if (!initiativeRows.length) {
    const err = new Error("INITIATIVE_NOT_FOUND");
    err.statusCode = 404;
    err.code = "INITIATIVE_NOT_FOUND";
    throw err;
  }

  const initiative = initiativeRows[0];

  const [changes, notes, files, recs, prototype] = await Promise.all([
    pool.query(
      `SELECT id, title, description, actor_name AS "actorName", created_at AS "createdAt"
       FROM v2.workspace_change_logs
       WHERE initiative_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [initiativeId]
    ),
    pool.query(
      `SELECT id, evaluator_name AS "evaluatorName", note, score_hint AS "scoreHint", created_at AS "createdAt"
       FROM v2.workspace_evaluator_notes
       WHERE initiative_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [initiativeId]
    ),
    pool.query(
      `SELECT id, file_name AS "fileName", file_type AS "fileType", file_size_kb AS "fileSizeKb", created_at AS "createdAt"
       FROM v2.workspace_files
       WHERE initiative_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [initiativeId]
    ),
    pool.query(
      `SELECT id, recommendation, confidence, source, created_at AS "createdAt"
       FROM v2.workspace_ai_recommendations
       WHERE initiative_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [initiativeId]
    ),
    pool.query(
      `SELECT progress
       FROM v2.prototypes
       WHERE initiative_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [initiativeId]
    ),
  ]);

  const progress = prototype.rows[0]?.progress || 0;
  const board = boardFromProgress(progress);

  return {
    initiative,
    changeLog: changes.rows,
    evaluatorNotes: notes.rows,
    aiRecommendations: recs.rows,
    prototypeFiles: files.rows,
    progressBoard: {
      progress,
      columns: board,
    },
  };
}

export async function addWorkspaceChange(initiativeId, payload, user) {
  const title = String(payload?.title || "").trim();
  if (!title) {
    const err = new Error("TITLE_REQUIRED");
    err.statusCode = 400;
    err.code = "TITLE_REQUIRED";
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO v2.workspace_change_logs (initiative_id, title, description, actor_id, actor_name)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, title, description, actor_name AS "actorName", created_at AS "createdAt"`,
    [initiativeId, title, payload?.description || null, user?.id || payload?.actorId || null, user?.name || payload?.actorName || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "WORKSPACE_CHANGE_ADD",
    operation: "create",
    entityId: initiativeId,
    afterState: rows[0],
  });

  return rows[0];
}

export async function addEvaluatorNote(initiativeId, payload, user) {
  const note = String(payload?.note || "").trim();
  if (!note) {
    const err = new Error("NOTE_REQUIRED");
    err.statusCode = 400;
    err.code = "NOTE_REQUIRED";
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO v2.workspace_evaluator_notes (initiative_id, evaluator_id, evaluator_name, note, score_hint)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, evaluator_name AS "evaluatorName", note, score_hint AS "scoreHint", created_at AS "createdAt"`,
    [initiativeId, user?.id || payload?.evaluatorId || null, user?.name || payload?.evaluatorName || null, note, payload?.scoreHint || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "WORKSPACE_EVALUATOR_NOTE",
    operation: "create",
    entityId: initiativeId,
    afterState: rows[0],
  });

  return rows[0];
}

export async function addRecommendation(initiativeId, payload, user) {
  const recommendation = String(payload?.recommendation || "").trim();
  if (!recommendation) {
    const err = new Error("RECOMMENDATION_REQUIRED");
    err.statusCode = 400;
    err.code = "RECOMMENDATION_REQUIRED";
    throw err;
  }

  const confidence = Number(payload?.confidence ?? 0.75);

  const { rows } = await pool.query(
    `INSERT INTO v2.workspace_ai_recommendations (initiative_id, recommendation, confidence, source)
     VALUES ($1,$2,$3,$4)
     RETURNING id, recommendation, confidence, source, created_at AS "createdAt"`,
    [initiativeId, recommendation, confidence, payload?.source || "recommendation-engine-v1"]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "WORKSPACE_AI_RECOMMENDATION",
    operation: "create",
    entityId: initiativeId,
    afterState: rows[0],
  });

  return rows[0];
}

export async function addWorkspaceFile(initiativeId, payload, user) {
  const fileName = String(payload?.fileName || "").trim();
  if (!fileName) {
    const err = new Error("FILE_NAME_REQUIRED");
    err.statusCode = 400;
    err.code = "FILE_NAME_REQUIRED";
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO v2.workspace_files (initiative_id, file_name, file_type, file_size_kb, object_key, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, file_name AS "fileName", file_type AS "fileType", file_size_kb AS "fileSizeKb", object_key AS "objectKey", created_at AS "createdAt"`,
    [initiativeId, fileName, payload?.fileType || "document", payload?.fileSizeKb || null, payload?.objectKey || null, user?.id || payload?.uploadedBy || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "WORKSPACE_FILE_ADD",
    operation: "create",
    entityId: initiativeId,
    afterState: rows[0],
  });

  return rows[0];
}
