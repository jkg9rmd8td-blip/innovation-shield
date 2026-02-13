export function checkConflictOfInterest({ evaluator, initiative }) {
  if (!evaluator || !initiative) return { conflicted: false, reason: null };

  if (initiative.ownerUserId && evaluator.id && initiative.ownerUserId === evaluator.id) {
    return { conflicted: true, reason: "SELF_REVIEW_CONFLICT" };
  }

  if (initiative.owner && evaluator.name && initiative.owner === evaluator.name) {
    return { conflicted: true, reason: "OWNER_NAME_CONFLICT" };
  }

  if (evaluator.department && initiative.ownerDepartment && evaluator.department === initiative.ownerDepartment) {
    return { conflicted: true, reason: "SAME_DEPARTMENT_CONFLICT" };
  }

  return { conflicted: false, reason: null };
}
