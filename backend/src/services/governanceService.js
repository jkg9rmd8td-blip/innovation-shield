import { pool } from "../db/pool.js";

export async function addPledge({ user, text }) {
  const { rows } = await pool.query(
    `INSERT INTO governance_pledges (user_id, user_name, user_role, pledge_text)
     VALUES ($1,$2,$3,$4)
     RETURNING id, user_id, user_name, user_role, pledge_text, created_at`,
    [user.id, user.name, user.role, text]
  );
  return rows[0];
}

export async function addConfidentialityApproval({ user, note }) {
  const { rows } = await pool.query(
    `INSERT INTO governance_confidentiality_approvals (user_id, user_name, user_role, note)
     VALUES ($1,$2,$3,$4)
     RETURNING id, user_id, user_name, user_role, note, created_at`,
    [user.id, user.name, user.role, note || null]
  );
  return rows[0];
}

export async function getGovernanceLogs() {
  const [pledges, confidentiality] = await Promise.all([
    pool.query(`SELECT id, user_id, user_name, user_role, pledge_text, created_at FROM governance_pledges ORDER BY created_at DESC`),
    pool.query(`SELECT id, user_id, user_name, user_role, note, created_at FROM governance_confidentiality_approvals ORDER BY created_at DESC`)
  ]);

  return {
    approvals: pledges.rows,
    pledges: pledges.rows,
    confidentialityApprovals: confidentiality.rows,
  };
}
