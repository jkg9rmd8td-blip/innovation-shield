import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { PERMISSIONS } from "../core/constants.js";
import { can } from "../core/permissions.js";
import { getRoleMatrix } from "../modules/access-module.js";
import { listAuditLogs } from "../services/audit-service.js";
import { listInitiativesFlow, approveInitiativeFlow, rejectInitiativeFlow } from "../modules/initiative-module.js";
import { renderRoleCapabilities } from "./role-services.js";

const user = requireUser("../login.html");
if (!user) throw new Error("UNAUTHORIZED");
if (!can(user.role, PERMISSIONS.ADMIN_ACCESS)) {
  location.replace("../teams.html");
}

mountNav({ active: "admin", base: ".." });

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} — ${user.roleLabel}`;
renderRoleCapabilities({
  user,
  permissionsEl: $("#adminPerms"),
  servicesEl: $("#adminServices"),
});

function renderMatrix() {
  const rows = getRoleMatrix();
  $("#matrix").innerHTML = rows
    .map((r) => `<tr><td>${r.role}</td><td>${r.permissions.join(" , ")}</td></tr>`)
    .join("");
}

function renderInitiatives() {
  const items = listInitiativesFlow();
  $("#initiatives").innerHTML = items
    .map(
      (i) => `<tr>
        <td>${i.id}</td>
        <td>${i.title}</td>
        <td>${i.status}</td>
        <td>${i.averageScore ?? "—"}</td>
        <td>
          <button data-approve="${i.id}" class="btn sm" ${can(user.role, PERMISSIONS.INITIATIVE_APPROVE) ? "" : "disabled"} title="${can(user.role, PERMISSIONS.INITIATIVE_APPROVE) ? "" : "لا تملك صلاحية الاعتماد"}">اعتماد</button>
          <button data-reject="${i.id}" class="btn sm ghost" ${can(user.role, PERMISSIONS.INITIATIVE_REJECT) ? "" : "disabled"} title="${can(user.role, PERMISSIONS.INITIATIVE_REJECT) ? "" : "لا تملك صلاحية الرفض"}">رفض</button>
        </td>
      </tr>`
    )
    .join("");

  document.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!can(user.role, PERMISSIONS.INITIATIVE_APPROVE)) return;
      try {
        await approveInitiativeFlow({ user, initiativeId: btn.getAttribute("data-approve") });
        renderInitiatives();
        renderAudit();
      } catch (e) {
        alert("تعذر الاعتماد: " + e.message);
      }
    });
  });

  document.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!can(user.role, PERMISSIONS.INITIATIVE_REJECT)) return;
      try {
        await rejectInitiativeFlow({ user, initiativeId: btn.getAttribute("data-reject") });
        renderInitiatives();
        renderAudit();
      } catch (e) {
        alert("تعذر الرفض: " + e.message);
      }
    });
  });
}

function renderAudit() {
  const logs = listAuditLogs(30);
  $("#audit").innerHTML = logs
    .map(
      (l) => `<tr>
      <td>${new Date(l.at).toLocaleString("ar-SA")}</td>
      <td>${l.user?.name || "System"}</td>
      <td>${l.operation}</td>
      <td>${l.action}</td>
      <td><code>${JSON.stringify(l.before)}</code></td>
      <td><code>${JSON.stringify(l.after)}</code></td>
    </tr>`
    )
    .join("");
  if (!logs.length) $("#audit").innerHTML = `<tr><td colspan="6" class="muted">لا توجد سجلات تدقيق.</td></tr>`;
}

renderMatrix();
renderInitiatives();
renderAudit();
