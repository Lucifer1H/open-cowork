/**
 * @typedef {Object} PluginContext
 * @property {string} taskId - 任务唯一标识
 * @property {string} cwd - 工作目录
 * @property {object} profile - 当前配置 profile
 * @property {object} metadata - 用户自定义元数据
 * @property {object} runtime - 运行时实例引用
 * @property {object} instructions - 合并后的指令规则
 * @property {function} emit - 发送事件 (type: string, payload: object) => void
 * @property {function} report - 进度报告 (message: string) => void
 * @property {object} [options] - 额外选项 (timeout, retry, onProgress)
 */

/**
 * @typedef {Object} CoworkPlugin
 * @property {string} id
 * @property {object} manifest - { name, version, runtime, capabilities }
 * @property {(task: string, context?: PluginContext) => boolean} canHandle
 * @property {(task: string, context?: PluginContext) => Promise<{steps: Array<{id: string, summary: string, risk?: string}>}>} plan
 * @property {(plan: {steps: Array}, context?: PluginContext) => Promise<{ok: boolean, results?: Array, changes?: Array}>} run
 * @property {(result: {ok: boolean}, context?: PluginContext) => Promise<{ok: boolean, reason?: string}>} verify
 */

/**
 * @typedef {Object} TaskRequest
 * @property {string} task - 任务描述
 * @property {'execute'|'plan_only'} mode - 执行模式
 * @property {string|null} approvalToken - 审批令牌
 * @property {string} riskPolicy - 风险策略 (safe|balanced|aggressive)
 * @property {object} metadata - 元数据
 */

/**
 * @typedef {Object} ExecuteResult
 * @property {boolean} ok - 是否成功
 * @property {Array} [results] - 步骤执行结果
 * @property {Array} [failedSteps] - 失败步骤 ID 列表
 * @property {string} [reason] - 失败原因
 * @property {number} [totalDurationMs] - 总执行时间
 */

/**
 * @typedef {Object} EventPayload
 * @property {string} type - 事件类型
 * @property {string} [taskId] - 任务 ID
 * @property {string} [stepId] - 步骤 ID
 * @property {number} [durationMs] - 执行时长
 * @property {string} [summary] - 摘要
 * @property {string} [error] - 错误信息
 * @property {object} [result] - 结果对象
 */

module.exports = {};