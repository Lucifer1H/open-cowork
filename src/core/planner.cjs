const { annotatePlanRisks } = require('./policy-engine.cjs');

function createPlanner(plugins) {
  return {
    plan(task, context = {}) {
      const matched = plugins.find((plugin) => plugin.canHandle(task, context));
      if (!matched) {
        return annotatePlanRisks({
          mode: 'fallback',
          pluginId: 'fallback.generic',
          steps: [
            {
              id: 'fallback.explore',
              summary: 'Explore repository and derive actionable execution steps.',
              risk: 'low'
            }
          ]
        });
      }

      return annotatePlanRisks({
        mode: 'plugin',
        pluginId: matched.id,
        ...matched.plan(task, context)
      });
    }
  };
}

module.exports = {
  createPlanner
};
