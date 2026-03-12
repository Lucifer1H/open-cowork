const {
  SESSION_STATUS,
  TASK_STATUS,
  createSession,
  createTask,
  isValidTransition
} = require('./types.cjs');

/**
 * 创建会话管理器
 * @param {object} options - 配置选项
 * @param {object} [options.store] - 会话存储实例
 * @param {object} [options.eventStore] - 事件存储实例
 * @param {function} [options.orchestrate] - 任务编排函数
 * @returns {object} - 会话管理器实例
 */
function createSessionManager(options = {}) {
  const store = options.store;
  const eventStore = options.eventStore;
  const orchestrate = options.orchestrate;

  /**
   * 创建新会话
   * @param {object} sessionOptions - 会话选项
   * @param {string} sessionOptions.task - 主任务描述
   * @param {object} [sessionOptions.context] - 会话上下文
   * @returns {object} - 创建的会话
   */
  function create(sessionOptions = {}) {
    const session = createSession(sessionOptions);

    if (store) {
      store.add(session);
    }

    emitEvent('session.created', { sessionId: session.id, task: session.task });

    return session;
  }

  /**
   * 获取会话
   * @param {string} id - 会话ID
   * @returns {object|null}
   */
  function get(id) {
    return store ? store.get(id) : null;
  }

  /**
   * 列出会话
   * @param {object} [filter] - 筛选条件
   * @returns {Array}
   */
  function list(filter = {}) {
    return store ? store.list(filter) : [];
  }

  /**
   * 暂停会话
   * @param {string} id - 会话ID
   * @returns {object} - 操作结果
   */
  function pause(id) {
    const session = get(id);
    if (!session) {
      return { ok: false, reason: 'Session not found' };
    }

    if (!isValidTransition(session.status, SESSION_STATUS.PAUSED)) {
      return { ok: false, reason: `Cannot pause session in ${session.status} state` };
    }

    const updated = {
      ...session,
      status: SESSION_STATUS.PAUSED,
      updatedAt: new Date().toISOString()
    };

    if (store) {
      store.update(updated);
    }

    emitEvent('session.paused', { sessionId: id });

    return { ok: true, session: updated };
  }

  /**
   * 恢复会话
   * @param {string} id - 会话ID
   * @returns {object} - 操作结果
   */
  function resume(id) {
    const session = get(id);
    if (!session) {
      return { ok: false, reason: 'Session not found' };
    }

    if (!isValidTransition(session.status, SESSION_STATUS.ACTIVE)) {
      return { ok: false, reason: `Cannot resume session in ${session.status} state` };
    }

    const updated = {
      ...session,
      status: SESSION_STATUS.ACTIVE,
      updatedAt: new Date().toISOString()
    };

    if (store) {
      store.update(updated);
    }

    emitEvent('session.resumed', { sessionId: id });

    return { ok: true, session: updated };
  }

  /**
   * 完成会话
   * @param {string} id - 会话ID
   * @param {object} [result] - 最终结果
   * @returns {object} - 操作结果
   */
  function complete(id, result = {}) {
    const session = get(id);
    if (!session) {
      return { ok: false, reason: 'Session not found' };
    }

    if (!isValidTransition(session.status, SESSION_STATUS.COMPLETED)) {
      return { ok: false, reason: `Cannot complete session in ${session.status} state` };
    }

    const now = new Date().toISOString();
    const updated = {
      ...session,
      status: SESSION_STATUS.COMPLETED,
      completedAt: now,
      updatedAt: now,
      result
    };

    if (store) {
      store.update(updated);
    }

    emitEvent('session.completed', { sessionId: id, result });

    return { ok: true, session: updated };
  }

  /**
   * 标记会话失败
   * @param {string} id - 会话ID
   * @param {string} reason - 失败原因
   * @returns {object} - 操作结果
   */
  function fail(id, reason) {
    const session = get(id);
    if (!session) {
      return { ok: false, reason: 'Session not found' };
    }

    if (!isValidTransition(session.status, SESSION_STATUS.FAILED)) {
      return { ok: false, reason: `Cannot fail session in ${session.status} state` };
    }

    const now = new Date().toISOString();
    const updated = {
      ...session,
      status: SESSION_STATUS.FAILED,
      completedAt: now,
      updatedAt: now,
      failureReason: reason
    };

    if (store) {
      store.update(updated);
    }

    emitEvent('session.failed', { sessionId: id, reason });

    return { ok: true, session: updated };
  }

  /**
   * 添加任务到会话
   * @param {string} sessionId - 会话ID
   * @param {object} taskOptions - 任务选项
   * @returns {object} - 操作结果
   */
  function addTask(sessionId, taskOptions = {}) {
    const session = get(sessionId);
    if (!session) {
      return { ok: false, reason: 'Session not found' };
    }

    if (session.status !== SESSION_STATUS.ACTIVE) {
      return { ok: false, reason: 'Session is not active' };
    }

    const task = createTask(taskOptions);
    const updated = {
      ...session,
      tasks: [...session.tasks, task],
      updatedAt: new Date().toISOString()
    };

    if (store) {
      store.update(updated);
    }

    emitEvent('session.task.added', { sessionId, taskId: task.id });

    return { ok: true, task, session: updated };
  }

  /**
   * 更新任务状态
   * @param {string} sessionId - 会话ID
   * @param {string} taskId - 任务ID
   * @param {string} status - 新状态
   * @param {object} [result] - 任务结果
   * @returns {object} - 操作结果
   */
  function updateTask(sessionId, taskId, status, result = null) {
    const session = get(sessionId);
    if (!session) {
      return { ok: false, reason: 'Session not found' };
    }

    const taskIndex = session.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return { ok: false, reason: 'Task not found' };
    }

    const task = session.tasks[taskIndex];
    const updatedTask = {
      ...task,
      status,
      updatedAt: new Date().toISOString()
    };

    if (status === TASK_STATUS.COMPLETED || status === TASK_STATUS.FAILED) {
      updatedTask.completedAt = new Date().toISOString();
    }

    if (result) {
      updatedTask.result = result;
    }

    const updatedTasks = [...session.tasks];
    updatedTasks[taskIndex] = updatedTask;

    const updated = {
      ...session,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    };

    if (store) {
      store.update(updated);
    }

    return { ok: true, task: updatedTask, session: updated };
  }

  /**
   * 执行会话中的下一个待处理任务
   * @param {string} sessionId - 会话ID
   * @returns {Promise<object>} - 执行结果
   */
  async function executeNextTask(sessionId) {
    const session = get(sessionId);
    if (!session) {
      return { ok: false, reason: 'Session not found' };
    }

    if (session.status !== SESSION_STATUS.ACTIVE) {
      return { ok: false, reason: 'Session is not active' };
    }

    const pendingTask = session.tasks.find((t) => t.status === TASK_STATUS.PENDING);
    if (!pendingTask) {
      return { ok: false, reason: 'No pending tasks' };
    }

    // 标记任务为运行中
    updateTask(sessionId, pendingTask.id, TASK_STATUS.RUNNING);

    try {
      // 执行任务
      const result = orchestrate
        ? await orchestrate({ task: pendingTask.description, taskId: pendingTask.id })
        : { status: 'completed' };

      const taskStatus = result.status === 'completed' ? TASK_STATUS.COMPLETED : TASK_STATUS.FAILED;
      updateTask(sessionId, pendingTask.id, taskStatus, result);

      return { ok: taskStatus === TASK_STATUS.COMPLETED, task: pendingTask, result };
    } catch (error) {
      updateTask(sessionId, pendingTask.id, TASK_STATUS.FAILED, { error: error.message });
      return { ok: false, reason: error.message };
    }
  }

  /**
   * 获取会话历史
   * @param {string} sessionId - 会话ID
   * @returns {object} - 会话历史
   */
  function getHistory(sessionId) {
    const session = get(sessionId);
    if (!session) {
      return null;
    }

    const completedTasks = session.tasks.filter((t) => t.status === TASK_STATUS.COMPLETED);
    const failedTasks = session.tasks.filter((t) => t.status === TASK_STATUS.FAILED);
    const pendingTasks = session.tasks.filter((t) => t.status === TASK_STATUS.PENDING);

    return {
      sessionId: session.id,
      status: session.status,
      totalTasks: session.tasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      pendingTasks: pendingTasks.length,
      tasks: session.tasks,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      completedAt: session.completedAt
    };
  }

  /**
   * 发送事件
   * @param {string} type - 事件类型
   * @param {object} payload - 事件载荷
   */
  function emitEvent(type, payload) {
    if (eventStore && typeof eventStore.append === 'function') {
      eventStore.append({
        type,
        ...payload,
        timestamp: new Date().toISOString()
      });
    }
  }

  return {
    create,
    get,
    list,
    pause,
    resume,
    complete,
    fail,
    addTask,
    updateTask,
    executeNextTask,
    getHistory
  };
}

module.exports = {
  createSessionManager
};