import { pool } from "../db/pool.js";
import { INITIATIVE_STATUS, JOURNEY_STAGES, STAGE_INDEX } from "../core/constants.js";

function mapStageToStatus(stageKey) {
  if (stageKey === "evaluation") return INITIATIVE_STATUS.IN_REVIEW;
  if (["team_formation", "prototype", "development"].includes(stageKey)) return INITIATIVE_STATUS.IN_PROGRESS;
  if (stageKey === "pilot") return INITIATIVE_STATUS.PILOT;
  if (stageKey === "approval" || stageKey === "legal_protection") return INITIATIVE_STATUS.APPROVED;
  if (stageKey === "launch") return INITIATIVE_STATUS.LAUNCHED;
  return INITIATIVE_STATUS.DRAFT;
}

function stageLabel(stageKey) {
  return JOURNEY_STAGES.find((x) => x.key === stageKey)?.label || stageKey;
}

function getStageOrder(stageKey) {
  return STAGE_INDEX[stageKey] || 0;
}

const SELECT_FIELDS = `
  id,
  title,
  owner_name,
  status,
  stage,
  stage_history,
  average_score,
  judging_locked,
  reward_total,
  reward_distribution,
  created_at,
  updated_at
`;

export async function listInitiatives() {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM initiatives
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function getInitiativeById(id) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM initiatives
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function createInitiative({ title, ownerName }) {
  const { rows } = await pool.query(
    `INSERT INTO initiatives (title, owner_name, status, stage, stage_history)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING ${SELECT_FIELDS}`,
    [
      title,
      ownerName,
      INITIATIVE_STATUS.DRAFT,
      "idea_submission",
      JSON.stringify([
        {
          stage: "idea_submission",
          stageLabel: stageLabel("idea_submission"),
          at: new Date().toISOString(),
          by: ownerName,
          note: "تسجيل المبادرة",
        },
      ]),
    ]
  );
  return rows[0];
}

export async function updateInitiativeStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE initiatives
     SET status = $2, updated_at = now()
     WHERE id = $1
     RETURNING ${SELECT_FIELDS}`,
    [id, status]
  );
  return rows[0] || null;
}

export async function moveInitiativeStage({ id, stageKey, note, by }) {
  const current = await getInitiativeById(id);
  if (!current) return null;

  if (getStageOrder(stageKey) < getStageOrder(current.stage)) {
    throw new Error("JOURNEY_BACKWARD_NOT_ALLOWED");
  }

  const history = Array.isArray(current.stage_history) ? [...current.stage_history] : [];
  history.push({
    stage: stageKey,
    stageLabel: stageLabel(stageKey),
    at: new Date().toISOString(),
    by: by || "system",
    note: note || "تحديث مسار الابتكار",
  });

  const { rows } = await pool.query(
    `UPDATE initiatives
     SET stage = $2,
         status = $3,
         stage_history = $4,
         updated_at = now()
     WHERE id = $1
     RETURNING ${SELECT_FIELDS}`,
    [id, stageKey, mapStageToStatus(stageKey), JSON.stringify(history)]
  );

  return rows[0] || null;
}

export async function setJudgingLock(id, locked) {
  const { rows } = await pool.query(
    `UPDATE initiatives
     SET judging_locked = $2, updated_at = now()
     WHERE id = $1
     RETURNING ${SELECT_FIELDS}`,
    [id, locked]
  );
  return rows[0] || null;
}

export async function setInitiativeReward(id, total, distribution) {
  const { rows } = await pool.query(
    `UPDATE initiatives
     SET reward_total = $2,
         reward_distribution = $3,
         status = $4,
         updated_at = now()
     WHERE id = $1
     RETURNING ${SELECT_FIELDS}`,
    [id, total, distribution, INITIATIVE_STATUS.APPROVED]
  );
  return rows[0] || null;
}
