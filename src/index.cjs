const { PluginRegistry } = require('./core/plugin-registry.cjs');
const { createPlanner } = require('./core/planner.cjs');
const { createTaskContext } = require('./core/task-context.cjs');
const { runPipeline, executePlan } = require('./core/executor.cjs');
const { validateResult } = require('./core/validator.cjs');
const { createReporter } = require('./core/reporter.cjs');
const { runTask } = require('./core/orchestrator.cjs');
const { BUILTIN_PLUGINS } = require('./plugins/index.cjs');
const { loadCoworkConfig } = require('./config/load-config.cjs');
const { createTaskRequest, RISK_LEVELS, MODES, RISK_POLICIES } = require('./core/models.cjs');
const { createTaskSession, ALLOWED_TRANSITIONS } = require('./core/task-session.cjs');
const { requiresApproval, annotatePlanRisks, POLICY_THRESHOLDS } = require('./core/policy-engine.cjs');
const { createScheduleStore, createOnceJob, createIntervalJob, pollDueJobs } = require('./scheduler/engine.cjs');
const { createSchedulerRunner, createDelayedJob, createRecurringJob } = require('./scheduler/runner.cjs');
const { resolveInstructionContext } = require('./instructions/resolver.cjs');
const { createEventStore, EVENT_TYPES } = require('./observability/event-store.cjs');
const { computeMetricsSnapshot } = require('./observability/metrics.cjs');
const { createSessionStore } = require('./session/store.cjs');
const { createSessionManager, SESSION_STATUS, TASK_STATUS } = require('./session/manager.cjs');
const { createToolInspector } = require('./tools/inspector.cjs');
const { createOutputParser } = require('./tools/output-parser.cjs');

function createCoworkRuntime(options = {}) {
  const registry = new PluginRegistry();
  const config = loadCoworkConfig({ cwd: options.cwd, profile: options.profile, homeDir: options.homeDir });
  const scheduleStore = createScheduleStore();
  const eventStore = createEventStore();
  const sessionStore = createSessionStore({ storagePath: options.sessionStoragePath });

  for (const plugin of BUILTIN_PLUGINS) {
    const enabled = config.plugins[plugin.id];
    if (enabled !== false) {
      registry.register(plugin, 10);
    }
  }

  function plan(task, context = {}) {
    const planner = createPlanner(registry.all());
    return planner.plan(task, context);
  }

  async function orchestrate(requestInput) {
    const startedAt = Date.now();

    // 发送任务开始事件
    const taskId = requestInput.taskId || `task_${Date.now()}`;
    eventStore.append({
      type: 'task.started',
      taskId,
      task: requestInput.task,
      timestamp: new Date().toISOString()
    });

    const outcome = await runTask(requestInput, {
      plan,
      execute: async (executionPlan, request) => {
        const pluginId = executionPlan.pluginId;
        const plugin = registry.all().find((candidate) => candidate.id === pluginId);
        if (!plugin) {
          return { ok: true };
        }
        return plugin.run(executionPlan, request);
      },
      verify: async (runResult) => ({ ok: runResult.ok !== false })
    });

    const durationMs = Date.now() - startedAt;
    const type = outcome.status === 'completed' ? 'task.completed' : 'task.failed';
    eventStore.append({ type, taskId, durationMs, status: outcome.status });

    return outcome;
  }

  // 创建调度运行器
  const schedulerRunner = createSchedulerRunner({
    scheduleStore,
    eventStore,
    orchestrate,
    intervalMs: options.schedulerInterval || 60000
  });

  // 创建会话管理器
  const sessionManager = createSessionManager({
    store: sessionStore,
    eventStore,
    orchestrate
  });

  // 创建工具检查器
  const toolInspector = createToolInspector();

  // 创建输出解析器
  const outputParser = createOutputParser();

  return {
    version: '3.0.0-alpha',
    registry,
    config,
    scheduleStore,
    eventStore,
    sessionStore,
    plan,
    orchestrate,
    createTaskContext,
    createTaskRequest,
    createTaskSession,
    requiresApproval,
    annotatePlanRisks,
    runPipeline,
    executePlan,
    validateResult,
    createReporter,
    createOnceJob,
    createIntervalJob,
    pollDueJobs,
    resolveInstructionContext,
    computeMetricsSnapshot,
    // 调度功能
    scheduler: {
      start: () => schedulerRunner.start(),
      stop: () => schedulerRunner.stop(),
      status: () => schedulerRunner.status(),
      triggerNow: () => schedulerRunner.triggerNow(),
      addJob: (job) => scheduleStore.add(job),
      removeJob: (id) => scheduleStore.remove(id),
      listJobs: () => scheduleStore.all()
    },
    // 会话管理
    session: {
      create: (opts) => sessionManager.create(opts),
      get: (id) => sessionManager.get(id),
      list: (filter) => sessionManager.list(filter),
      pause: (id) => sessionManager.pause(id),
      resume: (id) => sessionManager.resume(id),
      complete: (id, result) => sessionManager.complete(id, result),
      fail: (id, reason) => sessionManager.fail(id, reason),
      addTask: (sessionId, taskOpts) => sessionManager.addTask(sessionId, taskOpts),
      updateTask: (sessionId, taskId, status, result) => sessionManager.updateTask(sessionId, taskId, status, result),
      executeNextTask: (sessionId) => sessionManager.executeNextTask(sessionId),
      getHistory: (sessionId) => sessionManager.getHistory(sessionId)
    },
    // 工具检查
    tools: {
      inspect: (toolName, output) => toolInspector.parseOutput(toolName, output),
      extractErrors: (output) => toolInspector.extractErrors(output),
      suggestFix: (error) => toolInspector.suggestFix(error),
      validateResult: (toolName, expected, actual) => toolInspector.validateResult(toolName, expected, actual),
      formatReport: (result) => toolInspector.formatReport(result),
      parseOutput: (output) => outputParser.autoParse(output),
      parseJSON: (output) => outputParser.parseJSON(output),
      parseLines: (output, opts) => outputParser.parseLines(output, opts),
      parseTable: (output, opts) => outputParser.parseTable(output, opts)
    },
    // 事件类型常量
    EVENT_TYPES,
    // 会话状态常量
    SESSION_STATUS,
    TASK_STATUS
  };
}

module.exports = {
  createCoworkRuntime,
  PluginRegistry,
  createPlanner,
  createTaskContext,
  createTaskRequest,
  createTaskSession,
  requiresApproval,
  annotatePlanRisks,
  runTask,
  runPipeline,
  executePlan,
  validateResult,
  createReporter,
  BUILTIN_PLUGINS,
  RISK_LEVELS,
  MODES,
  RISK_POLICIES,
  ALLOWED_TRANSITIONS,
  POLICY_THRESHOLDS,
  createScheduleStore,
  createOnceJob,
  createIntervalJob,
  pollDueJobs,
  createSchedulerRunner,
  createDelayedJob,
  createRecurringJob,
  resolveInstructionContext,
  createEventStore,
  EVENT_TYPES,
  computeMetricsSnapshot,
  // 新增导出
  createSessionStore,
  createSessionManager,
  SESSION_STATUS,
  TASK_STATUS,
  createToolInspector,
  createOutputParser
};