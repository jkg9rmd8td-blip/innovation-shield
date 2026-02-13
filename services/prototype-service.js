import { getState, mutateState } from "../core/state.js";
import { ACTIONS, PERMISSIONS } from "../core/constants.js";
import { requirePermission } from "../guards/permission-guard.js";
import { can } from "../core/permissions.js";
import { runWorkflowAutomation } from "./workflow-automation-service.js";
import { pushNotification } from "./notification-service.js";

const TASK_TYPES = ["analysis", "design", "development", "testing", "documentation"];

export const PROTOTYPE_TEMPLATES = [
  { key: "dashboard", label: "Dashboard", defaults: ["analysis", "design", "development", "testing"] },
  { key: "chatbot", label: "Chatbot", defaults: ["analysis", "design", "development", "testing", "documentation"] },
  { key: "landing_page", label: "Landing Page", defaults: ["analysis", "design", "development", "testing"] },
  { key: "mobile_mockup", label: "Mobile App Mockup", defaults: ["analysis", "design", "testing", "documentation"] },
  { key: "data_flow", label: "Data Flow Diagram", defaults: ["analysis", "design", "documentation"] },
];

export const PROTOTYPE_QUALITY_RUBRIC = [
  { key: "usability", label: "قابلية الاستخدام", weight: 20 },
  { key: "scalability", label: "قابلية التوسع", weight: 20 },
  { key: "valueClarity", label: "وضوح القيمة", weight: 20 },
  { key: "designQuality", label: "جودة التصميم", weight: 20 },
  { key: "applicability", label: "قابلية التطبيق", weight: 20 },
];

