import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { listMarketplaceOffers, createMarketplaceOffer } from "../../modules/marketplace/service.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await listMarketplaceOffers();
    return ok(res, rows, { count: rows.length });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const row = await createMarketplaceOffer(req.body || {}, req.user);
    return created(res, row);
  })
);

export default router;
