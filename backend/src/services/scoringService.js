export const DEFAULT_RUBRIC = [
  { key: "impact", weight: 35 },
  { key: "feasibility", weight: 30 },
  { key: "innovation", weight: 20 },
  { key: "alignment", weight: 15 },
];

export function scoreByRubric(marks, rubric = DEFAULT_RUBRIC) {
  const totalWeight = rubric.reduce((acc, r) => acc + Number(r.weight || 0), 0);
  if (!totalWeight) throw new Error("INVALID_RUBRIC");

  const weighted = rubric.reduce((acc, r) => {
    const mark = Number(marks?.[r.key] || 0);
    return acc + mark * Number(r.weight || 0);
  }, 0);

  return Number((weighted / totalWeight).toFixed(2));
}

export function average(values) {
  if (!values.length) return null;
  const sum = values.reduce((acc, x) => acc + Number(x || 0), 0);
  return Number((sum / values.length).toFixed(2));
}

export function distributeRewards(total, contributors) {
  const sum = contributors.reduce((acc, c) => acc + Number(c.weight || 0), 0) || 1;
  let allocated = 0;
  return contributors.map((c, i) => {
    let amount = Math.round((Number(total) * Number(c.weight || 0)) / sum);
    allocated += amount;
    if (i === contributors.length - 1) amount += Number(total) - allocated;
    return { name: c.name, weight: Number(c.weight || 0), amount };
  });
}
