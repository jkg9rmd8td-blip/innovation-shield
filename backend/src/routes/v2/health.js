import { Router } from "express";
import { ok } from "../../platform/http/response.js";

const router = Router();

router.get("/", (_req, res) => {
  return ok(res, {
    service: "innovation-shield-v2",
    status: "ok",
    time: new Date().toISOString(),
  });
});

export default router;
