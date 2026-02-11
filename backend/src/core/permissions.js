import { roleMatrix } from "./roleMatrix.js";

export function listRoleMatrix() {
  return Object.entries(roleMatrix).map(([role, permissions]) => ({ role, permissions }));
}

export function can(role, permission) {
  const perms = roleMatrix[role] || [];
  return perms.includes("*") || perms.includes(permission);
}
