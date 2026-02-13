import { listAuditLogs } from "./audit-service.js";
import { getState } from "../core/state.js";

const POINTS_MAP = {
  create_initiative: 50,
  submit_evaluation: 25,
  approve_initiative: 30,
  reject_initiative: 20,
  move_journey_stage: 20,
  submit_pledge: 12,
  submit_confidentiality_approval: 10,
  reward_distribution: 18,
};

function levelFromPoints(points) {
  if (points >= 700) return { level: 5, label: "Legend" };
  if (points >= 450) return { level: 4, label: "Master" };
  if (points >= 260) return { level: 3, label: "Pro" };
  if (points >= 120) return { level: 2, label: "Rising" };
  return { level: 1, label: "Starter" };
}

function badgesForUser(row) {
  const badges = [];
  if (row.evaluations >= 10) badges.push("حكم نشط");
  if (row.creations >= 5) badges.push("صاحب مبادرة");
  if (row.approvals >= 3) badges.push("صانع قرار");
  if (row.points >= 450) badges.push("تميّز ابتكاري");
  return badges;
}

export function buildLeaderboard() {
  const logs = listAuditLogs(2000);
  const state = getState();

  const users = {};
  logs.forEach((log) => {
    const id = log.user?.id;
    if (!id) return;
    if (!users[id]) {
      users[id] = {
        userId: id,
        name: log.user.name,
        role: log.user.roleLabel || log.user.role,
        points: 0,
        evaluations: 0,
        creations: 0,
        approvals: 0,
      };
    }

    const op = log.operation;
    users[id].points += Number(POINTS_MAP[op] || 0);
    if (op === "submit_evaluation") users[id].evaluations += 1;
    if (op === "create_initiative") users[id].creations += 1;
    if (op === "approve_initiative") users[id].approvals += 1;
  });

  const training = state.training?.completions || [];
  training.forEach((t) => {
    if (!users[t.userId]) {
      users[t.userId] = {
        userId: t.userId,
        name: t.userName,
        role: "-",
        points: 0,
        evaluations: 0,
        creations: 0,
        approvals: 0,
      };
    }
    users[t.userId].points += 8;
  });

  return Object.values(users)
    .map((u) => ({
      ...u,
      ...levelFromPoints(u.points),
      badges: badgesForUser(u),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 20);
}
