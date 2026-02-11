export const ROLES = {
  employee: "موظف",
  lead: "قائد",
  judge: "محكم",
  supervisor: "مشرف",
  executive: "إدارة عليا",
};

export const PERMISSIONS = {
  INITIATIVE_CREATE: "initiative.create",
  INITIATIVE_STATUS_UPDATE: "initiative.status.update",
  INITIATIVE_EVALUATE: "initiative.evaluate",
  INITIATIVE_APPROVE: "initiative.approve",
  INITIATIVE_REJECT: "initiative.reject",
  INITIATIVE_READ_ALL: "initiative.read.all",
  TEAM_MANAGE: "team.manage",
  GOVERNANCE_APPROVE: "governance.approve",
  GOVERNANCE_MANAGE: "governance.manage",
  REWARD_MANAGE: "reward.manage",
  JUDGING_LOCK: "judging.lock",
  AUDIT_READ: "audit.read",
  ADMIN_ACCESS: "admin.access",
};

export const ACTIONS = {
  INITIATIVE_CREATE: "INITIATIVE_CREATE",
  INITIATIVE_STATUS_UPDATE: "INITIATIVE_STATUS_UPDATE",
  INITIATIVE_EVALUATE: "INITIATIVE_EVALUATE",
  INITIATIVE_APPROVE: "INITIATIVE_APPROVE",
  INITIATIVE_REJECT: "INITIATIVE_REJECT",
  JUDGING_LOCK: "JUDGING_LOCK",
  GOVERNANCE_ACCEPT: "GOVERNANCE_ACCEPT",
  GOVERNANCE_CONFIDENTIALITY_APPROVE: "GOVERNANCE_CONFIDENTIALITY_APPROVE",
};

export const INITIATIVE_STATUS = {
  DRAFT: "مسودة",
  IN_REVIEW: "قيد التحكيم",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
};
