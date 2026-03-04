const { RISK_LEVELS } = require('./models.cjs');

const POLICY_THRESHOLDS = {
  safe: 'medium',
  balanced: 'high',
  aggressive: 'critical'
};

function riskRank(level) {
  return RISK_LEVELS.indexOf(level);
}

function requiresApproval(step, request) {
  if (request.approvalToken) {
    return false;
  }

  const policy = POLICY_THRESHOLDS[request.riskPolicy] ? request.riskPolicy : 'balanced';
  const threshold = POLICY_THRESHOLDS[policy];

  return riskRank(step.risk) >= riskRank(threshold);
}

function annotatePlanRisks(plan) {
  return {
    ...plan,
    steps: (plan.steps || []).map((step) => {
      const risk = RISK_LEVELS.includes(step.risk) ? step.risk : 'medium';
      return { ...step, risk };
    })
  };
}

module.exports = {
  POLICY_THRESHOLDS,
  requiresApproval,
  annotatePlanRisks
};
