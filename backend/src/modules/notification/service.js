import { pool } from "../../db/pool.js";

export async function listNotifications(userId = null) {
  const params = [];
  let where = "";
  if (userId) {
    params.push(userId);
    where = "WHERE user_id = $1";
  }

  const { rows } = await pool.query(
    `SELECT id, user_id AS "userId", channel, title, body, is_read AS "isRead", created_at AS "createdAt"
     FROM v2.notifications
     ${where}
     ORDER BY created_at DESC`,
    params
  );
  return rows;
}

export async function createNotification(payload) {
  const title = String(payload?.title || "").trim();
  const body = String(payload?.body || "").trim();
  if (!title || !body) {
    const err = new Error("TITLE_AND_BODY_REQUIRED");
    err.statusCode = 400;
    err.code = "TITLE_AND_BODY_REQUIRED";
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO v2.notifications (user_id, channel, title, body, is_read)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, user_id AS "userId", channel, title, body, is_read AS "isRead", created_at AS "createdAt"`,
    [payload?.userId || null, payload?.channel || "in_app", title, body, false]
  );
  return rows[0];
}

export async function markNotificationRead(id) {
  const { rows } = await pool.query(
    `UPDATE v2.notifications
     SET is_read = TRUE
     WHERE id = $1
     RETURNING id, user_id AS "userId", channel, title, body, is_read AS "isRead", created_at AS "createdAt"`,
    [id]
  );
  return rows[0] || null;
}
