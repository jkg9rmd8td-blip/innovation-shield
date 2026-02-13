import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { calculateIdeaMaturity, evaluateAndStoreIdeaMaturity, listIdeaMaturity } from "../../modules/scoring/service.js";

const router = Router();

router.post(
  "/idea-maturity",
  asyncHandler(async (req, res) => {
    const { initiativeId, persist = true, ...rest } = req.body || {};
    if (!persist) {
      return ok(res, calculateIdeaMaturity(rest));
    }
    return created(res, await evaluateAndStoreIdeaMaturity(initiativeId || null, rest, req.user));
  })
);

router.get(
  "/idea-maturity",
  asyncHandler(async (req, res) => ok(res, await listIdeaMaturity(req.query.initiativeId || null)))
);

export default router;
