import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { listIntegrations, upsertIntegration, createSyncJob } from "../../modules/integration/service.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await listIntegrations();
    return ok(res, rows, { count: rows.length });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const row = await upsertIntegration(req.body || {}, req.user);
    return created(res, row);
  })
);

router.post(
  "/:id/sync",
  asyncHandler(async (req, res) => {
    const row = await createSyncJob(req.params.id, req.body || {}, req.user);
    return created(res, row);
  })
);

export default router;
