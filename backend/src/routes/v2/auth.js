import { Router } from "express";
import { authRequired } from "../../middleware/auth.js";
import { ok } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { buildDemoSession } from "../../modules/auth/service.js";

const router = Router();

router.post(
  "/session",
  asyncHandler(async (req, res) => {
    const session = buildDemoSession(req.body || {});
    return ok(res, session, { mode: "demo" });
  })
);

router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    return ok(res, req.user);
  })
);

export default router;
