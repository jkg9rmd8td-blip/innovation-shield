import { requireAdminPage } from "./admin-guard.js";
import { PERMISSIONS } from "../core/constants.js";
import { can } from "../core/permissions.js";
import { applySubnavAccess } from "./subnav-access.js";
import { renderRoleCapabilities } from "./role-services.js";
import {
  getJudgingDashboard,
  evaluateInitiativeFlow,
  lockJudgingFlow,
  rewardInitiativeFlow,
} from "../modules/judging-module.js";
import { listAuditLogs } from "../services/audit-service.js";
import { checkConflictOfInterest } from "../services/conflict-checker-service.js";
import { notifySuccess, notifyError } from "./notify.js";

const user = requireAdminPage({
  pagePermission: PERMISSIONS.PAGE_ADMIN_JUDGING_VIEW,
  active: "judging",
});

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

renderRoleCapabilities({
  user,
  permissionsEl: $("#judgingPerms"),
  servicesEl: $("#judgingServices"),
});

function getFilteredRows() {
  const q = $("#judgeSearch").value.trim().toLowerCase();
  const status = $("#judgeStatusFilter").value;
  const lock = $("#judgeLockFilter").value;

  return getJudgingDashboard().filter((row) => {
    const text = `${row.id} ${row.title}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (status && row.status !== status) return false;
    if (lock === "open" && row.judgingLocked) return false;
    if (lock === "locked" && !row.judgingLocked) return false;
    return true;
  });
}

function buildStatusFilter() {
  const statuses = [...new Set(getJudgingDashboard().map((x) => x.status).filter(Boolean))];
  $("#judgeStatusFilter").innerHTML = `<option value="">كل الحالات</option>${statuses
    .map((s) => `<option value="${s}">${s}</option>`)
    .join("")}`;
}

function render() {
  const rows = getFilteredRows();

  const conflictLabel = (reason) => {
    if (reason === "SELF_REVIEW_CONFLICT") return "لا يمكن تقييم المبادرة الذاتية";
    if (reason === "OWNER_NAME_CONFLICT") return "تطابق اسم المقيّم مع مالك المبادرة";
    if (reason === "SAME_DEPARTMENT_CONFLICT") return "تضارب: نفس القسم";
    return "تضارب مصالح";
  };

  $("#rows").innerHTML = rows
    .map((row) => {
      const conflict = checkConflictOfInterest({
        evaluator: user,
        initiative: row,
      });
      const canEvaluate =
        can(user.role, PERMISSIONS.INITIATIVE_EVALUATE) &&
        !row.judgingLocked &&
        !conflict.conflicted;
      const evaluateTitle = conflict.conflicted
        ? conflictLabel(conflict.reason)
        : row.judgingLocked
          ? "التحكيم مقفل"
          : "";

      const actionOptions = [];
      if (canEvaluate) {
        actionOptions.push({ value: "evaluate", label: "تقييم المبادرة" });
      }
      if (can(user.role, PERMISSIONS.JUDGING_LOCK) && !row.judgingLocked) {
        actionOptions.push({ value: "lock", label: "قفل التحكيم" });
      }
      if (can(user.role, PERMISSIONS.REWARD_MANAGE)) {
        actionOptions.push({ value: "reward", label: "توزيع جائزة" });
      }

      return `
    <tr>
      <td>${row.id}</td>
      <td>${row.title}</td>
      <td>${row.stage}</td>
      <td>${row.averageScore ?? "-"}</td>
      <td>${row.evaluationsCount}</td>
      <td>${row.judgingLocked ? "مقفل" : "مفتوح"}</td>
      <td>${row.status}</td>
      <td class="row-actions">
        ${actionOptions.length
          ? `<div class="inline-actions">
              <select data-action-id="${row.id}">
                <option value="">اختر إجراء</option>
                ${actionOptions.map((x) => `<option value="${x.value}">${x.label}</option>`).join("")}
              </select>
              <button class="btn sm primary" data-run-id="${row.id}">تنفيذ</button>
            </div>`
          : `<span class="tiny muted" title="${evaluateTitle}">لا توجد إجراءات متاحة</span>`}
        ${conflict.conflicted ? `<div class="tiny" style="color:#fbbf24;margin-top:4px;">${conflictLabel(conflict.reason)}</div>` : ""}
      </td>
    </tr>
  `;
    })
    .join("");

  if (!rows.length) {
    $("#rows").innerHTML = '<tr><td colspan="8" class="muted">لا توجد نتائج مطابقة.</td></tr>';
  }

  document.querySelectorAll("[data-run-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-run-id");
      const actionEl = document.querySelector(`[data-action-id="${id}"]`);
      const selectedAction = actionEl?.value;

      if (!selectedAction) {
        notifyError("اختر إجراء أولًا.");
        return;
      }

      if (selectedAction === "evaluate") {
        if (!can(user.role, PERMISSIONS.INITIATIVE_EVALUATE)) return;
        const rawMarks = prompt("أدخل الدرجات بالترتيب: الأثر,التنفيذ,الابتكار,المواءمة", "80,76,84,78") || "";
        const [impact, feasibility, innovation, alignment] = rawMarks.split(",").map((x) => Number(x.trim()));
        const marks = [impact, feasibility, innovation, alignment];
        if (marks.some((x) => !Number.isFinite(x) || x < 0 || x > 100)) {
          notifyError("صيغة الدرجات غير صحيحة.");
          return;
        }

        try {
          await evaluateInitiativeFlow({
            user,
            initiativeId: id,
            marks: { impact, feasibility, innovation, alignment },
          });
          render();
          renderAudit();
          notifySuccess("تم حفظ التقييم.");
        } catch (e) {
          notifyError("تعذر تنفيذ التقييم: " + e.message);
        }
        return;
      }

      if (selectedAction === "lock") {
        if (!can(user.role, PERMISSIONS.JUDGING_LOCK)) return;
        try {
          await lockJudgingFlow({
            user,
            initiativeId: id,
          });
          render();
          renderAudit();
          notifySuccess("تم قفل التحكيم للمبادرة.");
        } catch (e) {
          notifyError("تعذر قفل التقييم: " + e.message);
        }
        return;
      }

      if (selectedAction === "reward") {
        if (!can(user.role, PERMISSIONS.REWARD_MANAGE)) return;
        const total = Number(prompt("إجمالي الجائزة", "100000") || 0);

        if (total <= 0) {
          notifyError("أدخل قيمة جائزة صحيحة.");
          return;
        }

        try {
          await rewardInitiativeFlow({
            user,
            initiativeId: id,
            totalReward: total,
            contributors: [
              { name: "قائد الابتكار", weight: 40 },
              { name: "العضو التقني", weight: 35 },
              { name: "الدعم التنفيذي", weight: 25 },
            ],
          });
          render();
          renderAudit();
          notifySuccess("تم توزيع الجائزة بنجاح.");
        } catch (e) {
          notifyError("تعذر توزيع الجائزة: " + e.message);
        }
      }
    });
  });
}

function renderAudit() {
  const rows = listAuditLogs(20).filter((x) =>
    ["submit_evaluation", "lock_judging", "reward_distribution"].includes(x.operation)
  );

  $("#audit").innerHTML = rows
    .map(
      (x) => `
    <tr>
      <td>${new Date(x.at).toLocaleString("ar-SA")}</td>
      <td>${x.user?.name || "system"}</td>
      <td>${x.operation}</td>
      <td>${x.entityId || "-"}</td>
    </tr>
  `
    )
    .join("");

  if (!rows.length) {
    $("#audit").innerHTML = '<tr><td colspan="4" class="muted">لا توجد سجلات تحكيم بعد.</td></tr>';
  }
}

["#judgeSearch", "#judgeStatusFilter", "#judgeLockFilter"].forEach((selector) => {
  $(selector).addEventListener("input", render);
  $(selector).addEventListener("change", render);
});

buildStatusFilter();
render();
renderAudit();
