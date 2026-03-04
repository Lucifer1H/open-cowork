function createTaskContext(task, options = {}) {
  return {
    task,
    cwd: options.cwd || process.cwd(),
    profile: options.profile || 'balanced',
    metadata: options.metadata || {}
  };
}

module.exports = {
  createTaskContext
};
