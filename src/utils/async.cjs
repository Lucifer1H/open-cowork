/**
 * 异步工具函数
 * 统一超时、重试、休眠等异步操作
 */

/**
 * 默认配置
 */
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * 异步休眠
 * @param {number} ms - 休眠时间（毫秒）
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带超时的 Promise 执行
 * @param {Promise} promise - 要执行的 Promise
 * @param {number} timeoutMs - 超时时间（毫秒）
 * @param {string} [context] - 上下文描述（用于错误信息）
 * @returns {Promise}
 */
async function withTimeout(promise, timeoutMs, context = 'operation') {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${context} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * 指数退避重试
 * @param {Function} fn - 要执行的异步函数
 * @param {object} options - 重试选项
 * @param {number} [options.attempts] - 最大尝试次数
 * @param {number} [options.baseDelay] - 基础延迟（毫秒）
 * @param {function} [options.shouldRetry] - 是否重试的判断函数 (error, attempt) => boolean
 * @returns {Promise}
 */
async function withRetry(fn, options = {}) {
  const attempts = options.attempts || DEFAULT_RETRY_ATTEMPTS;
  const baseDelay = options.baseDelay || DEFAULT_RETRY_DELAY_MS;
  const shouldRetry = options.shouldRetry || (() => true);

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      // 指数退避: delay = baseDelay * 2^(attempt-1)
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * 并发执行控制
 * @param {Array} items - 要处理的项目数组
 * @param {number} concurrency - 最大并发数
 * @param {Function} handler - 处理函数 (item, index) => Promise
 * @returns {Promise<Array>} - 所有处理结果
 */
async function runWithConcurrency(items, concurrency, handler) {
  if (!items || items.length === 0) {
    return [];
  }

  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await handler(items[index], index);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  const workers = Array(workerCount).fill(null).map(() => worker());

  await Promise.all(workers);
  return results;
}

/**
 * 带超时和重试的执行
 * @param {Function} fn - 要执行的函数
 * @param {object} options - 选项
 * @param {number} [options.timeout] - 超时时间
 * @param {number} [options.attempts] - 重试次数
 * @param {number} [options.baseDelay] - 重试基础延迟
 * @param {string} [options.context] - 上下文描述
 * @returns {Promise}
 */
async function withTimeoutAndRetry(fn, options = {}) {
  return withRetry(
    () => withTimeout(fn(), options.timeout, options.context),
    {
      attempts: options.attempts,
      baseDelay: options.baseDelay
    }
  );
}

module.exports = {
  sleep,
  withTimeout,
  withRetry,
  runWithConcurrency,
  withTimeoutAndRetry,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_ATTEMPTS,
  DEFAULT_RETRY_DELAY_MS
};