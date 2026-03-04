const bugfixPlugin = {
  id: 'bugfix',
  canHandle: (task) => /fix|bug|issue|failure|flaky/i.test(task),
  plan: () => ({
    steps: [{ id: 'bugfix.reproduce', summary: 'Reproduce issue and identify root cause.' }]
  }),
  run: async () => ({ ok: true }),
  verify: async () => ({ ok: true })
};

module.exports = {
  bugfixPlugin
};
