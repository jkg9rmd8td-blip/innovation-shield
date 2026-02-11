import { ROLES, PERMISSIONS } from "../core/constants.js";
import { can, getRolePermissions } from "../core/permissions.js";

export const PERMISSION_LABELS = {
  [PERMISSIONS.INITIATIVE_CREATE]: "إنشاء مبادرة",
  [PERMISSIONS.INITIATIVE_STATUS_UPDATE]: "تعديل حالة المبادرة",
  [PERMISSIONS.INITIATIVE_EVALUATE]: "تقييم المبادرات",
  [PERMISSIONS.INITIATIVE_APPROVE]: "اعتماد المبادرات",
  [PERMISSIONS.INITIATIVE_REJECT]: "رفض المبادرات",
  [PERMISSIONS.INITIATIVE_READ_ALL]: "عرض كل المبادرات",
  [PERMISSIONS.TEAM_MANAGE]: "إدارة الفرق",
  [PERMISSIONS.GOVERNANCE_APPROVE]: "اعتماد التعهدات",
  [PERMISSIONS.GOVERNANCE_MANAGE]: "إدارة الحوكمة",
  [PERMISSIONS.REWARD_MANAGE]: "توزيع الجوائز",
  [PERMISSIONS.JUDGING_LOCK]: "قفل التحكيم",
  [PERMISSIONS.AUDIT_READ]: "عرض سجل التدقيق",
  [PERMISSIONS.ADMIN_ACCESS]: "الوصول للوحة الإدارة",
};

export const ROLE_SERVICES = {
  employee: [
    "تقديم مبادرات جديدة",
    "اعتماد التعهدات والالتزام",
    "متابعة حالة المبادرات",
  ],
  lead: [
    "قيادة مسار المبادرات",
    "إدارة حالة المبادرة",
    "حوكمة فريق الابتكار",
  ],
  judge: [
    "تقييم المبادرات بالمعايير",
    "إدخال درجات التحكيم",
    "مراجعة سجل التدقيق",
  ],
  supervisor: [
    "إدارة مسار الحوكمة",
    "رفض المبادرات غير المطابقة",
    "إدارة تشغيل الإدارة",
  ],
  executive: [
    "اعتماد/رفض نهائي",
    "قفل التحكيم وتوزيع الجوائز",
    "إدارة شاملة للنظام",
  ],
};

export function getRoleSummary(user) {
  const role = user?.role;
  const roleLabel = ROLES[role] || role;
  const perms = getRolePermissions(role);
  const services = ROLE_SERVICES[role] || [];
  return {
    role,
    roleLabel,
    permissions: perms,
    permissionLabels: perms.includes("*")
      ? ["كل الصلاحيات"]
      : perms.map((p) => PERMISSION_LABELS[p] || p),
    services,
  };
}

export function renderRoleCapabilities({ user, permissionsEl, servicesEl }) {
  const summary = getRoleSummary(user);

  if (permissionsEl) {
    permissionsEl.innerHTML = summary.permissionLabels
      .map((x) => `<span class="badge" style="margin:3px;">${x}</span>`)
      .join("");
  }

  if (servicesEl) {
    servicesEl.innerHTML = summary.services
      .map((x) => `<div class="team"><div>${x}</div></div>`)
      .join("");
  }

  return summary;
}

export function setButtonPermissionState({ element, user, permission, denyText }) {
  if (!element) return;
  const allowed = can(user.role, permission);
  element.disabled = !allowed;
  if (!allowed && denyText) {
    element.title = denyText;
  } else {
    element.removeAttribute("title");
  }
}
