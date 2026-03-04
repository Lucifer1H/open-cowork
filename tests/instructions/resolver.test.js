const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { resolveInstructionContext } = require('../../src/instructions/resolver.cjs');

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

test('resolveInstructionContext merges global and local rules with local override', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cowork-instructions-'));
  const homeDir = path.join(root, 'home');
  const cwd = path.join(root, 'project');

  const globalFile = path.join(homeDir, '.config', 'opencode', 'cowork.instructions.json');
  const localFile = path.join(cwd, '.opencode', 'cowork.instructions.json');

  writeJson(globalFile, {
    rules: [
      { id: 'style', value: 'concise' },
      { id: 'approval', value: 'strict' }
    ]
  });

  writeJson(localFile, {
    rules: [
      { id: 'style', value: 'verbose' },
      { id: 'language', value: 'zh-CN' }
    ]
  });

  const context = resolveInstructionContext({ cwd, homeDir });

  assert.deepEqual(context.rules, [
    { id: 'style', value: 'verbose' },
    { id: 'approval', value: 'strict' },
    { id: 'language', value: 'zh-CN' }
  ]);
  assert.equal(context.paths.global, globalFile);
  assert.equal(context.paths.local, localFile);
});

test('resolveInstructionContext returns empty rules when files are missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cowork-instructions-empty-'));
  const context = resolveInstructionContext({
    cwd: path.join(root, 'project'),
    homeDir: path.join(root, 'home')
  });

  assert.deepEqual(context.rules, []);
});
