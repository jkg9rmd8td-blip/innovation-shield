import { buildRoleMatrixView } from "../core/permissions.js";
import { requirePermission } from "../guards/permission-guard.js";

export function getRoleMatrixFlow() {
  return buildRoleMatrixView();
}

export function assertPermissionFlow(user, permission) {
  const check = requirePermission(user, permission);
  if (!check.ok) throw new Error(`FORBIDDEN:${permission}`);
  return true;
}
