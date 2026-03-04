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

function createCoworkRuntime(options = {}) {
  const registry = new PluginRegistry();
  const config = loadCoworkConfig({ cwd: options.cwd, profile: options.profile });

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
    return runTask(requestInput, {
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
  }

  return {
    version: '3.0.0-alpha',
    registry,
    config,
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
    createReporter
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
  POLICY_THRESHOLDS
};
