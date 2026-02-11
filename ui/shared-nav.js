import { getCurrentUser, logout } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS, ROLES } from "../core/constants.js";

export function mountNav({ active = "", base = "." } = {}) {
  const user = getCurrentUser();
  const nav = document.createElement("header");
  nav.className = "topbar";

  const to = (path) => `${base}/${path}`.replace(/\/\//g, "/");

  nav.innerHTML = `
    <div class="brand">
      <div class="brand-mark">IS</div>
      <div>
        <div class="brand-title">درع الابتكار</div>
        <div class="brand-sub">نظام حوكمة الابتكار</div>
      </div>
    </div>
    <nav class="topnav" id="mainNav"></nav>
  `;

  const links = [
    { key: "home", label: "الرئيسية", href: to("index.html"), show: true },
    {
      key: "teams",
      label: "المسار التنفيذي",
      href: to("teams.html"),
      show: !!user && (can(user.role, PERMISSIONS.INITIATIVE_CREATE) || can(user.role, PERMISSIONS.INITIATIVE_READ_ALL)),
    },
    {
      key: "governance",
      label: "الحوكمة",
      href: to("policies.html"),
      show: !!user && (can(user.role, PERMISSIONS.GOVERNANCE_APPROVE) || can(user.role, PERMISSIONS.GOVERNANCE_MANAGE)),
    },
    {
      key: "admin",
      label: "الإدارة",
      href: to("admin/index.html"),
      show: !!user && can(user.role, PERMISSIONS.ADMIN_ACCESS),
    },
    { key: "login", label: user ? "تبديل الحساب" : "الدخول", href: to("login.html"), show: true },
  ];

  const navWrap = nav.querySelector("#mainNav");
  navWrap.innerHTML = links
    .filter((x) => x.show)
    .map((x) => `<a class="toplink ${x.key === active ? "active" : ""}" data-key="${x.key}" href="${x.href}">${x.label}</a>`)
    .join("");

  if (user) {
    const chip = document.createElement("span");
    chip.className = "badge";
    chip.textContent = `${user.name} — ${ROLES[user.role] || user.role}`;
    navWrap.appendChild(chip);

    const loginLink = navWrap.querySelector('[data-key="login"]');
    if (loginLink) {
      loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
        location.href = to("login.html");
      });
    }
  }

  document.body.prepend(nav);
}
