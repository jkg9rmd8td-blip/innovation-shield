export const ROLES = {
  innovator: "مبتكر",
  evaluator: "مقيّم",
  committee: "لجنة الابتكار",
  manager: "مدير الابتكار",
  support_entity: "جهة داعمة",
  executive_entity: "جهة تنفيذية",
};

export const ROLE_TRAITS = {
  innovator: ["مبدع", "مبادر", "يركز على الأثر"],
  evaluator: ["تحليلي", "محايد", "دقيق"],
  committee: ["حوكمي", "قرار جماعي", "ضبط جودة"],
  manager: ["قيادي", "تشغيلي", "استراتيجي"],
  support_entity: ["ممكن", "تقني/تشغيلي", "مسرّع"],
  executive_entity: ["تنفيذي", "اعتمادي", "إشرافي شامل"],
};

export const HEALTH_GOALS = {
  reduce_waste: "تقليل الهدر",
  patient_experience: "تحسين تجربة المريض",
  operational_efficiency: "رفع كفاءة التشغيل",
};

export const DEPARTMENTS = [
  "التحول الرقمي",
  "الخدمات العلاجية",
  "الخدمات المساندة",
  "الجودة وسلامة المرضى",
  "الموارد البشرية",
  "التشغيل",
  "الإدارة العليا",
];

export const PERMISSIONS = {
  PAGE_WORKSPACE_VIEW: "page.workspace.view",
  PAGE_INITIATIVES_VIEW: "page.initiatives.view",
  PAGE_JOURNEY_VIEW: "page.journey.view",
  PAGE_PROTOTYPES_VIEW: "page.prototypes.view",
  PAGE_SERVICE_CENTER_VIEW: "page.services.view",
  PAGE_GOVERNANCE_VIEW: "page.governance.view",
  PAGE_MARKETPLACE_VIEW: "page.marketplace.view",
  PAGE_ACADEMY_VIEW: "page.academy.view",
  PAGE_INTEGRATIONS_VIEW: "page.integrations.view",
  PAGE_ADMIN_OVERVIEW_VIEW: "page.admin.overview.view",
  PAGE_ADMIN_ACCESS_VIEW: "page.admin.access.view",
  PAGE_ADMIN_INITIATIVES_VIEW: "page.admin.initiatives.view",
  PAGE_ADMIN_AUDIT_VIEW: "page.admin.audit.view",
  PAGE_ADMIN_JUDGING_VIEW: "page.admin.judging.view",

  INITIATIVE_CREATE: "initiative.create",
  INITIATIVE_STATUS_UPDATE: "initiative.status.update",
  INITIATIVE_READ_ALL: "initiative.read.all",
  INITIATIVE_APPROVE: "initiative.approve",
  INITIATIVE_REJECT: "initiative.reject",

  INITIATIVE_EVALUATE: "initiative.evaluate",
  JUDGING_LOCK: "judging.lock",
  REWARD_MANAGE: "reward.manage",

  JOURNEY_STAGE_UPDATE: "journey.stage.update",
  PROTOTYPE_TASK_MANAGE: "prototype.task.manage",
  PROTOTYPE_SUPPORT_REQUEST: "prototype.support.request",
  PROTOTYPE_SUPPORT_MANAGE: "prototype.support.manage",
  PROTOTYPE_QUALITY_REVIEW: "prototype.quality.review",
  SERVICE_REQUEST_CREATE: "service.request.create",
  SERVICE_REQUEST_MANAGE: "service.request.manage",

  GOVERNANCE_PLEDGE_SIGN: "governance.pledge.sign",
  GOVERNANCE_CONFIDENTIALITY_APPROVE: "governance.confidentiality.approve",
  GOVERNANCE_POLICY_MANAGE: "governance.policy.manage",

  MARKETPLACE_MANAGE: "marketplace.manage",
  TRAINING_MANAGE: "training.manage",
  INTEGRATIONS_MANAGE: "integrations.manage",

  TEAM_MANAGE: "team.manage",
  AUDIT_READ: "audit.read",
  ADMIN_ACCESS: "admin.access",
};

