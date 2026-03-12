/**
 * 执行器模块
 * 提供任务执行、并发控制、超时和重试功能
 */

const { PROFILES } = require('../config/profiles.cjs');
const {
  sleep,
  withTimeout,
  withRetry,
  runWithConcurrency,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_ATTEMPTS
} = require('../utils/async.cjs');
const { duration } = require('../utils/time.cjs');

/**
 * 执行单个步骤
 * @param {object} step - 步骤对象
 * @param {object} plugin - 插件对象
 * @param {object} context - 执行上下文
 * @param {object} options - 执行选项
 * @returns {Promise<object>} - 步骤执行结果
 */
async function executeStep(step, plugin, context, options = {}) {
  const timeout = options.timeout || DEFAULT_TIMEOUT_MS;
  const retryOptions = options.retry || { attempts: DEFAULT_RETRY_ATTEMPTS };

  const stepId = step.id || 'unknown';
  const emit = context.emit || (() => {});

  emit('step.started', { stepId, summary: step.summary });

  const startTime = Date.now();

  try {
    const result = await withRetry(
      async () => {
        if (plugin.executeStep) {
          const stepResult = await withTimeout(
            plugin.executeStep(step, context),
            timeout,
            `Step "${stepId}"`
          );
          if (stepResult && stepResult.ok === false) {
            const error = new Error(stepResult.error || `Step ${stepId} returned failure`);
            error.stepResult = stepResult;
            throw error;
          }
          return stepResult;
        }
        return { ok: true, stepId };
      },
      {
        ...retryOptions,
        shouldRetry: (error, attempt) => {
          emit('step.retry', { stepId, attempt, error: error.message });
          return retryOptions.shouldRetry ? retryOptions.shouldRetry(error, attempt) : true;
        }
      }
    );

    const durationMs = duration(startTime);
    emit('step.completed', { stepId, durationMs, result });

    return { ok: true, stepId, durationMs, result };
  } catch (error) {
    const durationMs = duration(startTime);
    emit('step.failed', { stepId, durationMs, error: error.message });
    return { ok: false, stepId, durationMs, error: error.message };
  }
}

/**
 * 执行计划 - 核心执行函数
 * @param {object} plan - 执行计划 { steps: [...] }
 * @param {object} plugin - 插件对象
 * @param {object} context - 执行上下文
 * @returns {Promise<object>} - 执行结果
 */
async function executePlan(plan, plugin, context = {}) {
  const profile = context.profile || PROFILES.balanced;
  const maxParallel = profile.maxParallelSteps || 1;
  const timeout = context.timeout || DEFAULT_TIMEOUT_MS;
  const retry = context.retry || { attempts: DEFAULT_RETRY_ATTEMPTS };
  const onProgress = context.onProgress || null;

  const steps = plan.steps || [];

  if (steps.length === 0) {
    return { ok: true, results: [], message: 'No steps to execute' };
  }

  const enhancedContext = {
    ...context,
    emit: (type, payload) => {
      if (context.emit) context.emit(type, payload);
      if (onProgress) onProgress({ type, ...payload, timestamp: new Date().toISOString() });
    }
  };

  const results = await runWithConcurrency(
    steps,
    maxParallel,
    (step) => executeStep(step, plugin, enhancedContext, { timeout, retry })
  );

  const failedSteps = results.filter((r) => !r.ok);

  if (failedSteps.length > 0) {
    return {
      ok: false,
      results,
      failedSteps: failedSteps.map((s) => s.stepId),
      reason: `${failedSteps.length} step(s) failed: ${failedSteps.map((s) => s.error).join(', ')}`
    };
  }

  return {
    ok: true,
    results,
    totalDurationMs: results.reduce((sum, r) => sum + (r.durationMs || 0), 0)
  };
}

/**
 * 运行管道 - 执行并验证
 * @param {object} plan - 执行计划
 * @param {Function} run - 执行函数
 * @param {Function} validate - 验证函数
 * @returns {Promise<object>} - 管道结果
 */
async function runPipeline(plan, run, validate) {
  const runResult = await run(plan);
  const verifyResult = await validate(runResult);

  if (!verifyResult.ok) {
    return {
      status: 'needs_fix',
      reason: verifyResult.reason || 'validation failed'
    };
  }

  return { status: 'completed' };
}

module.exports = {
  runPipeline,
  executePlan,
  executeStep,
  runWithConcurrency,
  withTimeout,
  withRetry,
  sleep,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_ATTEMPTS
};