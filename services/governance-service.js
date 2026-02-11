import { mutateState, getState } from "../core/state.js";
import { PERMISSIONS, ACTIONS } from "../core/constants.js";
import { requirePermission } from "../guards/permission-guard.js";

export function signPledge(user, pledgeText) {
  const guard = requirePermission(user, PERMISSIONS.GOVERNANCE_APPROVE);
  if (!guard.ok) throw new Error("FORBIDDEN_GOVERNANCE_APPROVE");

  let after = null;
  mutateState((state) => {
    const row = {
      id: `GV-${Math.random().toString(16).slice(2, 8)}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      pledgeText,
      at: new Date().toISOString(),
    };
    state.governance.approvals.unshift(row);
    after = row;
    return state;
  });

  return {
    action: ACTIONS.GOVERNANCE_ACCEPT,
    before: null,
    after,
  };
}

export function approveConfidentiality(user, note) {
  const guard = requirePermission(user, PERMISSIONS.GOVERNANCE_APPROVE);
  if (!guard.ok) throw new Error("FORBIDDEN_CONFIDENTIALITY_APPROVAL");

  let after = null;
  mutateState((state) => {
    const row = {
      id: `CF-${Math.random().toString(16).slice(2, 8)}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      note: note || "موافقة سرية",
      at: new Date().toISOString(),
    };
    state.governance.confidentialityApprovals.unshift(row);
    after = row;
    return state;
  });

  return {
    action: ACTIONS.GOVERNANCE_CONFIDENTIALITY_APPROVE,
    before: null,
    after,
  };
}

export function listGovernanceLogs() {
  const g = getState().governance;
  return {
    approvals: g.approvals,
    confidentialityApprovals: g.confidentialityApprovals,
  };
}
