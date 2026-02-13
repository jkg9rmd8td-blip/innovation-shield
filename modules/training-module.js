import { composeMiddleware } from "../guards/middleware.js";
import { withAudit } from "../services/audit-service.js";
import { ACTIONS } from "../core/constants.js";
import { listTrainingCatalog, listTrainingProgress, completeTraining } from "../services/training-service.js";

const pipeline = composeMiddleware([
  async (ctx, next) => next(),
]);

export function listTrainingCatalogFlow() {
  return listTrainingCatalog();
}

export function listTrainingProgressFlow(userId) {
  return listTrainingProgress(userId);
}

export async function completeTrainingFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const row = completeTraining(innerCtx.user, innerCtx.trainingId);
      innerCtx.action = ACTIONS.TRAINING_COMPLETE;
      innerCtx.operation = "training_complete";
      innerCtx.before = null;
      innerCtx.after = row;
      innerCtx.entityId = innerCtx.trainingId;
      return row;
    })
  );
}
