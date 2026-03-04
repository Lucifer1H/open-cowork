const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
const MODES = ['execute', 'plan_only'];
const RISK_POLICIES = ['safe', 'balanced', 'aggressive'];

function createTaskRequest(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Task request input must be an object.');
  }

  if (!input.task || typeof input.task !== 'string') {
    throw new Error('Task request must include a non-empty task string.');
  }

  const mode = MODES.includes(input.mode) ? input.mode : 'execute';
  const riskPolicy = RISK_POLICIES.includes(input.riskPolicy) ? input.riskPolicy : 'balanced';

  return {
    task: input.task,
    mode,
    approvalToken: input.approvalToken || null,
    riskPolicy,
    metadata: input.metadata || {}
  };
}

module.exports = {
  RISK_LEVELS,
  MODES,
  RISK_POLICIES,
  createTaskRequest
};
