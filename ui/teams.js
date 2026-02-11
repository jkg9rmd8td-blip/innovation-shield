import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { listInitiativesFlow, createInitiativeFlow, updateInitiativeStatusFlow } from "../modules/initiative-module.js";
import { PERMISSIONS, INITIATIVE_STATUS } from "../core/constants.js";
import { can } from "../core/permissions.js";
import { renderRoleCapabilities, setButtonPermissionState } from "./role-services.js";

const user = requireUser("login.html");
if (!user) {
  throw new Error("UNAUTHORIZED");
}

mountNav({ active: "teams", base: "." });

const $ = (s) => document.querySelector(s);

$("#welcome").textContent = `${user.name} — ${user.roleLabel}`;
renderRoleCapabilities({
  user,
  permissionsEl: $("#rolePerms"),
  servicesEl: $("#roleServices"),
});

function renderInitiatives() {
  const items = listInitiativesFlow();
  $("#list").innerHTML = items
    .map(
      (i) => `
      <tr>
        <td>${i.id}</td>
        <td>${i.title}</td>
        <td>${i.owner}</td>
        <td>${i.status}</td>
        <td>${i.averageScore ?? "—"}</td>
        <td>
          ${can(user.role, PERMISSIONS.INITIATIVE_STATUS_UPDATE)
            ? `<select data-status-id="${i.id}">
                <option ${i.status === INITIATIVE_STATUS.DRAFT ? "selected" : ""}>${INITIATIVE_STATUS.DRAFT}</option>
                <option ${i.status === INITIATIVE_STATUS.IN_REVIEW ? "selected" : ""}>${INITIATIVE_STATUS.IN_REVIEW}</option>
                <option ${i.status === INITIATIVE_STATUS.APPROVED ? "selected" : ""}>${INITIATIVE_STATUS.APPROVED}</option>
                <option ${i.status === INITIATIVE_STATUS.REJECTED ? "selected" : ""}>${INITIATIVE_STATUS.REJECTED}</option>
              </select>`
            : "—"}
        </td>
      </tr>
    `
    )
    .join("");

  document.querySelectorAll("[data-status-id]").forEach((sel) => {
    sel.addEventListener("change", async () => {
      try {
        await updateInitiativeStatusFlow({
          user,
          initiativeId: sel.getAttribute("data-status-id"),
          status: sel.value,
        });
        renderInitiatives();
      } catch (e) {
        alert("تعذر تحديث الحالة: " + e.message);
      }
    });
  });
}

$("#createBtn").addEventListener("click", async () => {
  const title = $("#title").value.trim();
  const owner = $("#owner").value.trim();

  if (!title) return alert("اكتب عنوان المبادرة.");

  try {
    await createInitiativeFlow({
      user,
      payload: { title, owner: owner || user.name },
    });
    $("#title").value = "";
    renderInitiatives();
  } catch (e) {
    alert("تعذر إنشاء المبادرة: " + e.message);
  }
});

setButtonPermissionState({
  element: $("#createBtn"),
  user,
  permission: PERMISSIONS.INITIATIVE_CREATE,
  denyText: "لا تملك صلاحية إنشاء مبادرة",
});
if (!can(user.role, PERMISSIONS.INITIATIVE_CREATE)) {
  $("#title").disabled = true;
  $("#owner").disabled = true;
  $("#createHint").textContent = "الزر معطل لأن دورك لا يملك صلاحية الإنشاء.";
}

renderInitiatives();
