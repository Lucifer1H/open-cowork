const migrationPlugin = {
  id: 'migration',
  manifest: {
    name: '@cowork/migration',
    version: '1.0.0',
    runtime: '^3',
    capabilities: ['plan', 'run', 'verify']
  },
  canHandle: (task) => /migrate|migration|upgrade|convert/i.test(task),
  plan: () => ({
    steps: [{ id: 'migration.map', summary: 'Map source and target states for migration.' }]
  }),
  run: async () => ({ ok: true }),
  verify: async () => ({ ok: true })
};

module.exports = {
  migrationPlugin
};
