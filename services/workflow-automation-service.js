import { INITIATIVE_STATUS, JOURNEY_STAGES } from "../core/constants.js";
import { pushNotification } from "./notification-service.js";

function stageLabel(key) {
  return JOURNEY_STAGES.find((s) => s.key === key)?.label || key;
}

function pushStage(item, stage, by, note) {
  item.stage = stage;
  if (stage === "evaluation") item.status = INITIATIVE_STATUS.IN_REVIEW;
  if (["team_formation", "prototype", "development"].includes(stage)) item.status = INITIATIVE_STATUS.IN_PROGRESS;
  if (stage === "pilot") item.status = INITIATIVE_STATUS.PILOT;
  if (stage === "approval" || stage === "legal_protection") item.status = INITIATIVE_STATUS.APPROVED;
  if (stage === "launch") item.status = INITIATIVE_STATUS.LAUNCHED;
  item.stageHistory.push({
    stage,
    stageLabel: stageLabel(stage),
    at: new Date().toISOString(),
    by,
    note,
  });
}

export function ensureWorkflowDefaults(item) {
  item.workflow = item.workflow || {};
  item.workflow.requiredEvaluations = Number(item.workflow.requiredEvaluations || 3);
  item.workflow.autoLockEnabled = item.workflow.autoLockEnabled !== false;
  if (!item.workflow.evaluationDueAt) {
    item.workflow.evaluationDueAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
  }
}

export function runWorkflowAutomation(item, actor = "Workflow") {
  ensureWorkflowDefaults(item);

  const aiTotal = Number(item.aiScreening?.total || 0);
  const required = Number(item.workflow.requiredEvaluations || 3);
  const prototypeProgress = Number(item.prototype?.progress || 0);
  const prototypeQuality = Number(item.prototype?.quality?.total || 0);
  const dueAt = new Date(item.workflow.evaluationDueAt).getTime();
  const now = Date.now();

  if (item.stage === "idea_submission" && aiTotal >= 60) {
    pushStage(item, "screening", actor, "اجتياز الفرز الأولي آليًا");
  }

  if (item.stage === "screening" && aiTotal >= 72) {
    pushStage(item, "evaluation", actor, "تحويل تلقائي للتحكيم");
    pushNotification({
      roleTarget: "evaluator",
      type: "evaluation_due",
      message: `مبادرة جديدة بانتظار التقييم: ${item.id}`,
      entityId: item.id,
    });
  }

  if (item.stage === "evaluation" && Number(item.scores?.length || 0) >= required && Number(item.averageScore || 0) >= 70) {
    pushStage(item, "team_formation", actor, "اكتمال التحكيم والانتقال لتشكيل فريق النموذج");
  }

  if (item.stage === "team_formation" && item.prototype?.status && item.prototype.status !== "not_started") {
    pushStage(item, "prototype", actor, "بدء مرحلة تطوير النموذج الأولي");
    pushNotification({
      roleTarget: "support_entity",
      type: "prototype_support",
      message: `مبادرة ${item.id} دخلت مرحلة النموذج الأولي وتحتاج دعم الوحدة`,
      entityId: item.id,
    });
  }

  if (item.stage === "evaluation" && item.workflow.autoLockEnabled && dueAt > 0 && now > dueAt && !item.judgingLocked) {
    item.judgingLocked = true;
    pushNotification({
      roleTarget: "committee",
      type: "judging_locked",
      message: `تم قفل التحكيم آليًا للمبادرة ${item.id}`,
      entityId: item.id,
    });
  }

  if (item.stage === "prototype" && prototypeProgress >= 80 && prototypeQuality >= 70) {
    pushStage(item, "development", actor, "جاهزية النموذج الأولي والانتقال للتطوير");
  }

  if (item.stage === "development" && Number(item.averageScore || 0) >= 75) {
    pushStage(item, "pilot", actor, "جاهزية مبكرة لمرحلة التجربة");
  }
}
