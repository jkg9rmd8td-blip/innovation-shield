import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS } from "../core/constants.js";
import { applySubnavAccess } from "./subnav-access.js";
import { notifySuccess, notifyError } from "./notify.js";
import {
  listPrototypeWorkspacesFlow,
  getPrototypeWorkspaceFlow,
  listPrototypeTemplatesFlow,
  listPrototypeTaskTypesFlow,
  setPrototypeScopeFlow,
  usePrototypeTemplateFlow,
  addPrototypeTaskFlow,
  updatePrototypeTaskFlow,
  addPrototypeFileFlow,
  addPrototypeNoteFlow,
  generatePrototypeAISuggestionsFlow,
  evaluatePrototypeQualityFlow,
  requestPrototypeSupportFlow,
  managePrototypeSupportFlow,
} from "../modules/prototype-module.js";
import { listServiceRequests } from "../services/platform-hub-service.js";

const user = requireUser("login.html");
if (!user) throw new Error("UNAUTHORIZED");
if (!can(user.role, PERMISSIONS.PAGE_PROTOTYPES_VIEW)) {
  location.replace("teams.html");
  throw new Error("FORBIDDEN_PROTOTYPES_PAGE");
}

mountNav({ active: "prototypes", base: "." });

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

const canTaskManage = can(user.role, PERMISSIONS.PROTOTYPE_TASK_MANAGE);
const canQualityReview = can(user.role, PERMISSIONS.PROTOTYPE_QUALITY_REVIEW);
const canSupportRequest = can(user.role, PERMISSIONS.PROTOTYPE_SUPPORT_REQUEST);
const canSupportManage = can(user.role, PERMISSIONS.PROTOTYPE_SUPPORT_MANAGE);
const canRunAi = canTaskManage || canQualityReview;

const statusLabel = {
  not_started: "لم يبدأ",
  in_progress: "قيد التنفيذ",
  ready_for_judging: "جاهز للتحكيم",
  approved: "معتمد",
};

let workspaces = [];
let currentInitiativeId = null;

function applyStaticAccess() {
  const lock = (el, enabled, title) => {
    if (!el) return;
    el.disabled = !enabled;
    el.title = enabled ? "" : title;
  };

  lock($("#saveScopeBtn"), canTaskManage, "لا تملك صلاحية إدارة النموذج");
  lock($("#addTaskBtn"), canTaskManage, "لا تملك صلاحية إدارة المهام");
  lock($("#addFileBtn"), canTaskManage, "لا تملك صلاحية رفع الملفات");
  lock($("#addNoteBtn"), canTaskManage, "لا تملك صلاحية إضافة الملاحظات");
  lock($("#runAiBtn"), canRunAi, "لا تملك صلاحية تشغيل AI");
  lock($("#qualityBtn"), canQualityReview, "لا تملك صلاحية تقييم جودة النموذج");
  lock($("#requestSupportBtn"), canSupportRequest, "لا تملك صلاحية طلب خدمة PaaS");
  lock($("#manageSupportBtn"), canSupportManage, "لا تملك صلاحية إدارة دعم النماذج");

  ["#prototypeScope", "#taskType", "#taskTitle", "#taskAssignee", "#taskDue", "#taskImpact", "#fileName", "#fileType", "#fileUrl", "#noteText"].forEach((sel) => {
    const el = $(sel);
    if (el) el.disabled = !canTaskManage;
  });

  ["#q_usability", "#q_scalability", "#q_value", "#q_design", "#q_apply"].forEach((sel) => {
    const el = $(sel);
    if (el) el.disabled = !canQualityReview;
  });

  ["#slaHours", "#slaNote"].forEach((sel) => {
    const el = $(sel);
    if (el) el.disabled = !canSupportRequest;
  });

  ["#supportStatus", "#supportManageNote"].forEach((sel) => {
    const el = $(sel);
    if (el) el.disabled = !canSupportManage;
  });
}

function renderWorkspaceSelect() {
  const options = workspaces.map((w) => `
    <option value="${w.id}" ${w.id === currentInitiativeId ? "selected" : ""}>
      ${w.id} - ${w.title}
    </option>
  `).join("");
  $("#workspaceSelect").innerHTML = options || '<option value="">لا توجد مبادرات</option>';
}

function taskTypeLabel(type) {
  const labels = {
    analysis: "تحليل",
    design: "تصميم",
    development: "تطوير",
    testing: "اختبار",
    documentation: "توثيق",
  };
  return labels[type] || type;
}

function getCurrentWorkspace() {
  if (!currentInitiativeId) return null;
  return getPrototypeWorkspaceFlow(currentInitiativeId);
}

