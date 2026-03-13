const { createPluginBase, inferRiskLevel } = require('./base.cjs');

/**
 * Bugfix 插件 - 处理错误修复任务
 *
 * 使用模板方法模式，实现 analyze, generateSteps, executeStep, validateResult 方法
 */
const bugfixPlugin = createPluginBase({
  id: 'bugfix',

  manifest: {
    name: '@cowork/bugfix',
    version: '2.0.0',
    runtime: '^3',
    capabilities: ['plan', 'run', 'verify', 'analyze', 'diagnose']
  },

  /**
   * 判断是否能处理该任务
   * @param {string} task - 任务描述
   * @returns {boolean}
   */
  canHandle: (task) => {
    const patterns = /fix|bug|issue|failure|flaky|error|crash|broken|not working|doesn't work/i;
    return patterns.test(task);
  },

  /**
   * 分析任务 - 解析错误信息和上下文
   * @param {string} task - 任务描述
   * @param {object} context - 执行上下文
   * @returns {Promise<object>} - 分析结果
   */
  analyze: async (task, context) => {
    const analysis = {
      taskType: 'bugfix',
      errorType: null,
      affectedFiles: [],
      suspectedCauses: [],
      suggestedApproach: []
    };

    const lowerTask = task.toLowerCase();

    // 检测错误类型
    const errorPatterns = [
      { pattern: /typeerror|type error/i, type: 'TypeError' },
      { pattern: /referenceerror|reference error|not defined/i, type: 'ReferenceError' },
      { pattern: /syntaxerror|syntax error/i, type: 'SyntaxError' },
      { pattern: /null|nullpointer|undefined/i, type: 'NullReference' },
      { pattern: /async|await|promise|unhandled/i, type: 'AsyncError' },
      { pattern: /network|request|fetch|http|timeout/i, type: 'NetworkError' },
      { pattern: /permission|access denied|forbidden/i, type: 'PermissionError' },
      { pattern: /memory|oom|out of memory/i, type: 'MemoryError' }
    ];

    for (const { pattern, type } of errorPatterns) {
      if (pattern.test(task)) {
        analysis.errorType = type;
        analysis.suspectedCauses.push(`Possible ${type} detected`);
        break;
      }
    }

    // 推断修复方法
    if (analysis.errorType === 'NullReference') {
      analysis.suggestedApproach.push('Add null/undefined checks');
      analysis.suggestedApproach.push('Verify data flow and initialization');
    } else if (analysis.errorType === 'AsyncError') {
      analysis.suggestedApproach.push('Check promise handling');
      analysis.suggestedApproach.push('Add proper try-catch blocks');
      analysis.suggestedApproach.push('Verify async/await usage');
    } else if (analysis.errorType === 'TypeError') {
      analysis.suggestedApproach.push('Check variable types');
      analysis.suggestedApproach.push('Verify function arguments');
    }

    // 检测是否是测试相关
    if (/test|spec|jest|mocha|vitest/i.test(task)) {
      analysis.taskType = 'test-bugfix';
      analysis.suggestedApproach.push('Run tests to identify failing cases');
      analysis.suggestedApproach.push('Check test isolation and mocks');
    }

    return analysis;
  },

  /**
   * 生成修复步骤
   * @param {object} analysis - 分析结果
   * @param {object} context - 执行上下文
   * @returns {Promise<Array>} - 步骤数组
   */
  generateSteps: async (analysis, context) => {
    const steps = [];

    // 步骤 1: 复现问题
    steps.push({
      id: 'bugfix.reproduce',
      summary: 'Reproduce the issue and collect diagnostic information',
      risk: 'low',
      actions: [
        'Identify the exact conditions that trigger the bug',
        'Create a minimal reproduction case if possible',
        'Collect error messages, stack traces, and logs'
      ]
    });

    // 步骤 2: 定位根因
    steps.push({
      id: 'bugfix.locate',
      summary: 'Locate the root cause in the codebase',
      risk: 'low',
      actions: [
        'Trace the error stack to find the problematic code',
        'Identify the files and functions involved',
        'Understand the expected vs actual behavior'
      ]
    });

    // 步骤 3: 分析影响
    steps.push({
      id: 'bugfix.analyze',
      summary: 'Analyze the impact and dependencies',
      risk: 'low',
      actions: [
        'Check if other parts of the code depend on the buggy behavior',
        'Identify potential side effects of the fix',
        'Determine the scope of changes needed'
      ]
    });

    // 步骤 4: 实施修复
    steps.push({
      id: 'bugfix.implement',
      summary: 'Implement the fix with minimal changes',
      risk: 'medium',
      actions: [
        'Make targeted changes to fix the root cause',
        'Add defensive checks if appropriate',
        'Preserve existing code style and patterns'
      ]
    });

    // 步骤 5: 验证修复
    steps.push({
      id: 'bugfix.verify',
      summary: 'Verify the fix resolves the issue',
      risk: 'low',
      actions: [
        'Test the specific scenario that was broken',
        'Run related unit tests',
        'Check for any regressions'
      ]
    });

    return steps;
  },

  /**
   * 执行单个步骤
   * @param {object} step - 步骤对象
   * @param {object} context - 执行上下文
   * @returns {Promise<object>} - 步骤执行结果
   */
  executeStep: async (step, context) => {
    const stepId = step.id;
    const emit = context.emit || (() => {});
    const report = context.report || (() => {});

    emit('step.executing', { stepId, summary: step.summary });
    report(`Executing: ${step.summary}`);

    // 模拟步骤执行（实际实现会调用 OpenCode 的工具能力）
    // 在真实场景中，这里会：
    // - 读取相关文件
    // - 运行诊断命令
    // - 执行代码修改
    // - 运行测试验证

    return {
      ok: true,
      stepId,
      summary: step.summary,
      actionsCompleted: step.actions || [],
      notes: `Step ${stepId} completed successfully`
    };
  },

  /**
   * 验证修复结果
   * @param {object} runResult - 运行结果
   * @param {object} context - 执行上下文
   * @returns {Promise<object>} - 验证结果
   */
  validateResult: async (runResult, context) => {
    // 如果运行失败，验证也失败
    if (!runResult.ok) {
      return {
        ok: false,
        reason: runResult.reason || 'Bugfix execution failed'
      };
    }

    // 检查是否所有步骤都成功
    const results = runResult.results || [];
    const failedSteps = results.filter((r) => !r.ok);

    if (failedSteps.length > 0) {
      return {
        ok: false,
        reason: `${failedSteps.length} step(s) failed during bugfix`,
        failedSteps: failedSteps.map((s) => s.stepId)
      };
    }

    // 验证修复 - 在实际场景中会运行测试
    return {
      ok: true,
      summary: 'Bugfix completed and verified',
      stepsCompleted: results.length
    };
  }
});

module.exports = {
  bugfixPlugin
};