import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS } from "../core/constants.js";
import { applySubnavAccess } from "./subnav-access.js";
import { listTrainingCatalogFlow, listTrainingProgressFlow, completeTrainingFlow } from "../modules/training-module.js";
import { notifySuccess, notifyError } from "./notify.js";

const user = requireUser("login.html");
if (!user) throw new Error("UNAUTHORIZED");
if (!can(user.role, PERMISSIONS.PAGE_ACADEMY_VIEW)) {
  location.replace("teams.html");
  throw new Error("FORBIDDEN_ACADEMY");
}

mountNav({ active: "academy", base: "." });

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

function renderCatalog() {
  const progress = listTrainingProgressFlow(user.id);
  const doneIds = new Set(progress.map((x) => x.trainingId));

  $("#catalog").innerHTML = listTrainingCatalogFlow().map((c) => `
    <article class="feature-card">
      <h4>${c.title}</h4>
      <p>${c.type} - ${c.durationMin} دقيقة</p>
      <button class="btn sm" data-train="${c.id}" ${doneIds.has(c.id) ? "disabled" : ""}>${doneIds.has(c.id) ? "مكتمل" : "إكمال"}</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-train]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await completeTrainingFlow({ user, trainingId: btn.getAttribute("data-train") });
        notifySuccess("تم تسجيل إكمال الدورة.");
        renderCatalog();
        renderProgress();
      } catch (e) {
        notifyError("تعذر تسجيل الإكمال: " + e.message);
      }
    });
  });
}

function renderProgress() {
  const rows = listTrainingProgressFlow(user.id);
  $("#progress").innerHTML = rows.map((r) => `
    <tr>
      <td>${r.trainingId}</td>
      <td>${new Date(r.at).toLocaleString("ar-SA")}</td>
    </tr>
  `).join("");

  if (!rows.length) {
    $("#progress").innerHTML = '<tr><td colspan="2" class="muted">لا يوجد تقدم تدريبي بعد.</td></tr>';
  }
}

renderCatalog();
renderProgress();
