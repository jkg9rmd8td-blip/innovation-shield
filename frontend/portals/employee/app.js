import { bootPortal } from "../../shared/shell/shell.js";
import { api } from "../../shared/core/api-client.js";

bootPortal({ portal: "employee" });

const $ = (id) => document.getElementById(id);
const pretty = (data) => JSON.stringify(data, null, 2);
const nf = new Intl.NumberFormat("ar-SA");

const BUILDER_STEP_COUNT = 4;
const COLLAB_STORE_KEY = "is_employee_collab_v2";

const STUDIO_TEMPLATES = {
  wireframe: `Screen A: Intake\n- Patient ID\n- Symptom Input\n- Priority Suggestion\n\nScreen B: Routing\n- Suggested Unit\n- SLA Target\n- Escalation Trigger`,
  journey: `Stage 1: Arrival -> Waiting area\nStage 2: Triage -> Data capture\nStage 3: Routing -> Correct specialty\nStage 4: Follow-up -> Outcome tracking`,
  flowchart: `Start -> Capture Request -> Score Priority -> Route Case\nIf urgent -> Alert clinical team\nElse -> Standard queue\nEnd -> Notify stakeholder`,
  canvas: `Value Proposition: Faster triage and routing\nCustomer Segments: Patients + Care Teams\nChannels: Front desk + Portal\nKey Metrics: Wait time, cost, satisfaction\nCost Structure: Integration + training\nRevenue/Value: Cost avoidance + productivity`,
};

const appState = {
  initiatives: [],
  prototypes: [],
  selectedPrototypeId: null,
  compareSelection: [],
  workspaceCache: {},
  timelineCache: {},
  collabServerCache: {},
  pitchMode: false,
  builder: {
    step: 0,
    artifacts: {
      problemAnalysis: null,
      useCases: null,
      userStories: null,
      risk: null,
      mvp: null,
      writing: null,
      mockup: null,
      pitch: null,
      docPack: null,
    },
  },
  collab: loadJson(COLLAB_STORE_KEY, { scopes: {} }),
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local storage failures in private mode/sandboxed contexts.
  }
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function initiativeStatusClass(status) {
  const val = String(status || "").toLowerCase();
  if (/approved|deployed|published|معتمد|مكتمل/.test(val)) return "status-ok";
  if (/review|pilot|قيد|تحكيم|مراجعة/.test(val)) return "status-warn";
  return "status-neutral";
}

function prototypeStatusClass(status) {
  const val = String(status || "").toLowerCase();
  if (/ready|judging|published|deployed|مكتمل|جاهز/.test(val)) return "status-ok";
  if (/dev|progress|draft|review|قيد|تطوير|مراجعة/.test(val)) return "status-warn";
  return "status-neutral";
}

function riskClass(level) {
  if (level === "High") return "risk-high";
  if (level === "Medium") return "risk-medium";
  return "risk-low";
}

function prototypeProgress(item) {
  const direct = toNumber(item.progress, NaN);
  if (Number.isFinite(direct)) return clamp(direct, 0, 100);

  const score = toNumber(item.readinessScore, NaN);
  if (Number.isFinite(score)) return clamp(score, 0, 100);

  const status = String(item.status || "").toLowerCase();
  if (/ready|judging|published|deployed|مكتمل|جاهز/.test(status)) return 88;
  if (/dev|progress|قيد|تطوير/.test(status)) return 56;
  if (/draft|idea|مسودة/.test(status)) return 24;
  return 40;
}

function estimatePrototypeReadiness(item, workspace) {
  const progress = prototypeProgress(item);
  const notes = workspace?.evaluatorNotes?.length || 0;
  const files = workspace?.prototypeFiles?.length || 0;
  const recs = workspace?.aiRecommendations?.length || 0;
  const status = String(item.status || "").toLowerCase();

  const statusBoost = /ready|judging|approved|published|deployed|جاهز|معتمد/.test(status)
    ? 14
    : /draft|idea|مسودة/.test(status)
      ? -10
      : 4;

  return clamp(Math.round(progress * 0.62 + notes * 4 + files * 3 + recs * 2 + statusBoost), 0, 100);
}

function trlFromProgress(progress) {
  return clamp(Math.round(progress / 11) + 1, 1, 9);
}

function brlFromReadiness(readiness) {
  return clamp(Math.round(readiness / 11) + 1, 1, 9);
}

function estimateCost(progress, readiness) {
  return Math.round(Math.max(35000, (100 - progress) * 1400 + (100 - readiness) * 900));
}

function estimateImpact(progress, readiness) {
  return clamp(Math.round(progress * 0.42 + readiness * 0.58), 0, 100);
}

function prototypeStage(status, readiness) {
  const val = String(status || "").toLowerCase();
  if (/approved|published|deployed|معتمد|مطبق/.test(val)) return "Approved";
  if (/review|judging|تحكيم|مراجعة/.test(val)) return "Under Review";
  if (/ready|جاهز/.test(val) || readiness >= 72) return "Ready";
  return "Draft";
}

function detectRiskLevel(item, workspace, readiness) {
  const progress = prototypeProgress(item);
  const notesText = (workspace?.evaluatorNotes || [])
    .map((x) => String(x.note || "").toLowerCase())
    .join(" ");
  const hasRiskKeywords = /risk|issue|delay|compliance|خطر|مشكلة|تأخير|امتثال/.test(notesText);

  if (readiness < 45 || (hasRiskKeywords && progress < 55)) return "High";
  if (readiness < 70 || hasRiskKeywords) return "Medium";
  return "Low";
}

function buildPrototypeMetrics(item) {
  if (item?.metrics) {
    const m = item.metrics;
    const workspace = appState.workspaceCache[item.initiativeId] || null;
    return {
      progress: toNumber(m.progress, prototypeProgress(item)),
      readiness: toNumber(m.readinessScore, prototypeProgress(item)),
      trl: toNumber(m.trl, trlFromProgress(prototypeProgress(item))),
      brl: toNumber(m.brl, brlFromReadiness(toNumber(m.readinessScore, prototypeProgress(item)))),
      risk: m.riskLevel || "Medium",
      cost: toNumber(m.costEstimateSar, estimateCost(prototypeProgress(item), toNumber(m.readinessScore, prototypeProgress(item)))),
      impact: toNumber(m.impactScore, estimateImpact(prototypeProgress(item), toNumber(m.readinessScore, prototypeProgress(item)))),
      notesCount: toNumber(m.evaluatorNotesCount, 0),
      stage: m.portfolioStage || prototypeStage(item.status, toNumber(m.readinessScore, prototypeProgress(item))),
      workspace,
    };
  }

  const workspace = appState.workspaceCache[item.initiativeId] || null;
  const progress = prototypeProgress(item);
  const readiness = estimatePrototypeReadiness(item, workspace);
  const trl = trlFromProgress(progress);
  const brl = brlFromReadiness(readiness);
  const risk = detectRiskLevel(item, workspace, readiness);
  const cost = estimateCost(progress, readiness);
  const impact = estimateImpact(progress, readiness);
  const notesCount = workspace?.evaluatorNotes?.length || 0;
  const stage = prototypeStage(item.status, readiness);

  return { progress, readiness, trl, brl, risk, cost, impact, notesCount, stage, workspace };
}

function setText(id, data) {
  const el = $(id);
  if (!el) return;
  el.textContent = typeof data === "string" ? data : pretty(data);
}

function listToUl(id, items, mapper) {
  const el = $(id);
  if (!el) return;
  if (!items?.length) {
    el.innerHTML = "<li class='muted'>No records.</li>";
    return;
  }
  el.innerHTML = items.map(mapper).join("");
}

function getPrototypeById(id) {
  return appState.prototypes.find((item) => item.id === id) || null;
}

function getSelectedPrototype() {
  return appState.selectedPrototypeId ? getPrototypeById(appState.selectedPrototypeId) : null;
}

function currentScopeInitiativeId() {
  return (
    getSelectedPrototype()?.initiativeId ||
    $("workspaceInitiativeId")?.value?.trim() ||
    $("engineInitiativeId")?.value?.trim() ||
    ""
  );
}

function ensureCollabScope(scopeId) {
  if (!scopeId) return null;
  if (!appState.collab.scopes[scopeId]) {
    appState.collab.scopes[scopeId] = { comments: [], activities: [] };
  }
  return appState.collab.scopes[scopeId];
}

