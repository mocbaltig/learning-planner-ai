function computeConfidence(context) {
  let score = 0;

  if (context.preferred_time) score += 1;

  const avgDuration = 45;
  const totalExistingMinutes = context.existing_tasks.length * avgDuration;
  const targetMinutes = (context.weekly_target_hours || 5) * 60;
  const occupancy = targetMinutes > 0 ? totalExistingMinutes / targetMinutes : 0;
  if (occupancy < 0.5) score += 1;
  if (occupancy < 0.75) score += 0.5;

  if (context.goal?.deadline) {
    const deadlineDate = new Date(context.goal.deadline);
    const weekStart = new Date(context.week_start);
    const weeksUntilDeadline =
      (deadlineDate - weekStart) / (7 * 24 * 60 * 60 * 1000);
    if (weeksUntilDeadline >= 2) score += 1;
    else if (weeksUntilDeadline >= 1) score += 0.5;
  }

  if (context.existing_tasks.length <= 3) score += 0.5;

  if (score <= 1) return 'low';
  if (score <= 2.5) return 'average';
  return 'high';
}

module.exports = { computeConfidence };
