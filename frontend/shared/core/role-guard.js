const MATRIX = {
  employee: ["employee", "judging", "admin"],
  evaluator: ["judging", "employee", "admin"],
  manager: ["admin", "employee", "judging"],
  committee: ["admin", "judging", "employee"],
};

export function canAccessPortal(role, portal) {
  return (MATRIX[role] || ["employee"]).includes(portal);
}

export function defaultPortal(role) {
  return (MATRIX[role] || ["employee"])[0];
}
