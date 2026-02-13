import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

const TEMPLATE_CATALOG = [
  { key: "service-dashboard", title: "Service Dashboard", category: "dashboard", complexity: "medium", blocks: ["KPI", "Trend", "Alerts", "Actions"] },
  { key: "mobile-care-flow", title: "Mobile Care Flow", category: "mobile", complexity: "high", blocks: ["Auth", "Flow", "Forms", "Notifications"] },
  { key: "ops-automation", title: "Ops Automation Board", category: "workflow", complexity: "medium", blocks: ["Queue", "SLA", "Escalation", "Audit"] },
  { key: "self-service-portal", title: "Self-Service Portal", category: "portal", complexity: "low", blocks: ["Landing", "Catalog", "Request", "Tracking"] },
];

function cleanLines(text = "") {
  return String(text)
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseLimit(value, fallback = 40) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), 1), 300);
}

function cleanText(value) {
  return String(value || "").trim();
}

export function listTemplates() {
  return TEMPLATE_CATALOG;
}

export async function generatePitchDeck(payload, user) {
  const title = payload?.title || "Innovation Pitch";
  const problem = payload?.problem || "Problem statement not provided.";
  const solution = payload?.solution || "Proposed innovation solution.";
  const impact = payload?.impact || "Impact to be validated.";

  const deck = [
    { slide: 1, title: "Executive Summary", bullets: [title, "Healthcare innovation opportunity", "Decision-ready prototype path"] },
    { slide: 2, title: "Problem", bullets: cleanLines(problem).slice(0, 4) },
    { slide: 3, title: "Solution", bullets: cleanLines(solution).slice(0, 4) },
    { slide: 4, title: "Business Case", bullets: ["Cost of delay", "Expected value", "Adoption readiness"] },
    { slide: 5, title: "Impact", bullets: cleanLines(impact).slice(0, 4) },
    { slide: 6, title: "Pilot Plan", bullets: ["Scope", "Stakeholders", "KPIs", "Timeline"] },
    { slide: 7, title: "Risks & Mitigations", bullets: ["Operational", "Technical", "Compliance", "Change management"] },
    { slide: 8, title: "Decision Ask", bullets: ["Pilot approval", "Resource allocation", "Governance sponsor"] },
  ];

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "PROTOTYPE_BUILDER_PITCH",
    operation: "generate",
    entityId: payload?.initiativeId || null,
    afterState: { title, slides: deck.length },
  });

  return { template: "pitch-deck-v1", slides: deck };
}

export async function generateUseCases(payload, user) {
  const actor = payload?.actor || "Beneficiary";
  const goal = payload?.goal || "Improve service journey";
  const context = payload?.context || "Healthcare operation";

  const scenarios = [
    {
      id: "UC-1",
      title: `${actor} starts the service request`,
      context,
      steps: [
        `${actor} opens the service interface`,
        `System validates eligibility and consent`,
        `${actor} submits structured request`,
        `System creates traceable case ID`,
      ],
      expectedOutcome: `Faster request initiation for ${goal}`,
    },
    {
      id: "UC-2",
      title: `Operational team processes the case`,
      context,
      steps: [
        "Case routed to responsible unit",
        "Priority assigned by policy",
        "Actions logged in audit chain",
        "Status notifications sent to stakeholder",
      ],
      expectedOutcome: "Reduced turnaround time and higher transparency",
    },
    {
      id: "UC-3",
      title: "Management monitors outcome and impact",
      context,
      steps: [
        "KPI dashboard updates in near real-time",
        "Deviation alerts raised automatically",
        "Committee reviews impact score",
        "Decision for scaling is issued",
      ],
      expectedOutcome: "Data-driven decision to scale the innovation",
    },
  ];

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "PROTOTYPE_BUILDER_USE_CASES",
    operation: "generate",
    entityId: payload?.initiativeId || null,
    afterState: { actor, count: scenarios.length },
  });

  return { scenarios };
}

