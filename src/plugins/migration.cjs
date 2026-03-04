const migrationPlugin = {
  id: 'migration',
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
