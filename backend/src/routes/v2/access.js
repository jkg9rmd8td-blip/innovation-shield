import { Router } from "express";
import { ok } from "../../platform/http/response.js";
import { getRoleMatrixV2 } from "../../modules/access/service.js";

const router = Router();

router.get("/role-matrix", (_req, res) => {
  return ok(res, getRoleMatrixV2());
});

export default router;
