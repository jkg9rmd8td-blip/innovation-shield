import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { submitPledge, submitConfidentialApproval, getGovernanceDashboard } from "../modules/governance-module.js";
import { PERMISSIONS } from "../core/constants.js";
import { can } from "../core/permissions.js";
import { renderRoleCapabilities, setButtonPermissionState } from "./role-services.js";

const user = requireUser("login.html");
if (!user) throw new Error("UNAUTHORIZED");

mountNav({ active: "governance", base: "." });

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} — ${user.roleLabel}`;
renderRoleCapabilities({
  user,
  permissionsEl: $("#govPerms"),
  servicesEl: $("#govServices"),
});

const canGovernanceApprove = can(user.role, PERMISSIONS.GOVERNANCE_APPROVE);
setButtonPermissionState({
  element: $("#pledgeBtn"),
  user,
  permission: PERMISSIONS.GOVERNANCE_APPROVE,
  denyText: "لا تملك صلاحية اعتماد التعهد",
});
setButtonPermissionState({
  element: $("#confBtn"),
  user,
  permission: PERMISSIONS.GOVERNANCE_APPROVE,
  denyText: "لا تملك صلاحية الموافقة السرية",
});
if (!canGovernanceApprove) {
  $("#pledgeText").disabled = true;
  $("#confText").disabled = true;
  $("#pledgeHint").textContent = "الزر معطل: هذه الخدمة مخصصة للأدوار المخولة بالحوكمة.";
  $("#confHint").textContent = "الزر معطل: هذه الخدمة مخصصة للأدوار المخولة بالحوكمة.";
}

function renderLogs() {
  const data = getGovernanceDashboard();
  $("#pledgeLog").innerHTML = data.approvals
    .map((x) => `<tr><td>${x.userName}</td><td>${x.role}</td><td>${x.pledgeText}</td><td>${new Date(x.at).toLocaleString("ar-SA")}</td></tr>`)
    .join("");
  if (!data.approvals.length) $("#pledgeLog").innerHTML = `<tr><td colspan="4" class="muted">لا توجد موافقات تعهد.</td></tr>`;

  $("#confLog").innerHTML = data.confidentialityApprovals
    .map((x) => `<tr><td>${x.userName}</td><td>${x.role}</td><td>${x.note}</td><td>${new Date(x.at).toLocaleString("ar-SA")}</td></tr>`)
    .join("");
  if (!data.confidentialityApprovals.length) $("#confLog").innerHTML = `<tr><td colspan="4" class="muted">لا توجد موافقات سرية.</td></tr>`;
}

$("#pledgeBtn").addEventListener("click", async () => {
  if (!canGovernanceApprove) return;
  const text = $("#pledgeText").value.trim();
  if (!text) return alert("اكتب نص التعهد.");
  try {
    await submitPledge({ user, pledgeText: text });
    renderLogs();
  } catch (e) {
    alert("تعذر تسجيل التعهد: " + e.message);
  }
});

$("#confBtn").addEventListener("click", async () => {
  if (!canGovernanceApprove) return;
  const note = $("#confText").value.trim() || "موافقة سرية";
  try {
    await submitConfidentialApproval({ user, note });
    renderLogs();
  } catch (e) {
    alert("تعذر تسجيل الموافقة: " + e.message);
  }
});

renderLogs();
