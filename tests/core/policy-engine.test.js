const test = require('node:test');
const assert = require('node:assert/strict');

const { requiresApproval, annotatePlanRisks } = require('../../src/core/policy-engine.cjs');

test('high-risk step requires approval in balanced policy', () => {
  const required = requiresApproval(
    { id: 'delete.files', risk: 'high' },
    { riskPolicy: 'balanced', approvalToken: null }
  );
  assert.equal(required, true);
});

test('critical step does not require approval when token is provided', () => {
  const required = requiresApproval(
    { id: 'drop.db', risk: 'critical' },
    { riskPolicy: 'safe', approvalToken: 'approved-token' }
  );
  assert.equal(required, false);
});

test('aggressive policy only requires approval for critical risk', () => {
  assert.equal(
    requiresApproval({ id: 'touch.file', risk: 'high' }, { riskPolicy: 'aggressive', approvalToken: null }),
    false
  );
  assert.equal(
    requiresApproval({ id: 'remove.file', risk: 'critical' }, { riskPolicy: 'aggressive', approvalToken: null }),
    true
  );
});

test('annotatePlanRisks defaults missing risk levels to medium', () => {
  const plan = annotatePlanRisks({ steps: [{ id: 's1' }, { id: 's2', risk: 'low' }] });
  assert.equal(plan.steps[0].risk, 'medium');
  assert.equal(plan.steps[1].risk, 'low');
});
