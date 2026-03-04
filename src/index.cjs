const { PluginRegistry } = require('./core/plugin-registry.cjs');
const { createPlanner } = require('./core/planner.cjs');
const { createTaskContext } = require('./core/task-context.cjs');
const { runPipeline, executePlan } = require('./core/executor.cjs');
const { validateResult } = require('./core/validator.cjs');
const { createReporter } = require('./core/reporter.cjs');

function createCoworkRuntime() {
  const registry = new PluginRegistry();

  function plan(task, context = {}) {
    const planner = createPlanner(registry.all());
    return planner.plan(task, context);
  }

  return {
    version: '3.0.0-alpha',
    registry,
    plan,
    createTaskContext,
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
  runPipeline,
  executePlan,
  validateResult,
  createReporter
};
