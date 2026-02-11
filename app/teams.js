/* Innovation Shield — Teams & Memberships (Static Demo) */
(function () {
    const KEY_TEAMS = "IS_TEAMS";

    const $ = (s) => document.querySelector(s);

    const user = ISAuth.requireRole(["employee", "lead", "judge", "admin"], "login.html");
    if (!user) return;
    if (!ISAuth.hasPermission(ISAuth.PERMISSIONS.teamRead, user)) {
        ISAuth.audit("DENY_PAGE", { path: location.pathname, reason: "missing team.read" });
        location.replace("index.html");
        return;
    }

    $("#who").textContent = user.displayName;
    $("#roleBadge").textContent = `الدور: ${ISAuth.Roles[user.role]?.ar || user.role}`;

    function loadTeams() {
        try { return JSON.parse(localStorage.getItem(KEY_TEAMS) || "[]"); }
        catch { return []; }
    }

    function saveTeams(teams) {
        localStorage.setItem(KEY_TEAMS, JSON.stringify(teams));
    }

    function seedIfEmpty() {
        const teams = loadTeams();
        if (teams.length) return;

        const demo = [
            {
                id: cryptoId(),
                name: "فريق الجودة والتميز",
                dept: "الجودة وسلامة المرضى",
                leader: { name: "فهد الشهري", id: "LEAD-01" },
                members: [
                    { name: "سارة العتيبي", id: "EMP-01", role: "member" },
                    { name: "محمد الزهراني", id: "EMP-02", role: "doc" }
                ],
                createdAt: new Date().toISOString()
            }
        ];
        saveTeams(demo);
    }

    function cryptoId() {
        return "T-" + Math.random().toString(16).slice(2, 10).toUpperCase();
    }

    function canCreateTeam() {
        return ISAuth.hasPermission(ISAuth.PERMISSIONS.teamCreate, user);
    }

    function refreshSelect() {
        const teams = loadTeams();
        const sel = $("#teamSelect");
        sel.innerHTML = "";
        teams.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = `${t.name} — (${t.dept || "بدون تحديد"})`;
            sel.appendChild(opt);
        });
    }

    function renderTeams() {
        const teams = loadTeams();
        const wrap = $("#teamsList");
        wrap.innerHTML = "";

        if (!teams.length) {
            wrap.innerHTML = `<div class="team"><div>لا توجد فرق بعد.</div></div>`;
            return;
        }

        teams.forEach(t => {
            const el = document.createElement("div");
            el.className = "team";
            const members = (t.members || []).map(m => `${m.name} (${roleName(m.role)})`).join(" • ");
            el.innerHTML = `
        <div>
          <div style="font-weight:900">${t.name}</div>
          <div class="muted small">${t.dept || ""}</div>
          <div class="muted small" style="margin-top:6px">القائد: <b style="color:#fff">${t.leader?.name || "—"}</b></div>
          <div class="muted small" style="margin-top:6px">الأعضاء: ${members || "—"}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <span class="pill">ID: ${t.id}</span>
          ${(user.role === "admin") ? `<button class="btn" data-del="${t.id}" style="margin:0">حذف</button>` : ``}
        </div>
      `;
            wrap.appendChild(el);
        });

        // Admin delete
        wrap.querySelectorAll("[data-del]").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-del");
                if (confirm("تأكيد حذف الفريق؟")) {
                    const next = loadTeams().filter(x => x.id !== id);
                    saveTeams(next);
                    ISAuth.audit("TEAM_DELETE", { teamId: id });
                    refreshSelect();
                    renderTeams();
                }
            });
        });
    }

    function roleName(r) {
        return {
            member: "عضو",
            doc: "موثّق",
            ops: "مسؤول مهام",
            finance: "مسؤول جوائز"
        }[r] || r;
    }

    // Create team
    $("#createHint").textContent = canCreateTeam()
        ? "جاهز. اكتب الاسم والإدارة ثم إنشاء."
        : "غير متاح لدورك. اطلب من قائد الفريق أو الإدارة إنشاء فريق.";

    $("#createTeamBtn").addEventListener("click", () => {
        if (!canCreateTeam()) {
            alert("هذا الخيار لقائد الفريق أو الإدارة فقط.");
            return;
        }
        const name = $("#teamName").value.trim();
        const dept = $("#teamDept").value.trim();
        if (!name) return alert("اكتب اسم الفريق.");

        const teams = loadTeams();
        const newTeam = {
            id: cryptoId(),
            name,
            dept,
            leader: { name: user.displayName, id: user.identifier || "LEAD" },
            members: [
                { name: user.displayName, id: user.identifier || "LEAD", role: "ops" }
            ],
            createdAt: new Date().toISOString()
        };

        teams.unshift(newTeam);
        saveTeams(teams);
        ISAuth.audit("TEAM_CREATE", { teamId: newTeam.id, teamName: name });

        $("#teamName").value = "";
        $("#teamDept").value = "";

        refreshSelect();
        renderTeams();
        alert("تم إنشاء الفريق ✅");
    });

    // Join/update membership
    $("#joinBtn").addEventListener("click", () => {
        if (!ISAuth.hasPermission(ISAuth.PERMISSIONS.teamManageMembers, user) &&
            !ISAuth.hasPermission(ISAuth.PERMISSIONS.teamRead, user)) {
            alert("لا تملك صلاحية إدارة العضويات.");
            return;
        }

        const teamId = $("#teamSelect").value;
        const memberRole = $("#memberRole").value;
        const teams = loadTeams();
        const t = teams.find(x => x.id === teamId);
        if (!t) return alert("اختر فريق صحيح.");

        t.members = t.members || [];
        const myId = user.identifier || user.displayName;
        const idx = t.members.findIndex(m => (m.id || m.name) === myId || m.name === user.displayName);

        if (idx >= 0) {
            t.members[idx].name = user.displayName;
            t.members[idx].id = myId;
            t.members[idx].role = memberRole;
            ISAuth.audit("TEAM_MEMBER_UPDATE", { teamId, role: memberRole });
            alert("تم تحديث دورك داخل الفريق ✅");
        } else {
            t.members.push({ name: user.displayName, id: myId, role: memberRole });
            ISAuth.audit("TEAM_MEMBER_JOIN", { teamId, role: memberRole });
            alert("تم انضمامك للفريق ✅");
        }

        saveTeams(teams);
        renderTeams();
    });

    // Boot
    seedIfEmpty();
    refreshSelect();
    renderTeams();
})();
