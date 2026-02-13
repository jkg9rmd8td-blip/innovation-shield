import { mutateState, getState } from "../core/state.js";
import { PERMISSIONS, ACTIONS, INITIATIVE_STATUS } from "../core/constants.js";
import { requirePermission } from "../guards/permission-guard.js";
import { scoreByRubric, averageScores, distributeRewards } from "./scoring-service.js";
import { checkConflictOfInterest } from "./conflict-checker-service.js";
import { runWorkflowAutomation } from "./workflow-automation-service.js";
import { pushNotification } from "./notification-service.js";
import { logAudit } from "./audit-service.js";

export const DEFAULT_RUBRIC = [
  { key: "impact", label: "الأثر", weight: 35 },
  { key: "feasibility", label: "قابلية التنفيذ", weight: 25 },
  { key: "innovation", label: "الابتكار", weight: 25 },
  { key: "alignment", label: "المواءمة الاستراتيجية", weight: 15 },
];

function findInitiative(state, id) {
  const idx = state.initiatives.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error("INITIATIVE_NOT_FOUND");
  return idx;
}

export function submitEvaluation(user, initiativeId, marks, rubric = DEFAULT_RUBRIC) {
  const guard = requirePermission(user, PERMISSIONS.INITIATIVE_EVALUATE);
  if (!guard.ok) throw new Error("FORBIDDEN_INITIATIVE_EVALUATE");

  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    const item = state.initiatives[idx];

    if (item.judgingLocked) throw new Error("JUDGING_LOCKED");

    const conflict = checkConflictOfInterest({ evaluator: user, initiative: item });
    if (conflict.conflicted) {
      logAudit({
        user,
        action: ACTIONS.CONFLICT_BLOCKED,
        operation: "evaluation_conflict_blocked",
        entityId: initiativeId,
        before: { initiativeId, reason: conflict.reason },
        after: null,
      });
      throw new Error(`CONFLICT_OF_INTEREST:${conflict.reason}`);
    }

    before = structuredClone(item);

    const score = scoreByRubric(rubric, marks);
    item.scores.push({
      judgeId: user.id,
      judgeName: user.name,
      marks,
      score,
      at: new Date().toISOString(),
    });
    item.averageScore = averageScores(item.scores);
    item.status = INITIATIVE_STATUS.IN_REVIEW;

    runWorkflowAutomation(item, "Workflow");

    after = structuredClone(item);
    return state;
  });

  pushNotification({
    roleTarget: "committee",
    type: "evaluation_submitted",
    message: `تمت إضافة تقييم جديد للمبادرة ${initiativeId}`,
    entityId: initiativeId,
  });

  return {
    action: ACTIONS.INITIATIVE_EVALUATE,
    before,
    after,
  };
}

export function lockJudging(user, initiativeId) {
  const guard = requirePermission(user, PERMISSIONS.JUDGING_LOCK);
  if (!guard.ok) throw new Error("FORBIDDEN_JUDGING_LOCK");

  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    before = structuredClone(state.initiatives[idx]);
    state.initiatives[idx].judgingLocked = true;
    after = structuredClone(state.initiatives[idx]);
    return state;
  });

  return {
    action: ACTIONS.JUDGING_LOCK,
    before,
    after,
  };
}

export function rewardInitiative(user, initiativeId, totalReward, contributors) {
  const guard = requirePermission(user, PERMISSIONS.REWARD_MANAGE);
  if (!guard.ok) throw new Error("FORBIDDEN_REWARD_MANAGE");

  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = findInitiative(state, initiativeId);
    before = structuredClone(state.initiatives[idx]);

    state.initiatives[idx].reward = {
      total: Number(totalReward || 0),
      distribution: distributeRewards(Number(totalReward || 0), contributors || []),
      at: new Date().toISOString(),
      by: user.name,
    };
    state.initiatives[idx].status = INITIATIVE_STATUS.APPROVED;

    runWorkflowAutomation(state.initiatives[idx], "Workflow");

    after = structuredClone(state.initiatives[idx]);
    return state;
  });

  return {
    action: ACTIONS.REWARD_DISTRIBUTION,
    before,
    after,
  };
}

export function getJudgingSummary() {
  return getState().initiatives.map((item) => ({
    id: item.id,
    title: item.title,
    owner: item.owner,
    ownerUserId: item.ownerUserId,
    ownerDepartment: item.ownerDepartment,
    status: item.status,
    stage: item.stage,
    averageScore: item.averageScore,
    evaluationsCount: item.scores.length,
    judgingLocked: item.judgingLocked,
    reward: item.reward,
  }));
}
