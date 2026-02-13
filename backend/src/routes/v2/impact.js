import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { simulateImpact, runAndStoreImpactSimulation, listImpactSimulations } from "../../modules/impact/service.js";

const router = Router();

router.post(
  "/simulate",
  asyncHandler(async (req, res) => {
    const { initiativeId, persist = true, ...rest } = req.body || {};
    if (!persist) {
      return ok(res, simulateImpact(rest));
    }
    return created(res, await runAndStoreImpactSimulation(initiativeId || null, rest, req.user));
  })
);

router.get(
  "/simulations",
  asyncHandler(async (req, res) => ok(res, await listImpactSimulations(req.query.initiativeId || null)))
);

export default router;
