/**
 * ID 生成工具
 * 统一的 ID 生成函数，避免重复实现
 */

const { randomUUID } = require('crypto');

/**
 * 生成唯一 ID
 * @param {string} prefix - ID 前缀（如 'task', 'session', 'job'）
 * @returns {string} - 格式: {prefix}_{timestamp}_{random}
 */
function generateId(prefix = 'id') {
  const timestamp = Date.now().toString(36);
  const random = randomUUID().split('-')[0];
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 生成任务 ID
 * @returns {string}
 */
function generateTaskId() {
  return generateId('task');
}

/**
 * 生成会话 ID
 * @returns {string}
 */
function generateSessionId() {
  return generateId('session');
}

/**
 * 生成作业 ID
 * @returns {string}
 */
function generateJobId() {
  return generateId('job');
}

/**
 * 生成步骤 ID
 * @param {string} pluginId - 插件 ID
 * @param {string} stepName - 步骤名称
 * @returns {string}
 */
function generateStepId(pluginId, stepName) {
  return `${pluginId}.${stepName}`;
}

module.exports = {
  generateId,
  generateTaskId,
  generateSessionId,
  generateJobId,
  generateStepId
};