function appendCollabActivity(scopeId, text) {
  const scope = ensureCollabScope(scopeId);
  if (!scope) return;
  scope.activities.unshift({
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 900)}`,
    text,
    createdAt: new Date().toISOString(),
  });
  scope.activities = scope.activities.slice(0, 40);
  saveJson(COLLAB_STORE_KEY, appState.collab);
}

async function saveBuilderArtifact(artifactType, title, payload) {
  const initiativeId = $("engineInitiativeId")?.value?.trim() || currentScopeInitiativeId();
  if (!initiativeId) return null;

  const prototypeId = getSelectedPrototype()?.id || null;
  const res = await safeApi("Save builder artifact", () =>
    api("/api/v2/prototype-builder/artifacts", {
      method: "POST",
      auth: false,
      body: {
        initiativeId,
        prototypeId,
        artifactType,
        title,
        payload,
      },
    })
  );
  return res?.data || null;
}

async function fetchPrototypeTimeline(prototypeId, force = false) {
  if (!prototypeId) return null;
  if (!force && appState.timelineCache[prototypeId]) return appState.timelineCache[prototypeId];

  const res = await safeApi("Load prototype timeline", () => api(`/api/v2/prototypes/${prototypeId}/timeline`, { auth: false }));
  const events = res?.data?.events || null;
  if (events) appState.timelineCache[prototypeId] = events;
  return events;
}

async function fetchCollaborationForInitiative(initiativeId, prototypeId = null, force = false) {
  if (!initiativeId) return null;
  const cacheKey = `${initiativeId}:${prototypeId || "all"}`;
  if (!force && appState.collabServerCache[cacheKey]) return appState.collabServerCache[cacheKey];

  const query = new URLSearchParams();
  if (prototypeId) query.set("prototypeId", prototypeId);
  query.set("limit", "80");

  const res = await safeApi("Load collaboration", () =>
    api(`/api/v2/collaboration/${initiativeId}${query.toString() ? `?${query.toString()}` : ""}`, { auth: false })
  );

  const data = res?.data || null;
  if (data) appState.collabServerCache[cacheKey] = data;
  return data;
}

async function recordCollaborationActivity(initiativeId, message, activityType = "update", payload = null) {
  if (!initiativeId || !message) return null;
  const selected = getSelectedPrototype();
  const prototypeId = selected?.initiativeId === initiativeId ? selected.id : null;

  const res = await safeApi("Add collaboration activity", () =>
    api(`/api/v2/collaboration/${initiativeId}/activities`, {
      method: "POST",
      auth: false,
      body: {
        prototypeId,
        activityType,
        message,
        payload,
      },
    })
  );

  if (!res?.data) {
    appendCollabActivity(initiativeId, message);
    return null;
  }

  await fetchCollaborationForInitiative(initiativeId, prototypeId, true);
  return res.data;
}

function renderHomeSignals() {
  const host = $("homeSignalCards");
  if (!host) return;

  const initiatives = appState.initiatives;
  const prototypes = appState.prototypes;

  const total = initiatives.length;
  const approved = initiatives.filter((x) => /approved|deployed|published|معتمد|مكتمل/i.test(String(x.status || ""))).length;
  const prototypesTotal = prototypes.length;
  const ready = prototypes.filter((x) => /ready|judging|published|deployed|جاهز|مكتمل/i.test(String(x.status || ""))).length;
  const readiness = total ? Math.round(((approved * 2 + ready) / (total * 3)) * 100) : 0;

  const avgProgress = prototypesTotal
    ? Math.round(prototypes.reduce((acc, item) => acc + prototypeProgress(item), 0) / prototypesTotal)
    : 0;

  $("heroInitiativeCount") && ($("heroInitiativeCount").textContent = nf.format(total));
  $("heroApprovedCount") && ($("heroApprovedCount").textContent = nf.format(approved));
  $("heroPrototypeCount") && ($("heroPrototypeCount").textContent = nf.format(prototypesTotal));
  $("heroReadinessValue") && ($("heroReadinessValue").textContent = `${nf.format(readiness)}%`);

  host.innerHTML = `
    <article class="ep-signal-card">
      <p>سرعة الإنجاز</p>
      <strong>${nf.format(readiness)}%</strong>
      <span class="hint">نسبة الجاهزية العامة</span>
    </article>
    <article class="ep-signal-card">
      <p>نماذج جاهزة للتحكيم</p>
      <strong>${nf.format(ready)}</strong>
      <span class="hint">من أصل ${nf.format(prototypesTotal)} نموذج</span>
    </article>
    <article class="ep-signal-card">
      <p>متوسط تقدم النماذج</p>
      <strong>${nf.format(avgProgress)}%</strong>
      <span class="hint">يُحدّث تلقائيًا مع كل عملية</span>
    </article>
    <article class="ep-signal-card">
      <p>مؤشر جودة المحفظة</p>
      <strong>${nf.format(Math.round(((approved + ready) / Math.max(1, total + prototypesTotal)) * 100))}%</strong>
      <span class="hint">اعتماد + جاهزية</span>
    </article>
  `;
}

function renderPrototypeStatusPills(rows) {
  const host = $("prototypeStatusPills");
  if (!host) return;

  if (!rows.length) {
    host.innerHTML = '<span class="proto-pill">لا توجد بيانات نماذج</span>';
    return;
  }

  const ready = rows.filter((x) => /ready|judging|published|deployed|جاهز|مكتمل/i.test(String(x.status || ""))).length;
  const active = rows.filter((x) => /dev|progress|review|قيد|تطوير|مراجعة/i.test(String(x.status || ""))).length;
  const other = rows.length - ready - active;

  host.innerHTML = `
    <span class="proto-pill">الإجمالي <strong>${nf.format(rows.length)}</strong></span>
    <span class="proto-pill">جاهز <strong>${nf.format(ready)}</strong></span>
    <span class="proto-pill">قيد التطوير <strong>${nf.format(active)}</strong></span>
    <span class="proto-pill">أخرى <strong>${nf.format(other)}</strong></span>
    <span class="proto-pill">مقارنة <strong>${nf.format(appState.compareSelection.length)}</strong></span>
  `;
}

function filterAndSortPrototypes(rows) {
  const search = $("prototypeSearchInput")?.value?.trim()?.toLowerCase() || "";
  const status = $("prototypeStatusFilter")?.value || "all";
  const sort = $("prototypeSortSelect")?.value || "progress_desc";

  let result = [...rows];

  if (search) {
    result = result.filter((item) => {
      const blob = `${item.id || ""} ${item.prototypeCode || ""} ${item.initiativeId || ""} ${item.status || ""} ${item.templateKey || ""}`
        .toLowerCase();
      return blob.includes(search);
    });
  }

  if (status !== "all") {
    result = result.filter((item) => {
      const value = String(item.status || "").toLowerCase();
      if (status === "ready") return /ready|judging|published|deployed|جاهز|مكتمل/.test(value);
      if (status === "active") return /dev|progress|draft|review|قيد|تطوير|مراجعة/.test(value);
      return !/ready|judging|published|deployed|dev|progress|draft|review|جاهز|مكتمل|قيد|تطوير|مراجعة/.test(value);
    });
  }

  switch (sort) {
    case "progress_asc":
      result.sort((a, b) => prototypeProgress(a) - prototypeProgress(b));
      break;
    case "readiness_desc":
      result.sort((a, b) => buildPrototypeMetrics(b).readiness - buildPrototypeMetrics(a).readiness);
      break;
    case "updated_desc":
      result.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      break;
    case "name_asc":
      result.sort((a, b) => String(a.prototypeCode || a.id || "").localeCompare(String(b.prototypeCode || b.id || ""), "ar"));
      break;
    case "progress_desc":
    default:
      result.sort((a, b) => prototypeProgress(b) - prototypeProgress(a));
      break;
  }

  return result;
}

function renderPrototypeCards(rows) {
  const root = $("employeePrototypeCards");
  if (!root) return;

  const list = filterAndSortPrototypes(rows);

  if (!list.length) {
    root.innerHTML = '<div class="proto-empty">لا توجد نتائج مطابقة للفلترة الحالية.</div>';
    return;
  }

  root.innerHTML = list
    .map((item) => {
      const code = item.prototypeCode || item.id || "P-NA";
      const status = item.status || "unknown";
      const metrics = buildPrototypeMetrics(item);
      const checked = appState.compareSelection.includes(item.id);
      const selected = appState.selectedPrototypeId === item.id;

      return `
        <article class="proto-card ${selected ? "is-selected" : ""}" data-proto-id="${escapeHtml(item.id)}">
          <div class="proto-card-head">
            <label class="proto-compare">
              <input type="checkbox" data-proto-compare="${escapeHtml(item.id)}" ${checked ? "checked" : ""} />
              مقارنة
            </label>
            <div class="proto-card-actions">
              <button class="btn ghost" type="button" data-proto-select="${escapeHtml(item.id)}">تفاصيل</button>
              <button class="btn ghost" type="button" data-proto-pitch="${escapeHtml(item.id)}">Pitch</button>
            </div>
          </div>

          <h3>${escapeHtml(code)}</h3>
          <p class="proto-meta">Initiative: ${escapeHtml(item.initiativeId || "—")}</p>
          <p class="proto-meta">Template: ${escapeHtml(item.templateKey || item.template || "—")}</p>
          <span class="ep-chip ${prototypeStatusClass(status)}">${escapeHtml(status)}</span>

          <div class="proto-metric-grid">
            <article class="proto-metric"><p>حالة المحفظة</p><strong>${escapeHtml(metrics.stage)}</strong></article>
            <article class="proto-metric"><p>Readiness</p><strong>${nf.format(metrics.readiness)}%</strong></article>
            <article class="proto-metric"><p>TRL/BRL</p><strong>${metrics.trl}/${metrics.brl}</strong></article>
            <article class="proto-metric"><p>Risk</p><strong class="${riskClass(metrics.risk)}">${metrics.risk}</strong></article>
            <article class="proto-metric"><p>Evaluator Notes</p><strong>${nf.format(metrics.notesCount)}</strong></article>
            <article class="proto-metric"><p>Impact</p><strong>${nf.format(metrics.impact)}%</strong></article>
          </div>

          <div class="proto-progress"><span style="width:${metrics.progress}%"></span></div>
          <span class="proto-progress-label">${nf.format(metrics.progress)}% تقدم • ${formatDate(item.updatedAt)}</span>
        </article>
      `;
    })
    .join("");
}

function buildTimeline(item, workspace) {
  const code = item.prototypeCode || item.id || "P-NA";
  const events = [
    {
      createdAt: item.createdAt,
      label: "بداية النموذج",
      detail: `تم إنشاء ${code}`,
    },
    {
      createdAt: item.updatedAt,
      label: "تحديث النموذج",
      detail: `آخر تحديث للحالة: ${item.status || "unknown"}`,
    },
  ];

  (workspace?.changeLog || []).forEach((x) => {
    events.push({
      createdAt: x.createdAt,
      label: "تعديل",
      detail: `${x.title}${x.actorName ? ` (${x.actorName})` : ""}`,
    });
  });

  (workspace?.evaluatorNotes || []).forEach((x) => {
    events.push({
      createdAt: x.createdAt,
      label: "ملاحظة اللجنة",
      detail: x.note,
    });
  });

  (workspace?.prototypeFiles || []).forEach((x) => {
    events.push({
      createdAt: x.createdAt,
      label: "رفع ملف",
      detail: x.fileName,
    });
  });

  return events
    .filter((x) => x.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);
}

function renderComparisonPanel(overrideRows = null) {
  const host = $("protoComparisonResult");
  if (!host) return;

  const selected = Array.isArray(overrideRows)
    ? overrideRows.slice(0, 3)
    : appState.compareSelection
        .map((id) => getPrototypeById(id))
        .filter(Boolean)
        .slice(0, 3);

  if (selected.length < 2) {
    host.innerHTML = '<div class="proto-empty">حدد نموذجين أو أكثر لعرض مقارنة القرار.</div>';
    return;
  }

  const header = selected
    .map((item) => `<th>${escapeHtml(item.prototypeCode || item.id || "P-NA")}</th>`)
    .join("");

  const rows = [
    { label: "Portfolio Status", value: (x) => buildPrototypeMetrics(x).stage },
    { label: "Readiness %", value: (x) => `${buildPrototypeMetrics(x).readiness}%` },
    { label: "TRL", value: (x) => String(buildPrototypeMetrics(x).trl) },
    { label: "BRL", value: (x) => String(buildPrototypeMetrics(x).brl) },
    { label: "Estimated Cost (SAR)", value: (x) => nf.format(buildPrototypeMetrics(x).cost) },
    { label: "Estimated Impact", value: (x) => `${buildPrototypeMetrics(x).impact}%` },
    { label: "Risk", value: (x) => buildPrototypeMetrics(x).risk },
  ]
    .map((row) => {
      const vals = selected.map((item) => `<td>${escapeHtml(row.value(item))}</td>`).join("");
      return `<tr><th>${escapeHtml(row.label)}</th>${vals}</tr>`;
    })
    .join("");

  host.innerHTML = `
    <div class="comparison-table-wrap">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Metric</th>
            ${header}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderPitchModeSummary() {
  const box = $("protoPitchResult");
  if (!box) return;

  const item = getSelectedPrototype();
  if (!item) {
    box.textContent = "اختر نموذجًا أوليًا لعرض Pitch Mode.";
    return;
  }

  const metrics = buildPrototypeMetrics(item);
  const payload = {
    prototype: item.prototypeCode || item.id || "P-NA",
    status: metrics.stage,
    readiness: `${metrics.readiness}%`,
    trl_brl: `${metrics.trl}/${metrics.brl}`,
    impact: `${metrics.impact}%`,
    risk: metrics.risk,
    mvp: [
      "Smart intake form",
      "Automated routing engine",
      "SLA + escalation tracking",
    ],
    recommendations: [
      "Pilot with one facility for 8 weeks",
      "Lock baseline metrics before launch",
      "Run weekly committee checkpoint",
    ],
  };

  box.textContent = appState.pitchMode
    ? pretty(payload)
    : "فعّل Pitch Mode لعرض النسخة المختصرة الجاهزة للجنة التحكيم.";
}

function renderPrototypeDetails() {
  const meta = $("protoSelectedMeta");
  const timelineRoot = $("protoTimelineList");
  if (!meta || !timelineRoot) return;

  const item = getSelectedPrototype();
  if (!item) {
    meta.textContent = "اختر نموذجًا من البطاقات لعرض التفاصيل.";
    timelineRoot.innerHTML = "<li class='muted'>No timeline events.</li>";
    renderPitchModeSummary();
    return;
  }

  const metrics = buildPrototypeMetrics(item);
  const workspace = metrics.workspace;

  meta.innerHTML = `
    <span><strong>Prototype:</strong> ${escapeHtml(item.prototypeCode || item.id || "P-NA")}</span>
    <span><strong>Initiative:</strong> ${escapeHtml(item.initiativeId || "—")}</span>
    <span><strong>Portfolio Stage:</strong> ${escapeHtml(metrics.stage)}</span>
    <span><strong>Readiness:</strong> ${nf.format(metrics.readiness)}% • <strong>TRL/BRL:</strong> ${metrics.trl}/${metrics.brl}</span>
    <span><strong>Risk:</strong> <span class="${riskClass(metrics.risk)}">${metrics.risk}</span> • <strong>Cost:</strong> ${nf.format(metrics.cost)} SAR</span>
    <span><strong>Updated:</strong> ${formatDateTime(item.updatedAt)}</span>
  `;

  const serverTimeline = appState.timelineCache[item.id] || null;
  const timeline = (serverTimeline?.length
    ? serverTimeline.map((x) => ({
        label: x.title || x.type || "event",
        detail: x.detail || x.message || "",
        createdAt: x.createdAt,
      }))
    : buildTimeline(item, workspace));
  timelineRoot.innerHTML = timeline.length
    ? timeline
        .map(
          (event) =>
            `<li><strong>${escapeHtml(event.label)}</strong><span class="timeline-time">${formatDateTime(event.createdAt)}</span>${escapeHtml(event.detail)}</li>`
        )
        .join("")
    : "<li class='muted'>لا توجد أحداث Timeline بعد.</li>";

  renderComparisonPanel();
  renderPitchModeSummary();
}

function renderTemplateHint() {
  const hint = $("builderTemplateHint");
  const sel = $("builderTemplate");
  if (!hint || !sel) return;

  const key = sel.value || "";
  const txt = key
    ? `القالب الحالي: ${key} — يوصى باستخدامه لعرض MVP سريع أمام لجنة التحكيم.`
    : "اختر قالبًا لعرض توصية الاستخدام.";
  hint.textContent = txt;
}

function renderBuilderStepUI() {
  const current = appState.builder.step;
  document.querySelectorAll("[data-builder-step-btn]").forEach((btn) => {
    const step = Number(btn.getAttribute("data-builder-step-btn"));
    btn.classList.toggle("is-active", step === current);
  });

  document.querySelectorAll("[data-builder-step-panel]").forEach((panel) => {
    const step = Number(panel.getAttribute("data-builder-step-panel"));
    panel.classList.toggle("is-active", step === current);
  });

  const prev = $("builderPrevStepBtn");
  const next = $("builderNextStepBtn");
  if (prev) prev.disabled = current <= 0;
  if (next) next.disabled = current >= BUILDER_STEP_COUNT - 1;
}

function setBuilderStep(step) {
  appState.builder.step = clamp(step, 0, BUILDER_STEP_COUNT - 1);
  renderBuilderStepUI();
}

function setCopilotOutput(title, payload) {
  const box = $("builderCopilotResult");
  if (!box) return;
  box.textContent = `${title}\n${"-".repeat(title.length)}\n${typeof payload === "string" ? payload : pretty(payload)}`;
}

function computeBuilderReadiness() {
  const problem = $("builderProblem")?.value?.trim() || "";
  const summary = $("builderSummary")?.value?.trim() || "";
  const executionPlan = $("builderExecutionPlan")?.value?.trim() || "";
  const financialImpact = toNumber($("builderFinancialImpact")?.value, 0);

  const factors = [
    {
      key: "problem",
      label: "وضوح المشكلة",
      score: clamp(Math.round(problem.length * 1.4), 15, 100),
    },
    {
      key: "solution",
      label: "وضوح الحل",
      score: clamp(Math.round(summary.length * 1.8), 15, 100),
    },
    {
      key: "useCases",
      label: "وجود Use Cases",
      score: appState.builder.artifacts.useCases ? 100 : 30,
    },
    {
      key: "mvp",
      label: "تعريف MVP",
      score: appState.builder.artifacts.mvp || appState.builder.artifacts.mockup ? 100 : 25,
    },
    {
      key: "execution",
      label: "خطة التنفيذ",
      score: clamp(Math.round(executionPlan.length * 1.3), 20, 100),
    },
    {
      key: "financial",
      label: "الأثر المالي",
      score: financialImpact > 0 ? clamp(Math.round(45 + Math.min(financialImpact / 8000, 50)), 45, 95) : 25,
    },
  ];

  const score = Math.round(factors.reduce((acc, x) => acc + x.score, 0) / factors.length);
  return { score, factors };
}

function renderBuilderReadiness() {
  const scoreNode = $("builderReadinessScore");
  const factorsNode = $("builderReadinessFactors");
  if (!scoreNode || !factorsNode) return;

  const readiness = computeBuilderReadiness();
  scoreNode.textContent = `${nf.format(readiness.score)}%`;
  factorsNode.innerHTML = readiness.factors
    .map((f) => `<li>${escapeHtml(f.label)}: <strong>${nf.format(f.score)}%</strong></li>`)
    .join("");

  const ring = scoreNode.closest(".readiness-ring");
  if (ring) {
    const color = readiness.score >= 80 ? "rgba(19,118,82,0.55)" : readiness.score >= 60 ? "rgba(154,97,16,0.55)" : "rgba(157,47,47,0.55)";
    ring.style.borderColor = color;
  }
}

function renderWorkspaceFilesCards(files, notes) {
  const host = $("workspaceFilesCards");
  if (!host) return;

  if (!files?.length) {
    host.innerHTML = '<div class="proto-empty">No prototype files yet.</div>';
    return;
  }

  const latestNote = notes?.[0]?.note || "No evaluator note yet.";
  host.innerHTML = files
    .map(
      (file) => `
        <article class="file-card">
          <h5>${escapeHtml(file.fileName || "file")}</h5>
          <span>Type: ${escapeHtml(file.fileType || "document")}</span>
          <span>Date: ${formatDate(file.createdAt)}</span>
          <span>Size: ${file.fileSizeKb ? `${nf.format(file.fileSizeKb)} KB` : "—"}</span>
          <span>Note: ${escapeHtml(latestNote)}</span>
        </article>
      `
    )
    .join("");
}

function renderCollaboration(scopeId, workspaceData, serverData = null) {
  const commentsList = $("collabCommentsList");
  const activityList = $("collabActivityList");
  if (!commentsList || !activityList) return;

  if (!scopeId) {
    commentsList.innerHTML = "<li class='muted'>اختر نموذجًا أو مبادرة أولًا.</li>";
    activityList.innerHTML = "<li class='muted'>لا يوجد نشاط.</li>";
    return;
  }

  const scope = ensureCollabScope(scopeId);
  const cachedServer = serverData || appState.collabServerCache[`${scopeId}:${getSelectedPrototype()?.id || "all"}`] || null;
  const serverComments = (cachedServer?.comments || []).map((x) => ({
    author: x.authorName || x.authorId || "Portal User",
    mention: x.mention || "",
    text: x.commentText || "",
    createdAt: x.createdAt,
  }));
  const comments = serverComments.length ? serverComments : (scope?.comments || []);

  commentsList.innerHTML = comments.length
    ? comments
        .map(
          (x) =>
            `<li><strong>${escapeHtml(x.author || "Portal User")}</strong> ${x.mention ? `<span class="mention-chip">${escapeHtml(x.mention)}</span>` : ""}<br/>${escapeHtml(x.text)}<span class="timeline-time">${formatDateTime(x.createdAt)}</span></li>`
        )
        .join("")
    : "<li class='muted'>No comments yet.</li>";

  const workspaceActivities = [
    ...(workspaceData?.changeLog || []).slice(0, 4).map((x) => ({
      text: `Change: ${x.title}`,
      createdAt: x.createdAt,
    })),
    ...(workspaceData?.evaluatorNotes || []).slice(0, 4).map((x) => ({
      text: `Evaluator: ${x.note}`,
      createdAt: x.createdAt,
    })),
  ];

  const serverActivities = (cachedServer?.activities || []).map((x) => ({
    text: x.message || x.activityType || "activity",
    createdAt: x.createdAt,
  }));

  const allActivities = [...(serverActivities.length ? serverActivities : (scope?.activities || [])), ...workspaceActivities]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 12);

  activityList.innerHTML = allActivities.length
    ? allActivities
        .map((x) => `<li>${escapeHtml(x.text)}<span class="timeline-time">${formatDateTime(x.createdAt)}</span></li>`)
        .join("")
    : "<li class='muted'>No activity yet.</li>";
}