export async function assistInnovationWriting(payload, user) {
  const raw = String(payload?.text || "").trim();
  const tone = payload?.tone || "professional";

  const improved = raw
    ? raw.replace(/\s+/g, " ").replace(/[\.]{2,}/g, ".").trim()
    : "This innovation addresses a measurable operational challenge with clear impact and executable implementation path.";

  const suggestions = [
    "Define baseline metrics before pilot start.",
    "Add compliance and governance constraints explicitly.",
    "State one quantified benefit in time or cost.",
    "Clarify stakeholder ownership and rollout timeline.",
  ];

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "PROTOTYPE_BUILDER_WRITING_ASSIST",
    operation: "assist",
    entityId: payload?.initiativeId || null,
    afterState: { tone, hasInput: Boolean(raw) },
  });

  return { tone, improvedText: improved, suggestions };
}

export async function generateSimpleMockup(payload, user) {
  const templateKey = payload?.templateKey || "service-dashboard";
  const title = payload?.title || "Prototype Mockup";

  const selected = TEMPLATE_CATALOG.find((x) => x.key === templateKey) || TEMPLATE_CATALOG[0];
  const components = selected.blocks.map((block, idx) => ({
    id: `CMP-${idx + 1}`,
    type: block,
    x: 40 + idx * 120,
    y: 60 + (idx % 2) * 120,
    w: 100,
    h: 72,
    label: `${block} Module`,
  }));

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "PROTOTYPE_BUILDER_MOCKUP",
    operation: "generate",
    entityId: payload?.initiativeId || null,
    afterState: { templateKey: selected.key, components: components.length },
  });

  return {
    title,
    template: selected,
    canvas: { width: 900, height: 520, grid: 8 },
    components,
  };
}

export async function saveBuilderArtifact(payload, user) {
  const initiativeId = cleanText(payload?.initiativeId);
  if (!initiativeId) {
    const err = new Error("INITIATIVE_ID_REQUIRED");
    err.statusCode = 400;
    err.code = "INITIATIVE_ID_REQUIRED";
    throw err;
  }

  const artifactType = cleanText(payload?.artifactType);
  if (!artifactType) {
    const err = new Error("ARTIFACT_TYPE_REQUIRED");
    err.statusCode = 400;
    err.code = "ARTIFACT_TYPE_REQUIRED";
    throw err;
  }

  const artifactPayload = payload?.payload ?? payload?.artifact;
  if (!artifactPayload) {
    const err = new Error("ARTIFACT_PAYLOAD_REQUIRED");
    err.statusCode = 400;
    err.code = "ARTIFACT_PAYLOAD_REQUIRED";
    throw err;
  }

  const title = cleanText(payload?.title) || null;
  const prototypeId = cleanText(payload?.prototypeId) || null;

  const { rows: verRows } = await pool.query(
    `SELECT COALESCE(MAX(version), 0)::int AS "maxVersion"
       FROM v2.prototype_builder_artifacts
      WHERE initiative_id = $1
        AND artifact_type = $2`,
    [initiativeId, artifactType]
  );

  const nextVersion = (verRows[0]?.maxVersion || 0) + 1;

  const { rows } = await pool.query(
    `INSERT INTO v2.prototype_builder_artifacts (initiative_id, prototype_id, artifact_type, title, payload, version, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id,
               initiative_id AS "initiativeId",
               prototype_id AS "prototypeId",
               artifact_type AS "artifactType",
               title,
               payload,
               version,
               created_by AS "createdBy",
               created_at AS "createdAt"`,
    [initiativeId, prototypeId, artifactType, title, JSON.stringify(artifactPayload), nextVersion, user?.id || payload?.createdBy || null]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "PROTOTYPE_BUILDER_ARTIFACT_SAVE",
    operation: "create",
    entityId: initiativeId,
    afterState: rows[0],
  });

  return rows[0];
}

