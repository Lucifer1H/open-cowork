const { PluginRegistry } = require('./core/plugin-registry.cjs');

function createCoworkRuntime() {
  const registry = new PluginRegistry();
  return {
    version: '3.0.0-alpha',
    registry
  };
}

module.exports = {
  createCoworkRuntime,
  PluginRegistry
};
