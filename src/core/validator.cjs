async function validateResult(plugin, runResult, context = {}) {
  const result = await plugin.verify(runResult, context);
  return result;
}

module.exports = {
  validateResult
};
