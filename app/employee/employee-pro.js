(() => {
    "use strict";

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    const fmt = (n) => new Intl.NumberFormat("ar-SA").format(Number(n || 0));
    const pad2 = (n) => String(n).padStart(2, "0");
    const isoNow = () => new Date().toISOString();
    const stamp = () => {
        const d = new Date();
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    };

    const store = {
        get(key, fallback) {
            try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
            catch { return fallback; }
        },
        set(key, val) {
            localStorage.setItem(key, JSON.stringify(val));
        }
    };

    const KEY = "is_state_v1";
    const UI_KEY = "is_employee_pro_ui_v1";

    const uiState = store.get(UI_KEY, {
        activeTab: "my",
        selectedId: null,
        filters: { q: "", stage: "", status: "" },
        tipsSeen: false
    });

    // ---------- Seed (only if missing) ----------
    function seedState() {
        const existing = store.get(KEY, null);
        if (existing) return existing;

        const seeded = {
            org: { nameAr: "مجمع الملك فيصل الطبي", programAr: "مبادرة درع الابتكار — مركز قيادة الابتكار المؤسسي" },
            me: { displayName: "سلمان الحربي", dept: "إدارة/قسم", role: "موظف مبتكر", points: 128, level: "Pioneer" },
            nda: { signed: false, signedAt: null },
            initiatives: [
                {
                    id: "I-2001",
                    title: "تحسين رحلة المريض الذكية",
                    stage: "الفكرة",
                    status: "مسودة",
                    progress: 18,
                    updatedAt: isoNow(),
                    notes: [{ id: "N1", t: "تحديد نطاق التجربة الأولية", at: isoNow() }],
                    tasks: [
                        { id: "T-1", title: "صياغة المشكلة", owner: "سلمان", col: "todo", due: "هذا الأسبوع" },
                        { id: "T-2", title: "جمع بيانات أولية", owner: "سلمان", col: "doing", due: "3 أيام" }
                    ],
                    prototype: null
                },
                {
                    id: "I-2002",
                    title: "أتمتة طلبات التشغيل",
                    stage: "التقييم",
                    status: "قيد التحكيم",
                    progress: 52,
                    updatedAt: isoNow(),
                    notes: [{ id: "N2", t: "تمت ملاحظة متطلبات الحوكمة", at: isoNow() }],
                    tasks: [
                        { id: "T-3", title: "رسم تدفق العمل", owner: "عضو", col: "done", due: "تم" },
                        { id: "T-4", title: "بناء نموذج شاشة", owner: "سلمان", col: "doing", due: "5 أيام" }
                    ],
                    prototype: { id: "P-3101", status: "قيد التطوير", template: "Dashboard", support: "UI/UX", scope: "لوحة مؤشرات + قائمة طلبات + حالات", progress: 36, createdAt: isoNow() }
                },
                {
                    id: "I-2003",
                    title: "مؤشر جودة داخلي",
                    stage: "الاعتماد",
                    status: "معتمد",
                    progress: 90,
                    updatedAt: isoNow(),
                    notes: [{ id: "N3", t: "الاستعداد لإطلاق تجريبي", at: isoNow() }],
                    tasks: [
                        { id: "T-5", title: "توثيق النتائج", owner: "سلمان", col: "review", due: "أسبوع" }
                    ],
                    prototype: { id: "P-3102", status: "جاهز للتحكيم", template: "Dashboard", support: "Quality Review", scope: "عرض بيانات + فلترة + تقرير", progress: 88, createdAt: isoNow() }
                }
            ],
            audit: [
                { id: "A-1", title: "إنشاء ملف الموظف", meta: `${stamp()} • system`, at: isoNow() }
            ]
        };

        store.set(KEY, seeded);
        return seeded;
    }

    const state = seedState();
    let selectedId = null;

    // ---------- Helpers ----------
    function save() {
        store.set(KEY, state);
    }

    function saveUi() {
        store.set(UI_KEY, uiState);
    }

    function toast(message, type = "info") {
        let host = $("#toastHost");
        if (!host) {
            host = document.createElement("div");
            host.id = "toastHost";
            host.className = "toast-host";
            document.body.appendChild(host);
        }

        const el = document.createElement("div");
        el.className = `toast ${type}`;
        el.textContent = message;
        host.appendChild(el);

        setTimeout(() => {
            el.classList.add("out");
            setTimeout(() => el.remove(), 180);
        }, 2500);
    }

    function openPrintReport() {
        const initiatives = state.initiatives || [];
        const stats = {
            total: initiatives.length,
            wins: initiatives.filter(i => i.status === "معتمد").length,
            impact: initiatives.filter(i => i.stage === "الإطلاق").length,
            protos: initiatives.filter(i => !!i.prototype).length,
        };

        const badges = [];
        if (stats.total >= 1) badges.push({ t: "أول مبادرة" });
        if (stats.wins >= 1) badges.push({ t: "مبادرة معتمدة" });
        if (stats.protos >= 1) badges.push({ t: "باني نموذج أولي" });
        if ((state.me?.points || 0) >= 150) badges.push({ t: "نقاط متقدمة" });

        const prototypes = initiatives
            .filter(i => !!i.prototype)
            .map(i => ({
                id: i.id,
                title: i.title,
                template: i.prototype.template || "—",
                support: i.prototype.support || "—",
                status: i.prototype.status || "—",
                progress: clamp(i.prototype.progress || 0, 0, 100),
                scope: i.prototype.scope || "—",
            }));

        const payload = {
            ts: isoNow(),
            me: state.me,
            org: state.org,
            level: state.me?.level || "Pioneer",
            points: state.me?.points || 0,
            nda: state.nda || { signed: false, signedAt: null },
            stats,
            badges,
            prototypes,
            audit: (state.audit || []).slice(0, 8),
        };

        localStorage.setItem("is_employee_print_v1", JSON.stringify(payload));
        window.open("../pro/print-career.html", "_blank");
    }

    function addAudit(title, meta) {
        const item = { id: `A-${Math.random().toString(16).slice(2, 8)}`, title, meta: meta || `${stamp()} • user`, at: isoNow() };
        state.audit.unshift(item);
        save();
        renderAudit();
    }

    function stageBadge(stage) {
        if (stage === "الاعتماد" || stage === "الإطلاق") return "ok";
        if (stage === "النموذج الأولي") return "warn";
        return "muted";
    }

    function statusBadge(status) {
        if (status === "معتمد") return "ok";
        if (status === "قيد التحكيم") return "warn";
        return "muted";
    }

    function prettyDate(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "2-digit" });
        } catch {
            return "—";
        }
    }

    function prettyTime(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
        } catch {
            return "—";
        }
    }

    function clamp(n, a, b) {
        return Math.max(a, Math.min(b, n));
    }

    // ---------- Render: identity metrics ----------
    function renderHeader() {
        $("#empName").textContent = state.me.displayName || "موظف مبتكر";
        $("#empOrg").textContent = state.org?.nameAr || "—";
        $("#empDept").textContent = state.me.dept || "—";
        $("#empRole").textContent = state.me.role || "—";
        $("#empLevel").textContent = state.me.level || "Pioneer";

        const wins = state.initiatives.filter(i => i.status === "معتمد").length;
        const protos = state.initiatives.filter(i => !!i.prototype).length;

        $("#mPoints").textContent = fmt(state.me.points || 0);
        $("#mInitiatives").textContent = fmt(state.initiatives.length);
        $("#mWins").textContent = fmt(wins);
        $("#mPrototypes").textContent = fmt(protos);
    }

    // ---------- Tabs ----------
    function setActiveTab(key, silentAudit = false) {
        const target = ["my", "proto", "audit", "settings"].includes(key) ? key : "my";
        uiState.activeTab = target;
        saveUi();

        $$(".tab").forEach((t) => {
            t.classList.toggle("active", t.getAttribute("data-tab") === target);
        });

        $$(".panel").forEach((p) => p.classList.remove("active"));
        const panel = {
            my: $("#panel-my"),
            proto: $("#panel-proto"),
            audit: $("#panel-audit"),
            settings: $("#panel-settings"),
        }[target];
        if (panel) panel.classList.add("active");

        if (!silentAudit) addAudit("تبديل تبويب", `${stamp()} • tab:${target}`);
    }

    function wireTabs() {
        $$(".tab").forEach((t) => {
            t.addEventListener("click", () => {
                setActiveTab(t.getAttribute("data-tab"));
            });
        });
    }

    // ---------- Initiatives Table ----------

    function currentFilters() {
        return {
            q: ($("#q")?.value || "").trim().toLowerCase(),
            stage: ($("#filterStage")?.value || "").trim(),
            status: ($("#filterStatus")?.value || "").trim(),
        };
    }

    function filteredInitiatives() {
        const { q, stage, status } = currentFilters();
        return state.initiatives.filter(i => {
            const matchQ = !q || `${i.id} ${i.title} ${i.stage} ${i.status}`.toLowerCase().includes(q);
            const matchStage = !stage || i.stage === stage;
            const matchStatus = !status || i.status === status;
            return matchQ && matchStage && matchStatus;
        });
    }

    function renderInitiatives() {
        const tbody = $("#iniTbody");
        if (!tbody) return;

        const items = filteredInitiatives();

        tbody.innerHTML = items.map(i => {
            const sb = statusBadge(i.status);
            const st = stageBadge(i.stage);
            const prog = clamp(i.progress || 0, 0, 100);

            const selectedClass = i.id === selectedId ? "is-selected" : "";
            return `
        <tr data-row="${i.id}" class="${selectedClass}">
          <td>${i.id}</td>
          <td>${i.title}</td>
          <td><span class="pillbadge ${st}">${i.stage}</span></td>
          <td><span class="pillbadge ${sb}">${i.status}</span></td>
          <td>${fmt(prog)}%</td>
          <td>${prettyDate(i.updatedAt)}</td>
          <td class="td-right">
            <span class="linkbtn" data-open="${i.id}">فتح</span>
          </td>
        </tr>
      `;
        }).join("") || `<tr><td colspan="7" class="muted">لا توجد مبادرات مطابقة للفلاتر الحالية.</td></tr>`;

        // wire row open
        $$("[data-open]").forEach(b => b.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = b.getAttribute("data-open");
            selectInitiative(id);
        }));

        $$("[data-row]").forEach(row => row.addEventListener("click", () => {
            const id = row.getAttribute("data-row");
            selectInitiative(id);
        }));
    }

    // ---------- Workspace / Kanban ----------
    const KCOLS = [
        { key: "todo", name: "To Do" },
        { key: "doing", name: "Doing" },
        { key: "review", name: "Review" },
        { key: "done", name: "Done" },
    ];

    function selectInitiative(id) {
        const i = state.initiatives.find(x => x.id === id);
        if (!i) return;

        selectedId = id;
        uiState.selectedId = id;
        saveUi();

        $("#workspaceEmpty")?.classList.add("hidden");
        $("#workspace")?.classList.remove("hidden");

        $("#wsTitle").textContent = i.title;
        $("#wsMeta").textContent = `${i.id} • ${i.stage} • ${i.status} • تقدّم ${fmt(i.progress || 0)}%`;

        renderKanban(i);
        renderNotes(i);
        renderInitiatives();

        addAudit("فتح مبادرة", `${stamp()} • ${i.id}`);
    }

    function renderKanban(initiative) {
        const root = $("#kanban");
        if (!root) return;

        const tasks = initiative.tasks || [];
        root.innerHTML = KCOLS.map(c => {
            const list = tasks.filter(t => t.col === c.key);
            return `
        <div class="col" data-col="${c.key}">
          <div class="colhead">
            <div class="coltitle">${c.name}</div>
            <div class="colcount">${fmt(list.length)}</div>
          </div>
          <div class="collist" data-list="${c.key}">
            ${list.map(t => `
              <div class="cardtask" draggable="true" data-task="${t.id}">
                <div class="ctitle">${t.title}</div>
                <div class="cmeta">
                  <span class="chip">👤 ${t.owner || "—"}</span>
                  <span class="chip">⏳ ${t.due || "—"}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
        }).join("");

        wireDnD(initiative);
    }

    function renderNotes(initiative) {
        const root = $("#notes");
        if (!root) return;

        const notes = initiative.notes || [];
        root.innerHTML = notes.length ? notes.map(n => `
      <div class="note">
        <div class="nt">${n.t}</div>
        <div class="nm">${prettyDate(n.at)} • ${prettyTime(n.at)}</div>
      </div>
    `).join("") : `<div class="note"><div class="nt">لا توجد ملاحظات بعد.</div></div>`;
    }

    function updateProgressFromTasks(initiative) {
        // simple heuristic: done tasks contribute
        const tasks = initiative.tasks || [];
        if (!tasks.length) return;
        const done = tasks.filter(t => t.col === "done").length;
        const p = Math.round((done / tasks.length) * 100);
        // keep it realistic: don't drop progress below existing unless higher
        initiative.progress = Math.max(initiative.progress || 0, p);
        initiative.updatedAt = isoNow();
    }

    function wireDnD(initiative) {
        const tasksEls = $$(".cardtask");
        const lists = $$("[data-list]");

        let draggingId = null;

        tasksEls.forEach(el => {
            el.addEventListener("dragstart", (e) => {
                draggingId = el.getAttribute("data-task");
                el.style.opacity = "0.6";
                try { e.dataTransfer.setData("text/plain", draggingId); } catch { }
            });
            el.addEventListener("dragend", () => {
                draggingId = null;
                el.style.opacity = "";
            });
        });

        lists.forEach(list => {
            list.addEventListener("dragover", (e) => {
                e.preventDefault();
                list.parentElement.style.outline = "1px solid rgba(78,163,255,.25)";
            });
            list.addEventListener("dragleave", () => {
                list.parentElement.style.outline = "";
            });
            list.addEventListener("drop", (e) => {
                e.preventDefault();
                list.parentElement.style.outline = "";

                const col = list.getAttribute("data-list");
                const id = draggingId || (() => {
                    try { return e.dataTransfer.getData("text/plain"); } catch { return null; }
                })();

                const t = (initiative.tasks || []).find(x => x.id === id);
                if (!t) return;

                t.col = col;
                updateProgressFromTasks(initiative);
                save();

                addAudit("نقل مهمة", `${stamp()} • ${initiative.id} • ${t.title} → ${col}`);
                renderKanban(initiative);
                renderInitiatives(); // refresh progress
                renderHeader();
            });
        });
    }

    // ---------- Prototype Stage ----------
    function ensurePrototypeForInitiative(initiative, template = "Dashboard", support = "UI/UX") {
        if (!initiative.prototype) {
            initiative.prototype = {
                id: `P-${Math.floor(3000 + Math.random() * 900)}`,
                status: "قيد التطوير",
                template,
                support,
                scope: "نطاق أولي (Mock)",
                progress: 10,
                createdAt: isoNow()
            };
            // move stage to prototype if earlier
            initiative.stage = "النموذج الأولي";
            initiative.updatedAt = isoNow();
            save();
            addAudit("إنشاء نموذج أولي", `${stamp()} • ${initiative.id} • ${initiative.prototype.id}`);
        }
    }

    function renderPrototypes() {
        const list = $("#protoList");
        if (!list) return;

        const items = state.initiatives
            .filter(i => !!i.prototype)
            .map(i => ({
                initiative: i,
                proto: i.prototype
            }));

        list.innerHTML = items.length ? items.map(x => {
            const i = x.initiative;
            const p = x.proto;
            const prog = clamp(p.progress || 0, 0, 100);

            return `
        <div class="protobox">
          <div>
            <div class="pbtitle">${p.id} — ${i.title}</div>
            <div class="pbmeta">${i.id} • قالب: ${p.template} • دعم: ${p.support} • حالة: ${p.status}</div>
            <div class="pbmeta">النطاق: ${p.scope || "—"}</div>
            <div class="pbprogress"><span style="width:${prog}%"></span></div>
            <div class="pbmeta">التقدم: ${fmt(prog)}%</div>
          </div>
          <div class="pbactions">
            <button class="btn sm" data-prog="${i.id}">تحديث التقدم</button>
            <button class="btn sm ghost" data-ready="${i.id}">جاهز للتحكيم</button>
            <button class="btn sm ghost" data-openw="${i.id}">فتح مساحة العمل</button>
          </div>
        </div>
      `;
        }).join("") : `
      <div class="support-card">
        <div class="sc1">لا توجد نماذج أولية بعد</div>
        <div class="sc2">ابدأ بنموذج أولي من مبادرة موجودة أو أنشئ نموذج جديد.</div>
      </div>
    `;

        $$("[data-openw]").forEach(b => b.addEventListener("click", () => {
            const id = b.getAttribute("data-openw");
            // switch to my tab then select
            setActiveTab("my");
            selectInitiative(id);
        }));

        $$("[data-prog]").forEach(b => b.addEventListener("click", () => {
            const id = b.getAttribute("data-prog");
            const i = state.initiatives.find(x => x.id === id);
            if (!i || !i.prototype) return;
            const v = prompt("أدخل نسبة التقدم (0-100):", String(i.prototype.progress ?? 10));
            if (v == null) return;
            const n = clamp(Number(v), 0, 100);
            if (!isFinite(n)) return;
            i.prototype.progress = Math.round(n);
            i.updatedAt = isoNow();
            // keep initiative progress aligned but not overriding higher
            i.progress = Math.max(i.progress || 0, Math.min(100, i.prototype.progress));
            save();
            addAudit("تحديث تقدم النموذج", `${stamp()} • ${i.id} • ${i.prototype.id} → ${i.prototype.progress}%`);
            renderPrototypes();
            renderInitiatives();
            renderHeader();
        }));

        $$("[data-ready]").forEach(b => b.addEventListener("click", () => {
            const id = b.getAttribute("data-ready");
            const i = state.initiatives.find(x => x.id === id);
            if (!i || !i.prototype) return;
            i.prototype.status = "جاهز للتحكيم";
            i.prototype.progress = Math.max(i.prototype.progress || 0, 85);
            i.stage = "النموذج الأولي";
            i.updatedAt = isoNow();
            i.progress = Math.max(i.progress || 0, i.prototype.progress);
            save();
            addAudit("رفع جاهزية للتحكيم", `${stamp()} • ${i.id} • ${i.prototype.id}`);
            toast("تم تحديث حالة النموذج إلى جاهز للتحكيم.", "success");
            renderPrototypes();
            renderInitiatives();
            renderHeader();
        }));
    }

    function openModal(id) {
        const m = $(id);
        m?.classList.remove("hidden");
        if (m) document.body.classList.add("modal-open");
    }
    function closeModals() {
        $$(".modal").forEach(m => m.classList.add("hidden"));
        document.body.classList.remove("modal-open");
    }

    function wireModals() {
        $$("[data-close]").forEach(x => x.addEventListener("click", closeModals));
        $$(".modal-backdrop").forEach(b => b.addEventListener("click", closeModals));
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeModals();
        });
    }

    function fillPrototypeInitiativesSelect() {
        const sel = $("#prInitiative");
        if (!sel) return;
        sel.innerHTML = state.initiatives.map(i => `<option value="${i.id}">${i.title} — ${i.id}</option>`).join("");
        if (selectedId) sel.value = selectedId;
    }

    function wirePrototypeRequest() {
        const btn = $("#btnRequestPrototype");
        const btnSupport = $("#btnRequestSupport");
        const btnSubmit = $("#btnSubmitProto");

        function show() {
            fillPrototypeInitiativesSelect();
            openModal("#modalProto");
        }

        btn?.addEventListener("click", show);
        btnSupport?.addEventListener("click", show);

        btnSubmit?.addEventListener("click", () => {
            const initId = $("#prInitiative")?.value;
            const template = $("#prTemplate")?.value || "Dashboard";
            const scope = ($("#prScope")?.value || "").trim();
            const support = $("#prSupport")?.value || "UI/UX";

            const i = state.initiatives.find(x => x.id === initId);
            if (!i) return;
            if (!scope || scope.length < 10) {
                toast("اكتب نطاق نموذج أوضح (10 أحرف على الأقل).", "warn");
                return;
            }
            if (!state.nda?.signed) {
                toast("وقّع تعهد السرية أولاً قبل إرسال الطلب.", "warn");
                setActiveTab("settings");
                return;
            }

            ensurePrototypeForInitiative(i, template, support);
            i.prototype.scope = scope || i.prototype.scope;
            i.prototype.status = "قيد التطوير";
            i.prototype.progress = Math.max(i.prototype.progress || 10, 15);
            i.stage = "النموذج الأولي";
            i.updatedAt = isoNow();

            save();
            addAudit("إرسال طلب دعم نموذج أولي", `${stamp()} • ${i.id} • قالب:${template} • دعم:${support}`);
            closeModals();

            // move to prototypes tab
            setActiveTab("proto");
            renderPrototypes();
            renderHeader();
            toast("تم إرسال طلب الدعم وربطه بالمبادرة.", "success");
        });
    }

    // ---------- Actions: New Initiative / Tasks / Notes ----------
    function wireActions() {
        $("#btnOpenPolicies")?.addEventListener("click", () => (location.href = "../policies.html"));
        $("#btnOpenMap")?.addEventListener("click", () => (location.href = "../components/map.html"));

        $("#btnPrint")?.addEventListener("click", () => {
            addAudit("طباعة السيرة الابتكارية", `${stamp()} • print-report`);
            openPrintReport();
            toast("تم فتح تقرير الطباعة في نافذة جديدة.", "success");
        });

        $("#btnNewInitiative")?.addEventListener("click", () => {
            const title = prompt("عنوان المبادرة:", "مبادرة جديدة");
            if (!title) return;

            const id = `I-${Math.floor(2000 + Math.random() * 8000)}`;
            const ini = {
                id,
                title: title.trim(),
                stage: "الفكرة",
                status: "مسودة",
                progress: 10,
                updatedAt: isoNow(),
                notes: [],
                tasks: [],
                prototype: null
            };
            state.initiatives.unshift(ini);
            state.me.points = (state.me.points || 0) + 5;

            save();
            addAudit("إنشاء مبادرة", `${stamp()} • ${id}`);
            renderHeader();
            renderInitiatives();
            selectInitiative(id);
            toast("تم إنشاء المبادرة الجديدة.", "success");
        });

        $("#btnAddTask")?.addEventListener("click", () => {
            if (!selectedId) {
                toast("اختر مبادرة أولاً.", "warn");
                return;
            }
            const i = state.initiatives.find(x => x.id === selectedId);
            if (!i) return;

            const title = prompt("عنوان المهمة:", "مهمة جديدة");
            if (!title) return;

            const owner = prompt("اسم المنفّذ:", state.me.displayName || "عضو");
            const due = prompt("موعد/تقدير:", "هذا الأسبوع");

            i.tasks = i.tasks || [];
            i.tasks.unshift({
                id: `T-${Math.random().toString(16).slice(2, 7)}`,
                title: title.trim(),
                owner: owner || "—",
                col: "todo",
                due: due || "—"
            });

            i.updatedAt = isoNow();
            i.progress = Math.max(i.progress || 0, 12);

            state.me.points = (state.me.points || 0) + 1;

            save();
            addAudit("إضافة مهمة", `${stamp()} • ${i.id} • ${title.trim()}`);
            renderKanban(i);
            renderInitiatives();
            renderHeader();
            toast("تمت إضافة المهمة.", "success");
        });

        $("#btnAddNote")?.addEventListener("click", () => {
            if (!selectedId) {
                toast("اختر مبادرة أولاً.", "warn");
                return;
            }
            const i = state.initiatives.find(x => x.id === selectedId);
            if (!i) return;

            const text = prompt("اكتب الملاحظة:", "ملاحظة…");
            if (!text) return;

            i.notes = i.notes || [];
            i.notes.unshift({ id: `N-${Math.random().toString(16).slice(2, 7)}`, t: text.trim(), at: isoNow() });
            i.updatedAt = isoNow();

            state.me.points = (state.me.points || 0) + 1;

            save();
            addAudit("إضافة ملاحظة", `${stamp()} • ${i.id}`);
            renderNotes(i);
            renderInitiatives();
            renderHeader();
            toast("تمت إضافة الملاحظة.", "success");
        });

        $("#btnToPrototype")?.addEventListener("click", () => {
            if (!selectedId) {
                toast("اختر مبادرة أولاً.", "warn");
                return;
            }
            const i = state.initiatives.find(x => x.id === selectedId);
            if (!i) return;

            ensurePrototypeForInitiative(i, "Dashboard", "Frontend");
            i.stage = "النموذج الأولي";
            i.updatedAt = isoNow();
            i.progress = Math.max(i.progress || 0, 25);

            save();
            addAudit("بدء مرحلة النموذج الأولي", `${stamp()} • ${i.id}`);
            renderHeader();
            renderInitiatives();
            renderPrototypes();
            setActiveTab("proto");
            toast("تم تحويل المبادرة لمرحلة النموذج الأولي.", "success");
        });

        // Prototype panel actions
        $("#btnNewProto")?.addEventListener("click", () => {
            // Create proto attached to selected initiative if exists, else prompt
            let initId = selectedId;
            if (!initId) {
                initId = prompt("اكتب معرّف المبادرة لربط النموذج (مثال I-2001):", state.initiatives[0]?.id || "");
            }
            const i = state.initiatives.find(x => x.id === initId);
            if (!i) {
                toast("لم يتم العثور على المبادرة.", "warn");
                return;
            }

            const template = prompt("نوع القالب:", "Dashboard") || "Dashboard";
            const support = prompt("نوع الدعم:", "UI/UX") || "UI/UX";
            ensurePrototypeForInitiative(i, template, support);

            i.prototype.scope = i.prototype.scope || "نطاق أولي (Mock)";
            i.prototype.progress = Math.max(i.prototype.progress || 10, 15);
            i.updatedAt = isoNow();
            i.stage = "النموذج الأولي";
            i.progress = Math.max(i.progress || 0, i.prototype.progress);

            state.me.points = (state.me.points || 0) + 3;

            save();
            addAudit("إنشاء نموذج أولي", `${stamp()} • ${i.id} • ${i.prototype.id}`);
            renderHeader();
            renderInitiatives();
            renderPrototypes();
            setActiveTab("proto");
            toast("تم إنشاء النموذج الأولي بنجاح.", "success");
        });

        $("#btnTemplates")?.addEventListener("click", () => {
            addAudit("فتح مكتبة القوالب", `${stamp()} • templates`);
            toast("القوالب المتاحة: Dashboard / Landing / Chatbot / Mobile Mock / Data Flow", "info");
        });

        $("#btnProtoReport")?.addEventListener("click", () => {
            addAudit("إنشاء تقرير جاهزية", `${stamp()} • proto-report`);
            openPrintReport();
            toast("تم فتح تقرير الجاهزية للطباعة.", "success");
        });

        // Audit buttons (from readiness box)
        $("#btnOpenAudit")?.addEventListener("click", () => {
            setActiveTab("audit");
        });

        $("#btnSelfCheck")?.addEventListener("click", () => {
            addAudit("تقييم ذاتي", `${stamp()} • self-check`);
            toast("التقييم الذاتي: أكمل بيانات القيمة + اجمع أدلة + ارفع نموذج قابل للاختبار.", "info");
        });
    }

    // ---------- NDA ----------
    function renderNDA() {
        const signed = !!state.nda?.signed;
        const check = $("#ndaCheck");
        if (check) check.checked = signed;

        const st = $("#ndaState");
        if (st) {
            st.textContent = signed ? `الحالة: موقّع (${state.nda.signedAt || "—"})` : "الحالة: غير موقّع";
        }
    }

    function wireNDA() {
        $("#btnSaveNDA")?.addEventListener("click", () => {
            const ok = $("#ndaCheck")?.checked;
            state.nda = state.nda || { signed: false, signedAt: null };
            state.nda.signed = !!ok;
            state.nda.signedAt = ok ? stamp() : null;
            save();
            addAudit("تحديث تعهد السرية", `${stamp()} • signed:${ok ? "yes" : "no"}`);
            renderNDA();
            toast(ok ? "تم حفظ التعهد بنجاح." : "تم إلغاء التعهد.", "success");
        });

        $("#btnNDAView")?.addEventListener("click", () => openModal("#modalNDA"));
    }

    // ---------- Audit ----------
    function renderAudit() {
        const root = $("#audit");
        if (!root) return;

        const items = (state.audit || []).slice(0, 30);
        root.innerHTML = items.map(a => `
      <div class="auditrow">
        <div>
          <div class="a1">${a.title}</div>
          <div class="a2">${a.meta || ""}</div>
        </div>
        <div class="atime">${prettyDate(a.at)} • ${String(a.meta || "").includes("•") ? (a.meta.split("•")[0].trim()) : ""}</div>
      </div>
    `).join("");
    }

    // ---------- Filters wiring ----------
    function wireFilters() {
        ["q", "filterStage", "filterStatus"].forEach(id => {
            const el = $("#" + id);
            el?.addEventListener("input", () => {
                renderInitiatives();
                uiState.filters = currentFilters();
                saveUi();
            });
            el?.addEventListener("change", () => {
                renderInitiatives();
                uiState.filters = currentFilters();
                saveUi();
            });
        });
    }

    function applySavedUiState() {
        const filters = uiState.filters || {};
        if ($("#q")) $("#q").value = filters.q || "";
        if ($("#filterStage")) $("#filterStage").value = filters.stage || "";
        if ($("#filterStatus")) $("#filterStatus").value = filters.status || "";

        selectedId = uiState.selectedId || null;
        setActiveTab(uiState.activeTab || "my", true);
    }

    function wireShortcuts() {
        document.addEventListener("keydown", (e) => {
            const tag = (document.activeElement?.tagName || "").toLowerCase();
            const typing = ["input", "textarea", "select"].includes(tag);

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
                e.preventDefault();
                openPrintReport();
                toast("تم فتح تقرير الطباعة.", "success");
                return;
            }

            if (typing) return;

            const key = e.key.toLowerCase();
            if (key === "/") {
                e.preventDefault();
                $("#q")?.focus();
                return;
            }
            if (key === "n") {
                e.preventDefault();
                $("#btnNewInitiative")?.click();
                return;
            }
            if (key === "p") {
                e.preventDefault();
                $("#btnRequestPrototype")?.click();
                return;
            }
            if (key === "m") {
                e.preventDefault();
                $("#btnOpenMap")?.click();
                return;
            }
            if (key === "1") setActiveTab("my");
            if (key === "2") setActiveTab("proto");
            if (key === "3") setActiveTab("audit");
            if (key === "4") setActiveTab("settings");
        });
    }

    // ---------- Init ----------
    function init() {
        // safety: if some elements missing, don't crash
        renderHeader();
        wireTabs();
        wireFilters();
        wireActions();
        wireModals();
        wirePrototypeRequest();
        wireNDA();
        wireShortcuts();
        applySavedUiState();

        renderNDA();
        renderInitiatives();
        renderPrototypes();
        renderAudit();

        const savedSelectionStillExists = selectedId && state.initiatives.some(i => i.id === selectedId);
        const first = savedSelectionStillExists ? selectedId : state.initiatives?.[0]?.id;
        if (first) selectInitiative(first);

        addAudit("فتح مسار الموظف (Pro)", `${stamp()} • view`);
        if (!uiState.tipsSeen) {
            toast("اختصارات سريعة: / للبحث • N مبادرة جديدة • P طلب نموذج • Ctrl/Cmd+P تقرير", "info");
            uiState.tipsSeen = true;
            saveUi();
        }
    }

    // run
    document.addEventListener("DOMContentLoaded", init);
})();
