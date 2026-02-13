import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { listTrainingCatalog, upsertTrainingCourse, listTrainingProgress, markTrainingProgress } from "../../modules/training/service.js";

const router = Router();

router.get(
  "/catalog",
  asyncHandler(async (_req, res) => {
    const rows = await listTrainingCatalog();
    return ok(res, rows, { count: rows.length });
  })
);

router.post(
  "/catalog",
  asyncHandler(async (req, res) => {
    const row = await upsertTrainingCourse(req.body || {}, req.user);
    return created(res, row);
  })
);

router.get(
  "/progress",
  asyncHandler(async (req, res) => {
    const rows = await listTrainingProgress(req.query.userId || null);
    return ok(res, rows, { count: rows.length });
  })
);

router.post(
  "/progress",
  asyncHandler(async (req, res) => {
    const row = await markTrainingProgress(req.body || {}, req.user);
    return created(res, row);
  })
);

export default router;
