/**
 * 标准事件类型常量
 */
const EVENT_TYPES = {
  // 任务级别事件
  TASK_STARTED: 'task.started',
  TASK_COMPLETED: 'task.completed',
  TASK_FAILED: 'task.failed',

  // 步骤级别事件
  STEP_STARTED: 'step.started',
  STEP_COMPLETED: 'step.completed',
  STEP_FAILED: 'step.failed',
  STEP_RETRY: 'step.retry',

  // 调度事件
  SCHEDULE_TRIGGERED: 'schedule.triggered',
  SCHEDULE_COMPLETED: 'schedule.completed',
  SCHEDULE_FAILED: 'schedule.failed',

  // 审批事件
  APPROVAL_REQUIRED: 'approval.required',
  APPROVAL_GRANTED: 'approval.granted',
  APPROVAL_DENIED: 'approval.denied'
};

/**
 * 创建事件存储
 * @param {object} options - 配置选项
 * @param {number} [options.maxSize] - 最大事件数量（可选，默认无限制）
 * @returns {object} - 事件存储实例
 */
function createEventStore(options = {}) {
  const events = [];
  const maxSize = options.maxSize || null;

  /**
   * 追加事件
   * @param {object} event - 事件对象
   * @param {string} event.type - 事件类型
   * @param {string} [event.taskId] - 任务 ID
   * @param {string} [event.stepId] - 步骤 ID
   * @param {string} [event.timestamp] - 时间戳
   */
  function append(event) {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString()
    };

    events.push(enrichedEvent);

    // 如果设置了最大数量，移除最旧的事件
    if (maxSize && events.length > maxSize) {
      events.shift();
    }
  }

  /**
   * 获取所有事件的副本
   * @returns {Array} - 事件数组
   */
  function all() {
    return events.slice();
  }

  /**
   * 按类型筛选事件
   * @param {string} type - 事件类型
   * @returns {Array} - 匹配的事件数组
   */
  function filter(type) {
    return events.filter((e) => e.type === type);
  }

  /**
   * 按类型前缀筛选事件
   * @param {string} prefix - 类型前缀（如 'step.' 或 'task.'）
   * @returns {Array} - 匹配的事件数组
   */
  function filterByPrefix(prefix) {
    return events.filter((e) => e.type && e.type.startsWith(prefix));
  }

  /**
   * 按任务 ID 查询事件
   * @param {string} taskId - 任务 ID
   * @returns {Array} - 该任务的所有事件
   */
  function findByTask(taskId) {
    return events.filter((e) => e.taskId === taskId);
  }

  /**
   * 按步骤 ID 查询事件
   * @param {string} stepId - 步骤 ID
   * @returns {Array} - 该步骤的所有事件
   */
  function findByStep(stepId) {
    return events.filter((e) => e.stepId === stepId);
  }

  /**
   * 获取最新的事件
   * @param {number} [count=10] - 数量
   * @returns {Array} - 最新的事件数组
   */
  function latest(count = 10) {
    return events.slice(-count);
  }

  /**
   * 获取事件数量
   * @returns {number} - 事件总数
   */
  function count() {
    return events.length;
  }

  /**
   * 按类型统计事件
   * @returns {object} - 类型 -> 数量的映射
   */
  function countByType() {
    const counts = {};
    for (const event of events) {
      const type = event.type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }

  /**
   * 清空所有事件
   */
  function clear() {
    events.length = 0;
  }

  /**
   * 生成事件摘要
   * @returns {object} - 摘要对象
   */
  function summarize() {
    const typeCounts = countByType();

    // 统计任务
    const taskIds = new Set(events.map((e) => e.taskId).filter(Boolean));
    const stepIds = new Set(events.map((e) => e.stepId).filter(Boolean));

    return {
      totalEvents: events.length,
      uniqueTasks: taskIds.size,
      uniqueSteps: stepIds.size,
      byType: typeCounts,
      oldestEvent: events[0]?.timestamp || null,
      newestEvent: events[events.length - 1]?.timestamp || null
    };
  }

  /**
   * 导出为 JSON 字符串
   * @returns {string} - JSON 字符串
   */
  function toJSON() {
    return JSON.stringify(events, null, 2);
  }

  /**
   * 从 JSON 字符串导入
   * @param {string} json - JSON 字符串
   */
  function fromJSON(json) {
    const imported = JSON.parse(json);
    if (Array.isArray(imported)) {
      clear();
      imported.forEach((e) => events.push(e));
    }
  }

  return {
    append,
    all,
    filter,
    filterByPrefix,
    findByTask,
    findByStep,
    latest,
    count,
    countByType,
    clear,
    summarize,
    toJSON,
    fromJSON
  };
}

module.exports = {
  createEventStore,
  EVENT_TYPES
};