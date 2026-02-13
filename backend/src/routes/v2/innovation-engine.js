import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import {
  getWorkflow,
  evaluateTechnicalEconomic,
  submitCommitteeDecision,
  moveToPilot,
  approveInitiative,
  deployInitiative,
} from "../../modules/innovationEngine/service.js";

const router = Router();

router.get(
  "/workflow",
  asyncHandler(async (_req, res) => ok(res, getWorkflow()))
);

router.post(
  "/:initiativeId/evaluate",
  asyncHandler(async (req, res) => {
    const row = await evaluateTechnicalEconomic(req.params.initiativeId, req.body || {}, req.user);
    return created(res, row);
  })
);

router.post(
  "/:initiativeId/committee",
  asyncHandler(async (req, res) => {
    const row = await submitCommitteeDecision(req.params.initiativeId, req.body || {}, req.user);
    return created(res, row);
  })
);

router.post(
  "/:initiativeId/pilot",
  asyncHandler(async (req, res) => {
    const row = await moveToPilot(req.params.initiativeId, req.user);
    return ok(res, row);
  })
);

router.post(
  "/:initiativeId/approve",
  asyncHandler(async (req, res) => {
    const row = await approveInitiative(req.params.initiativeId, req.user);
    return ok(res, row);
  })
);

router.post(
  "/:initiativeId/deploy",
  asyncHandler(async (req, res) => {
    const row = await deployInitiative(req.params.initiativeId, req.user);
    return ok(res, row);
  })
);

export default router;
