import { pool } from "../../db/pool.js";

function mapRowsToDict(rows, keyField, valueField) {
  return rows.reduce((acc, row) => {
    acc[row[keyField]] = Number(row[valueField]) || 0;
    return acc;
  }, {});
}

export async function getDashboardAnalytics() {
  const [
    initiativesTotal,
    stageDist,
    statusDist,
    maturityAvg,
    impactAgg,
    qualityAvg,
    prototypesTotal,
    servicesOpen,
    auditTotal,
    marketplaceTotal,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM v2.initiatives`),
    pool.query(`SELECT stage, COUNT(*)::int AS total FROM v2.initiatives GROUP BY stage`),
    pool.query(`SELECT status, COUNT(*)::int AS total FROM v2.initiatives GROUP BY status`),
    pool.query(`SELECT ROUND(AVG(score)::numeric,2) AS avg_score FROM v2.idea_maturity_scores`),
    pool.query(`SELECT ROUND(AVG((delta->>'timeDaysSaved')::numeric),2) AS avg_time_saved,
                       ROUND(AVG((delta->>'costSarSaved')::numeric),2) AS avg_cost_saved,
                       ROUND(AVG((delta->>'qualityGain')::numeric),2) AS avg_quality_gain,
                       ROUND(AVG((delta->>'satisfactionGain')::numeric),2) AS avg_satisfaction_gain
                FROM v2.impact_simulations`),
    pool.query(`SELECT ROUND(AVG(average_score)::numeric,2) AS avg_quality FROM v2.initiatives WHERE average_score IS NOT NULL`),
    pool.query(`SELECT COUNT(*)::int AS total FROM v2.prototypes`),
    pool.query(`SELECT COUNT(*)::int AS total FROM v2.service_requests WHERE status IN ('open','in_progress')`),
    pool.query(`SELECT COUNT(*)::int AS total FROM v2.audit_logs`),
    pool.query(`SELECT COUNT(*)::int AS total FROM v2.marketplace_offers`),
  ]);

  const kpis = {
    initiatives: initiativesTotal.rows[0]?.total || 0,
    prototypes: prototypesTotal.rows[0]?.total || 0,
    openServiceRequests: servicesOpen.rows[0]?.total || 0,
    marketplaceOffers: marketplaceTotal.rows[0]?.total || 0,
    auditEvents: auditTotal.rows[0]?.total || 0,
  };

  const qualityIndicators = {
    avgJudgingScore: qualityAvg.rows[0]?.avg_quality || 0,
    avgIdeaMaturity: maturityAvg.rows[0]?.avg_score || 0,
  };

  const progressIndicators = {
    byStage: mapRowsToDict(stageDist.rows, "stage", "total"),
    byStatus: mapRowsToDict(statusDist.rows, "status", "total"),
  };

  const impactIndicators = {
    avgTimeSavedDays: impactAgg.rows[0]?.avg_time_saved || 0,
    avgCostSavedSar: impactAgg.rows[0]?.avg_cost_saved || 0,
    avgQualityGain: impactAgg.rows[0]?.avg_quality_gain || 0,
    avgSatisfactionGain: impactAgg.rows[0]?.avg_satisfaction_gain || 0,
  };

  return {
    generatedAt: new Date().toISOString(),
    kpis,
    qualityIndicators,
    progressIndicators,
    impactIndicators,
  };
}
