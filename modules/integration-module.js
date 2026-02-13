import { composeMiddleware } from "../guards/middleware.js";
import { withAudit } from "../services/audit-service.js";
import { ACTIONS } from "../core/constants.js";
import { listIntegrations, syncIntegration } from "../services/integration-service.js";

const pipeline = composeMiddleware([
  async (ctx, next) => next(),
]);

export function listIntegrationsFlow() {
  return listIntegrations();
}

export async function syncIntegrationFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const row = syncIntegration(innerCtx.user, innerCtx.integrationKey);
      innerCtx.action = ACTIONS.INTEGRATION_SYNC;
      innerCtx.operation = "integration_sync";
      innerCtx.before = null;
      innerCtx.after = row;
      innerCtx.entityId = innerCtx.integrationKey;
      return row;
    })
  );
}
