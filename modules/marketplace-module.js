import { composeMiddleware } from "../guards/middleware.js";
import { withAudit } from "../services/audit-service.js";
import { submitMarketplaceOffer, listMarketplaceItems } from "../services/marketplace-service.js";
import { ACTIONS } from "../core/constants.js";

const pipeline = composeMiddleware([
  async (ctx, next) => next(),
]);

export function listMarketplaceFlow() {
  return listMarketplaceItems();
}

export async function submitMarketplaceOfferFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const row = submitMarketplaceOffer(
        innerCtx.user,
        innerCtx.initiativeId,
        innerCtx.roleType,
        innerCtx.note
      );

      innerCtx.action = ACTIONS.MARKETPLACE_ACTION;
      innerCtx.operation = "marketplace_offer";
      innerCtx.before = null;
      innerCtx.after = row;
      innerCtx.entityId = innerCtx.initiativeId;

      return row;
    })
  );
}
