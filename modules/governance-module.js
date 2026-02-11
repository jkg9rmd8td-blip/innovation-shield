import { composeMiddleware } from "../guards/middleware.js";
import { withAudit } from "../services/audit-service.js";
import { signPledge, approveConfidentiality, listGovernanceLogs } from "../services/governance-service.js";

const pipeline = composeMiddleware([
  async (ctx, next) => next(),
]);

export async function submitPledge(ctx) {
  return pipeline(ctx, withAudit(async (innerCtx) => {
    const result = signPledge(innerCtx.user, innerCtx.pledgeText);
    innerCtx.action = result.action;
    innerCtx.operation = "submit_pledge";
    innerCtx.before = result.before;
    innerCtx.after = result.after;
    innerCtx.entityId = result.after?.id;
    return result;
  }));
}

export async function submitConfidentialApproval(ctx) {
  return pipeline(ctx, withAudit(async (innerCtx) => {
    const result = approveConfidentiality(innerCtx.user, innerCtx.note);
    innerCtx.action = result.action;
    innerCtx.operation = "submit_confidentiality_approval";
    innerCtx.before = result.before;
    innerCtx.after = result.after;
    innerCtx.entityId = result.after?.id;
    return result;
  }));
}

export function getGovernanceDashboard() {
  return listGovernanceLogs();
}
