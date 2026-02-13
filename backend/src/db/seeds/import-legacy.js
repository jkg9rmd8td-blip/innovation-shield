import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { pool } from "../pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function safeReadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function hashRecord(record) {
  return crypto.createHash("sha256").update(JSON.stringify(record)).digest("hex");
}

function mapLegacyStage(stage = "") {
  const normalized = String(stage).trim().toLowerCase();
  const table = {
    "الفكرة": "idea_submission",
    "تقديم": "idea_submission",
    "فرز": "screening",
    "التقييم": "evaluation",
    "تحكيم": "evaluation",
    "الفريق": "team_formation",
    "النموذج الأولي": "prototype",
    "التطوير": "development",
    "مرحلة التجربة": "pilot",
    "الاعتماد": "approval",
    "الإطلاق": "launch",
    "idea_submission": "idea_submission",
    "screening": "screening",
    "evaluation": "evaluation",
    "team_formation": "team_formation",
    "prototype": "prototype",
    "development": "development",
    "pilot": "pilot",
    "approval": "approval",
    "launch": "launch",
  };
  return table[normalized] || "idea_submission";
}

function mapLegacyStatus(status = "") {
  const normalized = String(status).trim().toLowerCase();
  const table = {
    "مسودة": "draft",
    "قيد التحكيم": "in_review",
    "قيد التطوير": "in_progress",
    "مرحلة التجربة": "pilot",
    "معتمد": "approved",
    "مرفوض": "rejected",
    "مطلق": "launched",
    "draft": "draft",
    "in_review": "in_review",
    "approved": "approved",
    "rejected": "rejected",
    "launched": "launched",
  };
  return table[normalized] || "draft";
}

async function loadDbLegacyRows() {
  const out = { initiatives: [], scores: [], audit: [] };
  try {
    out.initiatives = (await pool.query("SELECT * FROM initiatives")).rows;
  } catch {
    out.initiatives = [];
  }
  try {
    out.scores = (await pool.query("SELECT * FROM initiative_scores")).rows;
  } catch {
    out.scores = [];
  }
  try {
    out.audit = (await pool.query("SELECT * FROM audit_logs")).rows;
  } catch {
    out.audit = [];
  }
  return out;
}

function loadJsonLegacy() {
  const root = path.resolve(__dirname, "../../../../");
  return {
    mock: safeReadJson(path.join(root, "app/data/mock.json")) || {},
    policies: safeReadJson(path.join(root, "app/data/policies.json")) || {},
    rubric: safeReadJson(path.join(root, "app/data/rubric.json")) || {},
    employee: safeReadJson(path.join(root, "app/employee/data/employee-mock.json")) || {},
    localSnapshot: safeReadJson(path.join(__dirname, "legacy-localstorage-snapshot.json")) || {},
  };
}

async function ensureUser(userId, userName) {
  const id = userId || `legacy-${hashRecord({ userName }).slice(0, 10)}`;
  const name = userName || "Legacy User";
  await pool.query(
    `INSERT INTO v2.users (id, name, department, locale)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO NOTHING`,
    [id, name, "Legacy", "ar"]
  );
  return id;
}

async function upsertInitiative(record, seen) {
  const fingerprint = hashRecord({
    title: record.title,
    owner: record.owner_name || record.owner,
    created_at: record.created_at || record.created,
  });

  if (seen.has(fingerprint)) {
    return { skipped: true };
  }
  seen.add(fingerprint);

  const ownerName = record.owner_name || record.owner || "Legacy Owner";
  const ownerId = await ensureUser(record.owner_id || null, ownerName);

  const result = await pool.query(
    `INSERT INTO v2.initiatives (title, owner_id, owner_name, status, stage)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id`,
    [
      record.title || "Untitled Legacy Initiative",
      ownerId,
      ownerName,
      mapLegacyStatus(record.status),
      mapLegacyStage(record.stage),
    ]
  );

  return { id: result.rows[0].id, skipped: false };
}

async function run() {
  const report = {
    startedAt: new Date().toISOString(),
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    sources: {
      postgres: { initiatives: 0, scores: 0, audit: 0 },
      json: { initiatives: 0 },
      localStorage: false,
    },
  };

  const seen = new Set();
  const dbLegacy = await loadDbLegacyRows();
  const jsonLegacy = loadJsonLegacy();

  report.sources.postgres.initiatives = dbLegacy.initiatives.length;
  report.sources.postgres.scores = dbLegacy.scores.length;
  report.sources.postgres.audit = dbLegacy.audit.length;
  report.sources.json.initiatives = Array.isArray(jsonLegacy.mock?.initiatives) ? jsonLegacy.mock.initiatives.length : 0;
  report.sources.localStorage = !!jsonLegacy.localSnapshot?.is_state_v1;

  for (const row of dbLegacy.initiatives) {
    try {
      const result = await upsertInitiative(row, seen);
      if (result.skipped) report.skipped += 1;
      else report.inserted += 1;
    } catch (err) {
      report.errors.push({ source: "postgres.initiatives", id: row.id, message: err.message });
    }
  }

  const jsonInitiatives = Array.isArray(jsonLegacy.mock?.initiatives) ? jsonLegacy.mock.initiatives : [];
  for (const row of jsonInitiatives) {
    try {
      const result = await upsertInitiative(row, seen);
      if (result.skipped) report.skipped += 1;
      else report.inserted += 1;
    } catch (err) {
      report.errors.push({ source: "json.mock.initiatives", id: row.id, message: err.message });
    }
  }

  for (const row of dbLegacy.audit) {
    try {
      await pool.query(
        `INSERT INTO v2.audit_logs (user_id, user_name, user_role, action, operation, entity_id, before_state, after_state)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          row.user_id || null,
          row.user_name || null,
          row.user_role || null,
          row.action || "LEGACY_EVENT",
          row.operation || "import",
          row.entity_id || null,
          row.before_state || null,
          row.after_state || null,
        ]
      );
      report.inserted += 1;
    } catch (err) {
      report.errors.push({ source: "postgres.audit", id: row.id, message: err.message });
    }
  }

  report.finishedAt = new Date().toISOString();

  const reportPath = path.join(__dirname, `etl-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`ETL report written: ${reportPath}`);

  await pool.end();
}

run().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
