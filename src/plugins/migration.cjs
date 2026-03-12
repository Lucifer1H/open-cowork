const { createPluginBase } = require('./base.cjs');

/**
 * Migration 插件 - 处理代码迁移和升级任务
 */
const migrationPlugin = createPluginBase({
  id: 'migration',

  manifest: {
    name: '@cowork/migration',
    version: '2.0.0',
    runtime: '^3',
    capabilities: ['plan', 'run', 'verify', 'analyze', 'transform']
  },

  canHandle: (task) => /migrate|migration|upgrade|convert|port|transform/i.test(task),

  analyze: async (task, context) => {
    const analysis = {
      migrationType: null,
      sourceVersion: null,
      targetVersion: null,
      breaking: false,
      automated: false
    };

    const lowerTask = task.toLowerCase();

    // 检测迁移类型
    const typePatterns = [
      { pattern: /react.*\d+|vue.*\d+|angular.*\d+/i, type: 'framework' },
      { pattern: /node|typescript|javascript/i, type: 'language' },
      { pattern: /class.*function|function.*class/i, type: 'pattern' },
      { pattern: /commonjs.*esm|esm.*commonjs/i, type: 'module' },
      { pattern: /javascript.*typescript|js.*ts/i, type: 'language' },
      { pattern: /database|schema|sql/i, type: 'database' }
    ];

    for (const { pattern, type } of typePatterns) {
      if (pattern.test(task)) {
        analysis.migrationType = type;
        break;
      }
    }

    // 检测版本号
    const versionMatch = task.match(/(?:to|from|v)?(\d+(?:\.\d+)*)/gi);
    if (versionMatch && versionMatch.length >= 1) {
      analysis.targetVersion = versionMatch[versionMatch.length - 1];
      if (versionMatch.length >= 2) {
        analysis.sourceVersion = versionMatch[0];
      }
    }

    // 检测是否破坏性变更
    if (/breaking|major|incompatible/i.test(task)) {
      analysis.breaking = true;
    }

    return analysis;
  },

  generateSteps: async (analysis) => {
    const steps = [
      {
        id: 'migration.assess',
        summary: 'Assess current state and migration requirements',
        risk: 'low'
      },
      {
        id: 'migration.plan',
        summary: 'Create migration plan with compatibility notes',
        risk: 'low'
      },
      {
        id: 'migration.backup',
        summary: 'Create backup and ensure rollback capability',
        risk: 'low'
      },
      {
        id: 'migration.transform',
        summary: 'Apply code transformations and updates',
        risk: 'high'
      },
      {
        id: 'migration.verify',
        summary: 'Run tests and verify migration success',
        risk: 'medium'
      },
      {
        id: 'migration.cleanup',
        summary: 'Clean up deprecated code and update dependencies',
        risk: 'medium'
      }
    ];

    return steps;
  },

  executeStep: async (step, context) => {
    return {
      ok: true,
      stepId: step.id,
      summary: step.summary
    };
  },

  validateResult: async (runResult) => {
    if (!runResult.ok) {
      return { ok: false, reason: runResult.reason };
    }
    return { ok: true, summary: 'Migration completed' };
  }
});

module.exports = {
  migrationPlugin
};