import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  if (!sql.trim()) return;
  await pool.query(sql);
}

async function runSqlDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const files = fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    await runSqlFile(path.join(dirPath, file));
    console.log(`Applied SQL: ${file}`);
  }
}

async function run() {
  await runSqlFile(path.join(__dirname, "schema.sql"));
  await runSqlDir(path.join(__dirname, "migrations"));
  console.log("Migration complete.");
  await pool.end();
}

run().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