function renderSummary(item) {
  if (!item) {
    $("#p_status").textContent = "-";
    $("#p_progress").textContent = "0%";
    $("#p_quality").textContent = "0";
    $("#p_sla").textContent = "-";
    $("#prototypeScope").value = "";
    $("#supportState").textContent = "لا توجد بيانات.";
    return;
  }

  const proto = item.prototype || {};
  const linkedTicket = listServiceRequests({ user, initiativeId: item.id, mineOnly: false })
    .find((row) => row.source === "prototype");
  $("#p_status").textContent = statusLabel[proto.status] || proto.status || "-";
  $("#p_progress").textContent = `${Number(proto.progress || 0)}%`;
  $("#p_quality").textContent = Number(proto.quality?.total || 0);
  $("#p_sla").textContent = proto.supportRequest?.slaHours ? `${proto.supportRequest.slaHours} ساعة` : "-";
  $("#prototypeScope").value = proto.scope || "";
  $("#supportState").textContent = proto.supportRequest
    ? `الحالة: ${proto.supportRequest.status} | طالب الخدمة: ${proto.supportRequest.requestedByName || "-"}${
      linkedTicket ? ` | التذكرة: ${linkedTicket.id}` : ""
    }`
    : "لا يوجد طلب دعم مسجل.";
}

function renderTemplates(item) {
  const used = new Set(item?.prototype?.templatesUsed || []);
  $("#templateRows").innerHTML = listPrototypeTemplatesFlow()
    .map((tpl) => `
      <tr>
        <td>${tpl.label}</td>
        <td>${tpl.defaults.map(taskTypeLabel).join("، ")}</td>
        <td>
          <button class="btn sm secondary" data-template="${tpl.key}" ${canTaskManage ? "" : "disabled"}>
            ${used.has(tpl.label) ? "مفعّل" : "استخدام القالب"}
          </button>
        </td>
      </tr>
    `)
    .join("");

  document.querySelectorAll("[data-template]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!canTaskManage) return;
      try {
        await usePrototypeTemplateFlow({
          user,
          initiativeId: currentInitiativeId,
          templateKey: btn.getAttribute("data-template"),
        });
        notifySuccess("تم تفعيل القالب وإضافة المهام الافتراضية.");
        renderAll();
      } catch (e) {
        notifyError("تعذر تفعيل القالب: " + e.message);
      }
    });
  });
}

function renderTaskTypeOptions() {
  $("#taskType").innerHTML = listPrototypeTaskTypesFlow()
    .map((x) => `<option value="${x}">${taskTypeLabel(x)}</option>`)
    .join("");
}

function renderTasks(item) {
  const tasks = item?.prototype?.tasks || [];
  $("#taskRows").innerHTML = tasks.map((task) => `
    <tr>
      <td>${taskTypeLabel(task.type)}</td>
      <td>${task.title}</td>
      <td>${task.assigneeName}</td>
      <td>${task.dueAt ? new Date(task.dueAt).toLocaleDateString("ar-SA") : "-"}</td>
      <td>
        <input type="number" min="0" max="100" value="${Number(task.progress || 0)}" data-task-progress="${task.id}" ${canTaskManage ? "" : "disabled"} />
      </td>
      <td>${task.impact || "-"}</td>
      <td>
        <button class="btn sm" data-task-update="${task.id}" ${canTaskManage ? "" : "disabled"}>تحديث</button>
      </td>
    </tr>
  `).join("");

  if (!tasks.length) {
    $("#taskRows").innerHTML = '<tr><td colspan="7" class="muted">لا توجد مهام بعد.</td></tr>';
  }

  document.querySelectorAll("[data-task-update]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!canTaskManage) return;
      const taskId = btn.getAttribute("data-task-update");
      const progressEl = document.querySelector(`[data-task-progress="${taskId}"]`);
      const note = prompt("ملاحظة تحديث (اختياري)", "") || "";
      try {
        await updatePrototypeTaskFlow({
          user,
          initiativeId: currentInitiativeId,
          taskId,
          patch: {
            progress: Number(progressEl?.value || 0),
            note,
          },
        });
        notifySuccess("تم تحديث المهمة.");
        renderAll();
      } catch (e) {
        notifyError("تعذر تحديث المهمة: " + e.message);
      }
    });
  });
}

function renderFiles(item) {
  const files = item?.prototype?.files || [];
  $("#fileRows").innerHTML = files
    .map((f) => `
      <tr>
        <td>${f.name}</td>
        <td>${f.fileType || "-"}</td>
        <td>${f.byUserName || "-"}</td>
        <td>${new Date(f.at).toLocaleString("ar-SA")}</td>
      </tr>
    `)
    .join("");

  if (!files.length) {
    $("#fileRows").innerHTML = '<tr><td colspan="4" class="muted">لا توجد ملفات بعد.</td></tr>';
  }
}

