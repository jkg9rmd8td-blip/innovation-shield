import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.js";
import { AUDIT_ACTIONS, PERMISSIONS } from "../core/constants.js";
import { addPledge, addConfidentialityApproval, getGovernanceLogs } from "../services/governanceService.js";
import { writeAudit } from "../services/auditService.js";

const router = Router();

router.post(
  "/pledge",
  authRequired,
  requirePermission(PERMISSIONS.GOVERNANCE_PLEDGE_SIGN),
  async (req, res, next) => {
    try {
      const pledgeText = String(req.body?.pledgeText || "").trim();
      if (!pledgeText) return res.status(400).json({ error: "PLEDGE_TEXT_REQUIRED" });

      const row = await addPledge({ user: req.user, text: pledgeText });
      await writeAudit({
        user: req.user,
        action: AUDIT_ACTIONS.GOVERNANCE_PLEDGE_SIGN,
        operation: "submit_pledge",
        entityId: row.id,
        before: null,
        after: row,
      });

      res.status(201).json({ pledge: row });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/confidentiality",
  authRequired,
  requirePermission(PERMISSIONS.GOVERNANCE_CONFIDENTIALITY_APPROVE),
  async (req, res, next) => {
    try {
      const note = String(req.body?.note || "موافقة سرية");
      const row = await addConfidentialityApproval({ user: req.user, note });

      await writeAudit({
        user: req.user,
        action: AUDIT_ACTIONS.GOVERNANCE_CONFIDENTIALITY_APPROVE,
        operation: "submit_confidentiality_approval",
        entityId: row.id,
        before: null,
        after: row,
      });

      res.status(201).json({ approval: row });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/logs", authRequired, async (_req, res, next) => {
  try {
    const data = await getGovernanceLogs();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default router;
