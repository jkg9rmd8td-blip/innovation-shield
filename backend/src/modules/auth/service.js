import { ROLES } from "../../core/constants.js";
import { issueAccessToken } from "../../middleware/auth.js";

export function buildDemoSession({ name, role, department, id }) {
  if (!name || !role || !ROLES[role]) {
    const err = new Error("INVALID_LOGIN_PAYLOAD");
    err.statusCode = 400;
    err.code = "INVALID_LOGIN_PAYLOAD";
    throw err;
  }

  const user = {
    id: id || `${role}-${Math.random().toString(16).slice(2, 10)}`,
    name,
    role,
    department: department || "General",
  };

  return {
    token: issueAccessToken(user),
    tokenType: "Bearer",
    user,
  };
}
