import { mutateState, getState } from "../core/state.js";
import { requirePermission } from "../guards/permission-guard.js";
import { PERMISSIONS } from "../core/constants.js";

export const TRAINING_CATALOG = [
  {
    id: "TR-101",
    title: "صياغة المشكلة الابتكارية",
    durationMin: 20,
    type: "دورة قصيرة",
  },
  {
    id: "TR-102",
    title: "تحليل الجدوى السريع",
    durationMin: 25,
    type: "أداة تحليل",
  },
  {
    id: "TR-103",
    title: "نموذج مبادرة جاهز",
    durationMin: 15,
    type: "نموذج",
  },
  {
    id: "TR-104",
    title: "تجهيز العرض للجنة الابتكار",
    durationMin: 18,
    type: "دليل عملي",
  },
];

export function listTrainingCatalog() {
  return TRAINING_CATALOG;
}

export function listTrainingProgress(userId) {
  const rows = getState().training?.completions || [];
  return rows.filter((x) => x.userId === userId);
}

export function completeTraining(user, trainingId) {
  const guard = requirePermission(user, PERMISSIONS.PAGE_ACADEMY_VIEW);
  if (!guard.ok) throw new Error("FORBIDDEN_TRAINING_COMPLETE");

  let created = null;
  mutateState((state) => {
    state.training = state.training || { completions: [] };
    const exists = state.training.completions.find((x) => x.userId === user.id && x.trainingId === trainingId);
    if (!exists) {
      created = {
        id: `TC-${Math.random().toString(16).slice(2, 8)}`,
        userId: user.id,
        userName: user.name,
        trainingId,
        at: new Date().toISOString(),
      };
      state.training.completions.unshift(created);
    } else {
      created = exists;
    }
    return state;
  });
  return created;
}
