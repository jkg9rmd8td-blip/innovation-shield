import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import {
  getWorkspace,
  addWorkspaceChange,
  addEvaluatorNote,
  addRecommendation,
  addWorkspaceFile,
} from "../../modules/workspace/service.js";

const router = Router();

router.get(
  "/:initiativeId",
  asyncHandler(async (req, res) => ok(res, await getWorkspace(req.params.initiativeId)))
);

router.post(
  "/:initiativeId/changes",
  asyncHandler(async (req, res) => created(res, await addWorkspaceChange(req.params.initiativeId, req.body || {}, req.user)))
);

router.post(
  "/:initiativeId/evaluator-notes",
  asyncHandler(async (req, res) => created(res, await addEvaluatorNote(req.params.initiativeId, req.body || {}, req.user)))
);

router.post(
  "/:initiativeId/recommendations",
  asyncHandler(async (req, res) => created(res, await addRecommendation(req.params.initiativeId, req.body || {}, req.user)))
);

router.post(
  "/:initiativeId/files",
  asyncHandler(async (req, res) => created(res, await addWorkspaceFile(req.params.initiativeId, req.body || {}, req.user)))
);

export default router;
