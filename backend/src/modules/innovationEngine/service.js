import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";
import { createNotification } from "../notification/service.js";

const WORKFLOW = [
  { key: "idea_submission", labelAr: "تقديم الفكرة", labelEn: "Idea Submission", order: 1 },
  { key: "evaluation", labelAr: "التقييم الفني والاقتصادي", labelEn: "Technical & Economic Evaluation", order: 2 },
  { key: "committee", labelAr: "اللجان", labelEn: "Committees", order: 3 },
  { key: "pilot", labelAr: "التجربة", labelEn: "Pilot", order: 4 },
  { key: "approval", labelAr: "الاعتماد", labelEn: "Approval", order: 5 },
  { key: "application", labelAr: "التطبيق", labelEn: "Application", order: 6 },
];

function normalizePct(v, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, n));
}

function calcEconomicScore({ annualSavings = 0, implementationCost = 1, beneficiaries = 0 }) {
  const savings = Math.max(0, Number(annualSavings) || 0);
  const cost = Math.max(1, Number(implementationCost) || 1);
  const impactPerBeneficiary = beneficiaries > 0 ? savings / beneficiaries : savings;
  const roiRatio = savings / cost;
  const score = Math.max(0, Math.min(100, roiRatio * 45 + Math.min(25, impactPerBeneficiary / 2000)));
  return Math.round(score * 100) / 100;
}

function calcTechnicalScore({ architectureReadiness = 0, dataReadiness = 0, securityReadiness = 0, integrationReadiness = 0 }) {
  const a = normalizePct(architectureReadiness);
  const d = normalizePct(dataReadiness);
  const s = normalizePct(securityReadiness);
  const i = normalizePct(integrationReadiness);
  return Math.round((a * 0.28 + d * 0.24 + s * 0.24 + i * 0.24) * 100) / 100;
}

async function updateStage(initiativeId, stage, status, note, user) {
  const sql = `
    UPDATE v2.initiatives
    SET stage = $2,
        status = $3,
        updated_at = now()
    WHERE id = $1
    RETURNING id, title, owner_id AS "ownerId", owner_name AS "ownerName", stage, status, updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(sql, [initiativeId, stage, status]);
  if (!rows.length) {
    const err = new Error("INITIATIVE_NOT_FOUND");
    err.statusCode = 404;
    err.code = "INITIATIVE_NOT_FOUND";
    throw err;
  }

  await pool.query(
    `INSERT INTO v2.initiative_stage_events (initiative_id, stage, stage_label, by_user_id, by_user_name, note)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [initiativeId, stage, stage, user?.id || null, user?.name || null, note || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "INNOVATION_ENGINE_STAGE",
    operation: "update_stage",
    entityId: initiativeId,
    afterState: rows[0],
  });

  if (rows[0]?.ownerId) {
    await createNotification({
      userId: rows[0].ownerId,
      channel: "in_app",
      title: "تحديث حالة المبادرة",
      body: `تم تحديث مبادرتك "${rows[0].title}" إلى المرحلة: ${stage} والحالة: ${status}.`,
    });
  }

  return rows[0];
}

export function getWorkflow() {
  return WORKFLOW;
}

export async function evaluateTechnicalEconomic(initiativeId, payload, user) {
  const technicalScore = calcTechnicalScore(payload || {});
  const economicScore = calcEconomicScore(payload || {});
  const finalScore = Math.round((technicalScore * 0.58 + economicScore * 0.42) * 100) / 100;

  const { rows } = await pool.query(
    `INSERT INTO v2.committee_reviews (initiative_id, reviewer_id, reviewer_name, decision, technical_score, economic_score, final_score, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, initiative_id AS "initiativeId", decision, technical_score AS "technicalScore", economic_score AS "economicScore", final_score AS "finalScore", note, created_at AS "createdAt"`,
    [initiativeId, user?.id || payload?.reviewerId || "engine", user?.name || payload?.reviewerName || "Innovation Engine", "evaluation", technicalScore, economicScore, finalScore, payload?.note || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "INNOVATION_ENGINE_EVALUATION",
    operation: "evaluate",
    entityId: initiativeId,
    afterState: rows[0],
  });

  return rows[0];
}

export async function submitCommitteeDecision(initiativeId, payload, user) {
  const decision = payload?.decision || "pending";
  const note = payload?.note || null;

  const { rows } = await pool.query(
    `INSERT INTO v2.committee_reviews (initiative_id, reviewer_id, reviewer_name, decision, technical_score, economic_score, final_score, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, initiative_id AS "initiativeId", reviewer_id AS "reviewerId", reviewer_name AS "reviewerName", decision, final_score AS "finalScore", note, created_at AS "createdAt"`,
    [initiativeId, user?.id || payload?.reviewerId || null, user?.name || payload?.reviewerName || null, decision, payload?.technicalScore || null, payload?.economicScore || null, payload?.finalScore || null, note]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "INNOVATION_ENGINE_COMMITTEE",
    operation: "committee_decision",
    entityId: initiativeId,
    afterState: rows[0],
  });

  const { rows: initiativeRows } = await pool.query(
    `SELECT owner_id AS "ownerId", title
       FROM v2.initiatives
      WHERE id = $1
      LIMIT 1`,
    [initiativeId]
  );
  const ownerId = initiativeRows[0]?.ownerId;
  const title = initiativeRows[0]?.title;
  if (ownerId) {
    await createNotification({
      userId: ownerId,
      channel: "in_app",
      title: "قرار لجنة الابتكار",
      body: `قرار اللجنة لمبادرة "${title || initiativeId}": ${decision}.`,
    });
  }

  return rows[0];
}

export async function moveToPilot(initiativeId, user) {
  return updateStage(initiativeId, "pilot", "pilot", "Moved to pilot", user);
}

export async function approveInitiative(initiativeId, user) {
  return updateStage(initiativeId, "approval", "approved", "Approved by committee", user);
}

export async function deployInitiative(initiativeId, user) {
  return updateStage(initiativeId, "application", "launched", "Applied in operations", user);
}
