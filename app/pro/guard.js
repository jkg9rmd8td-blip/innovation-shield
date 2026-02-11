(() => {
  "use strict";

  const ROLE_KEY = "is_role_v1"; // employee | judge | admin
  const DEFAULT_ROLE = "employee";

  function getRole() {
    return localStorage.getItem(ROLE_KEY) || DEFAULT_ROLE;
  }
  function setRole(role) {
    localStorage.setItem(ROLE_KEY, role);
  }

  function requireRole(allowed) {
    const role = getRole();
    if (!allowed.includes(role)) {
      alert("لا تملك الصلاحية لفتح هذه الصفحة (Demo Roles).");
      location.href = "../../index.html";
      return false;
    }
    return true;
  }

  // Adds a small role switcher in top-right (demo only)
  function mountRoleSwitcher() {
    const bar = document.querySelector(".topbar");
    if (!bar) return;

    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.gap = "8px";
    wrap.style.alignItems = "center";

    const tag = document.createElement("span");
    tag.className = "badge muted";
    tag.id = "role_tag";
    tag.textContent = "الدور: " + roleName(getRole());

    const sel = document.createElement("select");
    sel.className = "in sm";
    sel.style.width = "160px";
    sel.innerHTML = `
      <option value="employee">موظف</option>
      <option value="judge">محكّم</option>
      <option value="admin">إدارة</option>
    `;
    sel.value = getRole();
    sel.onchange = () => {
      setRole(sel.value);
      tag.textContent = "الدور: " + roleName(sel.value);
      alert("تم تغيير الدور (Demo). أعد تحميل الصفحة.");
    };

    wrap.appendChild(tag);
    wrap.appendChild(sel);
    bar.appendChild(wrap);
  }

  function roleName(r){
    if(r==="admin") return "إدارة";
    if(r==="judge") return "محكّم";
    return "موظف";
  }

  window.RoleGuard = { getRole, setRole, requireRole, mountRoleSwitcher };
})();