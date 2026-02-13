import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

export async function listServiceRequests() {
  const { rows } = await pool.query(
    `SELECT id,
            requester_id AS "requesterId",
            initiative_id AS "initiativeId",
            service_type AS "serviceType",
            status,
            details,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM v2.service_requests
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function createServiceRequest(payload, user) {
  const serviceType = String(payload?.serviceType || "").trim();
  if (!serviceType) {
    const err = new Error("SERVICE_TYPE_REQUIRED");
    err.statusCode = 400;
    err.code = "SERVICE_TYPE_REQUIRED";
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO v2.service_requests (requester_id, initiative_id, service_type, status, details)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, requester_id AS "requesterId", initiative_id AS "initiativeId", service_type AS "serviceType", status, details, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [user?.id || payload?.requesterId || null, payload?.initiativeId || null, serviceType, payload?.status || "open", payload?.details || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "SERVICE_REQUEST_CREATE",
    operation: "create",
    entityId: rows[0].id,
    afterState: rows[0],
  });

  return rows[0];
}