function renderNotes(item) {
  const notes = item?.prototype?.notes || [];
  $("#noteRows").innerHTML = notes
    .map((n) => `
      <div class="split-item">
        <div>
          <b>${n.byUserName || "-"}</b>
          <div class="tiny muted">${n.text}</div>
        </div>
        <div class="tiny muted">${new Date(n.at).toLocaleString("ar-SA")}</div>
      </div>
    `)
    .join("");

  if (!notes.length) {
    $("#noteRows").innerHTML = '<div class="muted">لا توجد ملاحظات بعد.</div>';
  }
}

function renderAI(item) {
  const ai = item?.prototype?.ai;
  if (!ai) {
    $("#aiBlock").textContent = "لا توجد توصيات بعد.";
    return;
  }
  $("#aiBlock").textContent = [
    `النهج المقترح: ${ai.approach}`,
    `مكونات الواجهة: ${(ai.uiComponents || []).join("، ")}`,
    `هيكلة البيانات: ${(ai.dataStructure || []).join("، ")}`,
    `المخاطر: ${(ai.risks || []).join("، ")}`,
    `تحسينات التصميم: ${(ai.designImprovements || []).join("، ")}`,
  ].join("\n");
}

function renderQuality(item) {
  const q = item?.prototype?.quality;
  if (!q) {
    $("#qualityHint").textContent = "لم يتم تقييم الجودة بعد.";
    return;
  }
  $("#qualityHint").textContent = `آخر تقييم: ${q.total} بواسطة ${q.byUserName} (${new Date(q.at).toLocaleString("ar-SA")})`;
}

function renderIpLog(item) {
  const rows = item?.prototype?.ipLog || [];
  $("#ipRows").innerHTML = rows
    .map((x) => `
      <tr>
        <td>${x.operation}</td>
        <td>${x.actorName || "-"}</td>
        <td>${x.details || "-"}</td>
        <td>${new Date(x.at).toLocaleString("ar-SA")}</td>
      </tr>
    `)
    .join("");

  if (!rows.length) {
    $("#ipRows").innerHTML = '<tr><td colspan="4" class="muted">لا توجد سجلات IP بعد.</td></tr>';
  }
}

function renderAll() {
  const item = getCurrentWorkspace();
  renderSummary(item);
  renderTemplates(item);
  renderTasks(item);
  renderFiles(item);
  renderNotes(item);
  renderAI(item);
  renderQuality(item);
  renderIpLog(item);
}

function refreshWorkspaces() {
  workspaces = listPrototypeWorkspacesFlow();
  if (!workspaces.length) {
    currentInitiativeId = null;
  } else if (!workspaces.some((x) => x.id === currentInitiativeId)) {
    currentInitiativeId = workspaces[0].id;
  }
  renderWorkspaceSelect();
  if (currentInitiativeId) {
    renderAll();
  } else {
    renderSummary(null);
    $("#templateRows").innerHTML = '<tr><td colspan="3" class="muted">لا توجد مبادرات مرتبطة.</td></tr>';
    $("#taskRows").innerHTML = '<tr><td colspan="7" class="muted">لا توجد مهام.</td></tr>';
    $("#fileRows").innerHTML = '<tr><td colspan="4" class="muted">لا توجد ملفات.</td></tr>';
    $("#noteRows").innerHTML = '<div class="muted">لا توجد ملاحظات.</div>';
    $("#aiBlock").textContent = "لا توجد توصيات بعد.";
    $("#qualityHint").textContent = "لا توجد بيانات جودة.";
    $("#ipRows").innerHTML = '<tr><td colspan="4" class="muted">لا توجد سجلات.</td></tr>';
  }
}

$("#workspaceSelect").addEventListener("change", () => {
  currentInitiativeId = $("#workspaceSelect").value;
  renderAll();
});

$("#refreshWorkspaceBtn").addEventListener("click", refreshWorkspaces);

$("#saveScopeBtn").addEventListener("click", async () => {
  if (!canTaskManage || !currentInitiativeId) return;
  try {
    await setPrototypeScopeFlow({
      user,
      initiativeId: currentInitiativeId,
      scope: $("#prototypeScope").value,
    });
    notifySuccess("تم حفظ نطاق النموذج.");
    renderAll();
  } catch (e) {
    notifyError("تعذر حفظ النطاق: " + e.message);
  }
});

