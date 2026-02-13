import { t, getLang, dirForLang, toggleLang } from "../i18n/index.js";
import { getUser, clearSession } from "../core/auth-client.js";
import { toKpis, readLegacyState } from "../core/state-adapter.js";
import { canAccessPortal, defaultPortal } from "../core/role-guard.js";

function applyLanguage() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.documentElement.dir = dirForLang(lang);
  return lang;
}

function navItemsFor(portal) {
  const common = [
    { key: "initiatives", labelKey: "initiatives_title", href: "#initiatives" },
    { key: "prototypes", labelKey: "prototypes_title", href: "#prototypes" },
    { key: "governance", labelKey: "governance_title", href: "#governance" },
  ];

  if (portal === "admin") {
    common.push({ key: "audit", labelKey: "kpi_audit", href: "#audit" });
  }

  return common;
}

function mountSidebar({ root, portal, lang }) {
  const side = root.querySelector("[data-sidebar]");
  if (!side) return;

  side.innerHTML = `
    <div class="card apple-glass sidebar">
      <nav>
        ${navItemsFor(portal)
          .map((item, idx) => `<a class="nav-link ${idx === 0 ? "active" : ""}" href="${item.href}">${t(item.labelKey, lang)}</a>`)
          .join("")}
      </nav>
    </div>
  `;
}

function mountKpis({ root, lang }) {
  const state = readLegacyState();
  const kpi = toKpis(state);
  const el = root.querySelector("[data-kpi-grid]");
  if (!el) return;

  el.innerHTML = [
    { key: "kpi_initiatives", value: kpi.initiatives },
    { key: "kpi_prototypes", value: kpi.prototypes },
    { key: "kpi_services", value: kpi.services },
    { key: "kpi_audit", value: kpi.audit },
  ]
    .map(
      (item) => `
      <article class="kpi">
        <div class="value">${new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US").format(item.value)}</div>
        <div class="label">${t(item.key, lang)}</div>
      </article>
    `
    )
    .join("");
}

function mountTopbar({ portal, lang }) {
  const user = getUser();
  const titleKey = `${portal}_portal`;
  const topbar = document.querySelector("[data-topbar]");
  if (!topbar) return;

  topbar.innerHTML = `
    <div class="topbar-inner">
      <div class="brand">
        <div class="brand-mark">IS</div>
        <div>
          <div class="brand-title">${t("app_name", lang)}</div>
          <div class="brand-sub">${t("app_subtitle", lang)}</div>
        </div>
      </div>
      <div class="cluster">
        <span class="badge">${t(titleKey, lang)}</span>
        <span class="badge">${t("role_label", lang)}: ${user?.role || "guest"}</span>
        <button class="btn ghost" type="button" id="langToggle">${t("language_switch", lang)}</button>
        <button class="btn" type="button" id="signOutBtn">${t("sign_out", lang)}</button>
      </div>
    </div>
  `;

  topbar.querySelector("#langToggle")?.addEventListener("click", () => {
    toggleLang();
    location.reload();
  });

  topbar.querySelector("#signOutBtn")?.addEventListener("click", () => {
    clearSession();
    location.href = "/login.html";
  });
}

export function bootPortal({ portal, rootSelector = "[data-portal-root]" }) {
  const user = getUser();
  if (!user) {
    location.replace("/login.html");
    return;
  }

  if (!canAccessPortal(user.role, portal)) {
    const fallback = defaultPortal(user.role);
    const target = fallback === "admin"
      ? "/frontend/portals/admin/index.html"
      : fallback === "judging"
        ? "/frontend/portals/judging/index.html"
        : "/frontend/portals/employee/index.html";
    location.replace(target);
    return;
  }

  const lang = applyLanguage();
  mountTopbar({ portal, lang });
  const root = document.querySelector(rootSelector);
  if (!root) return;

  mountSidebar({ root, portal, lang });
  mountKpis({ root, lang });
}
