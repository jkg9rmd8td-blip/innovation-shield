import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { listNotifications, createNotification, markNotificationRead } from "../../modules/notification/service.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await listNotifications(req.query.userId || null);
    return ok(res, rows, { count: rows.length });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const row = await createNotification(req.body || {});
    return created(res, row);
  })
);

router.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const row = await markNotificationRead(req.params.id);
    return ok(res, row);
  })
);

export default router;
