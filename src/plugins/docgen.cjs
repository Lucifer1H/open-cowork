const docgenPlugin = {
  id: 'docgen',
  manifest: {
    name: '@cowork/docgen',
    version: '1.0.0',
    runtime: '^3',
    capabilities: ['plan', 'run', 'verify']
  },
  canHandle: (task) => /document|documentation|readme|api doc|docs/i.test(task),
  plan: () => ({
    steps: [{ id: 'docgen.scan', summary: 'Scan source and generate structured documentation draft.' }]
  }),
  run: async () => ({ ok: true }),
  verify: async () => ({ ok: true })
};

module.exports = {
  docgenPlugin
};
