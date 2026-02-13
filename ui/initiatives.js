import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import {
  listInitiativesFlow,
  createInitiativeFlow,
  updateInitiativeStatusFlow,
} from "../modules/initiative-module.js";
import { PERMISSIONS, INITIATIVE_STATUS, JOURNEY_STAGES, HEALTH_GOALS, DEPARTMENTS } from "../core/constants.js";
import { can } from "../core/permissions.js";
import { setButtonPermissionState } from "./role-services.js";
import { applySubnavAccess } from "./subnav-access.js";
import { notifySuccess, notifyError } from "./notify.js";

const user = requireUser("login.html");
if (!user) throw new Error("UNAUTHORIZED");

if (!can(user.role, PERMISSIONS.PAGE_INITIATIVES_VIEW)) {
  location.replace("teams.html");
  throw new Error("FORBIDDEN_INITIATIVES_PAGE");
}

mountNav({ active: "initiatives", base: "." });

const $ = (s) => document.querySelector(s);
const stageLabelMap = Object.fromEntries(JOURNEY_STAGES.map((s) => [s.key, s.label]));

$("#welcome").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

$("#department").innerHTML = DEPARTMENTS.map((d) => `<option ${d === (user.department || "") ? "selected" : ""}>${d}</option>`).join("");
$("#goal").innerHTML = Object.entries(HEALTH_GOALS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
$("#owner").value = user.name;

function fillFilters(rows) {
  const stages = [...new Set(rows.map((x) => x.stage).filter(Boolean))];
  const statuses = [...new Set(rows.map((x) => x.status).filter(Boolean))];

  $("#stageFilter").innerHTML = `<option value="">كل المراحل</option>${stages
    .map((stage) => `<option value="${stage}">${stageLabelMap[stage] || stage}</option>`)
    .join("")}`;

  $("#statusFilter").innerHTML = `<option value="">كل الحالات</option>${statuses
    .map((status) => `<option value="${status}">${status}</option>`)
    .join("")}`;
}

function computeStats(rows) {
  const total = rows.length;
  const review = rows.filter((x) => x.status === INITIATIVE_STATUS.IN_REVIEW).length;
  const quick = rows.filter((x) => x.valueEffortClass === "Quick Win").length;

  const aiRows = rows.filter((x) => Number.isFinite(Number(x.aiScreening?.total)));
  const aiAvg = aiRows.length
    ? Number((aiRows.reduce((acc, x) => acc + Number(x.aiScreening.total || 0), 0) / aiRows.length).toFixed(1))
    : 0;

  $("#s_total").textContent = total;
  $("#s_review").textContent = review;
  $("#s_quick").textContent = quick;
  $("#s_ai").textContent = aiAvg;
}

function getFilteredRows() {
  const q = $("#q").value.trim().toLowerCase();
  const stage = $("#stageFilter").value;
  const status = $("#statusFilter").value;

  return listInitiativesFlow().filter((item) => {
    const text = `${item.id} ${item.title} ${item.owner}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (stage && item.stage !== stage) return false;
    if (status && item.status !== status) return false;
    return true;
  });
}

function renderInitiatives() {
  const canUpdateStatus = can(user.role, PERMISSIONS.INITIATIVE_STATUS_UPDATE);
  const canOpenServices = can(user.role, PERMISSIONS.PAGE_SERVICE_CENTER_VIEW);
  const filteredRows = getFilteredRows();

  $("#list").innerHTML = filteredRows
    .map(
      (item) => `
    <tr>
      <td>${item.id}</td>
      <td>
        <b>${item.title}</b>
        <div class="tiny muted">${item.description || ""}</div>
      </td>
      <td>${item.ownerDepartment || "-"}</td>
      <td>${HEALTH_GOALS[item.goalKey] || "-"}</td>
      <td><span class="stage-label">${stageLabelMap[item.stage] || item.stage}</span></td>
      <td>${item.aiScreening?.total ?? "-"}</td>
      <td>${item.valueEffortClass || "-"}</td>
      <td>${item.status}</td>
      <td>
        ${canUpdateStatus
          ? `<select data-status-id="${item.id}">
              ${Object.values(INITIATIVE_STATUS)
                .map((s) => `<option ${s === item.status ? "selected" : ""}>${s}</option>`)
                .join("")}
            </select>`
          : '<span class="tiny muted">غير متاح</span>'}
      </td>
      <td>
        ${canOpenServices
          ? `<a class=\"btn sm ghost\" href=\"service-center.html?initiative=${encodeURIComponent(item.id)}\">طلب خدمة</a>`
          : '<span class=\"tiny muted\">غير متاح</span>'}
      </td>
    </tr>
  `
    )
    .join("");

  if (!filteredRows.length) {
    $("#list").innerHTML = '<tr><td colspan="10" class="muted">لا توجد نتائج مطابقة.</td></tr>';
  }

  document.querySelectorAll("[data-status-id]").forEach((sel) => {
    sel.addEventListener("change", async () => {
      try {
        await updateInitiativeStatusFlow({
          user,
          initiativeId: sel.getAttribute("data-status-id"),
          status: sel.value,
        });
        computeStats(listInitiativesFlow());
        renderInitiatives();
        notifySuccess("تم تحديث حالة المبادرة.");
      } catch (e) {
        notifyError("تعذر تحديث الحالة: " + e.message);
      }
    });
  });
}

function refreshAll() {
  const rows = listInitiativesFlow();
  computeStats(rows);
  renderInitiatives();
}

async function handleCreateInitiative() {
  const title = $("#title").value.trim();
  const owner = $("#owner").value.trim();
  const description = $("#description").value.trim();
  const ownerDepartment = $("#department").value;
  const goalKey = $("#goal").value;
  const effortScore = Number($("#effortScore").value || 50);
  const expectedValueScore = Number($("#valueScore").value || 75);

  if (!title) {
    notifyError("اكتب عنوان المبادرة.");
    return;
  }

  try {
    const result = await createInitiativeFlow({
      user,
      payload: {
        title,
        owner: owner || user.name,
        description,
        ownerDepartment,
        goalKey,
        effortScore,
        expectedValueScore,
      },
    });

    $("#title").value = "";
    $("#description").value = "";
    $("#owner").value = user.name;
    fillFilters(listInitiativesFlow());
    refreshAll();
    $("#title").focus();

    notifySuccess(`تم إنشاء المبادرة (${result.initiative.id}) ونتيجة AI = ${result.initiative.aiScreening.total}`);
  } catch (e) {
    notifyError("تعذر إنشاء المبادرة: " + e.message);
  }
}

$("#createBtn").addEventListener("click", handleCreateInitiative);

["#title", "#owner", "#effortScore", "#valueScore"].forEach((selector) => {
  $(selector).addEventListener("keydown", (e) => {
    if (e.key === "Enter" && can(user.role, PERMISSIONS.INITIATIVE_CREATE)) {
      e.preventDefault();
      handleCreateInitiative();
    }
  });
});

setButtonPermissionState({
  element: $("#createBtn"),
  user,
  permission: PERMISSIONS.INITIATIVE_CREATE,
  denyText: "لا تملك صلاحية إنشاء مبادرة",
});

if (!can(user.role, PERMISSIONS.INITIATIVE_CREATE)) {
  ["#title", "#owner", "#description", "#department", "#goal", "#effortScore", "#valueScore"].forEach((sel) => {
    $(sel).disabled = true;
  });
  $("#createHint").textContent = "الإنشاء معطل لهذا الدور.";
}

["#q", "#stageFilter", "#statusFilter"].forEach((selector) => {
  $(selector).addEventListener("input", renderInitiatives);
  $(selector).addEventListener("change", renderInitiatives);
});

fillFilters(listInitiativesFlow());
refreshAll();
