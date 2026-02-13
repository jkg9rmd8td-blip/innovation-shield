import { ROLES, ROLE_TRAITS, PERMISSIONS } from "../core/constants.js";
import { can, getRolePermissions } from "../core/permissions.js";

export const PERMISSION_LABELS = {
  [PERMISSIONS.PAGE_WORKSPACE_VIEW]: "الوصول لمساحة العمل",
  [PERMISSIONS.PAGE_INITIATIVES_VIEW]: "الوصول لصفحة المبادرات",
  [PERMISSIONS.PAGE_JOURNEY_VIEW]: "الوصول لمسار الابتكار",
  [PERMISSIONS.PAGE_PROTOTYPES_VIEW]: "الوصول لصفحة النماذج الأولية",
  [PERMISSIONS.PAGE_SERVICE_CENTER_VIEW]: "الوصول لمركز الخدمات",
  [PERMISSIONS.PAGE_GOVERNANCE_VIEW]: "الوصول للحوكمة",
  [PERMISSIONS.PAGE_MARKETPLACE_VIEW]: "الوصول لسوق الابتكار",
  [PERMISSIONS.PAGE_ACADEMY_VIEW]: "الوصول لأكاديمية الابتكار",
  [PERMISSIONS.PAGE_INTEGRATIONS_VIEW]: "الوصول للتكاملات",
  [PERMISSIONS.PAGE_ADMIN_OVERVIEW_VIEW]: "الوصول للإدارة (نظرة عامة)",
  [PERMISSIONS.PAGE_ADMIN_ACCESS_VIEW]: "الوصول لإدارة الصلاحيات",
  [PERMISSIONS.PAGE_ADMIN_INITIATIVES_VIEW]: "الوصول لإدارة المبادرات",
  [PERMISSIONS.PAGE_ADMIN_AUDIT_VIEW]: "الوصول لسجل التدقيق",
  [PERMISSIONS.PAGE_ADMIN_JUDGING_VIEW]: "الوصول لمسار التحكيم",
  [PERMISSIONS.INITIATIVE_CREATE]: "إنشاء مبادرات",
  [PERMISSIONS.INITIATIVE_STATUS_UPDATE]: "تحديث حالة المبادرات",
  [PERMISSIONS.INITIATIVE_READ_ALL]: "عرض جميع المبادرات",
  [PERMISSIONS.INITIATIVE_APPROVE]: "اعتماد المبادرات",
  [PERMISSIONS.INITIATIVE_REJECT]: "رفض المبادرات",
  [PERMISSIONS.INITIATIVE_EVALUATE]: "تقييم المبادرات",
  [PERMISSIONS.JUDGING_LOCK]: "قفل التقييم",
  [PERMISSIONS.REWARD_MANAGE]: "توزيع الجوائز",
  [PERMISSIONS.JOURNEY_STAGE_UPDATE]: "تحريك مراحل مسار الابتكار",
  [PERMISSIONS.PROTOTYPE_TASK_MANAGE]: "إدارة مهام النموذج الأولي",
  [PERMISSIONS.PROTOTYPE_SUPPORT_REQUEST]: "طلب خدمة النموذج الأولي (PaaS)",
  [PERMISSIONS.PROTOTYPE_SUPPORT_MANAGE]: "تشغيل وحدة دعم النماذج الأولية",
  [PERMISSIONS.PROTOTYPE_QUALITY_REVIEW]: "تقييم جودة النموذج الأولي",
  [PERMISSIONS.SERVICE_REQUEST_CREATE]: "إنشاء طلبات الخدمة",
  [PERMISSIONS.SERVICE_REQUEST_MANAGE]: "إدارة طلبات الخدمة",
  [PERMISSIONS.GOVERNANCE_PLEDGE_SIGN]: "اعتماد التعهد",
  [PERMISSIONS.GOVERNANCE_CONFIDENTIALITY_APPROVE]: "اعتماد السرية",
  [PERMISSIONS.GOVERNANCE_POLICY_MANAGE]: "إدارة سياسات الحوكمة",
  [PERMISSIONS.MARKETPLACE_MANAGE]: "إدارة سوق الابتكار",
  [PERMISSIONS.TRAINING_MANAGE]: "إدارة التدريب",
  [PERMISSIONS.INTEGRATIONS_MANAGE]: "إدارة التكاملات",
  [PERMISSIONS.TEAM_MANAGE]: "إدارة الفرق",
  [PERMISSIONS.AUDIT_READ]: "قراءة سجل التدقيق",
  [PERMISSIONS.ADMIN_ACCESS]: "إدارة الوصول الشامل",
};