async function refreshCollaborationView(scopeId, workspaceData = null, force = false) {
  if (!scopeId) {
    renderCollaboration(scopeId, workspaceData, null);
    return;
  }
  const selected = getSelectedPrototype();
  const prototypeId = selected?.initiativeId === scopeId ? selected.id : null;
  const serverData = await fetchCollaborationForInitiative(scopeId, prototypeId, force);
  renderCollaboration(scopeId, workspaceData, serverData);
}

async function safeApi(label, fn, targetId = null) {
  try {
    const res = await fn();
    if (targetId) setText(targetId, res?.data ?? res);
    return res;
  } catch (err) {
    if (targetId) setText(targetId, `${label} failed: ${err.message}`);
    return null;
  }
}

async function ensureInitiativeId(primaryInputId, fallbackInputIds = []) {
  const direct = $(primaryInputId)?.value?.trim();
  if (direct) return direct;

  for (const id of fallbackInputIds) {
    const val = $(id)?.value?.trim();
    if (val) return val;
  }

  const list = await safeApi("Fetch initiatives", () => api("/api/v2/initiatives", { auth: false }));
  const first = list?.data?.[0]?.id;
  if (first && $(primaryInputId)) $(primaryInputId).value = first;
  return first || "";
}

async function loadWorkspaceForInitiative(initiativeId, force = false) {
  if (!initiativeId) return null;
  if (!force && appState.workspaceCache[initiativeId]) return appState.workspaceCache[initiativeId];

  const res = await safeApi("Load workspace", () => api(`/api/v2/workspace/${initiativeId}`, { auth: false }));
  const data = res?.data || null;
  if (data) appState.workspaceCache[initiativeId] = data;
  return data;
}

