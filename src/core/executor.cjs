async function runPipeline(plan, run, validate) {
  const runResult = await run(plan);
  const verifyResult = await validate(runResult);

  if (!verifyResult.ok) {
    return {
      status: 'needs_fix',
      reason: verifyResult.reason || 'validation failed'
    };
  }

  return {
    status: 'completed'
  };
}

async function executePlan(plan, plugin, context = {}) {
  return plugin.run(plan, context);
}

module.exports = {
  runPipeline,
  executePlan
};
