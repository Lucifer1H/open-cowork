const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function readRules(file) {
  if (!fs.existsSync(file)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!parsed || !Array.isArray(parsed.rules)) {
    return [];
  }

  return parsed.rules.filter((item) => item && typeof item.id === 'string');
}

function resolveInstructionContext(options = {}) {
  const cwd = options.cwd || process.cwd();
  const homeDir = options.homeDir || os.homedir();

  const globalFile = path.join(homeDir, '.config', 'opencode', 'cowork.instructions.json');
  const localFile = path.join(cwd, '.opencode', 'cowork.instructions.json');

  const globalRules = readRules(globalFile);
  const localRules = readRules(localFile);

  const merged = new Map();
  for (const rule of globalRules) {
    merged.set(rule.id, rule);
  }
  for (const rule of localRules) {
    merged.set(rule.id, rule);
  }

  return {
    paths: {
      global: globalFile,
      local: localFile
    },
    globalRules,
    localRules,
    rules: Array.from(merged.values())
  };
}

module.exports = {
  resolveInstructionContext
};
