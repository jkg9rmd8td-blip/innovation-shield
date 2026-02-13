export function validateRubric(rubric) {
  if (!Array.isArray(rubric) || !rubric.length) throw new Error("INVALID_RUBRIC");
  const totalWeight = rubric.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  if (totalWeight <= 0) throw new Error("INVALID_RUBRIC_WEIGHT");
  return totalWeight;
}

export function scoreByRubric(rubric, marks) {
  const totalWeight = validateRubric(rubric);
  const weighted = rubric.reduce((acc, item) => {
    const mark = Number(marks[item.key] || 0);
    const weight = Number(item.weight || 0);
    return acc + (mark * weight);
  }, 0);
  return Number((weighted / totalWeight).toFixed(2));
}

export function averageScores(scores) {
  if (!scores.length) return null;
  const sum = scores.reduce((acc, s) => acc + Number(s.score || 0), 0);
  return Number((sum / scores.length).toFixed(2));
}

export function distributeRewards(total, contributors) {
  const totalAmount = Number(total || 0);
  const weightSum = contributors.reduce((sum, c) => sum + Number(c.weight || 0), 0) || 1;
  let allocated = 0;

  return contributors.map((c, idx) => {
    let amount = Math.round((totalAmount * Number(c.weight || 0)) / weightSum);
    allocated += amount;
    if (idx === contributors.length - 1) {
      amount += totalAmount - allocated;
    }
    return {
      name: c.name,
      weight: Number(c.weight || 0),
      amount,
    };
  });
}
