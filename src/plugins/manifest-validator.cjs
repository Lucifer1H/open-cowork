const { PluginContractError } = require('../core/errors.cjs');

const REQUIRED_MANIFEST_FIELDS = ['name', 'version', 'runtime', 'capabilities'];

function isRuntimeCompatible(requirement, runtimeVersion = '3.0.0-alpha') {
  const major = String(runtimeVersion).split('.')[0];
  const value = String(requirement || '').trim();

  if (!value) {
    return false;
  }

  if (value === major) return true;
  if (value === `${major}.x`) return true;
  if (value === `^${major}`) return true;
  if (value.startsWith(`${major}.`)) return true;
  if (value === `>=${major} <${Number(major) + 1}`) return true;
  if (value === `>=${major}.0.0 <${Number(major) + 1}.0.0`) return true;

  return false;
}

function validatePluginManifest(manifest, runtimeVersion = '3.0.0-alpha') {
  if (!manifest || typeof manifest !== 'object') {
    throw new PluginContractError('Plugin manifest must be an object.');
  }

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!(field in manifest)) {
      throw new PluginContractError(`Plugin is missing required manifest field: ${field}`);
    }
  }

  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
    throw new PluginContractError('Plugin manifest capabilities must be a non-empty array.');
  }

  if (!isRuntimeCompatible(manifest.runtime, runtimeVersion)) {
    throw new PluginContractError(
      `Plugin manifest declares incompatible runtime: ${manifest.runtime} (current: ${runtimeVersion})`
    );
  }

  return manifest;
}

module.exports = {
  REQUIRED_MANIFEST_FIELDS,
  isRuntimeCompatible,
  validatePluginManifest
};
