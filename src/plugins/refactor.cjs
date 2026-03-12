const { createPluginBase } = require('./base.cjs');

/**
 * Refactor 插件 - 处理代码重构任务
 */
const refactorPlugin = createPluginBase({
  id: 'refactor',

  manifest: {
    name: '@cowork/refactor',
    version: '2.0.0',
    runtime: '^3',
    capabilities: ['plan', 'run', 'verify', 'analyze', 'extract']
  },

  canHandle: (task) => /refactor|reorganize|extract|restructure|clean up|optimize/i.test(task),

  analyze: async (task, context) => {
    const analysis = {
      refactorType: null,
      scope: 'unknown',
      affectedFiles: [],
      dependencies: []
    };

    const lowerTask = task.toLowerCase();

    // 检测重构类型
    const typePatterns = [
      { pattern: /extract (method|function|class)/i, type: 'extract' },
      { pattern: /rename|rename to/i, type: 'rename' },
      { pattern: /move|reorganize|restructure/i, type: 'reorganize' },
      { pattern: /inline/i, type: 'inline' },
      { pattern: /simplify|clean up/i, type: 'simplify' },
      { pattern: /optimize|performance/i, type: 'optimize' },
      { pattern: /remove|delete|unused/i, type: 'remove' }
    ];

    for (const { pattern, type } of typePatterns) {
      if (pattern.test(task)) {
        analysis.refactorType = type;
        break;
      }
    }

    // 检测范围
    if (/module|package|folder|directory/i.test(task)) {
      analysis.scope = 'module';
    } else if (/file|class/i.test(task)) {
      analysis.scope = 'file';
    } else if (/method|function/i.test(task)) {
      analysis.scope = 'function';
    }

    return analysis;
  },

  generateSteps: async (analysis) => {
    const steps = [
      {
        id: 'refactor.analyze',
        summary: 'Analyze current code structure and dependencies',
        risk: 'low'
      },
      {
        id: 'refactor.plan',
        summary: 'Create detailed refactoring plan with file mappings',
        risk: 'low'
      },
      {
        id: 'refactor.prepare',
        summary: 'Ensure tests pass before refactoring',
        risk: 'low'
      },
      {
        id: 'refactor.execute',
        summary: 'Apply refactoring changes incrementally',
        risk: 'medium'
      },
      {
        id: 'refactor.verify',
        summary: 'Run tests and verify behavior preserved',
        risk: 'low'
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
    return { ok: true, summary: 'Refactoring completed' };
  }
});

module.exports = {
  refactorPlugin
};