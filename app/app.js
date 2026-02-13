/* =========================================================
   Innovation Shield — app.js (Core UI + State bootstrap)
   - LocalStorage seed (safe)
   - Toasts
   - Active nav
   - KPI counters
   - Tiny helpers
========================================================= */

(() => {
  "use strict";

  // ---------- DOM helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fmt = (n) => new Intl.NumberFormat("ar-SA").format(Number(n || 0));
  const nowISO = () => new Date().toISOString();
  const hhmm = () => {
    const d = new Date();
    const p2 = (x) => String(x).padStart(2, "0");
    return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
  };

  // ---------- Storage ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  // ---------- Global namespace ----------
  window.IS = window.IS || {};
  const IS = window.IS;

  // ---------- Toast ----------
  function ensureToastHost() {
    let host = $(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      document.body.appendChild(host);
    }
    return host;
  }

  function toast(message, type = "ok", timeout = 2600) {
    const host = ensureToastHost();
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    host.appendChild(el);

    const t = setTimeout(() => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 220);
    }, timeout);

    el.addEventListener("click", () => {
      clearTimeout(t);
      el.classList.add("out");
      setTimeout(() => el.remove(), 220);
    });
  }

  IS.toast = toast;

  // ---------- Seed State (MVP) ----------
  const KEY = "is_state_v2";

  function seed() {
    const existing = store.get(KEY, null);
    if (existing) return existing;

    const seeded = {
      org: { nameAr: "تجمع الطائف الصحي", unitAr: "مكتب إدارة الابتكار", programAr: "درع الابتكار" },
      me: { name: "موظف مبتكر", role: "Employee", dept: "قسم/إدارة", points: 132, level: "Pioneer" },

      kpis: {
        innovators: 248,
        initiatives: 41,
        prototypes: 12,
        approved: 7
      },

      stages: ["الفكرة", "التقييم", "تشكيل الفريق", "النموذج الأولي", "التجربة", "الاعتماد", "التطبيق"],

      initiatives: [
        {
          id: "I-2001",
          title: "تحسين رحلة المريض الذكية",
          stage: "الفكرة",
          status: "مسودة",
          updatedAt: nowISO(),
          progress: 18,
          tags: ["تجربة مستفيد", "تشغيلي"],
          tasks: [
            { id: "T-1", title: "صياغة المشكلة", col: "todo", owner: "موظف مبتكر", due: "هذا الأسبوع" },
            { id: "T-2", title: "جمع بيانات أولية", col: "doing", owner: "موظف مبتكر", due: "3 أيام" }
          ],
          prototype: null
        },
        {
          id: "I-2002",
          title: "أتمتة طلبات التشغيل",
          stage: "النموذج الأولي",
          status: "قيد التطوير",
          updatedAt: nowISO(),
          progress: 52,
          tags: ["تشغيلي", "رقمنة"],
          tasks: [
            { id: "T-3", title: "رسم تدفق العمل", col: "done", owner: "عضو", due: "تم" },
            { id: "T-4", title: "بناء نموذج شاشة", col: "doing", owner: "موظف مبتكر", due: "5 أيام" }
          ],
          prototype: {
            id: "P-3101",
            template: "Dashboard",
            support: "Prototype Support Unit",
            scope: "Dashboard + حالات + فلترة + تقرير",
            progress: 36,
            status: "قيد التطوير",
            createdAt: nowISO()
          }
        }
      ],

      policies: {
        accepted: false,
        acceptedAt: null,
        tags: ["سرية", "سيادة بيانات", "تعارض مصالح", "سجل تدقيق", "RBAC"]
      },

      audit: [
        { at: nowISO(), title: "تهيئة النظام", meta: `system • ${hhmm()}` }
      ]
    };

    store.set(KEY, seeded);
    return seeded;
  }

  IS.state = seed();

  IS.save = () => store.set(KEY, IS.state);

  IS.audit = (title, meta = "") => {
    IS.state.audit = IS.state.audit || [];
    IS.state.audit.unshift({
      at: nowISO(),
      title,
      meta: meta || `user • ${hhmm()}`
    });
    IS.save();
  };

  // ---------- Active Nav ----------
  function setActiveNav() {
    const path = (location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();
    $$(".nav a, .topnav a, .topbar a").forEach(a => {
      const href = (a.getAttribute("href") || "").split("/").pop().toLowerCase();
      if (href && href === path) a.classList.add("active");
    });
  }

  // ---------- KPI Counters ----------
  function animateKpis() {
    const els = $$("[data-kpi]");
    if (!els.length) return;

    els.forEach(el => {
      const key = el.getAttribute("data-kpi");
      const target = Number((IS.state.kpis && IS.state.kpis[key]) ?? el.getAttribute("data-target") ?? 0);
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

  // ---------- Global click wiring ----------
  function wireDataGo() {
    $$("[data-go]").forEach(el => {
      el.addEventListener("click", () => {
        const to = el.getAttribute("data-go");
        if (to) location.href = to;
      });
    });
  }

  function wirePolicyChip() {
    const btn = $("[data-accept-policy]");
    if (!btn) return;

    btn.addEventListener("click", () => {
      IS.state.policies.accepted = true;
      IS.state.policies.acceptedAt = nowISO();
      IS.audit("قبول تعهد السرية", `policy • ${hhmm()}`);
      IS.save();
      toast("تم حفظ التعهد ✅", "ok");
      btn.disabled = true;
      btn.textContent = "تم القبول";
    });
  }

  // ---------- Init ----------
  function init() {
    setActiveNav();
    wireDataGo();
    wirePolicyChip();
    animateKpis();

    // small “ready” ping
    // (لو ما تبغاها احذفها)
    if (!IS.state.policies.accepted) {
      toast("ملاحظة: يلزم قبول تعهد السرية قبل مشاركة أي ملف.", "warn", 3200);
    } else {
      toast("جاهز ✅", "ok", 1400);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();