import { can } from "../core/permissions.js";

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED" });
    if (!can(req.user.role, permission)) {
      return res.status(403).json({ error: "FORBIDDEN", permission, role: req.user.role });
    }
    return next();
  };
}
