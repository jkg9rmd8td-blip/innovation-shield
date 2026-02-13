import { requireAdminPage } from "./admin-guard.js";
import { PERMISSIONS } from "../core/constants.js";
import { can } from "../core/permissions.js";
import { applySubnavAccess } from "./subnav-access.js";
import {
  listInitiativesFlow,
  approveInitiativeFlow,
  rejectInitiativeFlow,
} from "../modules/initiative-module.js";
import { notifySuccess, notifyError } from "./notify.js";

const user = requireAdminPage({
  pagePermission: PERMISSIONS.PAGE_ADMIN_INITIATIVES_VIEW,
  active: "admin",
});

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

const canApprove = can(user.role, PERMISSIONS.INITIATIVE_APPROVE);
const canReject = can(user.role, PERMISSIONS.INITIATIVE_REJECT);

function render() {
  const rows = listInitiativesFlow();

  $("#initiatives").innerHTML = rows
    .map(
      (item) => `
    <tr>
      <td>${item.id}</td>
      <td>${item.title}</td>
      <td>${item.stage}</td>
      <td>${item.status}</td>
      <td>${item.averageScore ?? "-"}</td>
      <td class="row-actions">
        ${(canApprove || canReject)
          ? `<div class="inline-actions">
              <select data-decision-id="${item.id}">
                <option value="">اختر قرارًا</option>
                ${canApprove ? '<option value="approve">اعتماد المبادرة</option>' : ""}
                ${canReject ? '<option value="reject">رفض المبادرة</option>' : ""}
              </select>
              <button class="btn sm primary" data-apply-decision="${item.id}">تنفيذ</button>
            </div>`
          : '<span class="tiny muted">لا تملك صلاحيات قرار.</span>'}
      </td>
    </tr>
  `
    )
    .join("");

  document.querySelectorAll("[data-apply-decision]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-apply-decision");
      const selectEl = document.querySelector(`[data-decision-id="${id}"]`);
      const action = selectEl?.value;
      if (!action) {
        notifyError("اختر قرارًا أولًا.");
        return;
      }

      try {
        if (action === "approve") {
          if (!canApprove) return;
          await approveInitiativeFlow({ user, initiativeId: id });
          notifySuccess("تم اعتماد المبادرة.");
        } else if (action === "reject") {
          if (!canReject) return;
          await rejectInitiativeFlow({ user, initiativeId: id });
          notifySuccess("تم رفض المبادرة.");
        }

        render();
      } catch (e) {
        notifyError("تعذر تنفيذ القرار: " + e.message);
      }
    });
  });

  if (!canApprove && !canReject) {
    $("#actionsHint").textContent = "أزرار القرار معطلة لهذا الدور.";
  }
}

render();
