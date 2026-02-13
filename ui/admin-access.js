import { requireAdminPage } from "./admin-guard.js";
import { PERMISSIONS, ROLES, ROLE_TRAITS } from "../core/constants.js";
import { getRoleMatrixFlow } from "../modules/access-module.js";
import { PERMISSION_LABELS, ROLE_SERVICES } from "./role-services.js";
import { applySubnavAccess } from "./subnav-access.js";

const user = requireAdminPage({
  pagePermission: PERMISSIONS.PAGE_ADMIN_ACCESS_VIEW,
  active: "admin",
});

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

const rows = getRoleMatrixFlow();
const toChips = (items) => items.map((x) => `<span class="chip">${x}</span>`).join("");

$("#matrix").innerHTML = rows.map((row) => {
  const pagePerms = row.permissions.filter((p) => p.startsWith("page."));
  const actionPerms = row.permissions.filter((p) => !p.startsWith("page."));

  const pageLabels = pagePerms.map((p) => PERMISSION_LABELS[p] || p);
  const actionLabels = actionPerms.map((p) => PERMISSION_LABELS[p] || p);
  const services = ROLE_SERVICES[row.role] || [];
  const traits = ROLE_TRAITS[row.role] || [];

  return `
    <tr>
      <td>
        <b>${ROLES[row.role] || row.role}</b>
        <div class="tiny muted" style="margin-top:6px;">${toChips(traits)}</div>
      </td>
      <td>${toChips(pageLabels)}</td>
      <td>${toChips(actionLabels)}</td>
      <td>${toChips(services)}</td>
    </tr>
  `;
}).join("");
