import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import {
  listPrototypes,
  createPrototype,
  listPrototypePortfolio,
  comparePrototypePortfolio,
  getPrototypeTimeline,
} from "../../modules/prototype/service.js";

const router = Router();

router.get(
  "/portfolio",
  asyncHandler(async (req, res) => {
    const rows = await listPrototypePortfolio({
      initiativeId: req.query.initiativeId || null,
      status: req.query.status || null,
      search: req.query.search || null,
      limit: req.query.limit || 120,
    });
    return ok(res, rows, { count: rows.length });
  })
);

router.get(
  "/compare",
  asyncHandler(async (req, res) => {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const rows = await comparePrototypePortfolio(ids);
    return ok(res, rows, { count: rows.length });
  })
);

router.get(
  "/:prototypeId/timeline",
  asyncHandler(async (req, res) => {
    const data = await getPrototypeTimeline(req.params.prototypeId, { limit: req.query.limit || 40 });
    return ok(res, data, { count: data.events?.length || 0 });
  })
);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await listPrototypes();
    return ok(res, rows, { count: rows.length });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const row = await createPrototype(req.body || {}, req.user);
    return created(res, row);
  })
);

export default router;
