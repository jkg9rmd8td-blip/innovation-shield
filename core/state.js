import { readJson, writeJson, nowISO } from "./storage.js";
import { INITIATIVE_STATUS } from "./constants.js";

const STATE_KEY = "STATE";

const DEFAULT_STATE = {
  initiatives: [
    {
      id: "IN-1001",
      title: "تحسين رحلة المراجع الرقمية",
      owner: "فريق التحول",
      status: INITIATIVE_STATUS.DRAFT,
      createdAt: nowISO(),
      scores: [],
      averageScore: null,
      reward: null,
      judgingLocked: false,
    },
    {
      id: "IN-1002",
      title: "أتمتة أوامر التشغيل الداخلية",
      owner: "فريق التشغيل الذكي",
      status: INITIATIVE_STATUS.IN_REVIEW,
      createdAt: nowISO(),
      scores: [],
      averageScore: null,
      reward: null,
      judgingLocked: false,
    },
  ],
  teams: [
    {
      id: "TM-1001",
      name: "فريق التحول",
      members: ["سارة", "فهد"],
    },
  ],
  governance: {
    approvals: [],
    confidentialityApprovals: [],
  },
};

export function getState() {
  return readJson(STATE_KEY, DEFAULT_STATE);
}

export function saveState(state) {
  writeJson(STATE_KEY, state);
}

export function mutateState(mutator) {
  const current = getState();
  const next = mutator(structuredClone(current));
  saveState(next);
  return next;
}
