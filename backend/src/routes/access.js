import { Router } from "express";
import { listRoleMatrix } from "../core/permissions.js";

const router = Router();

router.get("/role-matrix", (_req, res) => {
  res.json({ matrix: listRoleMatrix() });
});

export default router;
