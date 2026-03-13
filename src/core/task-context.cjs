/**
 * 任务上下文模块
 */

const { generateTaskId } = require('../utils/id.cjs');
const { nowIso } = require('../utils/time.cjs');
const { PROFILES } = require('../config/profiles.cjs');

/**
 * 创建任务上下文
 * @param {string} task - 任务描述
 * @param {object} options - 配置选项
 * @returns {object} - 任务上下文对象
 */
function createTaskContext(task, options = {}) {
  const taskId = options.taskId || generateTaskId();
  const cwd = options.cwd || process.cwd();

  let profile = options.profile || PROFILES.balanced;
  if (typeof profile === 'string') {
    profile = PROFILES[profile] || PROFILES.balanced;
  }

  const metadata = options.metadata || {};
  const eventStore = options.eventStore || null;
  const instructions = options.instructions || { globalRules: [], localRules: [], rules: [] };
  const runtime = options.runtime || null;

  function emit(type, payload = {}) {
    if (eventStore && typeof eventStore.append === 'function') {
      eventStore.append({
        type,
        taskId,
        timestamp: nowIso(),
        ...payload
      });
    }
  }

  function report(message, level = 'info') {
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✓';
    process.stdout.write(`[${nowIso()}] [${taskId}] ${prefix} ${message}\n`);
  }

  function createChildContext(extraOptions = {}) {
    return createTaskContext(task, {
      taskId,
      cwd,
      profile,
      metadata: { ...metadata, ...extraOptions.metadata },
      eventStore,
      instructions,
      runtime,
      ...extraOptions
    });
  }

  return {
    task,
    taskId,
    cwd,
    profile,
    metadata,
    instructions,
    runtime,
    emit,
    report,
    createChildContext
  };
}

/**
 * 合并上下文选项
 */
function mergeContextOptions(baseContext, extraOptions = {}) {
  return {
    ...baseContext,
    ...extraOptions,
    metadata: { ...baseContext.metadata, ...extraOptions.metadata }
  };
}

module.exports = {
  createTaskContext,
  generateTaskId,
  mergeContextOptions
};