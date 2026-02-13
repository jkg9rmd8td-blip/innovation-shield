import { Router } from "express";
import { ok } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { getDashboardAnalytics } from "../../modules/analytics/service.js";

const router = Router();

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => ok(res, await getDashboardAnalytics()))
);

export default router;
