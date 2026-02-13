import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function simulateImpact(payload = {}) {
  const baseline = {
    timeDays: Math.max(0, num(payload?.baseline?.timeDays, 0)),
    costSar: Math.max(0, num(payload?.baseline?.costSar, 0)),
    qualityScore: Math.max(0, Math.min(100, num(payload?.baseline?.qualityScore, 0))),
    satisfactionScore: Math.max(0, Math.min(100, num(payload?.baseline?.satisfactionScore, 0))),
  };

  const assumptions = {
    timeReductionPct: Math.max(0, Math.min(100, num(payload?.assumptions?.timeReductionPct, 0))),
    costReductionPct: Math.max(0, Math.min(100, num(payload?.assumptions?.costReductionPct, 0))),
    qualityIncreasePct: Math.max(0, Math.min(100, num(payload?.assumptions?.qualityIncreasePct, 0))),
    satisfactionIncreasePct: Math.max(0, Math.min(100, num(payload?.assumptions?.satisfactionIncreasePct, 0))),
  };

  const projected = {
    timeDays: Math.max(0, baseline.timeDays * (1 - assumptions.timeReductionPct / 100)),
    costSar: Math.max(0, baseline.costSar * (1 - assumptions.costReductionPct / 100)),
    qualityScore: Math.min(100, baseline.qualityScore * (1 + assumptions.qualityIncreasePct / 100)),
    satisfactionScore: Math.min(100, baseline.satisfactionScore * (1 + assumptions.satisfactionIncreasePct / 100)),
  };

  const delta = {
    timeDaysSaved: baseline.timeDays - projected.timeDays,
    costSarSaved: baseline.costSar - projected.costSar,
    qualityGain: projected.qualityScore - baseline.qualityScore,
    satisfactionGain: projected.satisfactionScore - baseline.satisfactionScore,
  };

  const confidence = Math.max(0, Math.min(100, 60 + assumptions.qualityIncreasePct * 0.2 + assumptions.satisfactionIncreasePct * 0.2 - assumptions.timeReductionPct * 0.05));

  return {
    baseline,
    assumptions,
    projected,
    delta,
    confidence: Math.round(confidence * 100) / 100,
  };
}

export async function runAndStoreImpactSimulation(initiativeId, payload, user) {
  const result = simulateImpact(payload || {});

  const { rows } = await pool.query(
    `INSERT INTO v2.impact_simulations (initiative_id, baseline, assumptions, projected, delta, confidence, model_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, initiative_id AS "initiativeId", confidence, model_version AS "modelVersion", created_at AS "createdAt"`,
    [initiativeId || null, result.baseline, result.assumptions, result.projected, result.delta, result.confidence, "impact-sim-v1"]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "IMPACT_SIMULATION",
    operation: "simulate",
    entityId: initiativeId || rows[0].id,
    afterState: { recordId: rows[0].id, confidence: result.confidence },
  });

  return { record: rows[0], result };
}

export async function listImpactSimulations(initiativeId = null) {
  const params = [];
  let where = "";
  if (initiativeId) {
    params.push(initiativeId);
    where = "WHERE initiative_id = $1";
  }

  const { rows } = await pool.query(
    `SELECT id,
            initiative_id AS "initiativeId",
            baseline,
            assumptions,
            projected,
            delta,
            confidence,
            model_version AS "modelVersion",
            created_at AS "createdAt"
     FROM v2.impact_simulations
     ${where}
     ORDER BY created_at DESC`,
    params
  );

  return rows;
}
