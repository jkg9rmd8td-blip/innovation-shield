import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import {
  listCollaborationStream,
  addCollaborationComment,
  addCollaborationActivity,
} from "../../modules/collaboration/service.js";

const router = Router();

router.get(
  "/:initiativeId",
  asyncHandler(async (req, res) => {
    const data = await listCollaborationStream(req.params.initiativeId, {
      prototypeId: req.query.prototypeId || null,
      limit: req.query.limit || 60,
    });
    return ok(res, data, {
      commentsCount: data.comments?.length || 0,
      activitiesCount: data.activities?.length || 0,
    });
  })
);

router.post(
  "/:initiativeId/comments",
  asyncHandler(async (req, res) => {
    const data = await addCollaborationComment(req.params.initiativeId, req.body || {}, req.user);
    return created(res, data);
  })
);

router.post(
  "/:initiativeId/activities",
  asyncHandler(async (req, res) => {
    const data = await addCollaborationActivity(req.params.initiativeId, req.body || {}, req.user);
    return created(res, data);
  })
);

export default router;
