import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.js";
import { PERMISSIONS } from "../core/constants.js";
import { listAudits } from "../services/auditService.js";

const router = Router();

router.get("/", authRequired, requirePermission(PERMISSIONS.AUDIT_READ), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const rows = await listAudits(limit);
    res.json({ logs: rows });
  } catch (e) {
    next(e);
  }
});

export default router;
