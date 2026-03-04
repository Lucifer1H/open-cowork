const test = require('node:test');
const assert = require('node:assert/strict');

const { runPipeline } = require('../../src/core/executor.cjs');

test('pipeline does not return completed when validator fails', async () => {
  const result = await runPipeline(
    { steps: [{ id: 's1', summary: 'run' }] },
    async () => ({ ok: true }),
    async () => ({ ok: false, reason: 'checks failed' })
  );

  assert.equal(result.status, 'needs_fix');
  assert.equal(result.reason, 'checks failed');
});

test('pipeline returns completed when validator passes', async () => {
  const result = await runPipeline(
    { steps: [{ id: 's1', summary: 'run' }] },
    async () => ({ ok: true }),
    async () => ({ ok: true })
  );

  assert.equal(result.status, 'completed');
});
