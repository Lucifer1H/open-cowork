const test = require('node:test');
const assert = require('node:assert/strict');

const { PluginRegistry } = require('../../src/core/plugin-registry.cjs');

const refactorPlugin = {
  id: 'refactor',
  manifest: {
    name: '@tests/refactor',
    version: '1.0.0',
    runtime: '^3',
    capabilities: ['plan', 'run', 'verify']
  },
  canHandle: (task) => task.includes('refactor'),
  plan: () => ({ steps: [] }),
  run: async () => ({ ok: true }),
  verify: async () => ({ ok: true })
};

const bugfixPlugin = {
  id: 'bugfix',
  manifest: {
    name: '@tests/bugfix',
    version: '1.0.0',
    runtime: '^3',
    capabilities: ['plan', 'run', 'verify']
  },
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
