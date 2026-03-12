const { createPluginBase } = require('./base.cjs');

/**
 * Docgen 插件 - 处理文档生成任务
 */
const docgenPlugin = createPluginBase({
  id: 'docgen',

  manifest: {
    name: '@cowork/docgen',
    version: '2.0.0',
    runtime: '^3',
    capabilities: ['plan', 'run', 'verify', 'analyze', 'generate']
  },

  canHandle: (task) => /document|documentation|readme|api doc|docs|javadoc|jsdoc/i.test(task),

  analyze: async (task, context) => {
    const analysis = {
      docType: null,
      format: 'markdown',
      scope: 'all',
      targetFiles: []
    };

    const lowerTask = task.toLowerCase();

    // 检测文档类型
    if (/readme/i.test(task)) {
      analysis.docType = 'readme';
    } else if (/api|reference/i.test(task)) {
      analysis.docType = 'api';
    } else if (/changelog|change log/i.test(task)) {
      analysis.docType = 'changelog';
    } else if (/jsdoc|javadoc|comment/i.test(task)) {
      analysis.docType = 'inline';
    } else if (/guide|tutorial|how to/i.test(task)) {
      analysis.docType = 'guide';
    } else {
      analysis.docType = 'general';
    }

    // 检测格式
    if (/html/i.test(task)) {
      analysis.format = 'html';
    } else if (/json/i.test(task)) {
      analysis.format = 'json';
    }

    return analysis;
  },

  generateSteps: async (analysis) => {
    const steps = [
      {
        id: 'docgen.scan',
        summary: 'Scan source files and extract code structure',
        risk: 'low'
      },
      {
        id: 'docgen.extract',
        summary: 'Extract function signatures, types, and comments',
        risk: 'low'
      },
      {
        id: 'docgen.structure',
        summary: 'Organize documentation structure and sections',
        risk: 'low'
      },
      {
        id: 'docgen.generate',
        summary: 'Generate documentation in target format',
        risk: 'low'
      },
      {
        id: 'docgen.review',
        summary: 'Review and refine generated documentation',
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
    return { ok: true, summary: 'Documentation generated' };
  }
});

module.exports = {
  docgenPlugin
};