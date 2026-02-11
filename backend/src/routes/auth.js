import { Router } from "express";
import { ROLES } from "../core/constants.js";
import { issueDemoToken } from "../middleware/auth.js";

const router = Router();

router.post("/session", (req, res) => {
  const { name, role, id } = req.body || {};
  if (!name || !role || !ROLES[role]) {
    return res.status(400).json({ error: "INVALID_LOGIN_PAYLOAD" });
  }

  const user = {
    id: id || `${role}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    role,
  };

  return res.json({
    token: issueDemoToken(user),
    user,
  });
});

export default router;
