import { composeMiddleware } from "../guards/middleware.js";
import { withAudit } from "../services/audit-service.js";
import { createInitiative, updateInitiativeStatus, approveInitiative, rejectInitiative, listInitiatives } from "../services/initiative-service.js";

const pipeline = composeMiddleware([
  async (ctx, next) => next(),
]);

export async function createInitiativeFlow(ctx) {
  return pipeline(ctx, withAudit(async (innerCtx) => {
    const result = createInitiative(innerCtx.user, innerCtx.payload);
    innerCtx.action = result.action;
    innerCtx.operation = "create_initiative";
    innerCtx.before = result.before;
    innerCtx.after = result.after;
    innerCtx.entityId = result.initiative.id;
    return result;
  }));
}

export async function updateInitiativeStatusFlow(ctx) {
  return pipeline(ctx, withAudit(async (innerCtx) => {
    const result = updateInitiativeStatus(innerCtx.user, innerCtx.initiativeId, innerCtx.status);
    innerCtx.action = result.action;
    innerCtx.operation = "update_initiative_status";
    innerCtx.before = result.before;
    innerCtx.after = result.after;
    innerCtx.entityId = innerCtx.initiativeId;
    return result;
  }));
}

export async function approveInitiativeFlow(ctx) {
  return pipeline(ctx, withAudit(async (innerCtx) => {
    const result = approveInitiative(innerCtx.user, innerCtx.initiativeId);
    innerCtx.action = result.action;
    innerCtx.operation = "approve_initiative";
    innerCtx.before = result.before;
    innerCtx.after = result.after;
    innerCtx.entityId = innerCtx.initiativeId;
    return result;
  }));
}

export async function rejectInitiativeFlow(ctx) {
  return pipeline(ctx, withAudit(async (innerCtx) => {
    const result = rejectInitiative(innerCtx.user, innerCtx.initiativeId);
    innerCtx.action = result.action;
    innerCtx.operation = "reject_initiative";
    innerCtx.before = result.before;
    innerCtx.after = result.after;
    innerCtx.entityId = innerCtx.initiativeId;
    return result;
  }));
}

export function listInitiativesFlow() {
  return listInitiatives();
}
