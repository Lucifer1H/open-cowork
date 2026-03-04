const { PluginRegistry } = require('./core/plugin-registry.cjs');
const { createPlanner } = require('./core/planner.cjs');
const { createTaskContext } = require('./core/task-context.cjs');

function createCoworkRuntime() {
  const registry = new PluginRegistry();
  const planner = createPlanner(registry.all());

  return {
    version: '3.0.0-alpha',
    registry,
    planner,
    createTaskContext
  };
}

module.exports = {
  createCoworkRuntime,
  PluginRegistry,
  createPlanner,
  createTaskContext
};
