import { can } from "../core/permissions.js";

export function requirePermission(user, permission) {
  if (!user) {
    return { ok: false, reason: "NO_USER" };
  }

  if (!can(user.role, permission)) {
    return {
      ok: false,
      reason: "FORBIDDEN",
      permission,
      role: user.role,
    };
  }

  return { ok: true };
}