async function hydratePrototypeInsights(rows) {
  const ids = [...new Set(rows.map((x) => x.initiativeId).filter(Boolean))].slice(0, 10);
  const missing = ids.filter((id) => !appState.workspaceCache[id]);
  if (!missing.length) return;

  await Promise.all(missing.map((initiativeId) => loadWorkspaceForInitiative(initiativeId)));
}

function syncInitiativeInputs(initiativeId) {
  if (!initiativeId) return;
  ["engineInitiativeId", "workspaceInitiativeId", "scoreInitiativeId", "benchInitiativeId", "marketInitiativeId"].forEach((id) => {
    const el = $(id);
    if (el) el.value = initiativeId;
  });
}

async function selectPrototype(prototypeId, forceWorkspace = false) {
  const item = getPrototypeById(prototypeId);
  if (!item) return;

  appState.selectedPrototypeId = item.id;
  syncInitiativeInputs(item.initiativeId);

  if (item.initiativeId) {
    await loadWorkspaceForInitiative(item.initiativeId, forceWorkspace);
  }
  await fetchPrototypeTimeline(item.id, forceWorkspace);

  renderPrototypeCards(appState.prototypes);
  renderPrototypeDetails();

  const workspaceData = item.initiativeId ? appState.workspaceCache[item.initiativeId] : null;
  await refreshCollaborationView(item.initiativeId, workspaceData, forceWorkspace);
}

