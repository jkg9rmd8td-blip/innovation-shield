import { HEALTH_GOALS } from "../core/constants.js";

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(v || 0)));
}

export function runAIScreening({ title, description, goalKey, effortScore, expectedValueScore }) {
  const txt = `${title || ""} ${description || ""}`.trim();
  const len = txt.length;

  const clarity = clamp(40 + Math.min(45, Math.floor(len / 4)));
  const feasibility = clamp(100 - Number(effortScore || 50) + 18);
  const impact = clamp(Number(expectedValueScore || 50));
  const alignment = clamp(goalKey && HEALTH_GOALS[goalKey] ? 88 : 55);

  const total = Number((clarity * 0.25 + feasibility * 0.25 + impact * 0.3 + alignment * 0.2).toFixed(1));
  const label = total >= 85 ? "مرشح استراتيجي" : total >= 70 ? "مرشح قوي" : total >= 55 ? "بحاجة تحسين" : "ضعيف";

  return {
    clarity,
    feasibility,
    impact,
    alignment,
    total,
    label,
  };
}
