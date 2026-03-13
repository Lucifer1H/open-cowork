/**
 * 插件基类工厂
 * 提供模板方法模式的插件框架，子类只需实现特定的抽象方法
 *
 * @param {object} config - 插件配置
 * @param {string} config.id - 插件 ID
 * @param {object} config.manifest - 插件清单 { name, version, runtime, capabilities }
 * @param {function} config.canHandle - 判断是否能处理任务 (task: string, context?: object) => boolean
 * @param {function} [config.analyze] - 分析任务 (task: string, context: object) => Promise<object>
 * @param {function} [config.generateSteps] - 生成步骤 (analysis: object, context: object) => Promise<Array>
 * @param {function} [config.executeStep] - 执行步骤 (step: object, context: object) => Promise<object>
 * @param {function} [config.validateResult] - 验证结果 (runResult: object, context: object) => Promise<object>
 * @param {function} [config.plan] - 自定义计划方法（覆盖默认实现）
 * @param {function} [config.run] - 自定义运行方法（覆盖默认实现）
 * @param {function} [config.verify] - 自定义验证方法（覆盖默认实现）
 * @returns {object} - 插件对象
 */
function createPluginBase(config) {
  const {
    id,
    manifest,
    canHandle,
    analyze,
    generateSteps,
    executeStep,
    validateResult,
    plan: customPlan,
    run: customRun,
    verify: customVerify
  } = config;

  // 验证必需字段
  if (!id) {
    throw new Error('Plugin id is required');
  }
  if (!manifest) {
    throw new Error('Plugin manifest is required');
  }
  if (typeof canHandle !== 'function') {
    throw new Error('Plugin canHandle function is required');
  }

  /**
   * 默认计划方法 - 模板方法
   * @param {string} task - 任务描述
   * @param {object} context - 执行上下文
   * @returns {Promise<object>} - 计划对象 { steps, analysis }
   */
  async function plan(task, context = {}) {
    // 如果提供了自定义计划方法，使用它
    if (customPlan) {
      return customPlan(task, context);
    }

    // 默认模板方法实现
    const emit = context.emit || (() => {});

    // 1. 分析任务
    let analysis = {};
    if (analyze) {
      emit('plugin.analyzing', { pluginId: id });
      analysis = await analyze(task, context);
      emit('plugin.analyzed', { pluginId: id, analysis });
    }

    // 2. 生成步骤
    let steps = [];
    if (generateSteps) {
      emit('plugin.generatingSteps', { pluginId: id });
      steps = await generateSteps(analysis, context);
      emit('plugin.stepsGenerated', { pluginId: id, stepCount: steps.length });
    } else {
      // 默认步骤
      steps = [
        { id: `${id}.default`, summary: `Execute ${id} task`, risk: 'low' }
      ];
    }

    return { steps, analysis };
  }

  /**
   * 默认运行方法 - 模板方法
   * @param {object} plan - 执行计划
   * @param {object} context - 执行上下文
   * @returns {Promise<object>} - 执行结果 { ok, results, changes }
   */
  async function run(plan, context = {}) {
    // 如果提供了自定义运行方法，使用它
    if (customRun) {
      return customRun(plan, context);
    }

    // 默认模板方法实现
    const steps = plan.steps || [];
    const emit = context.emit || (() => {});
    const results = [];
    const changes = [];

    for (const step of steps) {
      const stepId = step.id || 'unknown';

      emit('step.started', { stepId, summary: step.summary });
      const startTime = Date.now();

      try {
        let result;
        if (executeStep) {
          result = await executeStep(step, context);
        } else {
          // 默认：返回成功
          result = { ok: true, stepId };
        }

        const durationMs = Date.now() - startTime;
        emit('step.completed', { stepId, durationMs, result });

        results.push({ ...result, stepId, durationMs });

        // 收集变更
        if (result.changes) {
          changes.push(...result.changes);
        }

        // 如果步骤失败，停止执行
        if (!result.ok) {
          return {
            ok: false,
            results,
            changes,
            failedStep: stepId,
            reason: result.reason || `Step ${stepId} failed`
          };
        }
      } catch (error) {
        const durationMs = Date.now() - startTime;
        emit('step.failed', { stepId, durationMs, error: error.message });

        results.push({
          ok: false,
          stepId,
          durationMs,
          error: error.message
        });

        return {
          ok: false,
          results,
          changes,
          failedStep: stepId,
          reason: error.message
        };
      }
    }

    return {
      ok: true,
      results,
      changes,
      totalSteps: steps.length
    };
  }

  /**
   * 默认验证方法
   * @param {object} runResult - 运行结果
   * @param {object} context - 执行上下文
   * @returns {Promise<object>} - 验证结果 { ok, reason? }
   */
  async function verify(runResult, context = {}) {
    // 如果提供了自定义验证方法，使用它
    if (customVerify) {
      return customVerify(runResult, context);
    }

    // 如果运行失败，验证也失败
    if (!runResult || !runResult.ok) {
      return {
        ok: false,
        reason: runResult?.reason || 'Run phase failed'
      };
    }

    // 如果有自定义验证逻辑
    if (validateResult) {
      return validateResult(runResult, context);
    }

    // 默认：运行成功即验证成功
    return { ok: true };
  }

  return {
    id,
    manifest,
    canHandle,
    plan,
    run,
    verify
  };
}

