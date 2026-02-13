import { mutateState, getState } from "../core/state.js";
import { requirePermission } from "../guards/permission-guard.js";
import { PERMISSIONS } from "../core/constants.js";

export function listIntegrations() {
  return getState().integrations || {};
}

export function syncIntegration(user, key) {
  const guard = requirePermission(user, PERMISSIONS.INTEGRATIONS_MANAGE);
  if (!guard.ok) throw new Error("FORBIDDEN_INTEGRATION_SYNC");

  let after = null;
  mutateState((state) => {
    state.integrations = state.integrations || {};
    const row = state.integrations[key] || { status: "disconnected", owner: key };
    row.status = "connected";
    row.lastSyncAt = new Date().toISOString();
    row.lastSyncBy = user?.name || "system";
    state.integrations[key] = row;
    after = { key, ...row };

    state.initiatives = (state.initiatives || []).map((item) => ({
      ...item,
      integrationSync: {
        ...(item.integrationSync || {}),
        [key]: row.lastSyncAt,
      },
    }));

    return state;
  });
  return after;
}
