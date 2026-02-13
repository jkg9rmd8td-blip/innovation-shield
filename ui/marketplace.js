import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS } from "../core/constants.js";
import { applySubnavAccess } from "./subnav-access.js";
import { listMarketplaceFlow, submitMarketplaceOfferFlow } from "../modules/marketplace-module.js";
import { notifySuccess, notifyError } from "./notify.js";

const user = requireUser("login.html");
if (!user) throw new Error("UNAUTHORIZED");
if (!can(user.role, PERMISSIONS.PAGE_MARKETPLACE_VIEW)) {
  location.replace("teams.html");
  throw new Error("FORBIDDEN_MARKETPLACE");
}

mountNav({ active: "marketplace", base: "." });

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

function getRows() {
  const q = $("#marketSearch").value.trim().toLowerCase();
  return listMarketplaceFlow().filter((item) => {
    const txt = `${item.id} ${item.title}`.toLowerCase();
    return q ? txt.includes(q) : true;
  });
}

function render() {
  const rows = getRows();
  $("#marketRows").innerHTML = rows.map((item) => `
    <tr>
      <td><b>${item.title}</b><div class="tiny muted">${item.id}</div></td>
      <td>${item.status}</td>
      <td>${item.ownerDepartment || "-"}</td>
      <td>${item.offers.length}</td>
      <td><button class="btn sm" data-offer="${item.id}">تقديم عرض</button></td>
    </tr>
  `).join("");

  if (!rows.length) {
    $("#marketRows").innerHTML = '<tr><td colspan="5" class="muted">لا توجد مبادرات جاهزة في السوق.</td></tr>';
  }

  document.querySelectorAll("[data-offer]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await submitMarketplaceOfferFlow({
          user,
          initiativeId: btn.getAttribute("data-offer"),
          roleType: $("#marketRoleType").value,
          note: $("#marketNote").value.trim(),
        });
        notifySuccess("تم إرسال عرضك في السوق.");
        render();
      } catch (e) {
        notifyError("تعذر إرسال العرض: " + e.message);
      }
    });
  });
}

$("#marketSearch").addEventListener("input", render);
render();