export async function listBuilderArtifacts({ initiativeId, artifactType = null, limit = 40 } = {}) {
  const cleanInitiativeId = cleanText(initiativeId);
  if (!cleanInitiativeId) {
    const err = new Error("INITIATIVE_ID_REQUIRED");
    err.statusCode = 400;
    err.code = "INITIATIVE_ID_REQUIRED";
    throw err;
  }

  const params = [cleanInitiativeId];
  let where = `initiative_id = $1`;

  if (artifactType) {
    params.push(cleanText(artifactType));
    where += ` AND artifact_type = $${params.length}`;
  }

  params.push(parseLimit(limit));

  const { rows } = await pool.query(
    `SELECT id,
            initiative_id AS "initiativeId",
            prototype_id AS "prototypeId",
            artifact_type AS "artifactType",
            title,
            payload,
            version,
            created_by AS "createdBy",
            created_at AS "createdAt"
       FROM v2.prototype_builder_artifacts
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length}`,
    params
  );

  return rows;
}

function buildMarkdownPack(payload) {
  const title = cleanText(payload?.title) || "Prototype Pack";
  const problem = cleanText(payload?.problem) || "No problem statement provided.";
  const summary = cleanText(payload?.summary) || "No summary provided.";
  const readiness = cleanText(payload?.readiness) || "N/A";

  const mvpItems = Array.isArray(payload?.mvp) ? payload.mvp : [];
  const risks = Array.isArray(payload?.risks) ? payload.risks : [];
  const recommendations = Array.isArray(payload?.recommendations) ? payload.recommendations : [];

  const lines = [
    `# ${title}`,
    "",
    "## Problem",
    problem,
    "",
    "## Solution Summary",
    summary,
    "",
    "## Readiness",
    readiness,
    "",
    "## MVP",
    ...(mvpItems.length ? mvpItems.map((x) => `- ${x}`) : ["- No MVP items"]),
    "",
    "## Risks",
    ...(risks.length ? risks.map((x) => `- ${typeof x === "string" ? x : JSON.stringify(x)}`) : ["- No listed risks"]),
    "",
    "## Recommendations",
    ...(recommendations.length ? recommendations.map((x) => `- ${x}`) : ["- No recommendations"]),
    "",
    `_Generated at: ${new Date().toISOString()}_`,
  ];

  return lines.join("\n");
}

export async function exportPrototypePack(payload, user) {
  const initiativeId = cleanText(payload?.initiativeId);
  if (!initiativeId) {
    const err = new Error("INITIATIVE_ID_REQUIRED");
    err.statusCode = 400;
    err.code = "INITIATIVE_ID_REQUIRED";
    throw err;
  }

  const format = cleanText(payload?.format || "json").toLowerCase();
  const supported = ["json", "md", "pptx", "pdf"];
  if (!supported.includes(format)) {
    const err = new Error("UNSUPPORTED_EXPORT_FORMAT");
    err.statusCode = 400;
    err.code = "UNSUPPORTED_EXPORT_FORMAT";
    err.details = { supported };
    throw err;
  }

  const title = cleanText(payload?.title) || "Prototype Pack";
  const fileNameBase = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "prototype-pack";
  const generatedAt = new Date().toISOString();

  let content;
  if (format === "json") {
    content = {
      title,
      generatedAt,
      sections: payload?.sections || {},
      summary: payload?.summary || null,
    };
  } else {
    content = buildMarkdownPack(payload);
  }

  const response = {
    initiativeId,
    format,
    fileName: `${fileNameBase}.${format === "json" ? "json" : format === "md" ? "md" : format}`,
    renderMode: format === "pdf" || format === "pptx" ? "template-ready" : "direct",
    generatedAt,
    content,
  };

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "PROTOTYPE_BUILDER_EXPORT",
    operation: "export",
    entityId: initiativeId,
    afterState: {
      format: response.format,
      fileName: response.fileName,
      generatedAt: response.generatedAt,
    },
  });

  return response;
}
