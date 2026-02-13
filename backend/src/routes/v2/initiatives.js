import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { createInitiative, listInitiatives, patchInitiative } from "../../modules/initiative/service.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await listInitiatives();
    return ok(res, rows, { count: rows.length });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const row = await createInitiative(req.body || {}, req.user);
    return created(res, row);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await patchInitiative(req.params.id, req.body || {}, req.user);
    return ok(res, row);
  })
);

export default router;
