import { mutateState, getState } from "../core/state.js";
import {
  INITIATIVE_STATUS,
  JOURNEY_STAGES,
  STAGE_INDEX,
  PERMISSIONS,
  ACTIONS,
  HEALTH_GOALS,
} from "../core/constants.js";
import { requirePermission } from "../guards/permission-guard.js";
import { runAIScreening } from "./ai-screening-service.js";
import { classifyValueEffort } from "./impact-engine-service.js";
import { runWorkflowAutomation, ensureWorkflowDefaults } from "./workflow-automation-service.js";
import { pushNotification } from "./notification-service.js";

function nextInitiativeId() {
  return `IN-${Math.floor(1000 + Math.random() * 9000)}`;
}

function findStageByKey(key) {
  const stage = JOURNEY_STAGES.find((x) => x.key === key);
  if (!stage) throw new Error("INVALID_STAGE");
  return stage;
}

function findInitiative(state, initiativeId) {
  const idx = state.initiatives.findIndex((x) => x.id === initiativeId);
  if (idx < 0) throw new Error("INITIATIVE_NOT_FOUND");
  return idx;
}

function mapStageToStatus(stageKey) {
  if (stageKey === "evaluation") return INITIATIVE_STATUS.IN_REVIEW;
  if (["team_formation", "prototype", "development"].includes(stageKey)) return INITIATIVE_STATUS.IN_PROGRESS;
  if (stageKey === "pilot") return INITIATIVE_STATUS.PILOT;
  if (stageKey === "approval" || stageKey === "legal_protection") return INITIATIVE_STATUS.APPROVED;
  if (stageKey === "launch") return INITIATIVE_STATUS.LAUNCHED;
  return INITIATIVE_STATUS.DRAFT;
}

function setInitiativeStatus(initiativeId, status) {
  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    before = structuredClone(state.initiatives[idx]);
    state.initiatives[idx].status = status;
    after = structuredClone(state.initiatives[idx]);
    return state;
  });

  return { before, after };
}

export function listInitiatives() {
  return getState().initiatives;
}

export function createInitiative(user, payload) {
  const guard = requirePermission(user, PERMISSIONS.INITIATIVE_CREATE);
  if (!guard.ok) throw new Error("FORBIDDEN_INITIATIVE_CREATE");

  const stage = JOURNEY_STAGES[0];
  const effortScore = Number(payload.effortScore || 50);
  const expectedValueScore = Number(payload.expectedValueScore || 50);
  const goalKey = payload.goalKey && HEALTH_GOALS[payload.goalKey] ? payload.goalKey : "operational_efficiency";
  const aiScreening = runAIScreening({
    title: payload.title,
    description: payload.description,
    goalKey,
    effortScore,
    expectedValueScore,
  });

  const created = {
    id: nextInitiativeId(),
    title: payload.title,
    description: payload.description || "",
    owner: payload.owner || user.name,
    ownerUserId: user.id,
    ownerDepartment: payload.ownerDepartment || user.department || "غير محدد",
    goalKey,
    status: INITIATIVE_STATUS.DRAFT,
    stage: stage.key,
    stageHistory: [
      {
        stage: stage.key,
        stageLabel: stage.label,
        at: new Date().toISOString(),
        by: user.name,
        note: "تسجيل المبادرة",
      },
    ],
    effortScore,
    expectedValueScore,
    aiScreening,
    valueEffortClass: classifyValueEffort(expectedValueScore, effortScore),
    workflow: {
      requiredEvaluations: 3,
      autoLockEnabled: true,
      evaluationDueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    createdAt: new Date().toISOString(),
    scores: [],
    averageScore: null,
    reward: null,
    judgingLocked: false,
    prototype: {
      status: "not_started",
      scope: "",
      progress: 0,
      templatesUsed: [],
      tasks: [],
      files: [],
      notes: [],
      ai: null,
      quality: null,
      supportRequest: null,
      ipLog: [],
      updatedAt: new Date().toISOString(),
    },
    integrationSync: {
      hr: null,
      training: null,
      hospital_ops: null,
    },
  };

  runWorkflowAutomation(created, "Automation");

  const next = mutateState((state) => {
    state.initiatives.unshift(created);
    return state;
  });

  pushNotification({
    roleTarget: "manager",
    type: "initiative_created",
    message: `تم إنشاء مبادرة جديدة: ${created.id}`,
    entityId: created.id,
  });

  return {
    action: ACTIONS.INITIATIVE_CREATE,
    before: null,
    after: next.initiatives.find((x) => x.id === created.id),
    initiative: created,
  };
}

export function updateInitiativeStatus(user, initiativeId, status) {
  const guard = requirePermission(user, PERMISSIONS.INITIATIVE_STATUS_UPDATE);
  if (!guard.ok) throw new Error("FORBIDDEN_INITIATIVE_STATUS_UPDATE");

  const { before, after } = setInitiativeStatus(initiativeId, status);
  return {
    action: ACTIONS.INITIATIVE_STATUS_UPDATE,
    before,
    after,
  };
}

export function approveInitiative(user, initiativeId) {
  const guard = requirePermission(user, PERMISSIONS.INITIATIVE_APPROVE);
  if (!guard.ok) throw new Error("FORBIDDEN_INITIATIVE_APPROVE");

  const { before, after } = setInitiativeStatus(initiativeId, INITIATIVE_STATUS.APPROVED);
  return {
    action: ACTIONS.INITIATIVE_APPROVE,
    before,
    after,
  };
}

export function rejectInitiative(user, initiativeId) {
  const guard = requirePermission(user, PERMISSIONS.INITIATIVE_REJECT);
  if (!guard.ok) throw new Error("FORBIDDEN_INITIATIVE_REJECT");

  const { before, after } = setInitiativeStatus(initiativeId, INITIATIVE_STATUS.REJECTED);
  return {
    action: ACTIONS.INITIATIVE_REJECT,
    before,
    after,
  };
}

export function moveInitiativeStage(user, initiativeId, stageKey, note = "") {
  const guard = requirePermission(user, PERMISSIONS.JOURNEY_STAGE_UPDATE);
  if (!guard.ok) throw new Error("FORBIDDEN_JOURNEY_STAGE_UPDATE");

  const stage = findStageByKey(stageKey);
  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];
    const currentOrder = STAGE_INDEX[item.stage] || 0;
    const targetOrder = STAGE_INDEX[stage.key] || 0;

    if (targetOrder < currentOrder) {
      throw new Error("JOURNEY_BACKWARD_NOT_ALLOWED");
    }

    before = structuredClone(item);

    item.stage = stage.key;
    item.status = mapStageToStatus(stage.key);
    item.stageHistory.push({
      stage: stage.key,
      stageLabel: stage.label,
      at: new Date().toISOString(),
      by: user.name,
      note: note || "تحديث مسار الابتكار",
    });

    ensureWorkflowDefaults(item);
    runWorkflowAutomation(item, "Automation");

    after = structuredClone(item);
    return state;
  });

  return {
    action: ACTIONS.JOURNEY_STAGE_UPDATE,
    before,
    after,
  };
}
