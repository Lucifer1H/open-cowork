const { PluginContractError } = require('./errors.cjs');

class PluginRegistry {
  constructor() {
    this.items = [];
  }

  register(plugin, priority = 0) {
    validatePlugin(plugin);
    this.items.push({ plugin, priority });
    this.items.sort((a, b) => b.priority - a.priority);
  }

  match(task) {
    return this.items
      .filter(({ plugin }) => plugin.canHandle(task))
      .map(({ plugin }) => plugin);
  }

  all() {
    return this.items.map(({ plugin }) => plugin);
  }
}

function validatePlugin(plugin) {
  if (!plugin || typeof plugin !== 'object') {
    throw new PluginContractError('Plugin must be an object.');
  }

  const requiredFields = ['id', 'canHandle', 'plan', 'run', 'verify'];
  for (const field of requiredFields) {
    if (!(field in plugin)) {
      throw new PluginContractError(`Plugin is missing required field: ${field}`);
    }
  }

  if (typeof plugin.id !== 'string' || plugin.id.trim().length === 0) {
    throw new PluginContractError('Plugin id must be a non-empty string.');
  }

  const requiredFunctions = ['canHandle', 'plan', 'run', 'verify'];
  for (const field of requiredFunctions) {
    if (typeof plugin[field] !== 'function') {
      throw new PluginContractError(`Plugin field must be a function: ${field}`);
    }
  }
}

module.exports = {
  PluginRegistry
};
