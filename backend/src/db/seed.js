import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeeds(dirPath) {
  const files = fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dirPath, file), "utf8");
    await pool.query(sql);
    console.log(`Seed applied: ${file}`);
  }
}

async function run() {
  const seedDir = path.join(__dirname, "seeds");
  await runSeeds(seedDir);
  console.log("Seed complete.");
  await pool.end();
}

run().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
