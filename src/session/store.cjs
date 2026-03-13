const fs = require('fs');
const path = require('path');

/**
 * 创建会话存储
 * @param {object} options - 配置选项
 * @param {string} [options.storagePath] - 存储路径（可选，用于持久化）
 * @returns {object} - 会话存储实例
 */
function createSessionStore(options = {}) {
  const sessions = new Map();
  const storagePath = options.storagePath || null;

  /**
   * 添加会话
   * @param {object} session - 会话对象
   */
  function add(session) {
    sessions.set(session.id, { ...session });
    if (storagePath) {
      persistSession(session);
    }
  }

  /**
   * 获取会话
   * @param {string} id - 会话ID
   * @returns {object|null}
   */
  function get(id) {
    const session = sessions.get(id);
    return session ? { ...session } : null;
  }

  /**
   * 更新会话
   * @param {object} session - 更新后的会话对象
   */
  function update(session) {
    if (sessions.has(session.id)) {
      sessions.set(session.id, { ...session, updatedAt: new Date().toISOString() });
      if (storagePath) {
        persistSession(session);
      }
    }
  }

  /**
   * 删除会话
   * @param {string} id - 会话ID
   */
  function remove(id) {
    sessions.delete(id);
    if (storagePath) {
      deleteSessionFile(id);
    }
  }

  /**
   * 列出所有会话
   * @param {object} [filter] - 筛选条件
   * @returns {Array}
   */
  function list(filter = {}) {
    let result = Array.from(sessions.values());

    if (filter.status) {
      result = result.filter((s) => s.status === filter.status);
    }

    if (filter.since) {
      const since = new Date(filter.since).getTime();
      result = result.filter((s) => new Date(s.createdAt).getTime() >= since);
    }

    // 按创建时间倒序排列
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }

  /**
   * 获取会话数量
   * @returns {number}
   */
  function count() {
    return sessions.size;
  }

  /**
   * 清空所有会话
   */
  function clear() {
    sessions.clear();
    if (storagePath) {
      try {
        const files = fs.readdirSync(storagePath);
        for (const file of files) {
          if (file.startsWith('session_') && file.endsWith('.json')) {
            fs.unlinkSync(path.join(storagePath, file));
          }
        }
      } catch (e) {
        // 忽略错误
      }
    }
  }

  /**
   * 持久化会话到文件
   * @param {object} session - 会话对象
   */
  function persistSession(session) {
    if (!storagePath) return;

    try {
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
      }
      const filePath = path.join(storagePath, `${session.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf8');
    } catch (e) {
      // 忽略持久化错误
    }
  }

  /**
   * 删除会话文件
   * @param {string} id - 会话ID
   */
  function deleteSessionFile(id) {
    if (!storagePath) return;

    try {
      const filePath = path.join(storagePath, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      // 忽略错误
    }
  }

  /**
   * 从文件加载会话
   */
  function loadFromStorage() {
    if (!storagePath) return;

    try {
      if (!fs.existsSync(storagePath)) return;

      const files = fs.readdirSync(storagePath);
      for (const file of files) {
        if (file.startsWith('session_') && file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(path.join(storagePath, file), 'utf8');
            const session = JSON.parse(content);
            sessions.set(session.id, session);
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    } catch (e) {
      // 忽略加载错误
    }
  }

  // 初始化时加载持久化的会话
  if (storagePath) {
    loadFromStorage();
  }

  return {
    add,
    get,
    update,
    remove,
    list,
    count,
    clear,
    loadFromStorage
  };
}

module.exports = {
  createSessionStore
};