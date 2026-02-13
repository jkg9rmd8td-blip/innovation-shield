import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function stageFromStatus(status, readiness) {
  const val = String(status || "").toLowerCase();
  if (/approved|published|deployed|معتمد|مطبق/.test(val)) return "Approved";
  if (/review|judging|تحكيم|مراجعة/.test(val)) return "Under Review";
  if (/ready|جاهز/.test(val) || readiness >= 72) return "Ready";
  return "Draft";
}

function riskFromSignals({ readiness, progress, latestNote }) {
  const noteBlob = String(latestNote || "").toLowerCase();
  const hasRiskKeywords = /risk|issue|delay|compliance|خطر|مشكلة|تأخير|امتثال/.test(noteBlob);
  if (readiness < 45 || (hasRiskKeywords && progress < 55)) return "High";
  if (readiness < 70 || hasRiskKeywords) return "Medium";
  return "Low";
}

function computePortfolioMetrics(row) {
  const progress = clamp(Math.round(toNumber(row.progress, 0)));
  const evaluatorNotesCount = toNumber(row.evaluatorNotesCount, 0);
  const filesCount = toNumber(row.filesCount, 0);
  const recommendationsCount = toNumber(row.recommendationsCount, 0);

  const status = String(row.status || "").toLowerCase();
  const statusBoost = /ready|judging|approved|published|deployed|جاهز|معتمد/.test(status)
    ? 14
    : /draft|idea|مسودة/.test(status)
      ? -10
      : 4;

  const readinessScore = clamp(Math.round(progress * 0.62 + evaluatorNotesCount * 4 + filesCount * 3 + recommendationsCount * 2 + statusBoost));
  const trl = clamp(Math.round(progress / 11) + 1, 1, 9);
  const brl = clamp(Math.round(readinessScore / 11) + 1, 1, 9);
  const impactScore = clamp(Math.round(progress * 0.42 + readinessScore * 0.58));
  const costEstimateSar = Math.round(Math.max(35000, (100 - progress) * 1400 + (100 - readinessScore) * 900));
  const riskLevel = riskFromSignals({ readiness: readinessScore, progress, latestNote: row.latestEvaluatorNote });

  return {
    portfolioStage: stageFromStatus(row.status, readinessScore),
    readinessScore,
    trl,
    brl,
    riskLevel,
    impactScore,
    costEstimateSar,
    progress,
    evaluatorNotesCount,
    filesCount,
    recommendationsCount,
    changeCount: toNumber(row.changeCount, 0),
  };
}

