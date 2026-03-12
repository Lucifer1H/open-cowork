/**
 * 工具模块索引
 */

const { generateId, generateTaskId, generateSessionId, generateJobId, generateStepId } = require('./id.cjs');
const { nowIso, nowMs, duration, durationWithTimestamp, parseDate, toIsoString } = require('./time.cjs');
const { sleep, withTimeout, withRetry, runWithConcurrency, withTimeoutAndRetry, DEFAULT_TIMEOUT_MS, DEFAULT_RETRY_ATTEMPTS, DEFAULT_RETRY_DELAY_MS } = require('./async.cjs');

module.exports = {
  // ID 工具
  generateId,
  generateTaskId,
  generateSessionId,
  generateJobId,
  generateStepId,

  // 时间工具
  nowIso,
  nowMs,
  duration,
  durationWithTimestamp,
  parseDate,
  toIsoString,

  // 异步工具
  sleep,
  withTimeout,
  withRetry,
  runWithConcurrency,
  withTimeoutAndRetry,

  // 常量
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_ATTEMPTS,
  DEFAULT_RETRY_DELAY_MS
};