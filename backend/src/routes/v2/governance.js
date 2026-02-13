import { Router } from "express";
import { created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { createPledge } from "../../modules/governance/service.js";

const router = Router();

router.post(
  "/pledges",
  asyncHandler(async (req, res) => {
    const row = await createPledge(req.body || {}, req.user);
    return created(res, row);
  })
);

export default router;
