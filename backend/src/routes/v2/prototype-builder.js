import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import {
  listTemplates,
  generatePitchDeck,
  generateUseCases,
  assistInnovationWriting,
  generateSimpleMockup,
  saveBuilderArtifact,
  listBuilderArtifacts,
  exportPrototypePack,
} from "../../modules/prototypeBuilder/service.js";

const router = Router();

router.get(
  "/templates",
  asyncHandler(async (_req, res) => ok(res, listTemplates()))
);

router.post(
  "/pitch-deck",
  asyncHandler(async (req, res) => created(res, await generatePitchDeck(req.body || {}, req.user)))
);

router.post(
  "/use-cases",
  asyncHandler(async (req, res) => created(res, await generateUseCases(req.body || {}, req.user)))
);

router.post(
  "/writing-assistant",
  asyncHandler(async (req, res) => created(res, await assistInnovationWriting(req.body || {}, req.user)))
);

router.post(
  "/mockup",
  asyncHandler(async (req, res) => created(res, await generateSimpleMockup(req.body || {}, req.user)))
);

router.get(
  "/artifacts",
  asyncHandler(async (req, res) =>
    ok(
      res,
      await listBuilderArtifacts({
        initiativeId: req.query.initiativeId || null,
        artifactType: req.query.artifactType || null,
        limit: req.query.limit || 40,
      })
    )
  )
);

router.post(
  "/artifacts",
  asyncHandler(async (req, res) => created(res, await saveBuilderArtifact(req.body || {}, req.user)))
);

router.post(
  "/export-pack",
  asyncHandler(async (req, res) => created(res, await exportPrototypePack(req.body || {}, req.user)))
);

export default router;
