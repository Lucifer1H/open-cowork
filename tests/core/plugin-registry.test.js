const test = require('node:test');
const assert = require('node:assert/strict');

const { PluginRegistry } = require('../../src/core/plugin-registry.cjs');

const refactorPlugin = {
  id: 'refactor',
  canHandle: (task) => task.includes('refactor'),
  plan: () => ({ steps: [] }),
  run: async () => ({ ok: true }),
  verify: async () => ({ ok: true })
};

const bugfixPlugin = {
  id: 'bugfix',
  canHandle: (task) => task.includes('fix'),
  plan: () => ({ steps: [] }),
  run: async () => ({ ok: true }),
  verify: async () => ({ ok: true })
};

test('PluginRegistry returns matching plugins in priority order', () => {
  const registry = new PluginRegistry();
  registry.register(refactorPlugin, 20);
  registry.register(bugfixPlugin, 10);

  const matches = registry.match('refactor and fix auth module');
  assert.deepEqual(matches.map((p) => p.id), ['refactor', 'bugfix']);
});
