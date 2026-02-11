import { pool } from "../db/pool.js";
import { INITIATIVE_STATUS } from "../core/constants.js";

export async function listInitiatives() {
  const { rows } = await pool.query(
    `SELECT id, title, owner_name, status, average_score, judging_locked, reward_total, reward_distribution, created_at, updated_at
     FROM initiatives
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function getInitiativeById(id) {
  const { rows } = await pool.query(
    `SELECT id, title, owner_name, status, average_score, judging_locked, reward_total, reward_distribution, created_at, updated_at
     FROM initiatives WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function createInitiative({ title, ownerName }) {
  const { rows } = await pool.query(
    `INSERT INTO initiatives (title, owner_name, status)
     VALUES ($1,$2,$3)
     RETURNING id, title, owner_name, status, average_score, judging_locked, reward_total, reward_distribution, created_at, updated_at`,
    [title, ownerName, INITIATIVE_STATUS.DRAFT]
  );
  return rows[0];
}

export async function updateInitiativeStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE initiatives
     SET status = $2, updated_at = now()
     WHERE id = $1
     RETURNING id, title, owner_name, status, average_score, judging_locked, reward_total, reward_distribution, created_at, updated_at`,
    [id, status]
  );
  return rows[0] || null;
}

export async function setJudgingLock(id, locked) {
  const { rows } = await pool.query(
    `UPDATE initiatives
     SET judging_locked = $2, updated_at = now()
     WHERE id = $1
     RETURNING id, title, owner_name, status, average_score, judging_locked, reward_total, reward_distribution, created_at, updated_at`,
    [id, locked]
  );
  return rows[0] || null;
}

export async function setInitiativeReward(id, total, distribution) {
  const { rows } = await pool.query(
    `UPDATE initiatives
     SET reward_total = $2, reward_distribution = $3, status = $4, updated_at = now()
     WHERE id = $1
     RETURNING id, title, owner_name, status, average_score, judging_locked, reward_total, reward_distribution, created_at, updated_at`,
    [id, total, distribution, INITIATIVE_STATUS.APPROVED]
  );
  return rows[0] || null;
}
