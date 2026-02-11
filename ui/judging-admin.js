import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS } from "../core/constants.js";
import { evaluateInitiative, lockInitiativeJudging, approveReward, getJudgingDashboard } from "../modules/judging-module.js";
import { listAuditLogs } from "../services/audit-service.js";
import { renderRoleCapabilities } from "./role-services.js";

const user = requireUser("../login.html");
if (!user) throw new Error("UNAUTHORIZED");
if (!can(user.role, PERMISSIONS.INITIATIVE_EVALUATE) && !can(user.role, PERMISSIONS.ADMIN_ACCESS)) {
  location.replace("../teams.html");
}

mountNav({ active: "admin", base: ".." });

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} — ${user.roleLabel}`;
renderRoleCapabilities({
  user,
  permissionsEl: $("#judgingPerms"),
  servicesEl: $("#judgingServices"),
});

function render() {
  const data = getJudgingDashboard();
  $("#rows").innerHTML = data
    .map(
      (r) => `<tr>
        <td>${r.id}</td>
        <td>${r.title}</td>
        <td>${r.averageScore ?? "—"}</td>
        <td>${r.evaluationsCount}</td>
        <td>${r.judgingLocked ? "مقفل" : "مفتوح"}</td>
        <td>${r.status}</td>
        <td>
          <button class="btn sm" data-score="${r.id}" ${can(user.role, PERMISSIONS.INITIATIVE_EVALUATE) && !r.judgingLocked ? "" : "disabled"} title="${r.judgingLocked ? "التقييم مقفل لهذه المبادرة" : (can(user.role, PERMISSIONS.INITIATIVE_EVALUATE) ? "" : "لا تملك صلاحية التقييم")}">تقييم</button>
          <button class="btn sm ghost" data-lock="${r.id}" ${can(user.role, PERMISSIONS.JUDGING_LOCK) ? "" : "disabled"} title="${can(user.role, PERMISSIONS.JUDGING_LOCK) ? "" : "لا تملك صلاحية قفل التحكيم"}">قفل</button>
          <button class="btn sm" data-reward="${r.id}" ${can(user.role, PERMISSIONS.REWARD_MANAGE) ? "" : "disabled"} title="${can(user.role, PERMISSIONS.REWARD_MANAGE) ? "" : "لا تملك صلاحية توزيع الجوائز"}">جائزة</button>
        </td>
      </tr>`
    )
    .join("");

  document.querySelectorAll("[data-score]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!can(user.role, PERMISSIONS.INITIATIVE_EVALUATE)) return;
      const id = btn.getAttribute("data-score");
      const impact = Number(prompt("درجة الأثر (0-100)", "80") || 0);
      const feasibility = Number(prompt("درجة قابلية التنفيذ (0-100)", "75") || 0);
      const innovation = Number(prompt("درجة الابتكار (0-100)", "82") || 0);
      const alignment = Number(prompt("درجة المواءمة (0-100)", "78") || 0);
      try {
        await evaluateInitiative({
          user,
          initiativeId: id,
          marks: { impact, feasibility, innovation, alignment },
        });
        render();
        renderAudit();
      } catch (e) {
        alert("تعذر التقييم: " + e.message);
      }
    });
  });

  document.querySelectorAll("[data-lock]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!can(user.role, PERMISSIONS.JUDGING_LOCK)) return;
      try {
        await lockInitiativeJudging({ user, initiativeId: btn.getAttribute("data-lock") });
        render();
        renderAudit();
      } catch (e) {
        alert("تعذر القفل: " + e.message);
      }
    });
  });

  document.querySelectorAll("[data-reward]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!can(user.role, PERMISSIONS.REWARD_MANAGE)) return;
      const total = Number(prompt("إجمالي الجائزة", "100000") || 0);
      try {
        await approveReward({
          user,
          initiativeId: btn.getAttribute("data-reward"),
          totalReward: total,
          contributors: [
            { name: "قائد الفريق", weight: 40 },
            { name: "عضو تقني", weight: 35 },
            { name: "عضو داعم", weight: 25 },
          ],
        });
        render();
        renderAudit();
      } catch (e) {
        alert("تعذر توزيع الجائزة: " + e.message);
      }
    });
  });
}

function renderAudit() {
  const logs = listAuditLogs(20).filter((l) => ["submit_evaluation", "lock_judging", "reward_distribution"].includes(l.operation));
  $("#audit").innerHTML = logs
    .map((l) => `<tr><td>${new Date(l.at).toLocaleString("ar-SA")}</td><td>${l.user?.name || "System"}</td><td>${l.operation}</td><td>${l.entityId || "—"}</td></tr>`)
    .join("");
  if (!logs.length) $("#audit").innerHTML = `<tr><td colspan="4" class="muted">لا توجد سجلات تحكيم بعد.</td></tr>`;
}

render();
renderAudit();
