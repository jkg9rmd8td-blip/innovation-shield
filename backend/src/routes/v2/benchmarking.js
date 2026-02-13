import { Router } from "express";
import { ok, created } from "../../platform/http/response.js";
import { asyncHandler } from "../../platform/http/async-handler.js";
import { getBenchmarkCatalog, runGlobalBenchmark, listBenchmarkRuns } from "../../modules/benchmarking/service.js";

const router = Router();

router.get(
  "/catalog",
  asyncHandler(async (_req, res) => ok(res, getBenchmarkCatalog()))
);

router.post(
  "/global",
  asyncHandler(async (req, res) => created(res, await runGlobalBenchmark(req.body || {}, req.user)))
);

router.get(
  "/runs",
  asyncHandler(async (req, res) => ok(res, await listBenchmarkRuns(req.query.initiativeId || null)))
);

export default router;
