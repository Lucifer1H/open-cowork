const { createTaskRequest } = require('./models.cjs');
const { createTaskSession } = require('./task-session.cjs');
const { requiresApproval, annotatePlanRisks } = require('./policy-engine.cjs');

async function runTask(requestInput, dependencies = {}) {
  const request = createTaskRequest(requestInput);
  const session = createTaskSession();

  session.transition('planned');

  const planBuilder = dependencies.plan || (() => ({ steps: [] }));
  const rawPlan = planBuilder(request.task, request);
  const plan = annotatePlanRisks(rawPlan || { steps: [] });

  if (request.mode === 'plan_only') {
    session.transition('waiting_approval');
    return {
      status: session.state(),
      approvalRequired: true,
      plan,
      request
    };
  }

  const approvalRequired = plan.steps.some((step) => requiresApproval(step, request));
  if (approvalRequired) {
    session.transition('waiting_approval');
    return {
      status: session.state(),
      approvalRequired: true,
      plan,
      request
    };
  }

  session.transition('approved');
  session.transition('running');

  const execute = dependencies.execute || (async () => ({ ok: true }));
  const verify = dependencies.verify || (async () => ({ ok: true }));

  const runResult = await execute(plan, request);

  session.transition('verifying');
  const verifyResult = await verify(runResult, request);

  if (!verifyResult.ok) {
    session.transition('failed');
    return {
      status: session.state(),
      approvalRequired: false,
      plan,
      request,
      reason: verifyResult.reason || 'verification failed'
    };
  }

  session.transition('completed');
  return {
    status: session.state(),
    approvalRequired: false,
    plan,
    request
  };
}

module.exports = {
  runTask
};
