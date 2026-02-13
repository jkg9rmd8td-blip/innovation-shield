import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";

const CATALOG = [
  {
    id: "BM-100",
    title: "NHS Virtual Triage Pathway",
    region: "UK",
    domain: "patient-flow",
    keywords: ["triage", "virtual", "routing", "waiting-time", "care pathway"],
    outcomes: { timeReductionPct: 28, satisfactionIncreasePct: 18 },
  },
  {
    id: "BM-101",
    title: "Mayo Clinic Process Automation",
    region: "US",
    domain: "operations",
    keywords: ["automation", "workflow", "operations", "productivity", "sla"],
    outcomes: { costReductionPct: 22, qualityIncreasePct: 12 },
  },
  {
    id: "BM-102",
    title: "Singapore Smart Hospital Digital Twin",
    region: "Singapore",
    domain: "capacity-management",
    keywords: ["digital twin", "simulation", "capacity", "bed management", "prediction"],
    outcomes: { timeReductionPct: 19, qualityIncreasePct: 15 },
  },
  {
    id: "BM-103",
    title: "Kaiser Remote Monitoring Care Model",
    region: "US",
    domain: "remote-care",
    keywords: ["remote", "monitoring", "telehealth", "early alert", "patient engagement"],
    outcomes: { satisfactionIncreasePct: 21, qualityIncreasePct: 14 },
  },
];

function tokenize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .split(/\s+/)
    .filter((x) => x.length > 2);
}

function jaccard(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  const intersection = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size || 1;
  return intersection / union;
}

function buildKnowledgeGraph(matches) {
  return {
    nodes: matches.map((m) => ({ id: m.id, label: m.title, type: "global-solution" })),
    edges: matches.map((m, idx) => ({ id: `E-${idx + 1}`, from: "idea", to: m.id, label: `similarity:${m.similarity.toFixed(2)}` })),
  };
}

export function getBenchmarkCatalog() {
  return CATALOG;
}

export async function runGlobalBenchmark(payload, user) {
  const ideaText = [payload?.title, payload?.summary, ...(payload?.keywords || [])].filter(Boolean).join(" ");
  const ideaTokens = tokenize(ideaText);

  const scored = CATALOG.map((entry) => {
    const entryTokens = tokenize(`${entry.title} ${entry.domain} ${entry.keywords.join(" ")}`);
    const similarity = jaccard(ideaTokens, entryTokens);
    return { ...entry, similarity: Math.round(similarity * 10000) / 10000 };
  }).sort((a, b) => b.similarity - a.similarity);

  const matches = scored.slice(0, 3).map((x) => ({
    id: x.id,
    title: x.title,
    region: x.region,
    domain: x.domain,
    similarity: x.similarity,
    outcomes: x.outcomes,
  }));

  const knowledgeGraph = buildKnowledgeGraph(matches);
  const aiSimilarity = matches.reduce((acc, x) => acc + x.similarity, 0) / Math.max(1, matches.length);

  const report = {
    query: {
      title: payload?.title || "",
      summary: payload?.summary || "",
      keywords: payload?.keywords || [],
    },
    aiSimilarity: Math.round(aiSimilarity * 10000) / 10000,
    matches,
    knowledgeGraph,
    webApis: {
      enabled: false,
      reason: "External web APIs are disabled in current secure runtime. Local benchmark catalog is used.",
    },
  };

  const { rows } = await pool.query(
    `INSERT INTO v2.benchmark_runs (initiative_id, query_payload, ai_similarity, matches, knowledge_graph, web_api_used, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, initiative_id AS "initiativeId", ai_similarity AS "aiSimilarity", created_at AS "createdAt"`,
    [payload?.initiativeId || null, report.query, report.aiSimilarity, matches, knowledgeGraph, false, "local-benchmark-catalog-v1"]
  );

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "GLOBAL_BENCHMARK_RUN",
    operation: "benchmark",
    entityId: payload?.initiativeId || rows[0].id,
    afterState: { runId: rows[0].id, aiSimilarity: report.aiSimilarity },
  });

  return { record: rows[0], report };
}

export async function listBenchmarkRuns(initiativeId = null) {
  const params = [];
  let where = "";
  if (initiativeId) {
    params.push(initiativeId);
    where = "WHERE initiative_id = $1";
  }

  const { rows } = await pool.query(
    `SELECT id,
            initiative_id AS "initiativeId",
            query_payload AS "queryPayload",
            ai_similarity AS "aiSimilarity",
            matches,
            knowledge_graph AS "knowledgeGraph",
            web_api_used AS "webApiUsed",
            source,
            created_at AS "createdAt"
     FROM v2.benchmark_runs
     ${where}
     ORDER BY created_at DESC`,
    params
  );

  return rows;
}
