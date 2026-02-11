/* Innovation Shield — Auth + RBAC + Permissions (Static Demo) */
(function () {
    const KEY_AUTH = "IS_AUTH";
    const KEY_AUDIT = "IS_AUDIT";
    const KEY_ROLE_OVERRIDES = "IS_ROLE_OVERRIDES";

    const PERMISSIONS = {
        teamRead: "team.read",
        teamCreate: "team.create",
        teamManageMembers: "team.manage_members",
        initiativeSubmit: "initiative.submit",
        initiativeReview: "initiative.review",
        initiativeApprove: "initiative.approve",
        policyView: "policy.view",
        policyManage: "policy.manage",
        rewardManage: "reward.manage",
        auditRead: "audit.read",
        adminDashboard: "admin.dashboard",
        serviceRequest: "service.request",
        serviceManage: "service.manage",
        accessManage: "access.manage"
    };

    const ROLE_PERMISSIONS = {
        employee: [
            PERMISSIONS.teamRead,
            PERMISSIONS.initiativeSubmit,
            PERMISSIONS.policyView,
            PERMISSIONS.serviceRequest
        ],
        lead: [
            PERMISSIONS.teamRead,
            PERMISSIONS.teamCreate,
            PERMISSIONS.teamManageMembers,
            PERMISSIONS.initiativeSubmit,
            PERMISSIONS.policyView,
            PERMISSIONS.serviceRequest
        ],
        judge: [
            PERMISSIONS.teamRead,
            PERMISSIONS.initiativeReview,
            PERMISSIONS.policyView,
            PERMISSIONS.auditRead
        ],
        admin: ["*"]
    };

    const Roles = {
        employee: { ar: "موظف مبتكر" },
        lead: { ar: "قائد فريق" },
        judge: { ar: "محكّم" },
        admin: { ar: "إدارة الابتكار" }
    };

    function nowISO() { return new Date().toISOString(); }

    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getRoleOverrides() {
        return readJson(KEY_ROLE_OVERRIDES, {});
    }

    function saveRoleOverrides(value) {
        writeJson(KEY_ROLE_OVERRIDES, value);
    }

    function listRoles() {
        return Object.keys(Roles);
    }

    function getRolePermissions(role) {
        const base = new Set(ROLE_PERMISSIONS[role] || []);
        const overrides = getRoleOverrides()[role] || {};
        const add = Array.isArray(overrides.add) ? overrides.add : [];
        const remove = Array.isArray(overrides.remove) ? overrides.remove : [];

        add.forEach((p) => base.add(p));
        remove.forEach((p) => base.delete(p));
        return Array.from(base);
    }

    function audit(action, meta = {}) {
        const arr = readJson(KEY_AUDIT, []);
        const user = getUser();
        arr.unshift({
            ts: nowISO(),
            action,
            user: user ? { name: user.displayName, role: user.role, id: user.identifier || "" } : null,
            meta
        });
        writeJson(KEY_AUDIT, arr.slice(0, 300));
    }

    function getUser() {
        return readJson(KEY_AUTH, null);
    }

    function setUser(u) {
        writeJson(KEY_AUTH, u);
    }

    function isLoggedIn() {
        return !!getUser();
    }

    function getUserPermissions(user = getUser()) {
        if (!user) return [];
        return getRolePermissions(user.role);
    }

    function hasPermission(permission, user = getUser()) {
        const perms = getUserPermissions(user);
        return perms.includes("*") || perms.includes(permission);
    }

    function requirePermission(permission, redirectTo = "teams.html") {
        const u = getUser();
        if (!u) {
            location.replace("login.html");
            return null;
        }
        if (!hasPermission(permission, u)) {
            audit("DENY_PERMISSION", { path: location.pathname, need: permission, have: getUserPermissions(u) });
            location.replace(redirectTo);
            return null;
        }
        return u;
    }

    function login({ displayName, role, identifier }) {
        const user = {
            displayName,
            role,
            roleName: (Roles[role]?.ar) || role,
            identifier: identifier || "",
            createdAt: nowISO()
        };
        setUser(user);
        audit("LOGIN", { role });
        return user;
    }

    function logout() {
        audit("LOGOUT");
        localStorage.removeItem(KEY_AUTH);
    }

    function grantPermission(role, permission) {
        const overrides = getRoleOverrides();
        const current = overrides[role] || { add: [], remove: [] };
        current.add = Array.from(new Set([...(current.add || []), permission]));
        current.remove = (current.remove || []).filter((p) => p !== permission);
        overrides[role] = current;
        saveRoleOverrides(overrides);
        audit("PERMISSION_GRANTED", { role, permission });
    }

    function revokePermission(role, permission) {
        const overrides = getRoleOverrides();
        const current = overrides[role] || { add: [], remove: [] };
        current.add = (current.add || []).filter((p) => p !== permission);
        current.remove = Array.from(new Set([...(current.remove || []), permission]));
        overrides[role] = current;
        saveRoleOverrides(overrides);
        audit("PERMISSION_REVOKED", { role, permission });
    }

    // Guard: redirect if not allowed
    function requireRole(allowedRoles, redirectTo = "login.html") {
        const u = getUser();
        if (!u) {
            location.replace(redirectTo);
            return null;
        }
        if (Array.isArray(allowedRoles) && allowedRoles.length) {
            if (!allowedRoles.includes(u.role)) {
                audit("DENY_PAGE", { path: location.pathname, need: allowedRoles, have: u.role });
                location.replace("teams.html");
                return null;
            }
        }
        return u;
    }

    // UI helpers
    function mountTopbar() {
        const u = getUser();
        const bar = document.createElement("div");
        bar.className = "topbar";
        bar.innerHTML = `
      <div class="brand">
        <div class="brand-mark">IS</div>
        <div>
          <div class="brand-title">درع الابتكار</div>
          <div class="brand-sub">مبادرة داخلية — نموذج تجريبي</div>
        </div>
      </div>
      <div class="topnav">
        <a href="index.html">الرئيسية</a>
        <a href="teams.html" data-sec="team">الفرق</a>
        <a href="policies.html" data-sec="policy">السياسات</a>
        <a href="admin.html" data-sec="admin">الإدارة</a>
        <a href="login.html" id="logoutLink">تبديل الحساب</a>
      </div>
    `;
        document.body.prepend(bar);

        const logoutLink = bar.querySelector("#logoutLink");
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
            location.href = "login.html";
        });

        if (!u) {
            bar.querySelectorAll('[data-sec="team"], [data-sec="admin"]').forEach((a) => a.style.display = "none");
            logoutLink.textContent = "تسجيل الدخول";
            return;
        }

        if (!hasPermission(PERMISSIONS.teamRead, u)) {
            const team = bar.querySelector('[data-sec="team"]');
            if (team) team.style.display = "none";
        }
        if (!hasPermission(PERMISSIONS.policyView, u)) {
            const p = bar.querySelector('[data-sec="policy"]');
            if (p) p.style.display = "none";
        }
        if (!hasPermission(PERMISSIONS.adminDashboard, u)) {
            const admin = bar.querySelector('[data-sec="admin"]');
            if (admin) admin.style.display = "none";
        }
    }

    window.ISAuth = {
        KEY_AUTH,
        KEY_AUDIT,
        KEY_ROLE_OVERRIDES,
        Roles,
        PERMISSIONS,
        audit,
        getUser,
        isLoggedIn,
        login,
        logout,
        requireRole,
        requirePermission,
        hasPermission,
        getRolePermissions,
        getUserPermissions,
        grantPermission,
        revokePermission,
        listRoles,
        mountTopbar
    };
})();
