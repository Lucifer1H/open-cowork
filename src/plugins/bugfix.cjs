const bugfixPlugin = {
  id: 'bugfix',
  manifest: {
    name: '@cowork/bugfix',
    version: '1.0.0',
    runtime: '^3',
    capabilities: ['plan', 'run', 'verify']
  },
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
