import { ROLES } from "../core/constants.js";

function decodeToken(token) {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function issueDemoToken(user) {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}

export function authOptional(req, _res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const payload = token ? decodeToken(token) : null;
  if (payload && payload.role && ROLES[payload.role]) {
    req.user = payload;
  } else {
    req.user = null;
  }
  next();
}

export function authRequired(req, res, next) {
  authOptional(req, res, () => {
    if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED" });
    return next();
  });
}