export const ROLE_SERVICES = {
  innovator: [
    "تسجيل فكرة ابتكارية وربطها بهدف استراتيجي",
    "متابعة AI Screening وقيمة/جهد",
    "الوصول لسوق الابتكار والأكاديمية",
    "إدارة مهام النموذج الأولي ورفع الملفات",
    "طلب خدمات تمكين عبر مركز الخدمات",
  ],
  evaluator: [
    "تقييم المبادرات بنظام Rubric",
    "استلام تنبيهات التقييم الآلية",
    "مراجعة المسار قبل وبعد التحكيم",
    "تقييم جودة النموذج الأولي",
    "متابعة الطلبات المرتبطة بالتحكيم من مركز الخدمات",
  ],
  committee: [
    "اتخاذ قرارات الاعتماد والرفض",
    "قفل التحكيم وإدارة الازدحام",
    "مراقبة تضارب المصالح قبل كل تقييم",
    "مراجعة جاهزية النماذج الأولية للتحكيم",
    "تشغيل مسارات خدمة الحوكمة السريعة",
  ],
  manager: [
    "تشغيل المنصة وربطها بالأهداف الصحية",
    "إدارة التكاملات وسوق الابتكار والتدريب",
    "مراقبة أثر الابتكار وHeatmap التنفيذي",
    "تشغيل وحدة دعم النماذج الأولية (Prototype Support Unit)",
    "إدارة مركز الخدمات الشامل على مستوى المنصة",
  ],
  support_entity: [
    "دعم التنفيذ وتحديث مراحل المبادرات",
    "تقديم عروض في Marketplace",
    "إدارة مزامنة التكاملات التشغيلية",
    "تقديم خدمة Prototype-as-a-Service وفق SLA",
    "إدارة الطلبات التشغيلية في مركز الخدمات",
  ],
  executive_entity: [
    "إشراف شامل على الأداء والحوكمة",
    "قرارات تنفيذية نهائية",
    "متابعة ROI وسرعة دورة الابتكار",
    "رؤية موحدة لحالة الخدمات والطلبات",
  ],
};

export function getRoleSummary(user) {
  const role = user?.role;
  const permissions = getRolePermissions(role);
  const labels = permissions.map((p) => PERMISSION_LABELS[p] || p);

  return {
    role,
    roleLabel: ROLES[role] || role,
    permissions,
    permissionLabels: labels,
    services: ROLE_SERVICES[role] || [],
  };
}

export function renderRoleCapabilities({ user, permissionsEl, servicesEl, traitsEl }) {
  const summary = getRoleSummary(user);

  if (permissionsEl) {
    permissionsEl.innerHTML = summary.permissionLabels.map((x) => `<span class="chip">${x}</span>`).join("");
  }

  if (servicesEl) {
    servicesEl.innerHTML = summary.services.map((x) => `<div class="list-item">${x}</div>`).join("");
  }

  if (traitsEl) {
    const traits = ROLE_TRAITS[user?.role] || [];
    traitsEl.innerHTML = traits.length
      ? traits.map((x) => `<span class="chip">${x}</span>`).join("")
      : '<span class="tiny muted">لا توجد صفات معرفة لهذا الدور.</span>';
  }

  return summary;
}

export function setButtonPermissionState({ element, user, permission, denyText }) {
  if (!element) return;
  const allowed = can(user.role, permission);
  element.disabled = !allowed;
  if (!allowed) {
    element.title = denyText || "غير متاح لهذا الدور";
  } else {
    element.removeAttribute("title");
  }
}

export function setLinkPermissionState({ element, user, permission, denyText }) {
  if (!element) return;
  const allowed = can(user.role, permission);
  if (!allowed) {
    element.classList.add("is-disabled");
    element.style.pointerEvents = "none";
    element.setAttribute("aria-disabled", "true");
    element.title = denyText || "غير متاح لهذا الدور";
  } else {
    element.classList.remove("is-disabled");
    element.style.pointerEvents = "";
    element.removeAttribute("aria-disabled");
    element.removeAttribute("title");
  }
}
