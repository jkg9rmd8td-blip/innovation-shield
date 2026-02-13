import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS } from "../core/constants.js";
import { renderRoleCapabilities, setButtonPermissionState } from "./role-services.js";
import { applySubnavAccess } from "./subnav-access.js";
import { submitPledgeFlow, submitConfidentialApprovalFlow, getGovernanceDashboard } from "../modules/governance-module.js";
import { notifySuccess, notifyError } from "./notify.js";

const user = requireUser("login.html");
if (!user) throw new Error("UNAUTHORIZED");
if (!can(user.role, PERMISSIONS.PAGE_GOVERNANCE_VIEW)) {
  location.replace("teams.html");
  throw new Error("FORBIDDEN_GOVERNANCE_PAGE");
}

mountNav({ active: "governance", base: "." });

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

renderRoleCapabilities({
  user,
  permissionsEl: $("#govPerms"),
  servicesEl: $("#govServices"),
});

const canSignPledge = can(user.role, PERMISSIONS.GOVERNANCE_PLEDGE_SIGN);
const canConfidential = can(user.role, PERMISSIONS.GOVERNANCE_CONFIDENTIALITY_APPROVE);

setButtonPermissionState({
  element: $("#pledgeBtn"),
  user,
  permission: PERMISSIONS.GOVERNANCE_PLEDGE_SIGN,
  denyText: "لا تملك صلاحية اعتماد التعهد",
});
setButtonPermissionState({
  element: $("#confBtn"),
  user,
  permission: PERMISSIONS.GOVERNANCE_CONFIDENTIALITY_APPROVE,
  denyText: "لا تملك صلاحية موافقة السرية",
});

if (!canSignPledge) {
  $("#pledgeText").disabled = true;
  $("#pledgeHint").textContent = "هذه الخدمة غير متاحة لدورك.";
}
if (!canConfidential) {
  $("#confText").disabled = true;
  $("#confHint").textContent = "هذه الخدمة غير متاحة لدورك.";
}

function renderLogs() {
  const data = getGovernanceDashboard();
  $("#pledgeLog").innerHTML = data.approvals
    .map(
      (x) => `
    <tr>
      <td>${x.userName}</td>
      <td>${x.roleLabel || x.role}</td>
      <td>${x.pledgeText}</td>
      <td>${new Date(x.at).toLocaleString("ar-SA")}</td>
    </tr>
  `
    )
    .join("");

  if (!data.approvals.length) {
    $("#pledgeLog").innerHTML = '<tr><td colspan="4" class="muted">لا توجد سجلات تعهد بعد.</td></tr>';
  }

  $("#confLog").innerHTML = data.confidentialityApprovals
    .map(
      (x) => `
    <tr>
      <td>${x.userName}</td>
      <td>${x.roleLabel || x.role}</td>
      <td>${x.note}</td>
      <td>${new Date(x.at).toLocaleString("ar-SA")}</td>
    </tr>
  `
    )
    .join("");

  if (!data.confidentialityApprovals.length) {
    $("#confLog").innerHTML = '<tr><td colspan="4" class="muted">لا توجد سجلات سرية بعد.</td></tr>';
  }
}

$("#pledgeBtn").addEventListener("click", async () => {
  if (!canSignPledge) return;
  const text = $("#pledgeText").value.trim();
  if (!text) {
    notifyError("اكتب نص التعهد.");
    return;
  }

  try {
    await submitPledgeFlow({ user, pledgeText: text });
    renderLogs();
    notifySuccess("تم اعتماد التعهد بنجاح.");
  } catch (e) {
    notifyError("تعذر تسجيل التعهد: " + e.message);
  }
});

$("#confBtn").addEventListener("click", async () => {
  if (!canConfidential) return;
  const note = $("#confText").value.trim() || "موافقة سرية";

  try {
    await submitConfidentialApprovalFlow({ user, note });
    renderLogs();
    notifySuccess("تم تسجيل موافقة السرية.");
  } catch (e) {
    notifyError("تعذر تسجيل موافقة السرية: " + e.message);
  }
});

renderLogs();
