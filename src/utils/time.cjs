/**
 * 时间工具函数
 * 统一时间戳生成，避免散落各处
 */

/**
 * 获取当前 ISO 格式时间戳
 * @returns {string}
 */
function nowIso() {
  return new Date().toISOString();
}

/**
 * 获取当前毫秒时间戳
 * @returns {number}
 */
function nowMs() {
  return Date.now();
}

/**
 * 计算持续时间
 * @param {number} startMs - 开始时间（毫秒）
 * @returns {number} - 持续时间（毫秒）
 */
function duration(startMs) {
  return Date.now() - startMs;
}

/**
 * 计算持续时间并返回 ISO 时间戳
 * @param {number} startMs - 开始时间（毫秒）
 * @returns {{ durationMs: number, endIso: string }}
 */
function durationWithTimestamp(startMs) {
  return {
    durationMs: Date.now() - startMs,
    endIso: new Date().toISOString()
  };
}

/**
 * 解析时间为 Date 对象
 * @param {string|Date|number} value - 时间值
 * @returns {Date}
 */
function parseDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return new Date(value);
}

/**
 * 转换为 ISO 字符串
 * @param {string|Date|number} value - 时间值
 * @returns {string}
 */
function toIsoString(value) {
  return parseDate(value).toISOString();
}

module.exports = {
  nowIso,
  nowMs,
  duration,
  durationWithTimestamp,
  parseDate,
  toIsoString
};