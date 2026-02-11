import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { authOptional } from "./middleware/auth.js";
import { notFound, errorHandler } from "./middleware/error-handler.js";

import healthRoute from "./routes/health.js";
import authRoute from "./routes/auth.js";
import accessRoute from "./routes/access.js";
import initiativesRoute from "./routes/initiatives.js";
import judgingRoute from "./routes/judging.js";
import governanceRoute from "./routes/governance.js";
import auditRoute from "./routes/audit.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));
  app.use(authOptional);

  app.get("/", (_req, res) => {
    res.json({ service: "innovation-shield-backend", version: "1.0.0" });
  });

  app.use("/health", healthRoute);
  app.use("/auth", authRoute);
  app.use("/access", accessRoute);
  app.use("/initiatives", initiativesRoute);
  app.use("/judging", judgingRoute);
  app.use("/governance", governanceRoute);
  app.use("/audit", auditRoute);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
