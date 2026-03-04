const fs = require('node:fs');
const path = require('node:path');
const { loadProfile } = require('./profiles.cjs');
const { resolveInstructionContext } = require('../instructions/resolver.cjs');

function loadCoworkConfig(options = {}) {
  const cwd = options.cwd || process.cwd();
  const file = path.join(cwd, '.opencode', 'cowork.config.json');

  const base = {
    profile: loadProfile(options.profile),
    plugins: {},
    instructions: resolveInstructionContext({ cwd, homeDir: options.homeDir })
  };

  if (!fs.existsSync(file)) {
    return base;
  }

  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  return {
    ...base,
    profile: loadProfile(parsed.profile || options.profile),
    plugins: parsed.plugins || {}
  };
}

module.exports = {
  loadCoworkConfig
};
