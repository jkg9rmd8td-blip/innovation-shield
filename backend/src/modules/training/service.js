import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

export async function listTrainingCatalog() {
  const { rows } = await pool.query(
    `SELECT id, key, title, level, created_at AS "createdAt"
     FROM v2.training_courses
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function upsertTrainingCourse(payload, user) {
  const key = String(payload?.key || "").trim();
  const title = String(payload?.title || "").trim();
  if (!key || !title) {
    const err = new Error("KEY_AND_TITLE_REQUIRED");
    err.statusCode = 400;
    err.code = "KEY_AND_TITLE_REQUIRED";
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO v2.training_courses (key, title, level)
     VALUES ($1,$2,$3)
     ON CONFLICT (key)
     DO UPDATE SET title = EXCLUDED.title, level = EXCLUDED.level
     RETURNING id, key, title, level, created_at AS "createdAt"`,
    [key, title, payload?.level || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "TRAINING_COURSE_UPSERT",
    operation: "upsert",
    entityId: rows[0].id,
    afterState: rows[0],
  });

  return rows[0];
}

export async function listTrainingProgress(userId = null) {
  const params = [];
  let where = "";
  if (userId) {
    params.push(userId);
    where = "WHERE tp.user_id = $1";
  }

  const { rows } = await pool.query(
    `SELECT tp.id,
            tp.user_id AS "userId",
            tp.status,
            tp.completed_at AS "completedAt",
            tc.id AS "courseId",
            tc.key AS "courseKey",
            tc.title AS "courseTitle"
     FROM v2.training_progress tp
     JOIN v2.training_courses tc ON tc.id = tp.course_id
     ${where}
     ORDER BY tp.created_at DESC`,
    params
  );
  return rows;
}

export async function markTrainingProgress(payload, user) {
  const courseId = payload?.courseId;
  if (!courseId) {
    const err = new Error("COURSE_ID_REQUIRED");
    err.statusCode = 400;
    err.code = "COURSE_ID_REQUIRED";
    throw err;
  }

  const userId = payload?.userId || user?.id || "demo-user";
  const status = payload?.status || "completed";

  const { rows } = await pool.query(
    `INSERT INTO v2.training_progress (user_id, course_id, status, completed_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, course_id)
     DO UPDATE SET status = EXCLUDED.status, completed_at = EXCLUDED.completed_at
     RETURNING id, user_id AS "userId", course_id AS "courseId", status, completed_at AS "completedAt"`,
    [userId, courseId, status, status === "completed" ? new Date().toISOString() : null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "TRAINING_PROGRESS_UPDATE",
    operation: "upsert",
    entityId: rows[0].id,
    afterState: rows[0],
  });

  return rows[0];
}
