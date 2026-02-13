import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.js";
import { AUDIT_ACTIONS, PERMISSIONS } from "../core/constants.js";
import { getInitiativeById, setJudgingLock, setInitiativeReward } from "../services/initiativeService.js";
import { addEvaluation, listScoresByInitiative } from "../services/judgingService.js";
import { distributeRewards } from "../services/scoringService.js";
import { writeAudit } from "../services/auditService.js";

const router = Router();

router.post(
  "/:id/evaluate",
  authRequired,
  requirePermission(PERMISSIONS.INITIATIVE_EVALUATE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const marks = req.body?.marks || {};
      const before = await getInitiativeById(id);
      if (!before) return res.status(404).json({ error: "INITIATIVE_NOT_FOUND" });
      if (before.judging_locked) return res.status(409).json({ error: "JUDGING_LOCKED" });

      const result = await addEvaluation({
        initiativeId: id,
        judgeId: req.user.id,
        judgeName: req.user.name,
        marks,
      });
      const after = await getInitiativeById(id);

      await writeAudit({
        user: req.user,
        action: AUDIT_ACTIONS.INITIATIVE_EVALUATE,
        operation: "submit_evaluation",
        entityId: id,
        before,
        after,
      });

      res.json({
        initiative: after,
        evaluation: result,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/:id/lock",
  authRequired,
  requirePermission(PERMISSIONS.JUDGING_LOCK),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const before = await getInitiativeById(id);
      if (!before) return res.status(404).json({ error: "INITIATIVE_NOT_FOUND" });

      const after = await setJudgingLock(id, true);

      await writeAudit({
        user: req.user,
        action: AUDIT_ACTIONS.JUDGING_LOCK,
        operation: "lock_judging",
        entityId: id,
        before,
        after,
      });

      res.json({ initiative: after });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/:id/reward",
  authRequired,
  requirePermission(PERMISSIONS.REWARD_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const totalReward = Number(req.body?.totalReward || 0);
      const contributors = Array.isArray(req.body?.contributors) ? req.body.contributors : [];
      if (totalReward <= 0) return res.status(400).json({ error: "INVALID_TOTAL_REWARD" });
      if (!contributors.length) return res.status(400).json({ error: "CONTRIBUTORS_REQUIRED" });

      const before = await getInitiativeById(id);
      if (!before) return res.status(404).json({ error: "INITIATIVE_NOT_FOUND" });

      const distribution = distributeRewards(totalReward, contributors);
      const after = await setInitiativeReward(id, totalReward, distribution);

      await writeAudit({
        user: req.user,
        action: AUDIT_ACTIONS.REWARD_DISTRIBUTION,
        operation: "reward_distribution",
        entityId: id,
        before,
        after,
      });

      res.json({ initiative: after });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/:id/scores", authRequired, async (req, res, next) => {
  try {
    const scores = await listScoresByInitiative(req.params.id);
    res.json({ scores });
  } catch (e) {
    next(e);
  }
});

export default router;