function toggleCompareSelection(prototypeId, checked) {
  const list = appState.compareSelection;

  if (checked && !list.includes(prototypeId)) {
    list.push(prototypeId);
    if (list.length > 3) {
      list.shift();
    }
  }

  if (!checked && list.includes(prototypeId)) {
    appState.compareSelection = list.filter((id) => id !== prototypeId);
  }

  renderPrototypeStatusPills(appState.prototypes);
  renderPrototypeCards(appState.prototypes);
  renderComparisonPanel();
}

async function createDemoInitiative() {
  const res = await safeApi(
    "Create demo initiative",
    () =>
      api("/api/v2/initiatives", {
        method: "POST",
        auth: false,
        body: {
          title: `Demo Innovation ${new Date().toISOString().slice(11, 19)}`,
          ownerName: "Portal User",
          ownerId: "innovator-demo",
          stage: "idea_submission",
          status: "draft",
        },
      })
  );

  if (res?.data?.id) {
    syncInitiativeInputs(res.data.id);
    await recordCollaborationActivity(res.data.id, "تم إنشاء مبادرة تجريبية جديدة.", "initiative_created");
  }

  await refreshAll();
}

async function renderEngineWorkflow() {
  const res = await safeApi("Load workflow", () => api("/api/v2/engine/workflow", { auth: false }));
  const root = $("engineWorkflowPills");
  if (!root) return;
  const rows = res?.data || [];
  root.innerHTML = rows.map((x) => `<span class="badge">${x.labelAr || x.key}</span>`).join("");
}

async function loadTemplates() {
  const res = await safeApi("Load templates", () => api("/api/v2/prototype-builder/templates", { auth: false }));
  const sel = $("builderTemplate");
  if (!sel) return;
  const rows = res?.data || [];
  sel.innerHTML = rows.map((x) => `<option value="${x.key}">${x.title}</option>`).join("");
  renderTemplateHint();

  if (!sel.dataset.boundHint) {
    sel.addEventListener("change", () => {
      renderTemplateHint();
      renderBuilderReadiness();
    });
    sel.dataset.boundHint = "1";
  }
}

function renderWorkspaceView(data) {
  if (!data) return;

  listToUl("workspaceChangesList", data.changeLog, (x) => `<li>${escapeHtml(x.title)} <span class="muted">(${escapeHtml(x.actorName || "n/a")})</span></li>`);
  listToUl("workspaceNotesList", data.evaluatorNotes, (x) => `<li>${escapeHtml(x.note)}</li>`);
  listToUl("workspaceRecsList", data.aiRecommendations, (x) => `<li>${escapeHtml(x.recommendation)}</li>`);
  listToUl("workspaceFilesList", data.prototypeFiles, (x) => `<li>${escapeHtml(x.fileName)}</li>`);
  renderWorkspaceFilesCards(data.prototypeFiles, data.evaluatorNotes);
}

async function loadWorkspace(force = false) {
  const initiativeId = await ensureInitiativeId("workspaceInitiativeId", ["engineInitiativeId"]);
  if (!initiativeId) {
    setText("engineResult", "No initiative available. Create one first.");
    return;
  }

  const data = await loadWorkspaceForInitiative(initiativeId, force);
  if (!data) return;

  renderWorkspaceView(data);
  await refreshCollaborationView(initiativeId, data, force);

  const selected = getSelectedPrototype();
  if (selected?.initiativeId === initiativeId) {
    renderPrototypeDetails();
  }
}

