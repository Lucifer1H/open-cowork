/**
 * 计算指标快照 - 增强版
 * 支持任务级、步骤级、插件级多维度指标
 */

/**
 * 按类型筛选事件
 * @param {Array} events - 事件数组
 * @param {string} type - 事件类型
 * @returns {Array}
 */
function filterByType(events, type) {
  return (events || []).filter((e) => e.type === type);
}

/**
 * 按类型前缀筛选事件
 * @param {Array} events - 事件数组
 * @param {string} prefix - 类型前缀
 * @returns {Array}
 */
function filterByPrefix(events, prefix) {
  return (events || []).filter((e) => e.type && e.type.startsWith(prefix));
}

/**
 * 计算百分位数
 * @param {Array<number>} values - 数值数组（已排序）
 * @param {number} percentile - 百分位（0-100）
 * @returns {number}
 */
function computePercentile(values, percentile) {
  if (!values || values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * 计算基础统计
 * @param {Array<number>} values - 数值数组
 * @returns {object}
 */
function computeBasicStats(values) {
  if (!values || values.length === 0) {
    return {
      count: 0,
      sum: 0,
      min: 0,
      max: 0,
      mean: 0,
      p50: 0,
      p95: 0,
      p99: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    count: values.length,
    sum,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / values.length,
    p50: computePercentile(sorted, 50),
    p95: computePercentile(sorted, 95),
    p99: computePercentile(sorted, 99)
  };
}

/**
 * 计算任务级指标
 * @param {Array} events - 事件数组
 * @returns {object}
 */
function computeTaskMetrics(events) {
  const taskEvents = filterByPrefix(events, 'task.');
  const started = filterByType(events, 'task.started');
  const completed = filterByType(events, 'task.completed');
  const failed = filterByType(events, 'task.failed');

  const durations = completed
    .concat(failed)
    .map((e) => Number(e.durationMs))
    .filter((v) => Number.isFinite(v));

  return {
    total: taskEvents.length,
    started: started.length,
    completed: completed.length,
    failed: failed.length,
    successRate: taskEvents.length === 0 ? 0 : completed.length / (completed.length + failed.length),
    durations: computeBasicStats(durations)
  };
}

/**
 * 计算步骤级指标
 * @param {Array} events - 事件数组
 * @returns {object}
 */
function computeStepMetrics(events) {
  const stepEvents = filterByPrefix(events, 'step.');
  const started = filterByType(events, 'step.started');
  const completed = filterByType(events, 'step.completed');
  const failed = filterByType(events, 'step.failed');
  const retried = filterByType(events, 'step.retry');

  const durations = completed
    .map((e) => Number(e.durationMs))
    .filter((v) => Number.isFinite(v));

  // 按风险等级分组
  const byRiskLevel = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };

  for (const event of stepEvents) {
    const risk = event.risk || 'medium';
    if (byRiskLevel.hasOwnProperty(risk)) {
      byRiskLevel[risk]++;
    }
  }

  return {
    total: stepEvents.length,
    started: started.length,
    completed: completed.length,
    failed: failed.length,
    retried: retried.length,
    byRiskLevel,
    durations: computeBasicStats(durations)
  };
}

/**
 * 计算插件级指标
 * @param {Array} events - 事件数组
 * @returns {object}
 */
function computePluginMetrics(events) {
  const pluginEvents = filterByPrefix(events, 'plugin.');
  const plugins = {};

  // 按插件ID分组
  for (const event of pluginEvents) {
    const pluginId = event.pluginId || 'unknown';
    if (!plugins[pluginId]) {
      plugins[pluginId] = {
        id: pluginId,
        invocations: 0,
        completed: 0,
        failed: 0,
        durations: []
      };
    }

    if (event.type === 'plugin.analyzed') {
      plugins[pluginId].invocations++;
    }
    if (event.type === 'plugin.stepsGenerated') {
      plugins[pluginId].stepCount = event.stepCount || 0;
    }
    if (event.durationMs) {
      plugins[pluginId].durations.push(Number(event.durationMs));
    }
  }

  // 计算每个插件的统计
  for (const pluginId of Object.keys(plugins)) {
    const p = plugins[pluginId];
    p.avgDurationMs = p.durations.length > 0
      ? p.durations.reduce((a, b) => a + b, 0) / p.durations.length
      : 0;
    delete p.durations; // 移除原始数据
  }

  return {
    total: pluginEvents.length,
    plugins
  };
}

/**
 * 计算调度级指标
 * @param {Array} events - 事件数组
 * @returns {object}
 */
function computeScheduleMetrics(events) {
  const scheduleEvents = filterByPrefix(events, 'schedule.');
  const triggered = filterByType(events, 'schedule.triggered');
  const completed = filterByType(events, 'schedule.completed');
  const failed = filterByType(events, 'schedule.failed');

  const durations = completed
    .concat(failed)
    .map((e) => Number(e.durationMs))
    .filter((v) => Number.isFinite(v));

  return {
    total: scheduleEvents.length,
    triggered: triggered.length,
    completed: completed.length,
    failed: failed.length,
    durations: computeBasicStats(durations)
  };
}

/**
 * 计算错误统计
 * @param {Array} events - 事件数组
 * @returns {object}
 */
function computeErrorMetrics(events) {
  const failedEvents = events.filter((e) =>
    e.type && (e.type.includes('.failed') || e.type.includes('.error'))
  );

  // 按错误类型分类
  const byType = {};
  const recent = [];

  for (const event of failedEvents) {
    const errorType = event.type || 'unknown';
    byType[errorType] = (byType[errorType] || 0) + 1;

    // 收集最近的错误
    if (event.error || event.reason) {
      recent.push({
        timestamp: event.timestamp,
        type: event.type,
        taskId: event.taskId,
        stepId: event.stepId,
        error: event.error || event.reason
      });
    }
  }

  // 只保留最近 10 条
  return {
    total: failedEvents.length,
    byType,
    recent: recent.slice(-10)
  };
}

/**
 * 计算时间分布指标
 * @param {Array} events - 事件数组
 * @returns {object}
 */
function computeTimingMetrics(events) {
  const taskCompleted = filterByType(events, 'task.completed');
  const stepCompleted = filterByType(events, 'step.completed');

  const taskDurations = taskCompleted
    .map((e) => Number(e.durationMs))
    .filter((v) => Number.isFinite(v));

  const stepDurations = stepCompleted
    .map((e) => Number(e.durationMs))
    .filter((v) => Number.isFinite(v));

  return {
    tasks: computeBasicStats(taskDurations),
    steps: computeBasicStats(stepDurations)
  };
}

/**
 * 计算完整指标快照
 * @param {Array} events - 事件数组
 * @returns {object}
 */
function computeMetricsSnapshot(events) {
  const allEvents = events || [];

  return {
    // 时间戳
    timestamp: new Date().toISOString(),
    eventCount: allEvents.length,

    // 多维度指标
    tasks: computeTaskMetrics(allEvents),
    steps: computeStepMetrics(allEvents),
    plugins: computePluginMetrics(allEvents),
    schedule: computeScheduleMetrics(allEvents),

    // 错误统计
    errors: computeErrorMetrics(allEvents),

    // 时间分布
    timing: computeTimingMetrics(allEvents)
  };
}

/**
 * 计算增量指标（与上次快照比较）
 * @param {object} current - 当前快照
 * @param {object} previous - 上次快照
 * @returns {object}
 */
function computeDeltaMetrics(current, previous) {
  if (!previous) return current;

  return {
    timestamp: current.timestamp,
    delta: {
      tasks: {
        total: current.tasks.total - previous.tasks.total,
        completed: current.tasks.completed - previous.tasks.completed,
        failed: current.tasks.failed - previous.tasks.failed
      },
      steps: {
        total: current.steps.total - previous.steps.total,
        completed: current.steps.completed - previous.steps.completed,
        failed: current.steps.failed - previous.steps.failed
      },
      errors: {
        total: current.errors.total - previous.errors.total
      }
    }
  };
}

module.exports = {
  computeMetricsSnapshot,
  computeDeltaMetrics,
  computeTaskMetrics,
  computeStepMetrics,
  computePluginMetrics,
  computeScheduleMetrics,
  computeErrorMetrics,
  computeTimingMetrics,
  computeBasicStats,
  computePercentile,
  filterByType,
  filterByPrefix
};