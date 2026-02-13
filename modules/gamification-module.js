import { buildLeaderboard } from "../services/gamification-service.js";

export function getLeaderboardFlow() {
  return buildLeaderboard();
}
