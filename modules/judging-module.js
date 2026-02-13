import { composeMiddleware } from "../guards/middleware.js";
import { withAudit } from "../services/audit-service.js";
import { submitEvaluation, lockJudging, rewardInitiative, getJudgingSummary } from "../services/judging-service.js";

const pipeline = composeMiddleware([
  async (ctx, next) => next(),
]);

export function getJudgingDashboard() {
  return getJudgingSummary();
}

export async function evaluateInitiativeFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = submitEvaluation(innerCtx.user, innerCtx.initiativeId, innerCtx.marks, innerCtx.rubric);
      innerCtx.action = result.action;
      innerCtx.operation = "submit_evaluation";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function lockJudgingFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = lockJudging(innerCtx.user, innerCtx.initiativeId);
      innerCtx.action = result.action;
      innerCtx.operation = "lock_judging";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function rewardInitiativeFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = rewardInitiative(
        innerCtx.user,
        innerCtx.initiativeId,
        innerCtx.totalReward,
        innerCtx.contributors
      );
      innerCtx.action = result.action;
      innerCtx.operation = "reward_distribution";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}