function nextId(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}`;
}

function findInitiative(state, initiativeId) {
  const idx = state.initiatives.findIndex((x) => x.id === initiativeId);
  if (idx < 0) throw new Error("INITIATIVE_NOT_FOUND");
  return idx;
}

function ensurePrototype(item) {
  item.prototype = item.prototype || {};
  item.prototype.status = item.prototype.status || "not_started";
  item.prototype.scope = item.prototype.scope || "";
  item.prototype.progress = Number(item.prototype.progress || 0);
  item.prototype.templatesUsed = Array.isArray(item.prototype.templatesUsed) ? item.prototype.templatesUsed : [];
  item.prototype.tasks = Array.isArray(item.prototype.tasks) ? item.prototype.tasks : [];
  item.prototype.files = Array.isArray(item.prototype.files) ? item.prototype.files : [];
  item.prototype.notes = Array.isArray(item.prototype.notes) ? item.prototype.notes : [];
  item.prototype.ai = item.prototype.ai || null;
  item.prototype.quality = item.prototype.quality || null;
  item.prototype.supportRequest = item.prototype.supportRequest || null;
  item.prototype.ipLog = Array.isArray(item.prototype.ipLog) ? item.prototype.ipLog : [];
  item.prototype.updatedAt = item.prototype.updatedAt || new Date().toISOString();
}

function pushIpLog(item, user, operation, details = "") {
  ensurePrototype(item);
  item.prototype.ipLog.unshift({
    id: nextId("IP"),
    operation,
    details,
    actorId: user?.id || "system",
    actorName: user?.name || "system",
    at: new Date().toISOString(),
  });
  item.prototype.ipLog = item.prototype.ipLog.slice(0, 300);
  item.prototype.updatedAt = new Date().toISOString();
}

function recalcPrototypeProgress(item) {
  ensurePrototype(item);
  const tasks = item.prototype.tasks || [];
  if (!tasks.length) return item.prototype.progress || 0;
  const total = tasks.reduce((sum, t) => sum + Number(t.progress || 0), 0);
  item.prototype.progress = Math.round(total / tasks.length);
  return item.prototype.progress;
}

function markPrototypeActive(item) {
  ensurePrototype(item);
  if (item.prototype.status === "not_started") {
    item.prototype.status = "in_progress";
  }
}

function assertPrototypeTaskManage(user) {
  const guard = requirePermission(user, PERMISSIONS.PROTOTYPE_TASK_MANAGE);
  if (!guard.ok) throw new Error("FORBIDDEN_PROTOTYPE_TASK_MANAGE");
}

function assertPrototypeSupportRequest(user) {
  const guard = requirePermission(user, PERMISSIONS.PROTOTYPE_SUPPORT_REQUEST);
  if (!guard.ok) throw new Error("FORBIDDEN_PROTOTYPE_SUPPORT_REQUEST");
}

function assertPrototypeSupportManage(user) {
  const guard = requirePermission(user, PERMISSIONS.PROTOTYPE_SUPPORT_MANAGE);
  if (!guard.ok) throw new Error("FORBIDDEN_PROTOTYPE_SUPPORT_MANAGE");
}

function assertPrototypeQualityReview(user) {
  const guard = requirePermission(user, PERMISSIONS.PROTOTYPE_QUALITY_REVIEW);
  if (!guard.ok) throw new Error("FORBIDDEN_PROTOTYPE_QUALITY_REVIEW");
}

export function listPrototypeWorkspaces() {
  const state = getState();
  return (state.initiatives || []).map((item) => {
    const prototype = item.prototype || {};
    const tasks = prototype.tasks || [];
    const doneTasks = tasks.filter((t) => Number(t.progress || 0) >= 100).length;
    return {
      id: item.id,
      title: item.title,
      stage: item.stage,
      status: item.status,
      ownerDepartment: item.ownerDepartment || "-",
      prototypeStatus: prototype.status || "not_started",
      prototypeProgress: Number(prototype.progress || 0),
      tasksCount: tasks.length,
      tasksDone: doneTasks,
      filesCount: (prototype.files || []).length,
      qualityScore: Number(prototype.quality?.total || 0),
      supportStatus: prototype.supportRequest?.status || "-",
      updatedAt: prototype.updatedAt || item.createdAt,
    };
  });
}

export function getPrototypeWorkspace(initiativeId) {
  const item = getState().initiatives.find((x) => x.id === initiativeId);
  if (!item) throw new Error("INITIATIVE_NOT_FOUND");
  ensurePrototype(item);
  return item;
}

export function setPrototypeScope(user, initiativeId, scope) {
  assertPrototypeTaskManage(user);
  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    ensurePrototype(item);
    before = structuredClone(item);

    item.prototype.scope = (scope || "").trim();
    markPrototypeActive(item);
    pushIpLog(item, user, "scope_set", "تحديث نطاق النموذج");
    runWorkflowAutomation(item, "Prototype Unit");

    after = structuredClone(item);
    return state;
  });

  return { action: ACTIONS.PROTOTYPE_SCOPE_SET, before, after };
}

export function usePrototypeTemplate(user, initiativeId, templateKey) {
  assertPrototypeTaskManage(user);
  const tpl = PROTOTYPE_TEMPLATES.find((x) => x.key === templateKey);
  if (!tpl) throw new Error("INVALID_PROTOTYPE_TEMPLATE");

  let before = null;
  let after = null;
  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    ensurePrototype(item);
    before = structuredClone(item);

    if (!item.prototype.templatesUsed.includes(tpl.label)) {
      item.prototype.templatesUsed.push(tpl.label);
    }

    tpl.defaults.forEach((taskType) => {
      const title = `مهمة ${taskType} - ${tpl.label}`;
      const exists = item.prototype.tasks.some((t) => t.title === title);
      if (!exists) {
        item.prototype.tasks.push({
          id: nextId("PT"),
          type: taskType,
          title,
          assigneeId: user.id,
          assigneeName: user.name,
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 0,
          impact: "تحسين جودة النموذج",
          status: "open",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    markPrototypeActive(item);
    recalcPrototypeProgress(item);
    pushIpLog(item, user, "template_used", `تفعيل قالب ${tpl.label}`);
    runWorkflowAutomation(item, "Prototype Unit");
    after = structuredClone(item);
    return state;
  });

  return { action: ACTIONS.PROTOTYPE_TASK_CREATE, before, after };
}

export function addPrototypeTask(user, initiativeId, payload) {
  assertPrototypeTaskManage(user);
  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    ensurePrototype(item);
    before = structuredClone(item);

    const type = TASK_TYPES.includes(payload?.type) ? payload.type : "analysis";
    const progress = Math.max(0, Math.min(100, Number(payload?.progress || 0)));
    const status = progress >= 100 ? "done" : progress > 0 ? "in_progress" : "open";

    item.prototype.tasks.push({
      id: nextId("PT"),
      type,
      title: payload?.title?.trim() || "مهمة نموذج أولي",
      assigneeId: payload?.assigneeId || user.id,
      assigneeName: payload?.assigneeName?.trim() || user.name,
      dueAt: payload?.dueAt || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      progress,
      impact: payload?.impact?.trim() || "تحسين قيمة المبادرة",
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    markPrototypeActive(item);
    recalcPrototypeProgress(item);
    pushIpLog(item, user, "task_create", "إضافة مهمة جديدة");
    runWorkflowAutomation(item, "Prototype Unit");

    after = structuredClone(item);
    return state;
  });

  return { action: ACTIONS.PROTOTYPE_TASK_CREATE, before, after };
}

export function updatePrototypeTask(user, initiativeId, taskId, patch = {}) {
  assertPrototypeTaskManage(user);
  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    ensurePrototype(item);
    before = structuredClone(item);

    const taskIdx = item.prototype.tasks.findIndex((t) => t.id === taskId);
    if (taskIdx < 0) throw new Error("PROTOTYPE_TASK_NOT_FOUND");

    const old = item.prototype.tasks[taskIdx];
    const progress = patch.progress === undefined
      ? Number(old.progress || 0)
      : Math.max(0, Math.min(100, Number(patch.progress || 0)));

    item.prototype.tasks[taskIdx] = {
      ...old,
      assigneeName: patch.assigneeName?.trim() || old.assigneeName,
      dueAt: patch.dueAt || old.dueAt,
      impact: patch.impact?.trim() || old.impact,
      progress,
      status: progress >= 100 ? "done" : progress > 0 ? "in_progress" : "open",
      updatedAt: new Date().toISOString(),
    };

    if (patch.note) {
      item.prototype.notes.unshift({
        id: nextId("PN"),
        byUserId: user.id,
        byUserName: user.name,
        text: patch.note.trim(),
        at: new Date().toISOString(),
      });
    }

    markPrototypeActive(item);
    recalcPrototypeProgress(item);
    pushIpLog(item, user, "task_update", "تحديث مهمة النموذج");
    runWorkflowAutomation(item, "Prototype Unit");
    after = structuredClone(item);
    return state;
  });

  return { action: ACTIONS.PROTOTYPE_TASK_UPDATE, before, after };
}

export function addPrototypeFile(user, initiativeId, payload = {}) {
  assertPrototypeTaskManage(user);
  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    ensurePrototype(item);
    before = structuredClone(item);

    item.prototype.files.unshift({
      id: nextId("PF"),
      name: payload.name?.trim() || "ملف النموذج",
      fileType: payload.fileType?.trim() || "doc",
      url: payload.url?.trim() || "#",
      at: new Date().toISOString(),
      byUserId: user.id,
      byUserName: user.name,
    });
    item.prototype.files = item.prototype.files.slice(0, 200);

    markPrototypeActive(item);
    pushIpLog(item, user, "file_add", "إضافة ملف للنموذج");
    runWorkflowAutomation(item, "Prototype Unit");
    after = structuredClone(item);
    return state;
  });

  return { action: ACTIONS.PROTOTYPE_FILE_ADD, before, after };
}

export function addPrototypeNote(user, initiativeId, text) {
  assertPrototypeTaskManage(user);
  if (!text?.trim()) throw new Error("EMPTY_PROTOTYPE_NOTE");
  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    ensurePrototype(item);
    before = structuredClone(item);

    item.prototype.notes.unshift({
      id: nextId("PN"),
      byUserId: user.id,
      byUserName: user.name,
      text: text.trim(),
      at: new Date().toISOString(),
    });
    item.prototype.notes = item.prototype.notes.slice(0, 300);

    markPrototypeActive(item);
    pushIpLog(item, user, "note_add", "إضافة ملاحظة على النموذج");
    runWorkflowAutomation(item, "Prototype Unit");
    after = structuredClone(item);
    return state;
  });

  return { action: ACTIONS.PROTOTYPE_NOTE_ADD, before, after };
}

export function generatePrototypeAISuggestions(user, initiativeId) {
  if (!can(user.role, PERMISSIONS.PROTOTYPE_TASK_MANAGE) && !can(user.role, PERMISSIONS.PROTOTYPE_QUALITY_REVIEW)) {
    throw new Error("FORBIDDEN_PROTOTYPE_AI_ADVICE");
  }

  let before = null;
  let after = null;
  let advice = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    ensurePrototype(item);
    before = structuredClone(item);

    const goal = item.goalKey || "operational_efficiency";
    const common = {
      reduce_waste: "تبسيط التدفقات، خفض التكرار، وقياس وفورات التشغيل",
      patient_experience: "تصميم واجهات خفيفة للمستخدم النهائي مع زمن استجابة قصير",
      operational_efficiency: "هيكلة بيانات معيارية وربط مباشر مع أنظمة التشغيل",
    };

    advice = {
      approach: common[goal] || common.operational_efficiency,
      uiComponents: ["لوحة مؤشرات", "بطاقات حالة", "قائمة مهام", "تنبيهات ذكية"],
      dataStructure: ["initiatives", "prototype_tasks", "prototype_quality", "prototype_ip_log"],
      risks: ["تأخر التكامل", "ضعف توثيق المهام", "نقص الاختبارات القابلة للتكرار"],
      designImprovements: ["تبسيط النماذج", "تقليل النقرات", "توحيد تسميات الإجراءات"],
      at: new Date().toISOString(),
      by: user.name,
    };

    item.prototype.ai = advice;
    markPrototypeActive(item);
    pushIpLog(item, user, "ai_advice", "توليد توصيات AI للنموذج");
    runWorkflowAutomation(item, "Prototype AI");
    after = structuredClone(item);
    return state;
  });

  return { action: ACTIONS.PROTOTYPE_AI_ADVICE, before, after, advice };
}

export function evaluatePrototypeQuality(user, initiativeId, marks = {}) {
  assertPrototypeQualityReview(user);
  let before = null;
  let after = null;
  let quality = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    ensurePrototype(item);
    before = structuredClone(item);

    const weighted = PROTOTYPE_QUALITY_RUBRIC.reduce((sum, r) => {
      const mark = Math.max(0, Math.min(100, Number(marks[r.key] || 0)));
      return sum + mark * Number(r.weight || 0);
    }, 0);
    const totalWeight = PROTOTYPE_QUALITY_RUBRIC.reduce((sum, r) => sum + Number(r.weight || 0), 0) || 100;
    const total = Number((weighted / totalWeight).toFixed(2));

    quality = {
      marks: {
        usability: Number(marks.usability || 0),
        scalability: Number(marks.scalability || 0),
        valueClarity: Number(marks.valueClarity || 0),
        designQuality: Number(marks.designQuality || 0),
        applicability: Number(marks.applicability || 0),
      },
      total,
      byUserId: user.id,
      byUserName: user.name,
      at: new Date().toISOString(),
    };

    item.prototype.quality = quality;
    if (total >= 75 && Number(item.prototype.progress || 0) >= 75) {
      item.prototype.status = "ready_for_judging";
    } else {
      markPrototypeActive(item);
    }

    pushIpLog(item, user, "quality_review", `تقييم جودة النموذج بدرجة ${total}`);
    runWorkflowAutomation(item, "Prototype Quality");
    after = structuredClone(item);
    return state;
  });

  if (quality?.total >= 75) {
    pushNotification({
      roleTarget: "committee",
      type: "prototype_quality_ready",
      message: `النموذج الأولي للمبادرة ${initiativeId} تجاوز حد الجودة (${quality.total}).`,
      entityId: initiativeId,
    });
  }

  return { action: ACTIONS.PROTOTYPE_QUALITY_EVALUATE, before, after, quality };
}

export function requestPrototypeSupport(user, initiativeId, payload = {}) {
  assertPrototypeSupportRequest(user);
  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    ensurePrototype(item);
    before = structuredClone(item);

    item.prototype.supportRequest = {
      id: nextId("PSR"),
      status: "requested",
      slaHours: Math.max(12, Number(payload.slaHours || 72)),
      note: payload.note?.trim() || "طلب خدمة Prototype-as-a-Service",
      requestedBy: user.id,
      requestedByName: user.name,
      requestedByRole: user.role,
      requestedAt: new Date().toISOString(),
      managedBy: null,
      managedByName: null,
      managedAt: null,
      managedNote: "",
    };

    markPrototypeActive(item);
    pushIpLog(item, user, "support_requested", "طلب خدمة النموذج الأولي");
    runWorkflowAutomation(item, "Prototype Support");
    after = structuredClone(item);
    return state;
  });

  pushNotification({
    roleTarget: "manager",
    type: "prototype_support_requested",
    message: `تم طلب خدمة Prototype-as-a-Service للمبادرة ${initiativeId}.`,
    entityId: initiativeId,
  });

  return { action: ACTIONS.PROTOTYPE_SUPPORT_REQUESTED, before, after };
}

export function managePrototypeSupport(user, initiativeId, payload = {}) {
  assertPrototypeSupportManage(user);
  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    ensurePrototype(item);
    before = structuredClone(item);

    const prev = item.prototype.supportRequest || {};
    item.prototype.supportRequest = {
      id: prev.id || nextId("PSR"),
      ...prev,
      status: payload.status || "in_progress",
      managedBy: user.id,
      managedByName: user.name,
      managedAt: new Date().toISOString(),
      managedNote: payload.managedNote?.trim() || prev.managedNote || "",
    };

    markPrototypeActive(item);
    pushIpLog(item, user, "support_managed", `تحديث حالة دعم النموذج إلى ${item.prototype.supportRequest.status}`);
    runWorkflowAutomation(item, "Prototype Support Unit");
    after = structuredClone(item);
    return state;
  });

  pushNotification({
    roleTarget: "innovator",
    type: "prototype_support_updated",
    message: `تم تحديث حالة دعم النموذج للمبادرة ${initiativeId}.`,
    entityId: initiativeId,
  });

  return { action: ACTIONS.PROTOTYPE_SUPPORT_MANAGED, before, after };
}

export function listPrototypeTemplates() {
  return PROTOTYPE_TEMPLATES;
}

export function listPrototypeTaskTypes() {
  return TASK_TYPES;
}

export function listPrototypeQualityRubric() {
  return PROTOTYPE_QUALITY_RUBRIC;
}
