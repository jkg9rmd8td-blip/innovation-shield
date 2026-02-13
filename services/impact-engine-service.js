import { JOURNEY_STAGES } from "../core/constants.js";

function daysBetween(a, b) {
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return (end - start) / (1000 * 60 * 60 * 24);
}

export function classifyValueEffort(expectedValueScore, effortScore) {
  const v = Number(expectedValueScore || 0);
  const e = Number(effortScore || 0);

  if (v >= 75 && e <= 45) return "Quick Win";
  if (v >= 75 && e > 45) return "Strategic Bet";
  if (v < 75 && e <= 45) return "Fill-in";
  return "Re-think";
}

export function estimateROI(initiative) {
  const reward = Number(initiative.reward?.total || 0);
  const value = Number(initiative.expectedValueScore || 50);
  const effort = Number(initiative.effortScore || 50) || 1;

  const estimatedBenefit = reward > 0 ? reward : value * 18000;
  const estimatedCost = effort * 9000;
  const roi = ((estimatedBenefit - estimatedCost) / estimatedCost) * 100;
  return Number(roi.toFixed(1));
}

export function cycleSpeedDays(initiative) {
  const createdAt = initiative.createdAt;
  const last = initiative.stageHistory?.[initiative.stageHistory.length - 1]?.at || initiative.createdAt;
  return Number(daysBetween(createdAt, last).toFixed(1));
}

export function stageDurationMap(initiative) {
  const history = Array.isArray(initiative.stageHistory) ? initiative.stageHistory : [];
  const out = {};
  for (let i = 0; i < history.length; i += 1) {
    const cur = history[i];
    const next = history[i + 1];
    if (!cur?.stage) continue;
    out[cur.stage] = Number(daysBetween(cur.at, next?.at || new Date().toISOString()).toFixed(1));
  }
  return out;
}

export function buildDepartmentComparison(initiatives) {
  const rows = {};
  initiatives.forEach((item) => {
    const dept = item.ownerDepartment || "غير محدد";
    if (!rows[dept]) {
      rows[dept] = {
        department: dept,
        count: 0,
        accepted: 0,
        avgCycleDays: 0,
        avgROI: 0,
      };
    }
    rows[dept].count += 1;
    if (["معتمد", "مطلق"].includes(item.status)) rows[dept].accepted += 1;
    rows[dept].avgCycleDays += cycleSpeedDays(item);
    rows[dept].avgROI += estimateROI(item);
  });

  return Object.values(rows)
    .map((r) => ({
      ...r,
      acceptanceRate: r.count ? Number(((r.accepted / r.count) * 100).toFixed(1)) : 0,
      avgCycleDays: r.count ? Number((r.avgCycleDays / r.count).toFixed(1)) : 0,
      avgROI: r.count ? Number((r.avgROI / r.count).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.acceptanceRate - a.acceptanceRate || b.avgROI - a.avgROI);
}

export function buildGoalAlignment(initiatives) {
  return initiatives.reduce((acc, item) => {
    const key = item.goalKey || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function buildHeatmap(initiatives) {
  const stages = JOURNEY_STAGES.map((s) => s.key);
  const departments = [...new Set(initiatives.map((x) => x.ownerDepartment || "غير محدد"))];

  const matrix = departments.map((department) => {
    const row = { department };
    stages.forEach((stage) => {
      row[stage] = initiatives.filter((x) => (x.ownerDepartment || "غير محدد") === department && x.stage === stage).length;
    });
    return row;
  });

  return { departments, stages, matrix };
}

export function buildExecutiveImpact(initiatives) {
  const byDepartment = buildDepartmentComparison(initiatives);
  const goalAlignment = buildGoalAlignment(initiatives);
  const heatmap = buildHeatmap(initiatives);

  const totalROI = initiatives.reduce((sum, x) => sum + estimateROI(x), 0);
  const avgROI = initiatives.length ? Number((totalROI / initiatives.length).toFixed(1)) : 0;
  const avgCycleSpeed = initiatives.length
    ? Number((initiatives.reduce((sum, x) => sum + cycleSpeedDays(x), 0) / initiatives.length).toFixed(1))
    : 0;

  const valueEffortBuckets = initiatives.reduce((acc, x) => {
    const bucket = classifyValueEffort(x.expectedValueScore, x.effortScore);
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});

  return {
    avgROI,
    avgCycleSpeed,
    byDepartment,
    goalAlignment,
    heatmap,
    valueEffortBuckets,
  };
}
