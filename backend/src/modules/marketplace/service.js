import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

export async function listMarketplaceOffers() {
  const { rows } = await pool.query(
    `SELECT id,
            initiative_id AS "initiativeId",
            title,
            status,
            details,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM v2.marketplace_offers
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function createMarketplaceOffer(payload, user) {
  const title = String(payload?.title || "").trim();
  if (!title) {
    const err = new Error("TITLE_REQUIRED");
    err.statusCode = 400;
    err.code = "TITLE_REQUIRED";
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO v2.marketplace_offers (initiative_id, title, status, details)
     VALUES ($1,$2,$3,$4)
     RETURNING id, initiative_id AS "initiativeId", title, status, details, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [payload?.initiativeId || null, title, payload?.status || "draft", payload?.details || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "MARKETPLACE_OFFER_CREATE",
    operation: "create",
    entityId: rows[0].id,
    afterState: rows[0],
  });

  return rows[0];
}