async function renderInitiatives() {
  const body = $("employeeInitiativesBody");
  const res = await safeApi("Load initiatives", () => api("/api/v2/initiatives", { auth: false }));
  const rows = res?.data || [];
  appState.initiatives = rows;

  if (!body) {
    renderHomeSignals();
    return;
  }

  body.innerHTML = rows.length
    ? rows
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.id)}</td>
              <td>${escapeHtml(item.title)}</td>
              <td><span class="ep-chip stage">${escapeHtml(item.stage || "—")}</span></td>
              <td><span class="ep-chip ${initiativeStatusClass(item.status)}">${escapeHtml(item.status || "—")}</span></td>
              <td>${formatDate(item.updatedAt)}</td>
            </tr>
          `
        )
        .join("")
    : '<tr><td colspan="5" class="muted">No initiatives yet.</td></tr>';

  if (rows[0]?.id && !currentScopeInitiativeId()) {
    syncInitiativeInputs(rows[0].id);
  }

  renderHomeSignals();
}

async function renderPrototypes() {
  const portfolioRes = await safeApi("Load prototype portfolio", () => api("/api/v2/prototypes/portfolio?limit=180", { auth: false }));
  const fallbackRes = !portfolioRes?.data ? await safeApi("Load prototypes", () => api("/api/v2/prototypes", { auth: false })) : null;
  const rows = portfolioRes?.data || fallbackRes?.data || [];
  appState.prototypes = rows;

  if (rows.length && !getPrototypeById(appState.selectedPrototypeId || "")) {
    appState.selectedPrototypeId = rows[0].id;
  }

  await hydratePrototypeInsights(rows);

  renderPrototypeStatusPills(rows);
  renderPrototypeCards(rows);

  if (appState.selectedPrototypeId) {
    await selectPrototype(appState.selectedPrototypeId);
  } else {
    renderPrototypeDetails();
  }

  renderHomeSignals();
}

async function refreshAnalytics() {
  await safeApi("Load analytics", () => api("/api/v2/analytics/dashboard", { auth: false }), "analyticsResult");
}

async function refreshAll() {
  await Promise.all([renderEngineWorkflow(), loadTemplates(), renderInitiatives(), refreshAnalytics()]);
  await renderPrototypes();
  await loadWorkspace();
  renderBuilderReadiness();
  renderPitchModeSummary();
}

function wirePrototypeControls() {
  ["prototypeSearchInput", "prototypeStatusFilter", "prototypeSortSelect"].forEach((id) => {
    $(id)?.addEventListener("input", () => renderPrototypeCards(appState.prototypes));
    $(id)?.addEventListener("change", () => renderPrototypeCards(appState.prototypes));
  });

  $("prototypeCompareBtn")?.addEventListener("click", async () => {
    const ids = appState.compareSelection.slice(0, 3);
    if (ids.length < 2) {
      renderComparisonPanel();
      return;
    }

    const res = await safeApi("Compare prototypes", () =>
      api(`/api/v2/prototypes/compare?ids=${encodeURIComponent(ids.join(","))}`, { auth: false })
    );

    if (Array.isArray(res?.data) && res.data.length >= 2) {
      renderComparisonPanel(res.data);
      return;
    }

    renderComparisonPanel();
  });

  $("prototypePitchModeBtn")?.addEventListener("click", () => {
    appState.pitchMode = !appState.pitchMode;
    document.body.classList.toggle("pitch-mode", appState.pitchMode);
    const btn = $("prototypePitchModeBtn");
    if (btn) btn.textContent = `Pitch Mode: ${appState.pitchMode ? "ON" : "OFF"}`;
    renderPitchModeSummary();
  });

  $("prototypeRefreshDetailsBtn")?.addEventListener("click", async () => {
    const selected = getSelectedPrototype();
    if (!selected) return;
    await selectPrototype(selected.id, true);
  });

  const cardsRoot = $("employeePrototypeCards");
  if (cardsRoot && !cardsRoot.dataset.boundEvents) {
    cardsRoot.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const id = target.getAttribute("data-proto-compare");
      if (!id) return;
      toggleCompareSelection(id, target.checked);
    });

    cardsRoot.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const selectBtn = target.closest("[data-proto-select]");
      if (selectBtn) {
        const id = selectBtn.getAttribute("data-proto-select");
        if (id) await selectPrototype(id);
      }

      const pitchBtn = target.closest("[data-proto-pitch]");
      if (pitchBtn) {
        const id = pitchBtn.getAttribute("data-proto-pitch");
        if (id) {
          if (!appState.pitchMode) {
            appState.pitchMode = true;
            document.body.classList.add("pitch-mode");
            const btn = $("prototypePitchModeBtn");
            if (btn) btn.textContent = "Pitch Mode: ON";
          }
          await selectPrototype(id);
          renderPitchModeSummary();
        }
      }
    });

    cardsRoot.dataset.boundEvents = "1";
  }
}

function wireBuilderFlow() {
  document.querySelectorAll("[data-builder-step-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.getAttribute("data-builder-step-btn"));
      setBuilderStep(step);
    });
  });

  $("builderPrevStepBtn")?.addEventListener("click", () => setBuilderStep(appState.builder.step - 1));
  $("builderNextStepBtn")?.addEventListener("click", () => setBuilderStep(appState.builder.step + 1));

  [
    "builderProblem",
    "builderPainPoints",
    "builderBeneficiaries",
    "builderTitle",
    "builderSummary",
    "builderActor",
    "builderExecutionPlan",
    "builderFinancialImpact",
  ].forEach((id) => {
    $(id)?.addEventListener("input", renderBuilderReadiness);
  });

  $("builderWireframeEditor") && ($("builderWireframeEditor").value = STUDIO_TEMPLATES.wireframe);
  $("builderJourneyEditor") && ($("builderJourneyEditor").value = STUDIO_TEMPLATES.journey);
  $("builderFlowchartEditor") && ($("builderFlowchartEditor").value = STUDIO_TEMPLATES.flowchart);
  $("builderCanvasEditor") && ($("builderCanvasEditor").value = STUDIO_TEMPLATES.canvas);

  $("builderWireframeBtn")?.addEventListener("click", () => {
    const editor = $("builderWireframeEditor");
    if (editor) editor.value = STUDIO_TEMPLATES.wireframe;
    setCopilotOutput("Wireframe Builder", "تم توليد مخطط واجهات أولي قابل للتعديل.");
  });

  $("builderJourneyBtn")?.addEventListener("click", () => {
    const editor = $("builderJourneyEditor");
    if (editor) editor.value = STUDIO_TEMPLATES.journey;
    setCopilotOutput("Journey Map", "تم توليد رحلة مستفيد ابتدائية تشمل نقاط التحسين.");
  });

  $("builderFlowchartBtn")?.addEventListener("click", () => {
    const editor = $("builderFlowchartEditor");
    if (editor) editor.value = STUDIO_TEMPLATES.flowchart;
    setCopilotOutput("Flowchart", "تم توليد تدفق قرار تشغيلي للنموذج.");
  });

  $("builderCanvasBtn")?.addEventListener("click", () => {
    const editor = $("builderCanvasEditor");
    if (editor) editor.value = STUDIO_TEMPLATES.canvas;
    setCopilotOutput("Business Model Canvas", "تم تجهيز نسخة أولية من نموذج العمل.");
  });

  $("builderAiProblemBtn")?.addEventListener("click", () => {
    const problem = $("builderProblem")?.value?.trim() || "";
    const painPoints = ($("builderPainPoints")?.value || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const output = {
      problemClarity: clamp(Math.round(problem.length * 1.5), 0, 100),
      topPainPoints: painPoints.slice(0, 5),
      validationQuestions: [
        "ما baseline الحالي لزمن الانتظار؟",
        "ما الجزء الأعلى كلفة في العملية الحالية؟",
        "ما المؤشر الأهم للجنة التحكيم؟",
      ],
      quickWins: [
        "تقليل إعادة إدخال البيانات",
        "توجيه تلقائي للحالات منخفضة التعقيد",
        "لوحة متابعة SLA يومية",
      ],
    };

    appState.builder.artifacts.problemAnalysis = output;
    setCopilotOutput("Problem Analysis", output);
    void saveBuilderArtifact("problem-analysis", "Problem Analysis", output);
    renderBuilderReadiness();
    setBuilderStep(1);
  });

  $("builderUserStoriesBtn")?.addEventListener("click", () => {
    const actor = $("builderActor")?.value?.trim() || "User";
    const goal = $("builderSummary")?.value?.trim() || "achieve faster workflow";

    const stories = [
      `As ${actor}, I want to submit a case in one flow so that I reduce waiting time.`,
      `As ${actor}, I want to track case status so that I know when to act next.`,
      `As Operations Lead, I want SLA alerts so that delayed cases are escalated early.`,
    ];

    appState.builder.artifacts.userStories = stories;
    setCopilotOutput("User Stories", stories);
    void saveBuilderArtifact("user-stories", "User Stories", { stories });
    renderBuilderReadiness();
  });

  $("builderRiskBtn")?.addEventListener("click", () => {
    const risks = [
      { type: "Operational", mitigation: "Pilot scope lock + weekly checkpoint" },
      { type: "Technical", mitigation: "Integration sandbox before go-live" },
      { type: "Adoption", mitigation: "Targeted onboarding for frontline staff" },
      { type: "Quality", mitigation: "Baseline KPI + post-implementation audit" },
    ];

    appState.builder.artifacts.risk = risks;
    setCopilotOutput("Risk Analysis", risks);
    void saveBuilderArtifact("risk-analysis", "Risk Analysis", { risks });
    renderBuilderReadiness();
  });

  $("builderMvpBtn")?.addEventListener("click", () => {
    const mvp = [
      "Structured digital intake form",
      "Priority scoring and routing",
      "SLA dashboard with escalation rules",
      "Committee-ready performance snapshot",
    ];

    appState.builder.artifacts.mvp = mvp;
    setCopilotOutput("MVP Features", mvp);
    void saveBuilderArtifact("mvp-features", "MVP Features", { mvp });
    renderBuilderReadiness();
    setBuilderStep(2);
  });

  $("builderDocPackBtn")?.addEventListener("click", async () => {
    const readiness = computeBuilderReadiness();
    const pack = {
      title: $("builderTitle")?.value || "Prototype Pack",
      problem: $("builderProblem")?.value || "",
      summary: $("builderSummary")?.value || "",
      readiness: `${readiness.score}%`,
      useCases: appState.builder.artifacts.useCases?.scenarios?.length || 0,
      userStories: appState.builder.artifacts.userStories?.length || 0,
      risks: appState.builder.artifacts.risk?.length || 0,
      mvpItems: appState.builder.artifacts.mvp?.length || 0,
      generatedAt: new Date().toISOString(),
    };

    const initiativeId = $("engineInitiativeId")?.value?.trim() || currentScopeInitiativeId() || null;
    const exportRes = initiativeId
      ? await safeApi(
          "Export prototype pack",
          () =>
            api("/api/v2/prototype-builder/export-pack", {
              method: "POST",
              auth: false,
              body: {
                initiativeId,
                format: "json",
                title: pack.title,
                problem: pack.problem,
                summary: pack.summary,
                readiness: pack.readiness,
                mvp: appState.builder.artifacts.mvp || [],
                risks: appState.builder.artifacts.risk || [],
                recommendations: [
                  "Pilot scope lock",
                  "Weekly governance checkpoint",
                  "Decision review after 8 weeks",
                ],
                sections: pack,
              },
            })
        )
      : null;

    appState.builder.artifacts.docPack = exportRes?.data || pack;
    setText("builderResult", appState.builder.artifacts.docPack);
    setCopilotOutput("Document Pack", "تم توليد حزمة المستندات التنفيذية للنموذج الأولي.");
    await saveBuilderArtifact("document-pack", "Prototype Document Pack", appState.builder.artifacts.docPack);
    setBuilderStep(3);
    renderBuilderReadiness();
  });
}

$("refreshAllBtn")?.addEventListener("click", refreshAll);
$("createDemoInitiativeBtn")?.addEventListener("click", createDemoInitiative);
$("analyticsRefreshBtn")?.addEventListener("click", refreshAnalytics);

$("engineEvalBtn")?.addEventListener("click", async () => {
  const initiativeId = await ensureInitiativeId("engineInitiativeId");
  if (!initiativeId) return setText("engineResult", "No initiative selected.");

  await safeApi(
    "Engine evaluation",
    () =>
      api(`/api/v2/engine/${initiativeId}/evaluate`, {
        method: "POST",
        auth: false,
        body: {
          architectureReadiness: Number($("engineTech")?.value || 0),
          dataReadiness: Number($("engineTech")?.value || 0) - 4,
          securityReadiness: Number($("engineTech")?.value || 0) - 3,
          integrationReadiness: Number($("engineTech")?.value || 0) - 2,
          annualSavings: Number($("engineEco")?.value || 0),
          implementationCost: Math.max(1, Number($("engineEco")?.value || 0) * 0.35),
          beneficiaries: 1200,
          note: "Portal-run evaluation",
        },
      }),
    "engineResult"
  );
});

$("engineCommitteeBtn")?.addEventListener("click", async () => {
  const initiativeId = await ensureInitiativeId("engineInitiativeId");
  if (!initiativeId) return setText("engineResult", "No initiative selected.");

  await safeApi(
    "Committee decision",
    () =>
      api(`/api/v2/engine/${initiativeId}/committee`, {
        method: "POST",
        auth: false,
        body: {
          decision: $("engineDecision")?.value || "approved",
          note: "Committee checkpoint from portal",
        },
      }),
    "engineResult"
  );
});

$("enginePilotBtn")?.addEventListener("click", async () => {
  const initiativeId = await ensureInitiativeId("engineInitiativeId");
  if (!initiativeId) return setText("engineResult", "No initiative selected.");
  await safeApi("Move to pilot", () => api(`/api/v2/engine/${initiativeId}/pilot`, { method: "POST", auth: false }), "engineResult");
  await renderInitiatives();
});

$("engineApproveBtn")?.addEventListener("click", async () => {
  const initiativeId = await ensureInitiativeId("engineInitiativeId");
  if (!initiativeId) return setText("engineResult", "No initiative selected.");
  await safeApi("Approve initiative", () => api(`/api/v2/engine/${initiativeId}/approve`, { method: "POST", auth: false }), "engineResult");
  await renderInitiatives();
});

$("engineDeployBtn")?.addEventListener("click", async () => {
  const initiativeId = await ensureInitiativeId("engineInitiativeId");
  if (!initiativeId) return setText("engineResult", "No initiative selected.");
  await safeApi("Deploy initiative", () => api(`/api/v2/engine/${initiativeId}/deploy`, { method: "POST", auth: false }), "engineResult");
  await renderInitiatives();
});

$("builderPitchBtn")?.addEventListener("click", async () => {
  const res = await safeApi(
    "Pitch deck",
    () =>
      api("/api/v2/prototype-builder/pitch-deck", {
        method: "POST",
        auth: false,
        body: {
          initiativeId: $("engineInitiativeId")?.value?.trim() || null,
          title: $("builderTitle")?.value || "",
          problem: $("builderProblem")?.value || $("builderSummary")?.value || "",
          solution: $("builderSummary")?.value || "A digitally orchestrated triage and routing workflow.",
          impact: `Estimated financial impact: ${$("builderFinancialImpact")?.value || "0"} SAR`,
        },
      }),
    "builderResult"
  );

  if (res?.data) {
    appState.builder.artifacts.pitch = res.data;
    setCopilotOutput("Pitch Deck Generated", res.data);
    await saveBuilderArtifact("pitch-deck", "Pitch Deck", res.data);
    renderBuilderReadiness();
    setBuilderStep(3);
  }
});

$("builderUseCasesBtn")?.addEventListener("click", async () => {
  const res = await safeApi(
    "Use cases",
    () =>
      api("/api/v2/prototype-builder/use-cases", {
        method: "POST",
        auth: false,
        body: {
          initiativeId: $("engineInitiativeId")?.value?.trim() || null,
          actor: $("builderActor")?.value || "Patient",
          goal: $("builderSummary")?.value || "faster service access",
          context: "Hospital operations",
        },
      }),
    "builderResult"
  );

  if (res?.data) {
    appState.builder.artifacts.useCases = res.data;
    setCopilotOutput("Use Cases", res.data);
    await saveBuilderArtifact("use-cases", "Use Cases", res.data);
    renderBuilderReadiness();
  }
});

$("builderWritingBtn")?.addEventListener("click", async () => {
  const res = await safeApi(
    "Writing assistant",
    () =>
      api("/api/v2/prototype-builder/writing-assistant", {
        method: "POST",
        auth: false,
        body: {
          initiativeId: $("engineInitiativeId")?.value?.trim() || null,
          text: $("builderSummary")?.value || "",
          tone: "executive",
        },
      }),
    "builderResult"
  );

  if (res?.data) {
    appState.builder.artifacts.writing = res.data;
    setCopilotOutput("Writing Assistant", res.data);
    await saveBuilderArtifact("writing-assistant", "Writing Assistant", res.data);
    renderBuilderReadiness();
  }
});

$("builderMockupBtn")?.addEventListener("click", async () => {
  const initiativeId = $("engineInitiativeId")?.value?.trim() || null;

  const res = await safeApi(
    "Mockup generator",
    () =>
      api("/api/v2/prototype-builder/mockup", {
        method: "POST",
        auth: false,
        body: {
          initiativeId,
          title: $("builderTitle")?.value || "",
          templateKey: $("builderTemplate")?.value || "service-dashboard",
        },
      }),
    "builderResult"
  );

  if (res?.data) {
    appState.builder.artifacts.mockup = res.data;
    setCopilotOutput("Mockup Generated", res.data);
    await saveBuilderArtifact("mockup", "Generated Mockup", res.data);
    renderBuilderReadiness();
  }

  if (initiativeId && !appState.prototypes.some((x) => x.initiativeId === initiativeId)) {
    await safeApi("Create prototype", () =>
      api("/api/v2/prototypes", {
        method: "POST",
        auth: false,
        body: {
          initiativeId,
          status: "draft",
          progress: 32,
          supportLevel: "uiux",
        },
      })
    );
  }

  await renderPrototypes();
});

$("workspaceLoadBtn")?.addEventListener("click", () => loadWorkspace(true));

$("workspaceChangeBtn")?.addEventListener("click", async () => {
  const initiativeId = await ensureInitiativeId("workspaceInitiativeId", ["engineInitiativeId"]);
  if (!initiativeId) return;

  await safeApi(
    "Add workspace change",
    () =>
      api(`/api/v2/workspace/${initiativeId}/changes`, {
        method: "POST",
        auth: false,
        body: { title: $("workspaceChangeTitle")?.value || "Workspace update", description: "Added from employee portal" },
      })
  );

  await recordCollaborationActivity(initiativeId, "تمت إضافة تغيير جديد في Workspace.", "workspace_change_add");
  await loadWorkspace(true);
  await renderPrototypes();
});

$("workspaceNoteBtn")?.addEventListener("click", async () => {
  const initiativeId = await ensureInitiativeId("workspaceInitiativeId", ["engineInitiativeId"]);
  if (!initiativeId) return;

  await safeApi(
    "Add evaluator note",
    () =>
      api(`/api/v2/workspace/${initiativeId}/evaluator-notes`, {
        method: "POST",
        auth: false,
        body: { note: $("workspaceEvaluatorNote")?.value || "Evaluator note", scoreHint: 75 },
      })
  );

  await recordCollaborationActivity(initiativeId, "تمت إضافة ملاحظة تقييم جديدة.", "workspace_note_add");
  await loadWorkspace(true);
  await renderPrototypes();
});

$("workspaceRecBtn")?.addEventListener("click", async () => {
  const initiativeId = await ensureInitiativeId("workspaceInitiativeId", ["engineInitiativeId"]);
  if (!initiativeId) return;

  await safeApi(
    "Add AI recommendation",
    () =>
      api(`/api/v2/workspace/${initiativeId}/recommendations`, {
        method: "POST",
        auth: false,
        body: { recommendation: $("workspaceRecommendation")?.value || "Recommendation" },
      })
  );

  await recordCollaborationActivity(initiativeId, "تمت إضافة توصية AI ضمن Workspace.", "workspace_recommendation_add");
  await loadWorkspace(true);
});

$("collabAddCommentBtn")?.addEventListener("click", async () => {
  const scopeId = currentScopeInitiativeId();
  if (!scopeId) return;

  const text = $("collabCommentInput")?.value?.trim() || "";
  const mention = $("collabMentionInput")?.value?.trim() || "";
  if (!text) return;

  const prototypeId = getSelectedPrototype()?.initiativeId === scopeId ? getSelectedPrototype()?.id : null;
  const remote = await safeApi("Add collaboration comment", () =>
    api(`/api/v2/collaboration/${scopeId}/comments`, {
      method: "POST",
      auth: false,
      body: {
        prototypeId,
        commentText: text,
        mention: mention || null,
      },
    })
  );

  if (remote?.data?.comment) {
    await fetchCollaborationForInitiative(scopeId, prototypeId, true);
  } else {
    // Local fallback in case backend API is temporarily unavailable.
    const scope = ensureCollabScope(scopeId);
    scope.comments.unshift({
      id: `C-${Date.now()}`,
      text,
      mention,
      author: "Portal User",
      createdAt: new Date().toISOString(),
    });
    scope.comments = scope.comments.slice(0, 30);
    appendCollabActivity(scopeId, `تعليق جديد${mention ? ` مع ${mention}` : ""}`);
    saveJson(COLLAB_STORE_KEY, appState.collab);
  }

  const scope = ensureCollabScope(scopeId);
  if (scope && remote?.data?.comment) {
    // Keep lightweight local copy for offline fallback.
    scope.comments.unshift({
      id: remote.data.comment.id || `C-${Date.now()}`,
      text,
      mention,
      author: remote.data.comment.authorName || "Portal User",
      createdAt: remote.data.comment.createdAt || new Date().toISOString(),
    });
    scope.comments = scope.comments.slice(0, 30);
    saveJson(COLLAB_STORE_KEY, appState.collab);
  }

  if ($("collabCommentInput")) $("collabCommentInput").value = "";
  if ($("collabMentionInput")) $("collabMentionInput").value = "";

  const workspaceData = appState.workspaceCache[scopeId] || null;
  await refreshCollaborationView(scopeId, workspaceData, true);
});

$("collabSuggestBtn")?.addEventListener("click", () => {
  const scopeId = currentScopeInitiativeId();
  if (!scopeId) return;

  const selected = getSelectedPrototype();
  const metrics = selected ? buildPrototypeMetrics(selected) : null;

  const suggestion = metrics
    ? `اقتراح AI: ركّز الأسبوع القادم على خفض ${metrics.risk} risk ورفع الجاهزية من ${metrics.readiness}% إلى ${Math.min(100, metrics.readiness + 8)}%.`
    : "اقتراح AI: وثّق baseline الحالي قبل أي تعديل تنفيذي.";

  if ($("collabCommentInput")) {
    $("collabCommentInput").value = suggestion;
  }

  setCopilotOutput("Collaboration Suggestion", suggestion);
});

$("scoreCalcBtn")?.addEventListener("click", async () => {
  await safeApi(
    "Idea maturity",
    () =>
      api("/api/v2/scoring/idea-maturity", {
        method: "POST",
        auth: false,
        body: {
          initiativeId: $("scoreInitiativeId")?.value?.trim() || null,
          problemClarity: Number($("scoreProblem")?.value || 0),
          feasibility: Number($("scoreFeasibility")?.value || 0),
          impact: Number($("scoreImpact")?.value || 0),
          risk: Number($("scoreRisk")?.value || 0),
          readiness: Number($("scoreReadiness")?.value || 0),
        },
      }),
    "scoreResult"
  );
  await refreshAnalytics();
});

$("scoreListBtn")?.addEventListener("click", async () => {
  const initiativeId = $("scoreInitiativeId")?.value?.trim() || "";
  const path = initiativeId ? `/api/v2/scoring/idea-maturity?initiativeId=${encodeURIComponent(initiativeId)}` : "/api/v2/scoring/idea-maturity";
  await safeApi("List idea maturity", () => api(path, { auth: false }), "scoreResult");
});

$("impactRunBtn")?.addEventListener("click", async () => {
  await safeApi(
    "Impact simulation",
    () =>
      api("/api/v2/impact/simulate", {
        method: "POST",
        auth: false,
        body: {
          initiativeId: $("scoreInitiativeId")?.value?.trim() || null,
          baseline: {
            timeDays: Number($("impactTime")?.value || 0),
            costSar: Number($("impactCost")?.value || 0),
            qualityScore: Number($("impactQuality")?.value || 0),
            satisfactionScore: Number($("impactSatisfaction")?.value || 0),
          },
          assumptions: {
            timeReductionPct: Number($("impactTimeRed")?.value || 0),
            costReductionPct: Number($("impactCostRed")?.value || 0),
            qualityIncreasePct: Number($("impactQualityInc")?.value || 0),
            satisfactionIncreasePct: Number($("impactSatInc")?.value || 0),
          },
        },
      }),
    "impactResult"
  );
  await refreshAnalytics();
});

$("impactListBtn")?.addEventListener("click", async () => {
  const initiativeId = $("scoreInitiativeId")?.value?.trim() || "";
  const path = initiativeId ? `/api/v2/impact/simulations?initiativeId=${encodeURIComponent(initiativeId)}` : "/api/v2/impact/simulations";
  await safeApi("List impact simulations", () => api(path, { auth: false }), "impactResult");
});

$("benchRunBtn")?.addEventListener("click", async () => {
  const keywords = ($("benchKeywords")?.value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  await safeApi(
    "Global benchmark",
    () =>
      api("/api/v2/benchmarking/global", {
        method: "POST",
        auth: false,
        body: {
          initiativeId: $("benchInitiativeId")?.value?.trim() || null,
          title: $("benchTitle")?.value || "",
          summary: $("benchSummary")?.value || "",
          keywords,
        },
      }),
    "benchResult"
  );
});

$("benchCatalogBtn")?.addEventListener("click", async () => {
  await safeApi("Benchmark catalog", () => api("/api/v2/benchmarking/catalog", { auth: false }), "benchResult");
});

$("benchRunsBtn")?.addEventListener("click", async () => {
  const initiativeId = $("benchInitiativeId")?.value?.trim() || "";
  const path = initiativeId ? `/api/v2/benchmarking/runs?initiativeId=${encodeURIComponent(initiativeId)}` : "/api/v2/benchmarking/runs";
  await safeApi("Benchmark runs", () => api(path, { auth: false }), "benchResult");
});

$("marketCreateBtn")?.addEventListener("click", async () => {
  await safeApi(
    "Create marketplace offer",
    () =>
      api("/api/v2/marketplace", {
        method: "POST",
        auth: false,
        body: {
          initiativeId: $("marketInitiativeId")?.value?.trim() || null,
          title: $("marketTitle")?.value || "",
          status: $("marketStatus")?.value || "draft",
          details: { source: "employee-portal" },
        },
      }),
    "marketResult"
  );
});

$("marketListBtn")?.addEventListener("click", async () => {
  await safeApi("List marketplace offers", () => api("/api/v2/marketplace", { auth: false }), "marketResult");
});

wirePrototypeControls();
wireBuilderFlow();
setBuilderStep(0);
renderBuilderReadiness();
refreshAll();
