import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS } from "../core/constants.js";
import { listJourneyItemsFlow, listJourneyStagesFlow, updateJourneyStageFlow } from "../modules/journey-module.js";
import { applySubnavAccess } from "./subnav-access.js";
import { setButtonPermissionState } from "./role-services.js";
import { notifySuccess, notifyError } from "./notify.js";

const user = requireUser("login.html");
if (!user) throw new Error("UNAUTHORIZED");
if (!can(user.role, PERMISSIONS.PAGE_JOURNEY_VIEW)) {
  location.replace("teams.html");
  throw new Error("FORBIDDEN_JOURNEY_PAGE");
}

mountNav({ active: "journey", base: "." });

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

const stages = listJourneyStagesFlow();

function fillFilters() {
  $("#journeyStageFilter").innerHTML = `<option value="">كل المراحل</option>${stages
    .map((s) => `<option value="${s.key}">${s.label}</option>`)
    .join("")}`;
}

function getRows() {
  const q = $("#journeySearch").value.trim().toLowerCase();
  const stage = $("#journeyStageFilter").value;

  return listJourneyItemsFlow().filter((item) => {
    const text = `${item.id} ${item.title}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (stage && item.stage !== stage) return false;
    return true;
  });
}

function renderHistory(item) {
  const rows = (item?.stageHistory || []).slice().reverse();
  if (!rows.length) {
    $("#historyRows").innerHTML = '<tr><td colspan="5" class="muted">لا يوجد سجل مراحل.</td></tr>';
    return;
  }

  $("#historyRows").innerHTML = rows
    .map(
      (h) => `
    <tr>
      <td>${item.id}</td>
      <td>${h.stageLabel || h.stage}</td>
      <td>${h.by || "-"}</td>
      <td>${h.note || "-"}</td>
      <td>${new Date(h.at).toLocaleString("ar-SA")}</td>
    </tr>
  `
    )
    .join("");
}

function render() {
  const rows = getRows();
  const canUpdateStage = can(user.role, PERMISSIONS.JOURNEY_STAGE_UPDATE);

  $("#journeyRows").innerHTML = rows
    .map((item) => {
      const stageData = stages.find((s) => s.key === item.stage);
      const progress = Math.round(((stageData?.order || 1) / stages.length) * 100);
      const lastHistory = item.stageHistory[item.stageHistory.length - 1];

      return `
      <tr>
        <td>${item.id}</td>
        <td>${item.title}</td>
        <td><span class="stage-label">${stageData?.label || item.stage}</span></td>
        <td>
          <div class="progress-wrap">
            <div class="progress-bar" style="width:${progress}%"></div>
          </div>
          <div class="tiny muted">${progress}%</div>
        </td>
        <td>${item.workflow?.evaluationDueAt ? new Date(item.workflow.evaluationDueAt).toLocaleDateString("ar-SA") : "-"}</td>
        <td>${item.judgingLocked ? "مقفل" : "مفتوح"}</td>
        <td>${lastHistory?.note || "-"}</td>
        <td>
          <button class="btn sm ghost" data-show-history="${item.id}">عرض السجل</button>
          ${canUpdateStage
            ? `<select data-stage-id="${item.id}">${stages
                .map((s) => `<option value="${s.key}" ${s.key === item.stage ? "selected" : ""}>${s.label}</option>`)
                .join("")}</select>
               <input data-note-id="${item.id}" placeholder="ملاحظة التحديث" />
               <button class="btn sm" data-move-id="${item.id}">تحديث</button>`
            : '<span class="tiny muted">التحديث غير متاح</span>'}
        </td>
      </tr>
    `;
    })
    .join("");

  if (!rows.length) {
    $("#journeyRows").innerHTML = '<tr><td colspan="8" class="muted">لا توجد نتائج مطابقة.</td></tr>';
  }

  document.querySelectorAll("[data-show-history]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-show-history");
      const item = listJourneyItemsFlow().find((x) => x.id === id);
      if (!item) return;
      $("#historyHint").textContent = `سجل مراحل ${item.title}`;
      renderHistory(item);
    });
  });

  document.querySelectorAll("[data-move-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-move-id");
      const stageEl = document.querySelector(`[data-stage-id="${id}"]`);
      const noteEl = document.querySelector(`[data-note-id="${id}"]`);
      try {
        await updateJourneyStageFlow({
          user,
          initiativeId: id,
          stageKey: stageEl.value,
          note: noteEl.value.trim(),
        });
        render();
        const item = listJourneyItemsFlow().find((x) => x.id === id);
        if (item) renderHistory(item);
        notifySuccess("تم تحديث مسار الابتكار.");
      } catch (e) {
        notifyError("تعذر تحديث المرحلة: " + e.message);
      }
    });
  });
}

setButtonPermissionState({
  element: $("#bulkJourneyUpdateBtn"),
  user,
  permission: PERMISSIONS.JOURNEY_STAGE_UPDATE,
  denyText: "لا تملك صلاحية تحريك مراحل الرحلة",
});

$("#bulkJourneyUpdateBtn").addEventListener("click", () => {
  if (!can(user.role, PERMISSIONS.JOURNEY_STAGE_UPDATE)) return;
  notifySuccess("يمكنك الآن تحديث المراحل من كل صف في الجدول.");
});

["#journeySearch", "#journeyStageFilter"].forEach((selector) => {
  $(selector).addEventListener("input", render);
  $(selector).addEventListener("change", render);
});

fillFilters();
render();
