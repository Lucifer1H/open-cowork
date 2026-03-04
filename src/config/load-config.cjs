const fs = require('node:fs');
const path = require('node:path');
const { loadProfile } = require('./profiles.cjs');

function loadCoworkConfig(options = {}) {
  const cwd = options.cwd || process.cwd();
  const file = path.join(cwd, '.opencode', 'cowork.config.json');

  if (!fs.existsSync(file)) {
    return {
      profile: loadProfile(options.profile),
      plugins: {}
    };
  }

  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  return {
    profile: loadProfile(parsed.profile || options.profile),
    plugins: parsed.plugins || {}
  };
}

module.exports = {
  loadCoworkConfig
};
