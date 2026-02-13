import { ROLE_MATRIX } from "./role-matrix.js";

export function getRolePermissions(role) {
  return ROLE_MATRIX[role] || [];
}

export function can(role, permission) {
  const perms = getRolePermissions(role);
  return perms.includes(permission);
}

export function buildRoleMatrixView() {
  return Object.entries(ROLE_MATRIX).map(([role, permissions]) => ({
    role,
    permissions: [...permissions],
  }));
}
