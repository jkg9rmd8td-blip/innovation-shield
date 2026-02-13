import { getCurrentUser, logout } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { ROLES, PERMISSIONS } from "../core/constants.js";
import { getPlatformPulse, ensureServiceHubState } from "../services/platform-hub-service.js";

function normalizePath(path) {
  return path.replace(/\/\/+/, "/");
}

function actionIndexText(action) {
  return `${action.label} ${action.hint || ""} ${action.section || ""}`.toLowerCase();
}

export function mountNav({ active = "", base = "." } = {}) {
  const user = getCurrentUser();
  const nav = document.createElement("header");
  nav.className = "topbar";

  const to = (path) => normalizePath(`${base}/${path}`);
  ensureServiceHubState();

  const links = [
    { key: "home", label: "الرئيسية", href: to("index.html"), show: true },
    { key: "workspace", label: "مساحة العمل", href: to("teams.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_WORKSPACE_VIEW) },
    { key: "initiatives", label: "المبادرات", href: to("initiatives.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_INITIATIVES_VIEW) },
    { key: "journey", label: "المسار", href: to("journey.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_JOURNEY_VIEW) },
    { key: "prototypes", label: "النماذج الأولية", href: to("prototypes.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_PROTOTYPES_VIEW) },
    { key: "services", label: "مركز الخدمات", href: to("service-center.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_SERVICE_CENTER_VIEW) },
    { key: "marketplace", label: "السوق", href: to("marketplace.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_MARKETPLACE_VIEW) },
    { key: "academy", label: "الأكاديمية", href: to("academy.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_ACADEMY_VIEW) },
    { key: "governance", label: "الحوكمة", href: to("policies.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_GOVERNANCE_VIEW) },
    { key: "integrations", label: "التكاملات", href: to("integrations.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_INTEGRATIONS_VIEW) },
    { key: "admin", label: "الإدارة", href: to("admin/index.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_ADMIN_OVERVIEW_VIEW) },
    { key: "judging", label: "التحكيم", href: to("admin/judging.html"), show: !!user && can(user.role, PERMISSIONS.PAGE_ADMIN_JUDGING_VIEW) },
    { key: "login", label: user ? "تبديل الحساب" : "الدخول", href: to("login.html"), show: true },
  ];

  nav.innerHTML = `
    <div class="brand">
      <div class="brand-mark">IS</div>
      <div>
        <div class="brand-title">درع الابتكار</div>
        <div class="brand-sub">منصة حوكمة الابتكار المؤسسي</div>
      </div>
    </div>
    <nav class="topnav" id="mainNav"></nav>
    <div class="top-utils" id="topUtils"></div>
  `;

  const navWrap = nav.querySelector("#mainNav");
  const visibleLinks = links.filter((x) => x.show);
  navWrap.innerHTML = visibleLinks
    .map((x) => `<a class="toplink ${x.key === active ? "active" : ""}" data-key="${x.key}" href="${x.href}">${x.label}</a>`)
    .join("");

  const utils = nav.querySelector("#topUtils");

  if (user) {
    const chip = document.createElement("span");
    chip.className = "role-chip";
    chip.textContent = `${user.name} - ${ROLES[user.role] || user.role}`;
    utils.appendChild(chip);

    const pulse = getPlatformPulse(user);
    const pulseWrap = document.createElement("div");
    pulseWrap.className = "pulse-row";
    pulseWrap.innerHTML = `
      <span class="pulse-pill">الإشعارات ${pulse.totals.unreadNotifications}</span>
      <span class="pulse-pill">الخدمات ${pulse.totals.openServiceRequests}</span>
      <span class="pulse-pill">المبادرات ${pulse.totals.initiatives}</span>
    `;
    utils.appendChild(pulseWrap);

    const commandBtn = document.createElement("button");
    commandBtn.className = "cmd-btn";
    commandBtn.type = "button";
    commandBtn.textContent = "الاوامر السريعة";
    utils.appendChild(commandBtn);

    const hub = buildCommandHub({ user, visibleLinks, active, pulse, to });
    document.body.appendChild(hub.root);

    commandBtn.addEventListener("click", () => hub.open());
    document.addEventListener("keydown", (e) => {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isShortcut) return;
      e.preventDefault();
      hub.toggle();
    });

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

function buildCommandHub({ user, visibleLinks, active, pulse, to }) {
  const root = document.createElement("div");
  root.className = "command-hub hidden";
  root.innerHTML = `
    <div class="command-hub-backdrop" data-close="1"></div>
    <section class="command-hub-panel" role="dialog" aria-modal="true" aria-label="لوحة الاوامر السريعة">
      <div class="command-hub-head">
        <h3>لوحة التحكم السريعة</h3>
        <button class="btn sm ghost" type="button" data-close="1">اغلاق</button>
      </div>
      <div class="command-pulse-grid" id="commandPulse"></div>
      <input id="commandSearch" class="command-search" placeholder="ابحث عن صفحة او اجراء..." />
      <div class="command-actions" id="commandActions"></div>
      <div class="command-foot">الاختصار: Ctrl/Cmd + K</div>
    </section>
  `;

  const pulseGrid = root.querySelector("#commandPulse");
  pulseGrid.innerHTML = pulse.highlights
    .map((item) => `<article class="command-kpi"><span>${item.label}</span><b>${item.value}</b></article>`)
    .join("");

  const actions = buildActions({ user, visibleLinks, active, to });
  const actionsWrap = root.querySelector("#commandActions");
  const searchInput = root.querySelector("#commandSearch");

  function renderActions(filter = "") {
    const q = filter.trim().toLowerCase();
    const rows = actions.filter((a) => !q || actionIndexText(a).includes(q));
    actionsWrap.innerHTML = rows
      .map(
        (action) => `
          <a class="command-action ${action.key === active ? "active" : ""}" href="${action.href}">
            <div>
              <b>${action.label}</b>
              <div class="tiny muted">${action.hint || ""}</div>
            </div>
            <span>${action.section || ""}</span>
          </a>
        `
      )
      .join("");

    if (!rows.length) {
      actionsWrap.innerHTML = '<div class="tiny muted">لا توجد نتائج مطابقة.</div>';
    }
  }

  renderActions();
  searchInput.addEventListener("input", () => renderActions(searchInput.value));

  function open() {
    root.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    setTimeout(() => searchInput.focus(), 20);
  }

  function close() {
    root.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }

  function toggle() {
    if (root.classList.contains("hidden")) open();
    else close();
  }

  root.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", close);
  });

  root.addEventListener("click", (e) => {
    if (e.target === root) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  return { root, open, close, toggle };
}

function buildActions({ user, visibleLinks, active, to }) {
  const actions = visibleLinks
    .filter((link) => !["login"].includes(link.key))
    .map((link) => ({
      key: link.key,
      label: link.label,
      href: link.href,
      section: "تنقل",
      hint: link.key === active ? "الصفحة الحالية" : "",
    }));

  if (can(user.role, PERMISSIONS.INITIATIVE_CREATE)) {
    actions.unshift({
      key: "new_initiative",
      label: "انشاء مبادرة جديدة",
      href: to("initiatives.html"),
      section: "اجراء",
      hint: "فتح نموذج اضافة مبادرة",
    });
  }

  if (can(user.role, PERMISSIONS.PAGE_SERVICE_CENTER_VIEW)) {
    actions.unshift({
      key: "new_service_request",
      label: "طلب خدمة جديد",
      href: to("service-center.html"),
      section: "خدمات",
      hint: "ارسال طلب دعم او تشغيل",
    });
  }

  if (can(user.role, PERMISSIONS.PAGE_PROTOTYPES_VIEW)) {
    actions.unshift({
      key: "prototype_support",
      label: "متابعة دعم النماذج",
      href: to("prototypes.html"),
      section: "نماذج",
      hint: "حالة الجودة والجاهزية",
    });
  }

  return actions;
}
