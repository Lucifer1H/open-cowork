function computeMetricsSnapshot(events) {
  const taskEvents = (events || []).filter((event) => event.type === 'task.completed' || event.type === 'task.failed');
  const completed = taskEvents.filter((event) => event.type === 'task.completed');
  const failed = taskEvents.filter((event) => event.type === 'task.failed');

  const durations = taskEvents
    .map((event) => Number(event.durationMs))
    .filter((value) => Number.isFinite(value));

  const totalDuration = durations.reduce((sum, value) => sum + value, 0);

  return {
    totalTasks: taskEvents.length,
    completedTasks: completed.length,
    failedTasks: failed.length,
    successRate: taskEvents.length === 0 ? 0 : completed.length / taskEvents.length,
    averageDurationMs: durations.length === 0 ? 0 : totalDuration / durations.length
  };
}

module.exports = {
  computeMetricsSnapshot
};
