import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS } from "../core/constants.js";
import { renderRoleCapabilities, setLinkPermissionState } from "./role-services.js";
import { applySubnavAccess } from "./subnav-access.js";
import { listNotifications, markNotificationRead } from "../services/notification-service.js";
import { getLeaderboardFlow } from "../modules/gamification-module.js";

const user = requireUser("login.html");
if (!user) throw new Error("UNAUTHORIZED");

if (!can(user.role, PERMISSIONS.PAGE_WORKSPACE_VIEW)) {
  location.replace("initiatives.html");
  throw new Error("FORBIDDEN_WORKSPACE");
}

mountNav({ active: "workspace", base: "." });

const $ = (s) => document.querySelector(s);
$("#welcome").textContent = `${user.name} - ${user.roleLabel}`;

renderRoleCapabilities({
  user,
  permissionsEl: $("#rolePerms"),
  servicesEl: $("#roleServices"),
  traitsEl: $("#roleTraits"),
});

applySubnavAccess(user);

setLinkPermissionState({
  element: $("#goInitiatives"),
  user,
  permission: PERMISSIONS.PAGE_INITIATIVES_VIEW,
  denyText: "لا تملك صلاحية الدخول لصفحة المبادرات",
});
setLinkPermissionState({
  element: $("#goJourney"),
  user,
  permission: PERMISSIONS.PAGE_JOURNEY_VIEW,
  denyText: "لا تملك صلاحية الدخول لمسار الابتكار",
});
setLinkPermissionState({
  element: $("#goPrototypes"),
  user,
  permission: PERMISSIONS.PAGE_PROTOTYPES_VIEW,
  denyText: "لا تملك صلاحية الدخول للنماذج الأولية",
});
setLinkPermissionState({
  element: $("#goServices"),
  user,
  permission: PERMISSIONS.PAGE_SERVICE_CENTER_VIEW,
  denyText: "لا تملك صلاحية الدخول لمركز الخدمات",
});
setLinkPermissionState({
  element: $("#goMarketplace"),
  user,
  permission: PERMISSIONS.PAGE_MARKETPLACE_VIEW,
  denyText: "لا تملك صلاحية الدخول لسوق الابتكار",
});
setLinkPermissionState({
  element: $("#goAcademy"),
  user,
  permission: PERMISSIONS.PAGE_ACADEMY_VIEW,
  denyText: "لا تملك صلاحية الدخول لأكاديمية الابتكار",
});

function renderNotifications() {
  const rows = listNotifications(user.role).slice(0, 12);
  $("#notifList").innerHTML = rows
    .map(
      (n) => `
      <div class="split-item">
        <div>
          <b>${n.type}</b>
          <div class="tiny muted">${n.message}</div>
          <div class="tiny muted">${new Date(n.at).toLocaleString("ar-SA")}</div>
        </div>
        <button class="btn sm ghost" data-read="${n.id}">${n.read ? "مقروء" : "تعليم"}</button>
      </div>
    `
    )
    .join("");

  if (!rows.length) {
    $("#notifList").innerHTML = '<div class="muted">لا توجد إشعارات حالية.</div>';
  }

  document.querySelectorAll("[data-read]").forEach((btn) => {
    btn.addEventListener("click", () => {
      markNotificationRead(btn.getAttribute("data-read"));
      renderNotifications();
    });
  });
}

function renderLeaderboard() {
  const rows = getLeaderboardFlow();
  $("#leaderboard").innerHTML = rows
    .map(
      (r) => `
      <tr>
        <td>${r.name}</td>
        <td>${r.points}</td>
        <td>${r.label} (L${r.level})</td>
        <td>${r.badges.length ? r.badges.join("، ") : "-"}</td>
      </tr>
    `
    )
    .join("");

  if (!rows.length) {
    $("#leaderboard").innerHTML = '<tr><td colspan="4" class="muted">لا توجد بيانات كافية بعد.</td></tr>';
  }
}

renderNotifications();
renderLeaderboard();
