import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 8080),
  databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/innovation_shield",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
