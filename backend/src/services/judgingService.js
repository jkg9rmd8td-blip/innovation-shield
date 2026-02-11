import { pool } from "../db/pool.js";
import { scoreByRubric, average } from "./scoringService.js";

export async function addEvaluation({ initiativeId, judgeId, judgeName, marks }) {
  const score = scoreByRubric(marks);
  await pool.query(
    `INSERT INTO initiative_scores (initiative_id, judge_id, judge_name, marks, score)
     VALUES ($1,$2,$3,$4,$5)`,
    [initiativeId, judgeId, judgeName, marks, score]
  );

  const { rows: scoreRows } = await pool.query(
    `SELECT score FROM initiative_scores WHERE initiative_id = $1`,
    [initiativeId]
  );
  const avg = average(scoreRows.map((r) => Number(r.score)));

  await pool.query(
    `UPDATE initiatives SET average_score = $2, status = $3, updated_at = now() WHERE id = $1`,
    [initiativeId, avg, "قيد التحكيم"]
  );

  return { score, averageScore: avg };
}

export async function listScoresByInitiative(initiativeId) {
  const { rows } = await pool.query(
    `SELECT id, judge_id, judge_name, marks, score, created_at
     FROM initiative_scores
     WHERE initiative_id = $1
     ORDER BY created_at DESC`,
    [initiativeId]
  );
  return rows;
}
