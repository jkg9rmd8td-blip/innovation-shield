import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

const WEIGHTS = {
  problemClarity: 0.22,
  feasibility: 0.22,
  impact: 0.22,
  risk: 0.16,
  readiness: 0.18,
};

function normalize(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function levelForScore(score) {
  if (score >= 85) return "Scale Ready";
  if (score >= 70) return "Pilot Ready";
  if (score >= 50) return "Maturing";
  return "Early Concept";
}

export function calculateIdeaMaturity(payload = {}) {
  const factors = {
    problemClarity: normalize(payload.problemClarity),
    feasibility: normalize(payload.feasibility),
    impact: normalize(payload.impact),
    risk: normalize(payload.risk),
    readiness: normalize(payload.readiness),
  };

  const weighted =
    factors.problemClarity * WEIGHTS.problemClarity +
    factors.feasibility * WEIGHTS.feasibility +
    factors.impact * WEIGHTS.impact +
    factors.risk * WEIGHTS.risk +
    factors.readiness * WEIGHTS.readiness;

  const score = Math.round(weighted * 100) / 100;
  const level = levelForScore(score);

  return {
    weights: WEIGHTS,
    factors,
    score,
    level,
    recommendation:
      score >= 70
        ? "Proceed to committee and pilot readiness checks."
        : "Strengthen problem framing, feasibility evidence, and risk controls before committee submission.",
  };
}

export async function evaluateAndStoreIdeaMaturity(initiativeId, payload, user) {
  const result = calculateIdeaMaturity(payload || {});

  const { rows } = await pool.query(
    `INSERT INTO v2.idea_maturity_scores (initiative_id, problem_clarity, feasibility, impact, risk, readiness, score, level, model_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, initiative_id AS "initiativeId", score, level, model_version AS "modelVersion", created_at AS "createdAt"`,
    [
      initiativeId || null,
      result.factors.problemClarity,
      result.factors.feasibility,
      result.factors.impact,
      result.factors.risk,
      result.factors.readiness,
      result.score,
      result.level,
      "ims-v1",
    ]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "IDEA_MATURITY_SCORE",
    operation: "evaluate",
    entityId: initiativeId || rows[0].id,
    afterState: { ...result, recordId: rows[0].id },
  });

  return { record: rows[0], result };
}

export async function listIdeaMaturity(initiativeId = null) {
  const params = [];
  let where = "";
  if (initiativeId) {
    params.push(initiativeId);
    where = "WHERE initiative_id = $1";
  }

  const { rows } = await pool.query(
    `SELECT id,
            initiative_id AS "initiativeId",
            problem_clarity AS "problemClarity",
            feasibility,
            impact,
            risk,
            readiness,
            score,
            level,
            model_version AS "modelVersion",
            created_at AS "createdAt"
     FROM v2.idea_maturity_scores
     ${where}
     ORDER BY created_at DESC`,
    params
  );

  return rows;
}
