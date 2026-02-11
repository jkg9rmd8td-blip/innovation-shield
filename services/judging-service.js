import { mutateState, getState } from "../core/state.js";
import { PERMISSIONS, ACTIONS, INITIATIVE_STATUS } from "../core/constants.js";
import { requirePermission } from "../guards/permission-guard.js";
import { scoreByRubric, averageScores, distributeRewards } from "./scoring-service.js";

export const DEFAULT_RUBRIC = [
  { key: "impact", label: "الأثر", weight: 35 },
  { key: "feasibility", label: "قابلية التنفيذ", weight: 30 },
  { key: "innovation", label: "الابتكار", weight: 20 },
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

    after = structuredClone(item);
    return state;
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
      total: totalReward,
      distribution: distributeRewards(totalReward, contributors),
      at: new Date().toISOString(),
    };
    state.initiatives[idx].status = INITIATIVE_STATUS.APPROVED;
    after = structuredClone(state.initiatives[idx]);
    return state;
  });

  return {
    action: ACTIONS.INITIATIVE_APPROVE,
    before,
    after,
  };
}

export function getJudgingSummary() {
  const initiatives = getState().initiatives;
  return initiatives.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    averageScore: item.averageScore,
    evaluationsCount: item.scores.length,
    judgingLocked: item.judgingLocked,
    reward: item.reward,
  }));
}
