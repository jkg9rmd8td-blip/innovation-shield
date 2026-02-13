import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS } from "../core/constants.js";
import { applySubnavAccess } from "./subnav-access.js";
import { listIntegrationsFlow, syncIntegrationFlow } from "../modules/integration-module.js";
import { notifySuccess, notifyError } from "./notify.js";

const user = requireUser("login.html");
if (!user) throw new Error("UNAUTHORIZED");
if (!can(user.role, PERMISSIONS.PAGE_INTEGRATIONS_VIEW)) {
  location.replace("teams.html");
  throw new Error("FORBIDDEN_INTEGRATIONS");
}

mountNav({ active: "integrations", base: "." });

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

const canManage = can(user.role, PERMISSIONS.INTEGRATIONS_MANAGE);

function render() {
  const rows = listIntegrationsFlow();
  $("#integrationRows").innerHTML = Object.entries(rows).map(([key, row]) => `
    <tr>
      <td>${key}</td>
      <td>${row.status}</td>
      <td>${row.lastSyncAt ? new Date(row.lastSyncAt).toLocaleString("ar-SA") : "-"}</td>
      <td>${row.owner || "-"}</td>
      <td><button class="btn sm" data-sync="${key}" ${canManage ? "" : "disabled"}>مزامنة</button></td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-sync]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!canManage) return;
      try {
        await syncIntegrationFlow({ user, integrationKey: btn.getAttribute("data-sync") });
        notifySuccess("تمت المزامنة بنجاح.");
        render();
      } catch (e) {
        notifyError("تعذر تنفيذ المزامنة: " + e.message);
      }
    });
  });
}

render();
