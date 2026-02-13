import { Router } from "express";
import { ok } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { listAuditLogs } from "../../modules/audit/service.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await listAuditLogs({ limit: req.query.limit || 100 });
    return ok(res, rows, { count: rows.length });
  })
);

export default router;
