/**
 * @typedef {Object} CoworkPlugin
 * @property {string} id
 * @property {(task: string) => boolean} canHandle
 * @property {(task: string, context?: object) => {steps: Array<{id: string, summary: string}>}} plan
 * @property {(plan: {steps: Array<{id: string, summary: string}>}, context?: object) => Promise<{ok: boolean}>} run
 * @property {(result: {ok: boolean}, context?: object) => Promise<{ok: boolean, reason?: string}>} verify
 */

module.exports = {};
