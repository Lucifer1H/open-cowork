const test = require('node:test');
const assert = require('node:assert/strict');

const { createTaskRequest, RISK_LEVELS } = require('../../src/core/models.cjs');

test('createTaskRequest normalizes defaults', () => {
  const request = createTaskRequest({ task: 'refactor auth module' });

  assert.equal(request.task, 'refactor auth module');
  assert.equal(request.mode, 'execute');
  assert.equal(request.approvalToken, null);
  assert.equal(request.riskPolicy, 'balanced');
  assert.deepEqual(request.metadata, {});
  assert.deepEqual(RISK_LEVELS, ['low', 'medium', 'high', 'critical']);
});

test('createTaskRequest preserves explicit options', () => {
  const request = createTaskRequest({
    task: 'delete old files',
    mode: 'plan_only',
    approvalToken: 'token-123',
    riskPolicy: 'safe',
    metadata: { source: 'test' }
  });

  assert.equal(request.mode, 'plan_only');
  assert.equal(request.approvalToken, 'token-123');
  assert.equal(request.riskPolicy, 'safe');
  assert.deepEqual(request.metadata, { source: 'test' });
});
