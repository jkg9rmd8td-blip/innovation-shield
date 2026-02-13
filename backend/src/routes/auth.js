import { Router } from "express";
import { env } from "../config/env.js";
import { ROLES } from "../core/constants.js";
import { authRequired, issueAccessToken } from "../middleware/auth.js";

const router = Router();

router.post("/session", (req, res) => {
  const { name, role, id, passcode, department } = req.body || {};

  if (!name || !role || !ROLES[role]) {
    return res.status(400).json({ error: "INVALID_LOGIN_PAYLOAD" });
  }

  if (env.authStrict && env.authPasscode && passcode !== env.authPasscode) {
    return res.status(401).json({ error: "INVALID_PASSCODE" });
  }

  const user = {
    id: id || `${role}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    role,
    department: department || "غير محدد",
  };

  const token = issueAccessToken(user);

  return res.json({
    token,
    tokenType: "Bearer",
    expiresInSec: env.authAccessTtlSec,
    user,
  });
});

router.get("/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

export default router;