/**
 * 创建简单的正则匹配插件
 * @param {object} config - 插件配置
 * @param {string} config.id - 插件 ID
 * @param {string|RegExp} config.pattern - 匹配模式
 * @param {Array} config.steps - 静态步骤数组
 * @returns {object} - 插件对象
 */
function createSimplePlugin(config) {
  const { id, pattern, steps = [] } = config;

  const manifest = {
    name: `@cowork/${id}`,
    version: '1.0.0',
    runtime: '^3',
    capabilities: ['plan', 'run', 'verify']
  };

  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;

  return createPluginBase({
    id,
    manifest,
    canHandle: (task) => regex.test(task),
    generateSteps: async () => steps.map((s, i) => ({
      id: s.id || `${id}.step.${i + 1}`,
      summary: s.summary || `Step ${i + 1}`,
      risk: s.risk || 'low'
    }))
  });
}

/**
 * 插件工具函数
 */

/**
 * 解析任务中的关键词
 * @param {string} task - 任务描述
 * @param {Array<string>} keywords - 关键词列表
 * @returns {Array<string>} - 匹配的关键词
 */
function extractKeywords(task, keywords) {
  const lowerTask = task.toLowerCase();
  return keywords.filter((k) => lowerTask.includes(k.toLowerCase()));
}

/**
 * 从任务描述中提取文件路径
 * @param {string} task - 任务描述
 * @returns {Array<string>} - 可能的文件路径
 */
function extractFilePaths(task) {
  // 匹配常见的文件路径模式
  const patterns = [
    /['"]([^'"]+\.[a-zA-Z]+)['"]/g,  // 引号中的文件名
    /\b([a-zA-Z0-9_-]+\/[a-zA-Z0-9_\/.-]+)\b/g,  // 路径格式
    /\b([a-zA-Z0-9_-]+\.[a-zA-Z]{1,4})\b/g  // 文件名格式
  ];

  const paths = new Set();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(task)) !== null) {
      paths.add(match[1]);
    }
  }

  return Array.from(paths);
}

/**
 * 推断任务风险等级
 * @param {string} task - 任务描述
 * @returns {string} - 风险等级 (low|medium|high|critical)
 */
function inferRiskLevel(task) {
  const lowerTask = task.toLowerCase();

  // 关键词 -> 风险等级映射
  const riskKeywords = {
    critical: ['delete', 'remove', 'drop', 'truncate', 'destroy'],
    high: ['force', 'overwrite', 'replace', 'migrate'],
    medium: ['modify', 'update', 'change', 'refactor', 'rename'],
    low: ['read', 'view', 'show', 'list', 'document', 'generate']
  };

  for (const [level, keywords] of Object.entries(riskKeywords)) {
    if (keywords.some((k) => lowerTask.includes(k))) {
      return level;
    }
  }

  return 'low';
}

module.exports = {
  createPluginBase,
  createSimplePlugin,
  extractKeywords,
  extractFilePaths,
  inferRiskLevel
};