$("#addTaskBtn").addEventListener("click", async () => {
  if (!canTaskManage || !currentInitiativeId) return;
  const taskTitle = $("#taskTitle").value.trim();
  if (!taskTitle) {
    notifyError("اكتب عنوان المهمة.");
    return;
  }

  try {
    await addPrototypeTaskFlow({
      user,
      initiativeId: currentInitiativeId,
      payload: {
        type: $("#taskType").value,
        title: taskTitle,
        assigneeName: $("#taskAssignee").value.trim() || user.name,
        dueAt: $("#taskDue").value ? new Date($("#taskDue").value).toISOString() : undefined,
        impact: $("#taskImpact").value.trim(),
      },
    });
    $("#taskTitle").value = "";
    $("#taskImpact").value = "";
    notifySuccess("تمت إضافة مهمة جديدة.");
    renderAll();
  } catch (e) {
    notifyError("تعذر إضافة المهمة: " + e.message);
  }
});

$("#addFileBtn").addEventListener("click", async () => {
  if (!canTaskManage || !currentInitiativeId) return;
  const name = $("#fileName").value.trim();
  if (!name) {
    notifyError("أدخل اسم الملف.");
    return;
  }

  try {
    await addPrototypeFileFlow({
      user,
      initiativeId: currentInitiativeId,
      payload: {
        name,
        fileType: $("#fileType").value.trim(),
        url: $("#fileUrl").value.trim(),
      },
    });
    $("#fileName").value = "";
    $("#fileType").value = "";
    $("#fileUrl").value = "";
    notifySuccess("تمت إضافة الملف.");
    renderAll();
  } catch (e) {
    notifyError("تعذر إضافة الملف: " + e.message);
  }
});

$("#addNoteBtn").addEventListener("click", async () => {
  if (!canTaskManage || !currentInitiativeId) return;
  const text = $("#noteText").value.trim();
  if (!text) {
    notifyError("اكتب ملاحظة أولًا.");
    return;
  }

  try {
    await addPrototypeNoteFlow({
      user,
      initiativeId: currentInitiativeId,
      text,
    });
    $("#noteText").value = "";
    notifySuccess("تمت إضافة الملاحظة.");
    renderAll();
  } catch (e) {
    notifyError("تعذر إضافة الملاحظة: " + e.message);
  }
});

$("#runAiBtn").addEventListener("click", async () => {
  if (!canRunAi || !currentInitiativeId) return;
  try {
    await generatePrototypeAISuggestionsFlow({
      user,
      initiativeId: currentInitiativeId,
    });
    notifySuccess("تم توليد توصيات AI للنموذج.");
    renderAll();
  } catch (e) {
    notifyError("تعذر تشغيل AI: " + e.message);
  }
});

$("#qualityBtn").addEventListener("click", async () => {
  if (!canQualityReview || !currentInitiativeId) return;
  try {
    await evaluatePrototypeQualityFlow({
      user,
      initiativeId: currentInitiativeId,
      marks: {
        usability: Number($("#q_usability").value || 0),
        scalability: Number($("#q_scalability").value || 0),
        valueClarity: Number($("#q_value").value || 0),
        designQuality: Number($("#q_design").value || 0),
        applicability: Number($("#q_apply").value || 0),
      },
    });
    notifySuccess("تم حفظ تقييم جودة النموذج.");
    renderAll();
  } catch (e) {
    notifyError("تعذر حفظ تقييم الجودة: " + e.message);
  }
});

$("#requestSupportBtn").addEventListener("click", async () => {
  if (!canSupportRequest || !currentInitiativeId) return;
  try {
    await requestPrototypeSupportFlow({
      user,
      initiativeId: currentInitiativeId,
      payload: {
        slaHours: Number($("#slaHours").value || 72),
        note: $("#slaNote").value.trim(),
      },
    });
    notifySuccess("تم إرسال طلب خدمة النموذج الأولي.");
    renderAll();
  } catch (e) {
    notifyError("تعذر إرسال الطلب: " + e.message);
  }
});

$("#manageSupportBtn").addEventListener("click", async () => {
  if (!canSupportManage || !currentInitiativeId) return;
  try {
    await managePrototypeSupportFlow({
      user,
      initiativeId: currentInitiativeId,
      payload: {
        status: $("#supportStatus").value,
        managedNote: $("#supportManageNote").value.trim(),
      },
    });
    notifySuccess("تم تحديث حالة طلب الدعم.");
    renderAll();
  } catch (e) {
    notifyError("تعذر تحديث طلب الدعم: " + e.message);
  }
});

renderTaskTypeOptions();
applyStaticAccess();
refreshWorkspaces();
