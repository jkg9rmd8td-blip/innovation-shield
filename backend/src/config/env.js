import dotenv from "dotenv";
import crypto from "node:crypto";

dotenv.config();

const defaultSecret = crypto.createHash("sha256").update("innovation-shield-dev-secret").digest("hex");

export const env = {
  port: Number(process.env.PORT || 8080),
  databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/innovation_shield",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  authSecret: process.env.AUTH_SECRET || defaultSecret,
  authIssuer: process.env.AUTH_ISSUER || "innovation-shield",
  authAccessTtlSec: Number(process.env.AUTH_ACCESS_TTL_SEC || 60 * 60 * 8),
  authStrict: String(process.env.AUTH_STRICT || "false").toLowerCase() === "true",
  authPasscode: process.env.AUTH_PASSCODE || "",
};
