import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.js";
import { AUDIT_ACTIONS, INITIATIVE_STATUS, JOURNEY_STAGES, PERMISSIONS } from "../core/constants.js";
import {
  listInitiatives,
  getInitiativeById,
  createInitiative,
  updateInitiativeStatus,
  moveInitiativeStage,
} from "../services/initiativeService.js";
import { writeAudit } from "../services/auditService.js";

const router = Router();

router.get("/", authRequired, async (_req, res, next) => {
  try {
    const rows = await listInitiatives();
    res.json({ initiatives: rows });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  authRequired,
  requirePermission(PERMISSIONS.INITIATIVE_CREATE),
  async (req, res, next) => {
    try {
      const title = String(req.body?.title || "").trim();
      const ownerName = String(req.body?.ownerName || req.user.name).trim();
      if (!title) return res.status(400).json({ error: "TITLE_REQUIRED" });

      const created = await createInitiative({ title, ownerName });

      await writeAudit({
        user: req.user,
        action: AUDIT_ACTIONS.INITIATIVE_CREATE,
        operation: "create_initiative",
        entityId: created.id,
        before: null,
        after: created,
      });

      res.status(201).json({ initiative: created });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:id/status",
  authRequired,
  requirePermission(PERMISSIONS.INITIATIVE_STATUS_UPDATE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const status = String(req.body?.status || "").trim();
      const allowed = new Set(Object.values(INITIATIVE_STATUS));
      if (!allowed.has(status)) return res.status(400).json({ error: "INVALID_STATUS" });

      const before = await getInitiativeById(id);
      if (!before) return res.status(404).json({ error: "INITIATIVE_NOT_FOUND" });

      const after = await updateInitiativeStatus(id, status);

      await writeAudit({
        user: req.user,
        action: AUDIT_ACTIONS.INITIATIVE_STATUS_UPDATE,
        operation: "update_initiative_status",
        entityId: id,
        before,
        after,
      });

      res.json({ initiative: after });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:id/stage",
  authRequired,
  requirePermission(PERMISSIONS.JOURNEY_STAGE_UPDATE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const stage = String(req.body?.stage || "").trim();
      const note = String(req.body?.note || "").trim();

      if (!JOURNEY_STAGES.some((x) => x.key === stage)) {
        return res.status(400).json({ error: "INVALID_STAGE" });
      }

      const before = await getInitiativeById(id);
      if (!before) return res.status(404).json({ error: "INITIATIVE_NOT_FOUND" });

      const after = await moveInitiativeStage({
        id,
        stageKey: stage,
        note,
        by: req.user.name,
      });

      await writeAudit({
        user: req.user,
        action: AUDIT_ACTIONS.JOURNEY_STAGE_UPDATE,
        operation: "move_journey_stage",
        entityId: id,
        before,
        after,
      });

      res.json({ initiative: after });
    } catch (e) {
      if (e.message === "JOURNEY_BACKWARD_NOT_ALLOWED") {
        return res.status(409).json({ error: e.message });
      }
      next(e);
    }
  }
);

router.post(
  "/:id/approve",
  authRequired,
  requirePermission(PERMISSIONS.INITIATIVE_APPROVE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const before = await getInitiativeById(id);
      if (!before) return res.status(404).json({ error: "INITIATIVE_NOT_FOUND" });

      const after = await updateInitiativeStatus(id, INITIATIVE_STATUS.APPROVED);

      await writeAudit({
        user: req.user,
        action: AUDIT_ACTIONS.INITIATIVE_APPROVE,
        operation: "approve_initiative",
        entityId: id,
        before,
        after,
      });

      res.json({ initiative: after });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/:id/reject",
  authRequired,
  requirePermission(PERMISSIONS.INITIATIVE_REJECT),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const before = await getInitiativeById(id);
      if (!before) return res.status(404).json({ error: "INITIATIVE_NOT_FOUND" });

      const after = await updateInitiativeStatus(id, INITIATIVE_STATUS.REJECTED);

      await writeAudit({
        user: req.user,
        action: AUDIT_ACTIONS.INITIATIVE_REJECT,
        operation: "reject_initiative",
        entityId: id,
        before,
        after,
      });

      res.json({ initiative: after });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
