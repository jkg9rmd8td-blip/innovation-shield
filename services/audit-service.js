import { readJson, writeJson, nowISO } from "../core/storage.js";

const KEY = "AUDIT_LOG";

export function listAuditLogs(limit = 100) {
  return readJson(KEY, []).slice(0, limit);
}

export function logAudit({ user, action, operation, before, after, entityId }) {
  const logs = readJson(KEY, []);
  logs.unshift({
    id: `AUD-${Math.random().toString(16).slice(2, 8)}`,
    user: user ? { id: user.id, name: user.name, role: user.role } : null,
    at: nowISO(),
    action,
    operation,
    entityId: entityId || null,
    before: before ?? null,
    after: after ?? null,
  });
  writeJson(KEY, logs.slice(0, 500));
}

export function withAudit(handler, { action, operation, entityIdResolver } = {}) {
  return async (ctx, next) => {
    const result = await handler(ctx, next);
    logAudit({
      user: ctx.user,
      action: action || ctx.action,
      operation: operation || ctx.operation || "UNKNOWN",
      entityId: entityIdResolver ? entityIdResolver(ctx, result) : (ctx.entityId || null),
      before: ctx.before ?? null,
      after: ctx.after ?? null,
    });
    return result;
  };
}
