/**
 * 会话类型定义
 */

const { generateSessionId: genSessionId, generateTaskId: genTaskId } = require('../utils/id.cjs');
const { nowIso } = require('../utils/time.cjs');

/**
 * @typedef {Object} Session
 * @property {string} id - 会话唯一标识
 * @property {string} status - 会话状态 (active|paused|completed|failed)
 * @property {string} task - 会话主任务描述
 * @property {Array<Task>} tasks - 任务列表
 * @property {object} context - 会话上下文
 * @property {string} createdAt - 创建时间 (ISO字符串)
 * @property {string} updatedAt - 更新时间 (ISO字符串)
 * @property {string} [completedAt] - 完成时间
 * @property {object} [result] - 最终结果
 */

/**
 * @typedef {Object} Task
 * @property {string} id - 任务ID
 * @property {string} description - 任务描述
 * @property {string} status - 任务状态 (pending|running|completed|failed)
 * @property {string} [pluginId] - 处理的插件ID
 * @property {object} [result] - 任务结果
 * @property {string} createdAt - 创建时间
 * @property {string} [completedAt] - 完成时间
 */

/**
 * 会话状态枚举
 */
const SESSION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * 任务状态枚举
 */
const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * 有效状态转换
 */
const SESSION_TRANSITIONS = {
  active: ['paused', 'completed', 'failed'],
  paused: ['active', 'completed', 'failed'],
  completed: [],
  failed: []
};

/**
 * 创建新会话
 * @param {object} options - 会话选项
 * @param {string} [options.id] - 会话ID
 * @param {string} options.task - 主任务描述
 * @param {object} [options.context] - 会话上下文
 * @returns {object} - 会话对象
 */
function createSession(options = {}) {
  const { id, task, context = {} } = options;
  const timestamp = nowIso();

  return {
    id: id || genSessionId(),
    status: SESSION_STATUS.ACTIVE,
    task: task || '',
    tasks: [],
    context,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

/**
 * 创建任务
 * @param {object} options - 任务选项
 * @param {string} options.description - 任务描述
 * @param {string} [options.pluginId] - 插件ID
 * @returns {object} - 任务对象
 */
function createTask(options = {}) {
  const { description, pluginId } = options;

  return {
    id: genTaskId(),
    description: description || '',
    status: TASK_STATUS.PENDING,
    pluginId: pluginId || null,
    createdAt: nowIso()
  };
}

/**
 * 验证状态转换是否有效
 * @param {string} currentStatus - 当前状态
 * @param {string} newStatus - 新状态
 * @returns {boolean}
 */
function isValidTransition(currentStatus, newStatus) {
  const allowed = SESSION_TRANSITIONS[currentStatus];
  return allowed && allowed.includes(newStatus);
}

module.exports = {
  SESSION_STATUS,
  TASK_STATUS,
  SESSION_TRANSITIONS,
  createSession,
  createTask,
  isValidTransition
};