const { pollDueJobs } = require('./engine.cjs');

/**
 * 创建调度运行器
 * @param {object} options - 配置选项
 * @param {object} options.scheduleStore - 调度存储实例
 * @param {object} options.eventStore - 事件存储实例
 * @param {function} options.orchestrate - 任务编排函数
 * @param {number} [options.intervalMs] - 轮询间隔（毫秒），默认 60000
 * @returns {object} - 调度运行器实例
 */
function createSchedulerRunner(options) {
  const { scheduleStore, eventStore, orchestrate, intervalMs = 60000 } = options;

  let running = false;
  let intervalId = null;
  let executionCount = 0;

  /**
   * 执行单个调度任务
   * @param {object} job - 调度任务
   * @returns {Promise<object>} - 执行结果
   */
  async function executeJob(job) {
    const jobId = job.id;
    const startTime = Date.now();

    // 发送事件
    if (eventStore) {
      eventStore.append({
        type: 'schedule.triggered',
        jobId,
        jobType: job.type,
        timestamp: new Date().toISOString()
      });
    }

    try {
      // 调用编排器执行任务
      const result = await orchestrate(job.payload);

      const durationMs = Date.now() - startTime;

      // 发送完成事件
      if (eventStore) {
        eventStore.append({
          type: 'schedule.completed',
          jobId,
          durationMs,
          status: result.status
        });
      }

      executionCount++;

      return {
        ok: true,
        jobId,
        durationMs,
        result
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // 发送失败事件
      if (eventStore) {
        eventStore.append({
          type: 'schedule.failed',
          jobId,
          durationMs,
          error: error.message
        });
      }

      return {
        ok: false,
        jobId,
        durationMs,
        error: error.message
      };
    }
  }

  /**
   * 轮询并执行到期任务
   */
  async function tick() {
    if (!running) return;

    try {
      const dueJobs = pollDueJobs(scheduleStore);

      for (const job of dueJobs) {
        await executeJob(job);
      }
    } catch (error) {
      // 记录错误但不停止调度器
      if (eventStore) {
        eventStore.append({
          type: 'schedule.error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * 启动调度器
   * @returns {object} - 启动状态
   */
  function start() {
    if (running) {
      return { ok: false, reason: 'Scheduler is already running' };
    }

    running = true;
    intervalId = setInterval(tick, intervalMs);

    // 立即执行一次检查
    tick().catch(() => {});

    return {
      ok: true,
      message: `Scheduler started with ${intervalMs}ms interval`
    };
  }

  /**
   * 停止调度器
   * @returns {object} - 停止状态
   */
  function stop() {
    if (!running) {
      return { ok: false, reason: 'Scheduler is not running' };
    }

    running = false;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    return {
      ok: true,
      message: 'Scheduler stopped',
      totalExecutions: executionCount
    };
  }

  /**
   * 获取调度器状态
   * @returns {object} - 状态信息
   */
  function status() {
    return {
      running,
      intervalMs,
      executionCount,
      pendingJobs: scheduleStore.all().length
    };
  }

  /**
   * 手动触发检查（用于测试）
   */
  async function triggerNow() {
    return tick();
  }

  return {
    start,
    stop,
    status,
    triggerNow,
    executeJob
  };
}

/**
 * 创建一次性延迟任务
 * @param {object} options - 任务选项
 * @param {string} options.id - 任务 ID
 * @param {number} options.delayMs - 延迟时间（毫秒）
 * @param {object} options.payload - 任务载荷
 * @returns {object} - 任务对象
 */
function createDelayedJob(options) {
  const { id, delayMs, payload } = options;
  const runAt = new Date(Date.now() + delayMs);

  return {
    id,
    type: 'once',
    runAt: runAt.toISOString(),
    payload
  };
}

/**
 * 创建 cron 风格的任务（简化版）
 * 注意：这是一个简化的实现，仅支持基本的时间间隔
 * @param {object} options - 任务选项
 * @param {string} options.id - 任务 ID
 * @param {number} options.everyMs - 间隔时间（毫秒）
 * @param {object} options.payload - 任务载荷
 * @param {Date} [options.startAt] - 开始时间
 * @returns {object} - 任务对象
 */
function createRecurringJob(options) {
  const { id, everyMs, payload, startAt } = options;
  const nextRunAt = startAt || new Date();

  return {
    id,
    type: 'interval',
    everyMs,
    nextRunAt: nextRunAt.toISOString(),
    payload
  };
}

module.exports = {
  createSchedulerRunner,
  createDelayedJob,
  createRecurringJob
};