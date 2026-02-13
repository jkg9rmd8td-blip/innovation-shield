import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

export async function createPledge(payload, user) {
  const pledgeText = String(payload?.pledgeText || "").trim();
  if (!pledgeText) {
    const err = new Error("PLEDGE_TEXT_REQUIRED");
    err.statusCode = 400;
    err.code = "PLEDGE_TEXT_REQUIRED";
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO v2.governance_pledges (user_id, user_name, user_role, pledge_text)
     VALUES ($1,$2,$3,$4)
     RETURNING id, user_id AS "userId", user_name AS "userName", user_role AS "userRole", pledge_text AS "pledgeText", created_at AS "createdAt"`,
    [user?.id || payload?.userId || null, user?.name || payload?.userName || null, user?.role || payload?.userRole || null, pledgeText]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "GOVERNANCE_PLEDGE",
    operation: "create",
    entityId: rows[0].id,
    afterState: rows[0],
  });

  return rows[0];
}
