import { Router } from "express";
import { ok } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { submitJudgingScore } from "../../modules/judging/service.js";

const router = Router();

router.post(
  "/:initiativeId/scores",
  asyncHandler(async (req, res) => {
    const row = await submitJudgingScore(req.params.initiativeId, req.body || {}, req.user);
    return ok(res, row);
  })
);

export default router;
