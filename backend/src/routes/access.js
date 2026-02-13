import { Router } from "express";
import { listRoleMatrix } from "../core/permissions.js";
import { authRequired } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.js";
import { PERMISSIONS } from "../core/constants.js";

const router = Router();

router.get("/role-matrix", authRequired, requirePermission(PERMISSIONS.PAGE_ADMIN_ACCESS_VIEW), (_req, res) => {
  res.json({ matrix: listRoleMatrix() });
});

export default router;
