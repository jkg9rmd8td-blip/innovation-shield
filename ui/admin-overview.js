import { requireAdminPage } from "./admin-guard.js";
import { PERMISSIONS, JOURNEY_STAGES, HEALTH_GOALS } from "../core/constants.js";
import { listInitiativesFlow } from "../modules/initiative-module.js";
import { getExecutiveImpactFlow } from "../modules/impact-module.js";
import { renderRoleCapabilities } from "./role-services.js";
import { applySubnavAccess } from "./subnav-access.js";

const user = requireAdminPage({
  pagePermission: PERMISSIONS.PAGE_ADMIN_OVERVIEW_VIEW,
  active: "admin",
});

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

renderRoleCapabilities({
  user,
  permissionsEl: $("#adminPerms"),
  servicesEl: $("#adminServices"),
  traitsEl: $("#adminTraits"),
});

const fmt = (n) => new Intl.NumberFormat("ar-SA").format(n);
const stageLabelMap = Object.fromEntries(JOURNEY_STAGES.map((s) => [s.key, s.label]));

function renderKpis() {
  const items = listInitiativesFlow();
  const impact = getExecutiveImpactFlow();

  const total = items.length;
  const approved = items.filter((x) => x.status === "معتمد" || x.status === "مطلق").length;
  const acceptance = total ? Math.round((approved / total) * 100) : 0;
  const inPilot = items.filter((x) => x.status === "مرحلة التجربة").length;
  const launched = items.filter((x) => x.status === "مطلق").length;

  const evalDurations = items
    .filter((x) => x.scores.length && x.createdAt)
    .map((x) => {
      const start = new Date(x.createdAt).getTime();
      const firstEval = new Date(x.scores[0]?.at || x.createdAt).getTime();
      return Math.max(0, (firstEval - start) / (1000 * 60 * 60 * 24));
    })
    .filter((x) => x > 0);

  const avgEvalDays = evalDurations.length
    ? Number((evalDurations.reduce((a, b) => a + b, 0) / evalDurations.length).toFixed(1))
    : 0;

  const roi = items.reduce((acc, x) => acc + Number(x.reward?.total || 0), 0) || approved * 320000;

  $("#k_total").textContent = fmt(total);
  $("#k_accept_ratio").textContent = `${fmt(acceptance)}%`;
  $("#k_eval_days").textContent = fmt(avgEvalDays);
  $("#k_pilot").textContent = fmt(inPilot);
  $("#k_launched").textContent = fmt(launched);
  $("#k_roi").textContent = fmt(Math.round(roi));

  const stageCounts = items.reduce((acc, item) => {
    acc[item.stage] = (acc[item.stage] || 0) + 1;
    return acc;
  }, {});

  $("#stageStats").innerHTML = Object.entries(stageCounts)
    .map(
      ([stage, count]) => `
      <div class="info-card">
        <h4>${stageLabelMap[stage] || stage}</h4>
        <span class="kpi-number">${fmt(count)}</span>
      </div>
    `
    )
    .join("");

  if (!Object.keys(stageCounts).length) {
    $("#stageStats").innerHTML = '<div class="muted">لا توجد بيانات مراحل.</div>';
  }

  $("#goalStats").innerHTML = Object.entries(HEALTH_GOALS)
    .map(
      ([key, label]) => `
      <div class="info-card">
        <h4>${label}</h4>
        <span class="kpi-number">${fmt(impact.goalAlignment[key] || 0)}</span>
      </div>
    `
    )
    .join("");

  $("#deptStats").innerHTML = impact.byDepartment
    .map(
      (row) => `
      <tr>
        <td>${row.department}</td>
        <td>${fmt(row.count)}</td>
        <td>${fmt(row.acceptanceRate)}%</td>
        <td>${fmt(row.avgCycleDays)} يوم</td>
        <td>${fmt(row.avgROI)}%</td>
      </tr>
    `
    )
    .join("");

  if (!impact.byDepartment.length) {
    $("#deptStats").innerHTML = '<tr><td colspan="5" class="muted">لا توجد بيانات أقسام.</td></tr>';
  }

  const { stages, matrix } = impact.heatmap;
  let html = '<table class="tbl-lite"><thead><tr><th>القسم</th>';
  html += stages.map((s) => `<th>${stageLabelMap[s] || s}</th>`).join("");
  html += "</tr></thead><tbody>";
  html += matrix
    .map((row) => {
      const cells = stages.map((s) => `<td>${fmt(row[s] || 0)}</td>`).join("");
      return `<tr><td>${row.department}</td>${cells}</tr>`;
    })
    .join("");
  html += "</tbody></table>";
  $("#heatmapTable").innerHTML = html;
}

renderKpis();
