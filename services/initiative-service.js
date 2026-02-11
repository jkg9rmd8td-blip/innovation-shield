import { mutateState, getState } from "../core/state.js";
import { INITIATIVE_STATUS, PERMISSIONS, ACTIONS } from "../core/constants.js";
import { requirePermission } from "../guards/permission-guard.js";

function nextInitiativeId() {
  return `IN-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function listInitiatives() {
  return getState().initiatives;
}

export function createInitiative(user, payload) {
  const guard = requirePermission(user, PERMISSIONS.INITIATIVE_CREATE);
  if (!guard.ok) throw new Error("FORBIDDEN_INITIATIVE_CREATE");

  const created = {
    id: nextInitiativeId(),
    title: payload.title,
    owner: payload.owner || user.name,
    status: INITIATIVE_STATUS.DRAFT,
    createdAt: new Date().toISOString(),
    scores: [],
    averageScore: null,
    reward: null,
    judgingLocked: false,
  };

  const next = mutateState((state) => {
    state.initiatives.unshift(created);
    return state;
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

  let before = null;
  let after = null;

  mutateState((state) => {
    const idx = state.initiatives.findIndex((x) => x.id === initiativeId);
    if (idx < 0) throw new Error("INITIATIVE_NOT_FOUND");
    before = structuredClone(state.initiatives[idx]);
    state.initiatives[idx].status = status;
    after = structuredClone(state.initiatives[idx]);
    return state;
  });

  return {
    action: ACTIONS.INITIATIVE_STATUS_UPDATE,
    before,
    after,
  };
}

export function approveInitiative(user, initiativeId) {
  const guard = requirePermission(user, PERMISSIONS.INITIATIVE_APPROVE);
  if (!guard.ok) throw new Error("FORBIDDEN_INITIATIVE_APPROVE");
  return updateInitiativeStatus(user, initiativeId, INITIATIVE_STATUS.APPROVED);
}

export function rejectInitiative(user, initiativeId) {
  const guard = requirePermission(user, PERMISSIONS.INITIATIVE_REJECT);
  if (!guard.ok) throw new Error("FORBIDDEN_INITIATIVE_REJECT");
  return updateInitiativeStatus(user, initiativeId, INITIATIVE_STATUS.REJECTED);
}
