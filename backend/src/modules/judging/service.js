import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

function normalizeScore(marks) {
  const vals = Object.values(marks || {}).map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}

export async function submitJudgingScore(initiativeId, payload, user) {
  const marks = payload?.marks || {};
  const judgeId = payload?.judgeId || user?.id || "demo-judge";
  const judgeName = payload?.judgeName || user?.name || "Demo Judge";
  const score = payload?.score != null ? Number(payload.score) : normalizeScore(marks);

  await pool.query(
    `INSERT INTO v2.initiative_scores (initiative_id, judge_id, judge_name, marks, score)
     VALUES ($1,$2,$3,$4,$5)`,
    [initiativeId, judgeId, judgeName, JSON.stringify(marks), score]
  );

  await pool.query(
    `UPDATE v2.initiatives
     SET average_score = (
       SELECT ROUND(AVG(score)::numeric, 2)
       FROM v2.initiative_scores
       WHERE initiative_id = $1
     ),
     updated_at = now()
     WHERE id = $1`,
    [initiativeId]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "JUDGING_SCORE_SUBMIT",
    operation: "score",
    entityId: initiativeId,
    afterState: { judgeId, judgeName, marks, score },
  });

  const { rows } = await pool.query(
    `SELECT id, average_score AS "averageScore", updated_at AS "updatedAt"
     FROM v2.initiatives
     WHERE id = $1`,
    [initiativeId]
  );
  return rows[0] || null;
}