export const ACTIONS = {
  INITIATIVE_CREATE: "INITIATIVE_CREATE",
  INITIATIVE_STATUS_UPDATE: "INITIATIVE_STATUS_UPDATE",
  INITIATIVE_APPROVE: "INITIATIVE_APPROVE",
  INITIATIVE_REJECT: "INITIATIVE_REJECT",
  INITIATIVE_EVALUATE: "INITIATIVE_EVALUATE",
  JUDGING_LOCK: "JUDGING_LOCK",
  REWARD_DISTRIBUTION: "REWARD_DISTRIBUTION",
  JOURNEY_STAGE_UPDATE: "JOURNEY_STAGE_UPDATE",
  GOVERNANCE_PLEDGE_SIGN: "GOVERNANCE_PLEDGE_SIGN",
  GOVERNANCE_CONFIDENTIALITY_APPROVE: "GOVERNANCE_CONFIDENTIALITY_APPROVE",
  AI_SCREENING: "AI_SCREENING",
  AUTO_WORKFLOW: "AUTO_WORKFLOW",
  CONFLICT_BLOCKED: "CONFLICT_BLOCKED",
  MARKETPLACE_ACTION: "MARKETPLACE_ACTION",
  TRAINING_COMPLETE: "TRAINING_COMPLETE",
  INTEGRATION_SYNC: "INTEGRATION_SYNC",
  PROTOTYPE_SCOPE_SET: "PROTOTYPE_SCOPE_SET",
  PROTOTYPE_TASK_CREATE: "PROTOTYPE_TASK_CREATE",
  PROTOTYPE_TASK_UPDATE: "PROTOTYPE_TASK_UPDATE",
  PROTOTYPE_FILE_ADD: "PROTOTYPE_FILE_ADD",
  PROTOTYPE_NOTE_ADD: "PROTOTYPE_NOTE_ADD",
  PROTOTYPE_AI_ADVICE: "PROTOTYPE_AI_ADVICE",
  PROTOTYPE_QUALITY_EVALUATE: "PROTOTYPE_QUALITY_EVALUATE",
  PROTOTYPE_SUPPORT_REQUESTED: "PROTOTYPE_SUPPORT_REQUESTED",
  PROTOTYPE_SUPPORT_MANAGED: "PROTOTYPE_SUPPORT_MANAGED",
  SERVICE_REQUEST_CREATE: "SERVICE_REQUEST_CREATE",
  SERVICE_REQUEST_UPDATE: "SERVICE_REQUEST_UPDATE",
};

export const INITIATIVE_STATUS = {
  DRAFT: "مسودة",
  IN_REVIEW: "قيد التحكيم",
  IN_PROGRESS: "قيد التطوير",
  PILOT: "مرحلة التجربة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  LAUNCHED: "مطلق",
};

export const JOURNEY_STAGES = [
  { key: "idea_submission", label: "تقديم الفكرة", order: 1 },
  { key: "screening", label: "الفرز الأولي", order: 2 },
  { key: "evaluation", label: "التقييم", order: 3 },
  { key: "team_formation", label: "تشكيل الفريق", order: 4 },
  { key: "prototype", label: "تطوير النموذج الأولي", order: 5 },
  { key: "development", label: "التطوير", order: 6 },
  { key: "pilot", label: "التجربة", order: 7 },
  { key: "approval", label: "الاعتماد", order: 8 },
  { key: "legal_protection", label: "الحماية القانونية", order: 9 },
  { key: "launch", label: "الإطلاق", order: 10 },
];

export const STAGE_INDEX = JOURNEY_STAGES.reduce((acc, stage) => {
  acc[stage.key] = stage.order;
  return acc;
}, {});
