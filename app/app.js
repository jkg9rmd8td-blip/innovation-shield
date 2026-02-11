(() => {
  "use strict";

  /* ===========================
     Innovation Shield — app.js
     - Nav wiring (index + pages)
     - KPI animation (index)
     - Employee profile
     - Judging (score/approve)
     - Prize distribution (weighted/manual)
     - Innovation map (kanban)
     - Initiative details
     - Submit initiative
     - LocalStorage persistence
     =========================== */

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fmt = (n) => new Intl.NumberFormat("ar-SA").format(n);

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
  };

  // ---------- Mock State ----------
  const DEFAULT_STATE = {
    org: {
      nameAr: "مجمع الملك فيصل الطبي",
      programAr: "مبادرة درع الابتكار — مركز قيادة الابتكار المؤسسي",
    },
    me: {
      displayName: "موظف مبتكر",
      dept: "إدارة/قسم",
      role: "موظف",
    },
    kpis: { innovators: 248, governed: 41, approved: 7 },
    teams: [
      {
        id: "T-1001",
        name: "فريق أفق",
        members: [
          { id: "U-1", name: "موظف مبتكر", role: "قائد الفريق", weight: 35 },
          { id: "U-2", name: "عضو 2", role: "تحليل/بحث", weight: 25 },
          { id: "U-3", name: "عضو 3", role: "تصميم/UX", weight: 20 },
          { id: "U-4", name: "عضو 4", role: "تطوير/تنفيذ", weight: 20 },
        ],
      },
    ],
    initiatives: [
      {
        id: "I-2001",
        title: "تحسين رحلة المريض الذكية",
        stage: "الفكرة",
        owner: "T-1001",
        status: "مسودة",
        score: null,
        prizes: [],
      },
      {
        id: "I-2002",
        title: "أتمتة طلبات التشغيل",
        stage: "التقييم",
        owner: "T-1001",
        status: "قيد التحكيم",
        score: 82,
        prizes: [],
      },
      {
        id: "I-2003",
        title: "مؤشر جودة داخلي",
        stage: "الاعتماد",
        owner: "T-1001",
        status: "معتمد",
        score: 91,
        prizes: [
          {
            mode: "weighted",
            total: 100000,
            currency: "SAR",
            breakdown: [
              { name: "موظف مبتكر", percent: 35, amount: 35000 },
              { name: "عضو 2", percent: 25, amount: 25000 },
              { name: "عضو 3", percent: 20, amount: 20000 },
              { name: "عضو 4", percent: 20, amount: 20000 },
            ],
          },
        ],
      },
    ],
    policies: {
      lastUpdated: "2026-02-10",
      tags: [
        "سيادة بيانات",
        "سرية",
        "تعارض مصالح",
        "سجل تدقيق",
        "صلاحيات",
        "حماية المساهمة",
      ],
    },
    audit: [
      // {ts, actor, action, target}
    ],
  };

  const state = store.get("is_state_v1", DEFAULT_STATE);
  store.set("is_state_v1", state);

  function audit(action, target = "", actor = "System") {
    state.audit = state.audit || [];
    state.audit.unshift({
      ts: new Date().toISOString(),
      actor,
      action,
      target,
    });
    // keep short
    if (state.audit.length > 80) state.audit.length = 80;
    store.set("is_state_v1", state);
  }

  // ---------- Global Nav Wiring ----------
  function wireNav() {
    // Buttons by id (from index hero)
    const goMap = $("#go-map");
    const goSubmit = $("#go-submit");
    if (goMap) goMap.addEventListener("click", () => (location.href = "app/components/map.html"));
    if (goSubmit) goSubmit.addEventListener("click", () => (location.href = "app/components/submit.html"));

    // Generic data-go
    $$("[data-go]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const to = btn.getAttribute("data-go");
        if (to) location.href = to;
      });
    });

    // Highlight top nav active
    const path = location.pathname.split("/").pop();
    $$(".toplink").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("/").pop();
      if (href && href === path) a.classList.add("active");
    });
  }

  // ---------- KPI animation (index) ----------
  function animateKpis() {
    const els = $$(".kpi-number[data-target]");
    if (!els.length) return;

    els.forEach((el) => {
      const target = Number(el.getAttribute("data-target") || "0");
      const dur = 900 + Math.random() * 600;
      const t0 = performance.now();

      function tick(t) {
        const p = clamp((t - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = Math.round(target * eased);
        el.textContent = fmt(v);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // ---------- Page: Employee Profile ----------
  function renderProfile() {
    const root = $("#page-profile");
    if (!root) return;

    const myInitiatives = state.initiatives || [];
    const wins = myInitiatives.filter((x) => x.status === "معتمد").length;

    safeText("#pf_name", state.me?.displayName || "—");
    safeText("#pf_org", state.org?.nameAr || "—");
    safeText("#pf_role", "موظف مبتكر");
    safeText("#pf_total", fmt(myInitiatives.length));
    safeText("#pf_wins", fmt(wins));
    safeText("#pf_points", fmt(120));

    const list = $("#pf_list");
    if (list) {
      list.innerHTML = myInitiatives
        .map(
          (i) => `
        <div class="row cardline">
          <div class="row-main">
            <div class="row-title">${escapeHtml(i.title)}</div>
            <div class="row-sub">${escapeHtml(i.stage)} • ${escapeHtml(i.status)}${i.score != null ? ` • نتيجة: ${fmt(i.score)}` : ""}</div>
          </div>
          <div class="row-actions">
            <a class="btn ghost sm" href="initiative.html?id=${encodeURIComponent(i.id)}">فتح</a>
          </div>
        </div>`
        )
        .join("");
    }

    const btnNew = $("#btn_new");
    const btnMap = $("#btn_map");
    if (btnNew) btnNew.addEventListener("click", () => (location.href = "submit.html"));
    if (btnMap) btnMap.addEventListener("click", () => (location.href = "map.html"));
  }

  // ---------- Page: Judging ----------
  function renderJudging() {
    const root = $("#page-judging");
    if (!root) return;

    const tbody = $("#jd_tbody");
    if (!tbody) return;

    const itemsHtml = (state.initiatives || [])
      .map((i) => {
        const badge = i.status === "معتمد" ? "ok" : i.status === "قيد التحكيم" ? "warn" : "muted";
        return `
          <tr>
            <td><a class="link" href="initiative.html?id=${encodeURIComponent(i.id)}">${escapeHtml(i.id)}</a></td>
            <td>${escapeHtml(i.title)}</td>
            <td><span class="badge ${badge}">${escapeHtml(i.stage)}</span></td>
            <td><span class="badge ${badge}">${escapeHtml(i.status)}</span></td>
            <td>${i.score == null ? "—" : fmt(i.score)}</td>
            <td class="td-actions">
              <button class="btn sm" data-score="${escapeAttr(i.id)}">تقييم</button>
              <button class="btn sm ghost" data-approve="${escapeAttr(i.id)}">اعتماد</button>
              <button class="btn sm ghost" data-prize="${escapeAttr(i.id)}">جوائز</button>
            </td>
          </tr>`;
      })
      .join("");

    tbody.innerHTML = itemsHtml;

    $$("[data-score]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-score");
        const i = (state.initiatives || []).find((x) => x.id === id);
        if (!i) return;

        const v = prompt("أدخل نتيجة التحكيم (0-100):", String(i.score ?? 80));
        if (v == null) return;

        const n = clamp(Number(v), 0, 100);
        if (!isFinite(n)) return alert("قيمة غير صحيحة.");

        i.score = Math.round(n);
        if (i.status === "مسودة") i.status = "قيد التحكيم";
        audit("تحديث نتيجة التحكيم", i.id, "Judge");
        store.set("is_state_v1", state);
        renderJudging();
      })
    );

    $$("[data-approve]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-approve");
        const i = (state.initiatives || []).find((x) => x.id === id);
        if (!i) return;

        i.status = "معتمد";
        i.stage = "الاعتماد";
        if (i.score == null) i.score = 85;

        // mock KPI updates
        state.kpis.approved = (state.initiatives || []).filter((x) => x.status === "معتمد").length;

        audit("اعتماد المبادرة", i.id, "Committee");
        store.set("is_state_v1", state);
        renderJudging();
        alert("تم اعتماد المبادرة وتوثيق القرار (Mock).");
      })
    );

    $$("[data-prize]").forEach((b) =>
      b.addEventListener("click", () => openPrize(b.getAttribute("data-prize")))
    );
  }

  // ---------- Prize Engine ----------
  function openPrize(initId) {
    const i = (state.initiatives || []).find((x) => x.id === initId);
    if (!i) return;

    const modal = $("#modal_prize");
    if (!modal) return alert("نافذة الجوائز غير موجودة في هذه الصفحة.");

    const title = $("#pr_title");
    const total = $("#pr_total");
    const mode = $("#pr_mode");
    const tbody = $("#pr_tbody");
    const btnApply = $("#pr_apply");

    if (!title || !total || !mode || !tbody || !btnApply) {
      return alert("مكونات نافذة الجوائز غير مكتملة.");
    }

    title.textContent = `${i.title} — ${i.id}`;
    total.value = i.prizes?.[0]?.total ?? 100000;
    mode.value = i.prizes?.[0]?.mode ?? "weighted";

    const team = (state.teams || []).find((t) => t.id === i.owner) || (state.teams || [])[0];
    const members = team?.members || [];

    function renderRows() {
      const currentMode = mode.value;

      tbody.innerHTML = members
        .map(
          (m) => `
          <tr>
            <td>${escapeHtml(m.name)}</td>
            <td>${escapeHtml(m.role)}</td>
            <td><input class="in sm" data-w="${escapeAttr(m.id)}" type="number" min="0" max="100" step="1" value="${currentMode === "weighted" ? m.weight : 0}"></td>
            <td><input class="in sm" data-p="${escapeAttr(m.id)}" type="number" min="0" max="100" step="1" value="${currentMode === "manual" ? m.weight : 0}"></td>
          </tr>`
        )
        .join("");

      $$("[data-w]").forEach((x) => (x.disabled = mode.value !== "weighted"));
      $$("[data-p]").forEach((x) => (x.disabled = mode.value !== "manual"));
    }

    mode.onchange = renderRows;
    renderRows();

    btnApply.onclick = () => {
      const t = Number(total.value || 0);
      if (!isFinite(t) || t <= 0) return alert("أدخل إجمالي جائزة صحيح.");

      let percents = [];

      if (mode.value === "weighted") {
        const ws = members.map((m) => {
          const el = $(`[data-w="${cssEscape(m.id)}"]`);
          return { name: m.name, w: Number(el?.value || 0) };
        });
        const sum = ws.reduce((a, b) => a + b.w, 0) || 1;
        percents = ws.map((x) => ({ name: x.name, percent: Math.round((x.w / sum) * 100) }));
      } else {
        const ps = members.map((m) => {
          const el = $(`[data-p="${cssEscape(m.id)}"]`);
          return { name: m.name, percent: Number(el?.value || 0) };
        });
        const sum = ps.reduce((a, b) => a + b.percent, 0);

        if (sum === 0) {
          const eq = Math.floor(100 / ps.length);
          percents = ps.map((x) => ({ name: x.name, percent: eq }));
          const fix = 100 - eq * (ps.length - 1);
          percents[percents.length - 1].percent = fix;
        } else {
          percents = ps.map((x) => ({ name: x.name, percent: Math.round((x.percent / sum) * 100) }));
        }
      }

      // Normalize to 100
      let s = percents.reduce((a, b) => a + b.percent, 0);
      if (s !== 100 && percents.length) percents[percents.length - 1].percent += 100 - s;

      const breakdown = percents.map((p) => ({
        name: p.name,
        percent: p.percent,
        amount: Math.round((t * p.percent) / 100),
      }));

      i.prizes = [{ mode: mode.value, total: t, currency: "SAR", breakdown }];
      audit("حفظ توزيع الجوائز", i.id, "Committee");
      store.set("is_state_v1", state);

      closeModal("modal_prize");
      alert("تم حفظ توزيع الجوائز ✅");
    };

    openModal("modal_prize");
  }

  // ---------- Page: Innovation Map ----------
  function renderMap() {
    const root = $("#page-map");
    if (!root) return;

    const board = $("#map_board");
    if (!board) return;

    const stages = ["الفكرة", "التقييم", "الاعتماد", "التنفيذ", "الأثر"];
    const inits = state.initiatives || [];

    board.innerHTML = stages
      .map((stage) => {
        const items = inits.filter((i) => i.stage === stage);
        return `
          <div class="lane">
            <div class="lane-head">
              <div class="lane-title">${escapeHtml(stage)}</div>
              <div class="lane-count">${fmt(items.length)}</div>
            </div>
            <div class="lane-body">
              ${items
                .map(
                  (i) => `
                <a class="ticket" href="initiative.html?id=${encodeURIComponent(i.id)}">
                  <div class="ticket-title">${escapeHtml(i.title)}</div>
                  <div class="ticket-sub">${escapeHtml(i.id)} • ${escapeHtml(i.status)}${i.score != null ? ` • ${fmt(i.score)}` : ""}</div>
                </a>`
                )
                .join("")}
              <button class="ticket add" data-add="${escapeAttr(stage)}">+ إضافة</button>
            </div>
          </div>`;
      })
      .join("");

    $$("[data-add]").forEach((b) =>
      b.addEventListener("click", () => {
        const stage = b.getAttribute("data-add") || "الفكرة";
        const title = prompt("اسم المبادرة:");
        if (!title) return;

        const id = `I-${Math.floor(3000 + Math.random() * 6000)}`;
        state.initiatives.unshift({
          id,
          title: title.trim(),
          stage,
          owner: state.teams?.[0]?.id || "T-1001",
          status: "مسودة",
          score: null,
          prizes: [],
        });

        state.kpis.governed = state.initiatives.length;
        audit("تسجيل مبادرة جديدة", id, "Employee");
        store.set("is_state_v1", state);
        renderMap();
      })
    );
  }

  // ---------- Page: Initiative Details ----------
  function renderInitiative() {
    const root = $("#page-initiative");
    if (!root) return;

    const qs = new URLSearchParams(location.search);
    const id = qs.get("id");
    const i = (state.initiatives || []).find((x) => x.id === id) || (state.initiatives || [])[0];
    if (!i) return;

    safeText("#in_id", i.id);
    safeText("#in_title", i.title);
    safeText("#in_stage", i.stage);
    safeText("#in_status", i.status);
    safeText("#in_score", i.score == null ? "—" : fmt(i.score));

    const team = (state.teams || []).find((t) => t.id === i.owner) || (state.teams || [])[0];
    safeText("#in_team", team?.name || "—");

    const box = $("#in_prize");
    const p = i.prizes?.[0];
    if (box) {
      if (!p) {
        box.innerHTML = `<div class="muted">لا يوجد توزيع جوائز محفوظ لهذه المبادرة.</div>`;
      } else {
        box.innerHTML = `
          <div class="pr-head">
            <div class="pr-total">الإجمالي: ${fmt(p.total)} ${escapeHtml(p.currency)}</div>
            <div class="badge ok">${p.mode === "weighted" ? "حسب الأوزان" : "توزيع يدوي"}</div>
          </div>
          <div class="pr-list">
            ${p.breakdown
              .map(
                (x) => `
              <div class="pr-row">
                <div class="pr-name">${escapeHtml(x.name)}</div>
                <div class="pr-meta">${fmt(x.percent)}%</div>
                <div class="pr-amt">${fmt(x.amount)} ${escapeHtml(p.currency)}</div>
              </div>`
              )
              .join("")}
          </div>`;
      }
    }

    const back = $("#in_back");
    const openP = $("#in_open_prize");
    const next = $("#in_next");
    if (back) back.addEventListener("click", () => history.back());
    if (openP) openP.addEventListener("click", () => openPrize(i.id));
    if (next) {
      next.addEventListener("click", () => {
        const order = ["الفكرة", "التقييم", "الاعتماد", "التنفيذ", "الأثر"];
        const idx = order.indexOf(i.stage);
        i.stage = order[Math.min(idx + 1, order.length - 1)];
        if (i.stage === "الأثر") i.status = "متابعة أثر";
        audit("نقل مرحلة المبادرة", i.id, "Admin");
        store.set("is_state_v1", state);
        renderInitiative();
      });
    }
  }

  // ---------- Page: Submit ----------
  function renderSubmit() {
    const root = $("#page-submit");
    if (!root) return;

    const f = $("#sb_form");
    if (!f) return;

    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = ($("#sb_title")?.value || "").trim();
      if (!title) return alert("اكتب اسم المبادرة أولاً.");

      const id = `I-${Math.floor(3000 + Math.random() * 6000)}`;
      state.initiatives.unshift({
        id,
        title,
        stage: "الفكرة",
        owner: state.teams?.[0]?.id || "T-1001",
        status: "مسودة",
        score: null,
        prizes: [],
      });

      state.kpis.governed = state.initiatives.length;
      audit("تقديم مبادرة", id, "Employee");
      store.set("is_state_v1", state);

      alert("تم تسجيل المبادرة ✅");
      location.href = "map.html";
    });
  }

  // ---------- Modals ----------
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add("show");
    document.body.classList.add("no-scroll");
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }
  window.openModal = openModal;
  window.closeModal = closeModal;

  // ---------- Helpers ----------
  function safeText(sel, txt) {
    const el = $(sel);
    if (el) el.textContent = txt ?? "";
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replaceAll("`", "&#096;");
  }

  function cssEscape(s) {
    // minimal escape for querySelector in data-* attrs
    return String(s).replaceAll('"', '\\"');
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    wireNav();
    animateKpis();
    renderProfile();
    renderJudging();
    renderMap();
    renderInitiative();
    renderSubmit();

    // Close buttons & click outside
    $$(".modal [data-close]").forEach((b) => b.addEventListener("click", () => closeModal(b.closest(".modal")?.id)));
    $$(".modal").forEach((m) =>
      m.addEventListener("click", (e) => {
        if (e.target === m) closeModal(m.id);
      })
    );
  });
})();
