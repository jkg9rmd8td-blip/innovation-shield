import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/live", (_req, res) => {
  res.json({ ok: true, service: "innovation-shield-backend" });
});

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query("SELECT now() AS now");
    res.json({ ok: true, db: "up", dbTime: result.rows[0].now });
  } catch {
    res.status(503).json({ ok: false, db: "down" });
  }
});

export default router;
