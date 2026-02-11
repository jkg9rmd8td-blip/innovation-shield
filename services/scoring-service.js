export function validateRubric(rubric) {
  if (!Array.isArray(rubric) || !rubric.length) throw new Error("INVALID_RUBRIC");
  const totalWeight = rubric.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  if (totalWeight <= 0) throw new Error("INVALID_RUBRIC_WEIGHT");
  return totalWeight;
}

export function scoreByRubric(rubric, marks) {
  const totalWeight = validateRubric(rubric);
  let weightedSum = 0;

  rubric.forEach((criterion) => {
    const mark = Number(marks[criterion.key] || 0);
    const weight = Number(criterion.weight || 0);
    weightedSum += mark * weight;
  });

  return Number((weightedSum / totalWeight).toFixed(2));
}

export function averageScores(scores) {
  if (!scores.length) return null;
  const sum = scores.reduce((acc, s) => acc + Number(s.score || 0), 0);
  return Number((sum / scores.length).toFixed(2));
}

export function distributeRewards(total, contributors) {
  const weightSum = contributors.reduce((sum, c) => sum + Number(c.weight || 0), 0) || 1;
  let running = 0;
  const rows = contributors.map((c, idx) => {
    let amount = Math.round((Number(total) * Number(c.weight || 0)) / weightSum);
    running += amount;
    if (idx === contributors.length - 1) {
      amount += Number(total) - running;
    }
    return {
      name: c.name,
      weight: c.weight,
      amount,
    };
  });
  return rows;
}
