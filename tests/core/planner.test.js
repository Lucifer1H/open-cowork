const test = require('node:test');
const assert = require('node:assert/strict');

const { createPlanner } = require('../../src/core/planner.cjs');

const plugin = {
  id: 'docgen',
  canHandle: () => true,
  plan: () => ({ steps: [{ id: 's1', summary: 'generate docs' }] }),
  run: async () => ({ ok: true }),
  verify: async () => ({ ok: true })
};

test('planner uses fallback when no plugin matches', () => {
  const planner = createPlanner([]);
  const plan = planner.plan('unknown task');

  assert.equal(plan.mode, 'fallback');
  assert.equal(plan.pluginId, 'fallback.generic');
});

test('planner uses plugin plan when matched', () => {
  const planner = createPlanner([plugin]);
  const plan = planner.plan('anything');

  assert.equal(plan.mode, 'plugin');
  assert.equal(plan.pluginId, 'docgen');
  assert.equal(plan.steps.length, 1);
});