export async function listPrototypes() {
  const { rows } = await pool.query(
    `SELECT id,
            initiative_id AS "initiativeId",
            prototype_code AS "prototypeCode",
            status,
            progress,
            support_level AS "supportLevel",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM v2.prototypes
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function listPrototypePortfolio({ initiativeId = null, status = null, search = null, limit = 120 } = {}) {
  const where = [];
  const params = [];

  if (initiativeId) {
    params.push(initiativeId);
    where.push(`p.initiative_id = $${params.length}`);
  }

  if (status) {
    params.push(`%${status}%`);
    where.push(`LOWER(p.status) LIKE LOWER($${params.length})`);
  }

  if (search) {
    params.push(`%${search}%`);
    where.push(`(
      p.prototype_code ILIKE $${params.length}
      OR p.id::text ILIKE $${params.length}
      OR p.initiative_id::text ILIKE $${params.length}
    )`);
  }

  params.push(Math.min(Math.max(Number(limit) || 120, 1), 300));

  const sql = `
    SELECT p.id,
           p.initiative_id AS "initiativeId",
           p.prototype_code AS "prototypeCode",
           p.status,
           p.progress,
           p.support_level AS "supportLevel",
           p.created_at AS "createdAt",
           p.updated_at AS "updatedAt",
           i.stage AS "initiativeStage",
           i.status AS "initiativeStatus",
           COALESCE(ch.total, 0)::int AS "changeCount",
           COALESCE(en.total, 0)::int AS "evaluatorNotesCount",
           enl.note AS "latestEvaluatorNote",
           COALESCE(fl.total, 0)::int AS "filesCount",
           COALESCE(rc.total, 0)::int AS "recommendationsCount"
      FROM v2.prototypes p
      LEFT JOIN v2.initiatives i ON i.id = p.initiative_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS total
          FROM v2.workspace_change_logs c
         WHERE c.initiative_id = p.initiative_id
      ) ch ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS total
          FROM v2.workspace_evaluator_notes n
         WHERE n.initiative_id = p.initiative_id
      ) en ON TRUE
      LEFT JOIN LATERAL (
        SELECT n.note
          FROM v2.workspace_evaluator_notes n
         WHERE n.initiative_id = p.initiative_id
         ORDER BY n.created_at DESC
         LIMIT 1
      ) enl ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS total
          FROM v2.workspace_files f
         WHERE f.initiative_id = p.initiative_id
      ) fl ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS total
          FROM v2.workspace_ai_recommendations r
         WHERE r.initiative_id = p.initiative_id
      ) rc ON TRUE
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY p.updated_at DESC
     LIMIT $${params.length}
  `;

  const { rows } = await pool.query(sql, params);
  return rows.map((row) => ({
    ...row,
    metrics: computePortfolioMetrics(row),
  }));
}

export async function comparePrototypePortfolio(ids = []) {
  const uniqueIds = [...new Set((ids || []).map((x) => String(x || "").trim()).filter(Boolean))];
  if (uniqueIds.length < 2) {
    const err = new Error("AT_LEAST_TWO_PROTOTYPES_REQUIRED");
    err.statusCode = 400;
    err.code = "AT_LEAST_TWO_PROTOTYPES_REQUIRED";
    throw err;
  }

  const { rows } = await pool.query(
    `SELECT p.id,
            p.initiative_id AS "initiativeId",
            p.prototype_code AS "prototypeCode",
            p.status,
            p.progress,
            p.support_level AS "supportLevel",
            p.created_at AS "createdAt",
            p.updated_at AS "updatedAt",
            COALESCE(ch.total, 0)::int AS "changeCount",
            COALESCE(en.total, 0)::int AS "evaluatorNotesCount",
            enl.note AS "latestEvaluatorNote",
            COALESCE(fl.total, 0)::int AS "filesCount",
            COALESCE(rc.total, 0)::int AS "recommendationsCount"
       FROM v2.prototypes p
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS total
           FROM v2.workspace_change_logs c
          WHERE c.initiative_id = p.initiative_id
       ) ch ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS total
           FROM v2.workspace_evaluator_notes n
          WHERE n.initiative_id = p.initiative_id
       ) en ON TRUE
       LEFT JOIN LATERAL (
         SELECT n.note
           FROM v2.workspace_evaluator_notes n
          WHERE n.initiative_id = p.initiative_id
          ORDER BY n.created_at DESC
          LIMIT 1
       ) enl ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS total
           FROM v2.workspace_files f
          WHERE f.initiative_id = p.initiative_id
       ) fl ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS total
           FROM v2.workspace_ai_recommendations r
          WHERE r.initiative_id = p.initiative_id
       ) rc ON TRUE
      WHERE p.id = ANY($1::uuid[])
      ORDER BY p.updated_at DESC`,
    [uniqueIds]
  );

  if (rows.length < 2) {
    const err = new Error("COMPARE_SET_NOT_FOUND");
    err.statusCode = 404;
    err.code = "COMPARE_SET_NOT_FOUND";
    throw err;
  }

  return rows.map((row) => ({
    ...row,
    metrics: computePortfolioMetrics(row),
  }));
}

export async function getPrototypeTimeline(prototypeId, { limit = 40 } = {}) {
  const { rows: prototypes } = await pool.query(
    `SELECT id,
            initiative_id AS "initiativeId",
            prototype_code AS "prototypeCode",
            status,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
       FROM v2.prototypes
      WHERE id = $1
      LIMIT 1`,
    [prototypeId]
  );

  if (!prototypes.length) {
    const err = new Error("PROTOTYPE_NOT_FOUND");
    err.statusCode = 404;
    err.code = "PROTOTYPE_NOT_FOUND";
    throw err;
  }

  const prototype = prototypes[0];
  const cappedLimit = Math.min(Math.max(Number(limit) || 40, 5), 200);
  const initiativeId = prototype.initiativeId;

  const [changes, notes, files, committee, stages, collab] = await Promise.all([
    pool.query(
      `SELECT title, actor_name AS "actorName", created_at AS "createdAt"
         FROM v2.workspace_change_logs
        WHERE initiative_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [initiativeId, cappedLimit]
    ),
    pool.query(
      `SELECT note, evaluator_name AS "evaluatorName", created_at AS "createdAt"
         FROM v2.workspace_evaluator_notes
        WHERE initiative_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [initiativeId, cappedLimit]
    ),
    pool.query(
      `SELECT file_name AS "fileName", file_type AS "fileType", created_at AS "createdAt"
         FROM v2.workspace_files
        WHERE initiative_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [initiativeId, cappedLimit]
    ),
    pool.query(
      `SELECT decision, reviewer_name AS "reviewerName", note, created_at AS "createdAt"
         FROM v2.committee_reviews
        WHERE initiative_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [initiativeId, cappedLimit]
    ),
    pool.query(
      `SELECT stage, stage_label AS "stageLabel", by_user_name AS "byUserName", note, created_at AS "createdAt"
         FROM v2.initiative_stage_events
        WHERE initiative_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [initiativeId, cappedLimit]
    ),
    pool.query(
      `SELECT activity_type AS "activityType", message, actor_name AS "actorName", created_at AS "createdAt"
         FROM v2.prototype_collaboration_activities
        WHERE initiative_id = $1
          AND (prototype_id = $2 OR prototype_id IS NULL)
        ORDER BY created_at DESC
        LIMIT $3`,
      [initiativeId, prototypeId, cappedLimit]
    ),
  ]);

  const events = [
    {
      type: "prototype_created",
      title: "بداية النموذج",
      detail: `تم إنشاء النموذج ${prototype.prototypeCode || prototype.id}`,
      createdAt: prototype.createdAt,
      source: "prototype",
    },
    {
      type: "prototype_updated",
      title: "تحديث النموذج",
      detail: `آخر حالة: ${prototype.status || "unknown"}`,
      createdAt: prototype.updatedAt,
      source: "prototype",
    },
    ...changes.rows.map((x) => ({
      type: "workspace_change",
      title: "تعديل",
      detail: `${x.title}${x.actorName ? ` (${x.actorName})` : ""}`,
      createdAt: x.createdAt,
      source: "workspace",
    })),
    ...notes.rows.map((x) => ({
      type: "evaluator_note",
      title: "ملاحظة اللجنة",
      detail: `${x.note}${x.evaluatorName ? ` (${x.evaluatorName})` : ""}`,
      createdAt: x.createdAt,
      source: "workspace",
    })),
    ...files.rows.map((x) => ({
      type: "file_upload",
      title: "رفع ملف",
      detail: `${x.fileName}${x.fileType ? ` • ${x.fileType}` : ""}`,
      createdAt: x.createdAt,
      source: "workspace",
    })),
    ...committee.rows.map((x) => ({
      type: "committee_decision",
      title: "قرار التحكيم",
      detail: `${x.decision}${x.reviewerName ? ` • ${x.reviewerName}` : ""}${x.note ? ` • ${x.note}` : ""}`,
      createdAt: x.createdAt,
      source: "engine",
    })),
    ...stages.rows.map((x) => ({
      type: "stage_transition",
      title: "انتقال مرحلة",
      detail: `${x.stageLabel || x.stage}${x.byUserName ? ` • ${x.byUserName}` : ""}${x.note ? ` • ${x.note}` : ""}`,
      createdAt: x.createdAt,
      source: "engine",
    })),
    ...collab.rows.map((x) => ({
      type: x.activityType || "collaboration",
      title: "نشاط تعاوني",
      detail: `${x.message}${x.actorName ? ` • ${x.actorName}` : ""}`,
      createdAt: x.createdAt,
      source: "collaboration",
    })),
  ]
    .filter((x) => x.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, cappedLimit);

  return { prototype, events };
}

export async function createPrototype(payload, user) {
  const initiativeId = payload?.initiativeId;
  if (!initiativeId) {
    const err = new Error("INITIATIVE_ID_REQUIRED");
    err.statusCode = 400;
    err.code = "INITIATIVE_ID_REQUIRED";
    throw err;
  }

  const prototypeCode = payload?.prototypeCode || `P-${Math.floor(1000 + Math.random() * 9000)}`;
  const status = payload?.status || "in_progress";
  const progress = clamp(Number(payload?.progress ?? 15));
  const supportLevel = payload?.supportLevel || "uiux";

  const { rows } = await pool.query(
    `INSERT INTO v2.prototypes (initiative_id, prototype_code, status, progress, support_level)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, initiative_id AS "initiativeId", prototype_code AS "prototypeCode", status, progress, support_level AS "supportLevel", created_at AS "createdAt", updated_at AS "updatedAt"`,
    [initiativeId, prototypeCode, status, progress, supportLevel]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "PROTOTYPE_CREATE",
    operation: "create",
    entityId: rows[0].id,
    afterState: rows[0],
  });

  return rows[0];
}
