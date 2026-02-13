import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { listServiceRequests, createServiceRequest } from "../../modules/serviceCenter/service.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await listServiceRequests();
    return ok(res, rows, { count: rows.length });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const row = await createServiceRequest(req.body || {}, req.user);
    return created(res, row);
  })
);

export default router;
