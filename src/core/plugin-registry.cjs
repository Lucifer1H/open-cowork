const { PluginContractError } = require('./errors.cjs');
const { validatePluginManifest } = require('../plugins/manifest-validator.cjs');

class PluginRegistry {
  constructor(runtimeVersion = '3.0.0-alpha') {
    this.items = [];
    this.runtimeVersion = runtimeVersion;
  }

  register(plugin, priority = 0) {
    validatePlugin(plugin, this.runtimeVersion);
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

function validatePlugin(plugin, runtimeVersion) {
  if (!plugin || typeof plugin !== 'object') {
    throw new PluginContractError('Plugin must be an object.');
  }

  const requiredFields = ['id', 'manifest', 'canHandle', 'plan', 'run', 'verify'];
  for (const field of requiredFields) {
    if (!(field in plugin)) {
      throw new PluginContractError(`Plugin is missing required field: ${field}`);
    }
  }

  if (typeof plugin.id !== 'string' || plugin.id.trim().length === 0) {
    throw new PluginContractError('Plugin id must be a non-empty string.');
  }

  validatePluginManifest(plugin.manifest, runtimeVersion);

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
