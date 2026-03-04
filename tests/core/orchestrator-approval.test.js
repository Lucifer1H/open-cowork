const test = require('node:test');
const assert = require('node:assert/strict');

const { runTask } = require('../../src/core/orchestrator.cjs');

test('plan_only returns waiting_approval without execution', async () => {
  let executed = false;

  const result = await runTask(
    { task: 'delete logs', mode: 'plan_only', riskPolicy: 'balanced' },
    {
      plan: () => ({ steps: [{ id: 's1', risk: 'high' }] }),
      execute: async () => {
        executed = true;
        return { ok: true };
      }
    }
  );

  assert.equal(result.status, 'waiting_approval');
  assert.equal(result.approvalRequired, true);
  assert.equal(executed, false);
});

test('high-risk execute without token is blocked for approval', async () => {
  const result = await runTask(
    { task: 'delete logs', mode: 'execute', riskPolicy: 'balanced' },
    {
      plan: () => ({ steps: [{ id: 's1', risk: 'high' }] })
    }
  );

  assert.equal(result.status, 'waiting_approval');
  assert.equal(result.approvalRequired, true);
});

test('high-risk execute with approval token runs to completion', async () => {
  let executed = false;

  const result = await runTask(
    {
      task: 'delete logs',
      mode: 'execute',
      riskPolicy: 'balanced',
      approvalToken: 'approved-token'
    },
    {
      plan: () => ({ steps: [{ id: 's1', risk: 'high' }] }),
      execute: async () => {
        executed = true;
        return { ok: true };
      },
      verify: async () => ({ ok: true })
    }
  );

  assert.equal(result.status, 'completed');
  assert.equal(result.approvalRequired, false);
  assert.equal(executed, true);
});
