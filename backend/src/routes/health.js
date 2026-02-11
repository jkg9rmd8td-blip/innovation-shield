import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/", async (_req, res) => {
  const result = await pool.query("SELECT now() AS now");
  res.json({ ok: true, dbTime: result.rows[0].now });
});

export default router;
