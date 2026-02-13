/* Innovation Shield — Core Engine (LocalStorage Mock)
   - Unified state (initiatives, teams, policies, audit)
   - Toast, Audit, Save/Load, Seed
   - RBAC mock hooks (for UI gating later)
*/

(() => {
  "use strict";

  const KEY = "is_state_v3";

  const fmt = (n) => new Intl.NumberFormat("ar-SA").format(Number(n || 0));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const nowISO = () => new Date().toISOString();

  // ---------------- Storage ----------------
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  // ---------------- Toast ----------------
  const toast = (() => {
    let host = null;
    let timer = null;

    function ensure() {
      if (host) return host;
      host = document.createElement("div");
      host.setAttribute("id", "is_toast");
      host.style.cssText = `
        position: fixed; inset: auto 18px 18px 18px;
        display: grid; gap: 10px;
        z-index: 99999;
        pointer-events: none;
        max-width: 520px;
      `;
      document.body.appendChild(host);
      return host;
    }

    function show(msg, type = "ok", ms = 2000) {
      ensure();
      const card = document.createElement("div");

      const border =
        type === "ok" ? "rgba(17,117,82,.22)" :
          type === "warn" ? "rgba(153,95,16,.28)" :
            "rgba(155,50,72,.26)";

      const bg =
        type === "ok" ? "rgba(17,117,82,.10)" :
          type === "warn" ? "rgba(153,95,16,.12)" :
            "rgba(155,50,72,.10)";

      const ink =
        type === "ok" ? "#0f5f44" :
          type === "warn" ? "#8a5610" :
            "#8a2b3e";

      card.style.cssText = `
        pointer-events: none;
        border: 1px solid ${border};
        background: ${bg};
        color: ${ink};
        border-radius: 14px;
        padding: 10px 12px;
        font-family: inherit;
        font-weight: 800;
        box-shadow: 0 18px 44px rgba(7, 22, 39, 0.18);
        transform: translateY(8px);
        opacity: 0;
        transition: all .18s ease;
      `;
      card.textContent = msg;

      host.appendChild(card);
      requestAnimationFrame(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      });

      clearTimeout(timer);
      timer = setTimeout(() => {
        card.style.opacity = "0";
        card.style.transform = "translateY(8px)";
        setTimeout(() => card.remove(), 220);
      }, ms);
    }

    return { show };
  })();

  // ---------------- Default State ----------------
  function defaultImpactShape() {
    return {
      costSaving: 0,
      timeSavingPct: 0,
      implementationCost: 0,
      operatingCost: 0,
      horizonYears: 3,
      confidencePct: 75
    };
  }

  function defaultRiskShape() {
    return {
      operational: 2,
      financial: 2,
      technical: 2,
      quality: 2,
      experience: 2,
      mitigationEffectivenessPct: 0,
      mitigationPlan: "",
      owner: "",
      reviewCycle: "شهري"
    };
  }

  function defaultPostMonitoringShape() {
    return {
      owner: "",
      expected: {
        annualSaving: 0,
        timeSavingPct: 0
      },
      m3: {
        annualSaving: null,
        timeSavingPct: null,
        qualityImprovementPct: null,
        satisfactionPct: null,
        recordedAt: null
      },
      m6: {
        annualSaving: null,
        timeSavingPct: null,
        qualityImprovementPct: null,
        satisfactionPct: null,
        recordedAt: null
      },
      notes: ""
    };
  }

  function defaultEngagementShape() {
    return {
      upvotes: 0,
      downvotes: 0,
      userVote: 0,
      updatedAt: null
    };
  }

  function defaultState() {
    return {
      version: 3,

      org: {
        nameAr: "منشأة صحية (نموذج)",
        programAr: "مبادرة درع الابتكار — مركز قيادة الابتكار المؤسسي"
      },

      me: {
        name: "موظف مبتكر",
        dept: "إدارة/قسم",
        level: "Pioneer",
        points: 120,
        role: "employee" // employee | judge | admin
      },

      preferences: {
        language: "ar",
        rtl: true
      },

      // Stages in the innovation journey (includes prototype stage)
      stages: [
        "الفكرة",
        "التقييم",
        "تشكيل الفريق",
        "النموذج الأولي",
        "التجربة",
        "الاعتماد",
        "التطبيق"
      ],

      taxonomy: [
        "تقني",
        "تشغيلي",
        "سريري",
        "تجربة مستفيد",
        "جودة",
        "مالي",
        "رقمنة"
      ],

      policies: {
        accepted: false,
        acceptedAt: null,
        lastUpdated: "2026-02-10",
        tags: ["سيادة بيانات", "سرية", "تعارض مصالح", "سجل تدقيق", "صلاحيات", "حماية المساهمة"]
      },

      policyChecks: {
        "policy-nda": false,
        "policy-rbac": true,
        "policy-audit": true,
        "policy-coi": true,
        "policy-proto": true
      },

      teams: [
        {
          id: "T-1001",
          name: "فريق أفق",
          members: [
            { id: "U-1", name: "موظف مبتكر", role: "قائد الفريق", weight: 35 },
            { id: "U-2", name: "عضو 2", role: "تحليل/بحث", weight: 25 },
            { id: "U-3", name: "عضو 3", role: "تصميم/UX", weight: 20 },
            { id: "U-4", name: "عضو 4", role: "تطوير/تنفيذ", weight: 20 }
          ]
        }
      ],

      initiatives: [],

      audit: []
    };
  }

  // ---------------- Seed Data ----------------
  function seed(state) {
    if (state.initiatives && state.initiatives.length) return state;

    const iso = nowISO();

    state.initiatives = [
      {
        id: "I-3001",
        title: "تحسين رحلة المريض الذكية",
        stage: "الفكرة",
        status: "مسودة",
        progress: 18,
        score: null,
        rubric: null,
        minutes: "",
        tags: ["تجربة مستفيد"],
        ownerTeam: "T-1001",
        validation: {
          problem: "طول زمن رحلة المريض بين الأقسام",
          beneficiary: "المراجعين وفرق الاستقبال",
          evidence: "استبيان داخلي + ملاحظات ميدانية"
        },
        impact: {
          costSaving: 140000,
          timeSavingPct: 18,
          implementationCost: 95000,
          operatingCost: 22000,
          horizonYears: 3,
          confidencePct: 78
        },
        riskProfile: {
          operational: 3,
          financial: 2,
          technical: 2,
          quality: 3,
          experience: 3,
          mitigationEffectivenessPct: 30,
          mitigationPlan: "تجربة محدودة في قسم واحد قبل التوسع.",
          owner: "مدير تجربة المريض",
          reviewCycle: "شهري"
        },
        postMonitoring: {
          owner: "مدير المشروع",
          expected: { annualSaving: 140000, timeSavingPct: 18 },
          m3: { annualSaving: null, timeSavingPct: null, qualityImprovementPct: null, satisfactionPct: null, recordedAt: null },
          m6: { annualSaving: null, timeSavingPct: null, qualityImprovementPct: null, satisfactionPct: null, recordedAt: null },
          notes: ""
        },
        prototype: null,
        tasks: [
          { id: "TK-1", title: "صياغة المشكلة (Problem)", owner: "موظف مبتكر", col: "todo", due: "2026-02-20" },
          { id: "TK-2", title: "تحديد المستفيدين", owner: "عضو 2", col: "todo", due: "2026-02-21" }
        ],
        createdAt: iso,
        updatedAt: iso
      },
      {
        id: "I-3002",
        title: "أتمتة طلبات التشغيل",
        stage: "التقييم",
        status: "قيد التحكيم",
        progress: 44,
        score: 78,
        rubric: { problem: 4, feasible: 4, impact: 3, prototype: 2, risk: 3 },
        minutes: "مطلوب توضيح نطاق التنفيذ وتقدير الأثر.",
        tags: ["رقمنة"],
        ownerTeam: "T-1001",
        validation: {
          problem: "تأخر معالجة طلبات التشغيل",
          beneficiary: "الفرق التشغيلية",
          evidence: "تحليل 6 أشهر لزمن الإغلاق"
        },
        impact: {
          costSaving: 220000,
          timeSavingPct: 24,
          implementationCost: 135000,
          operatingCost: 30000,
          horizonYears: 3,
          confidencePct: 82
        },
        riskProfile: {
          operational: 2,
          financial: 3,
          technical: 3,
          quality: 2,
          experience: 2,
          mitigationEffectivenessPct: 35,
          mitigationPlan: "حوكمة تغيير + تدريب مرحلي للمستخدمين.",
          owner: "قائد التحول الرقمي",
          reviewCycle: "شهري"
        },
        postMonitoring: {
          owner: "قائد التحول الرقمي",
          expected: { annualSaving: 220000, timeSavingPct: 24 },
          m3: { annualSaving: null, timeSavingPct: null, qualityImprovementPct: null, satisfactionPct: null, recordedAt: null },
          m6: { annualSaving: null, timeSavingPct: null, qualityImprovementPct: null, satisfactionPct: null, recordedAt: null },
          notes: ""
        },
        prototype: null,
        tasks: [
          { id: "TK-3", title: "جمع المتطلبات", owner: "عضو 2", col: "doing", due: "2026-02-22" },
          { id: "TK-4", title: "رسم تدفق العملية", owner: "عضو 3", col: "todo", due: "2026-02-23" }
        ],
        createdAt: iso,
        updatedAt: iso
      },
      {
        id: "I-3003",
        title: "مؤشر جودة داخلي",
        stage: "النموذج الأولي",
        status: "قيد التطوير",
        progress: 58,
        score: null,
        rubric: null,
        minutes: "",
        tags: ["جودة"],
        ownerTeam: "T-1001",
        validation: {
          problem: "غياب رؤية يومية لمؤشرات الجودة",
          beneficiary: "قيادات الأقسام",
          evidence: "طلب رسمي من إدارة الجودة"
        },
        impact: {
          costSaving: 185000,
          timeSavingPct: 20,
          implementationCost: 120000,
          operatingCost: 26000,
          horizonYears: 3,
          confidencePct: 74
        },
        riskProfile: {
          operational: 3,
          financial: 2,
          technical: 2,
          quality: 2,
          experience: 2,
          mitigationEffectivenessPct: 25,
          mitigationPlan: "معايرة المؤشرات أسبوعيًا في أول شهرين.",
          owner: "مدير الجودة",
          reviewCycle: "أسبوعي"
        },
        postMonitoring: {
          owner: "مدير الجودة",
          expected: { annualSaving: 185000, timeSavingPct: 20 },
          m3: { annualSaving: null, timeSavingPct: null, qualityImprovementPct: null, satisfactionPct: null, recordedAt: null },
          m6: { annualSaving: null, timeSavingPct: null, qualityImprovementPct: null, satisfactionPct: null, recordedAt: null },
          notes: ""
        },
        prototype: {
          id: "P-4101",
          template: "Dashboard",
          support: "Prototype Support Unit",
          scope: "مؤشر + تقرير أسبوعي",
          progress: 44,
          status: "قيد التطوير",
          createdAt: iso
        },
        tasks: [
          { id: "TK-5", title: "تصميم واجهة Prototype", owner: "عضو 3", col: "doing", due: "2026-02-21" },
          { id: "TK-6", title: "بيانات تجريبية", owner: "عضو 4", col: "todo", due: "2026-02-23" },
          { id: "TK-7", title: "توثيق النتائج", owner: "موظف مبتكر", col: "todo", due: "2026-02-25" }
        ],
        createdAt: iso,
        updatedAt: iso
      }
    ];

    // initial audit
    state.audit = [
      { at: iso, title: "تهيئة المنصة", meta: "Seed data" }
    ];

    return state;
  }

  // ---------------- Audit ----------------
  function audit(title, meta = "") {
    state.audit = state.audit || [];
    state.audit.unshift({
      at: nowISO(),
      title,
      meta
    });
    // keep small
    if (state.audit.length > 80) state.audit = state.audit.slice(0, 80);
  }

  // ---------------- RBAC Mock ----------------
  function can(role) {
    // role string: "employee" | "judge" | "admin"
    // minimal mock: admin can all, judge can judging, employee can only employee/map/policies
    const me = (state.me && state.me.role) || "employee";
    if (me === "admin") return true;
    if (role === "employee") return true;
    if (role === "judge") return me === "judge";
    if (role === "admin") return false;
    return false;
  }

  // ---------------- Policy Hook ----------------
  function ensurePolicyAccepted() {
    if (!state.policies) state.policies = { accepted: false, acceptedAt: null };
    return !!state.policies.accepted;
  }

  function acceptPolicy() {
    if (!state.policies) state.policies = {};
    state.policies.accepted = true;
    state.policies.acceptedAt = nowISO();
    audit("قبول تعهد السرية (NDA)", "policies");
    toast.show("تم قبول تعهد السرية ✅", "ok", 2000);
    save();
  }

  // ---------------- Save/Load ----------------
  function save() {
    store.set(KEY, state);
  }

  function load() {
    const raw = store.get(KEY, null);
    if (!raw || typeof raw !== "object") return seed(defaultState());

    // migrate if needed
    const v = Number(raw.version || 0);
    if (v < 3) {
      // soft migration: merge with defaults
      const base = defaultState();
      const merged = { ...base, ...raw };
      merged.version = 3;
      if (!Array.isArray(merged.stages) || !merged.stages.length) merged.stages = base.stages;
      if (!Array.isArray(merged.taxonomy) || !merged.taxonomy.length) merged.taxonomy = base.taxonomy;
      if (!Array.isArray(merged.teams) || !merged.teams.length) merged.teams = base.teams;
      if (!Array.isArray(merged.audit)) merged.audit = [];
      if (!Array.isArray(merged.initiatives)) merged.initiatives = [];
      normalizeStateShape(merged);
      seed(merged);
      store.set(KEY, merged);
      return merged;
    }

    // ensure critical keys exist
    if (!raw.org) raw.org = defaultState().org;
    if (!raw.me) raw.me = defaultState().me;
    if (!raw.preferences || typeof raw.preferences !== "object") raw.preferences = defaultState().preferences;
    if (!Array.isArray(raw.stages)) raw.stages = defaultState().stages;
    if (!Array.isArray(raw.taxonomy)) raw.taxonomy = defaultState().taxonomy;
    if (!raw.policies) raw.policies = defaultState().policies;
    if (!raw.policyChecks) raw.policyChecks = defaultState().policyChecks;
    if (!Array.isArray(raw.teams)) raw.teams = defaultState().teams;
    if (!Array.isArray(raw.initiatives)) raw.initiatives = [];
    if (!Array.isArray(raw.audit)) raw.audit = [];

    normalizeStateShape(raw);
    seed(raw);
    return raw;
  }

  function normalizeStateShape(target) {
    if (!target || typeof target !== "object") return target;

    if (!Array.isArray(target.taxonomy) || !target.taxonomy.length) {
      target.taxonomy = defaultState().taxonomy.slice();
    }

    target.initiatives = (target.initiatives || []).map((ini) => {
      const item = ini || {};

      if (!Array.isArray(item.tags)) item.tags = [];

      if (!item.validation || typeof item.validation !== "object") item.validation = {};
      item.validation.problem = String(item.validation.problem || "");
      item.validation.beneficiary = String(item.validation.beneficiary || "");
      item.validation.evidence = String(item.validation.evidence || "");

      if (!item.engagement || typeof item.engagement !== "object") item.engagement = {};
      const baseEngagement = defaultEngagementShape();
      item.engagement.upvotes = Math.max(0, Number(item.engagement.upvotes ?? baseEngagement.upvotes));
      item.engagement.downvotes = Math.max(0, Number(item.engagement.downvotes ?? baseEngagement.downvotes));
      item.engagement.userVote = clamp(Number(item.engagement.userVote ?? baseEngagement.userVote), -1, 1);
      item.engagement.updatedAt = item.engagement.updatedAt ? String(item.engagement.updatedAt) : null;

      if (!item.impact || typeof item.impact !== "object") item.impact = {};
      const baseImpact = defaultImpactShape();
      item.impact.costSaving = Math.max(0, Number(item.impact.costSaving ?? baseImpact.costSaving));
      item.impact.timeSavingPct = clamp(Number(item.impact.timeSavingPct ?? baseImpact.timeSavingPct), 0, 100);
      item.impact.implementationCost = Math.max(0, Number(item.impact.implementationCost ?? baseImpact.implementationCost));
      item.impact.operatingCost = Math.max(0, Number(item.impact.operatingCost ?? baseImpact.operatingCost));
      item.impact.horizonYears = clamp(Number(item.impact.horizonYears ?? baseImpact.horizonYears), 1, 5);
      item.impact.confidencePct = clamp(Number(item.impact.confidencePct ?? baseImpact.confidencePct), 10, 100);

      if (!item.riskProfile || typeof item.riskProfile !== "object") item.riskProfile = {};
      const baseRisk = defaultRiskShape();
      item.riskProfile.operational = clamp(Number(item.riskProfile.operational ?? baseRisk.operational), 1, 5);
      item.riskProfile.financial = clamp(Number(item.riskProfile.financial ?? baseRisk.financial), 1, 5);
      item.riskProfile.technical = clamp(Number(item.riskProfile.technical ?? baseRisk.technical), 1, 5);
      item.riskProfile.quality = clamp(Number(item.riskProfile.quality ?? baseRisk.quality), 1, 5);
      item.riskProfile.experience = clamp(Number(item.riskProfile.experience ?? baseRisk.experience), 1, 5);
      item.riskProfile.mitigationEffectivenessPct = clamp(Number(item.riskProfile.mitigationEffectivenessPct ?? baseRisk.mitigationEffectivenessPct), 0, 100);
      item.riskProfile.mitigationPlan = String(item.riskProfile.mitigationPlan ?? baseRisk.mitigationPlan);
      item.riskProfile.owner = String(item.riskProfile.owner ?? baseRisk.owner);
      item.riskProfile.reviewCycle = String(item.riskProfile.reviewCycle ?? baseRisk.reviewCycle);

      if (!item.postMonitoring || typeof item.postMonitoring !== "object") item.postMonitoring = {};
      const basePost = defaultPostMonitoringShape();
      const toNullable = (value, min = 0, max = null) => {
        if (value == null || value === "") return null;
        const num = Number(value);
        if (!Number.isFinite(num)) return null;
        let out = num;
        if (min != null) out = Math.max(min, out);
        if (max != null) out = Math.min(max, out);
        return out;
      };

      item.postMonitoring.owner = String(item.postMonitoring.owner ?? basePost.owner);
      item.postMonitoring.notes = String(item.postMonitoring.notes ?? basePost.notes);

      item.postMonitoring.expected = item.postMonitoring.expected || {};
      item.postMonitoring.expected.annualSaving = Math.max(0, Number(item.postMonitoring.expected.annualSaving ?? basePost.expected.annualSaving));
      item.postMonitoring.expected.timeSavingPct = clamp(Number(item.postMonitoring.expected.timeSavingPct ?? basePost.expected.timeSavingPct), 0, 100);

      item.postMonitoring.m3 = item.postMonitoring.m3 || {};
      item.postMonitoring.m3.annualSaving = toNullable(item.postMonitoring.m3.annualSaving);
      item.postMonitoring.m3.timeSavingPct = toNullable(item.postMonitoring.m3.timeSavingPct, 0, 100);
      item.postMonitoring.m3.qualityImprovementPct = toNullable(item.postMonitoring.m3.qualityImprovementPct, 0, 100);
      item.postMonitoring.m3.satisfactionPct = toNullable(item.postMonitoring.m3.satisfactionPct, 0, 100);
      item.postMonitoring.m3.recordedAt = item.postMonitoring.m3.recordedAt ? String(item.postMonitoring.m3.recordedAt) : null;

      item.postMonitoring.m6 = item.postMonitoring.m6 || {};
      item.postMonitoring.m6.annualSaving = toNullable(item.postMonitoring.m6.annualSaving);
      item.postMonitoring.m6.timeSavingPct = toNullable(item.postMonitoring.m6.timeSavingPct, 0, 100);
      item.postMonitoring.m6.qualityImprovementPct = toNullable(item.postMonitoring.m6.qualityImprovementPct, 0, 100);
      item.postMonitoring.m6.satisfactionPct = toNullable(item.postMonitoring.m6.satisfactionPct, 0, 100);
      item.postMonitoring.m6.recordedAt = item.postMonitoring.m6.recordedAt ? String(item.postMonitoring.m6.recordedAt) : null;

      if (!item.aiPrediction || typeof item.aiPrediction !== "object") {
        item.aiPrediction = null;
      } else {
        item.aiPrediction.score = clamp(Number(item.aiPrediction.score || 0), 0, 100);
        item.aiPrediction.level = String(item.aiPrediction.level || "منخفض");
        item.aiPrediction.confidencePct = clamp(Number(item.aiPrediction.confidencePct || 60), 10, 100);
        item.aiPrediction.summary = String(item.aiPrediction.summary || "");
        item.aiPrediction.updatedAt = item.aiPrediction.updatedAt ? String(item.aiPrediction.updatedAt) : null;
      }

      return item;
    });

    return target;
  }

  // ---------------- Helpers ----------------
  function getInitiative(id) {
    return (state.initiatives || []).find(x => x.id === id) || null;
  }

  function setSelectedInitiative(id) {
    localStorage.setItem("is_selected_initiative", id || "");
  }

  function getSelectedInitiative() {
    const id = (localStorage.getItem("is_selected_initiative") || "").trim();
    return id ? id : null;
  }

  // ---------------- Bind Policy buttons ----------------
  function wirePolicyButtons() {
    // Any element with [data-accept-policy] will accept NDA
    document.querySelectorAll("[data-accept-policy]").forEach(btn => {
      btn.addEventListener("click", () => acceptPolicy());
    });
  }

  // ---------------- Global init ----------------
  let state = load();
  save(); // ensure persisted

  document.addEventListener("DOMContentLoaded", () => {
    wirePolicyButtons();
  });

  // Expose
  window.IS = {
    state,

    fmt,
    clamp,
    nowISO,

    toast: (msg, type = "ok", ms = 2000) => toast.show(msg, type, ms),
    audit,
    save,
    load: () => (state = load()),

    can,
    ensurePolicyAccepted,
    acceptPolicy,

    getInitiative,
    setSelectedInitiative,
    getSelectedInitiative
  };
})();
