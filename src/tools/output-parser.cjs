/**
 * 输出解析器
 * 将各种格式的输出转换为结构化数据
 */

/**
 * 创建输出解析器
 * @param {object} options - 配置选项
 * @returns {object} - 解析器实例
 */
function createOutputParser(options = {}) {
  /**
   * 解析 JSON 输出
   * @param {string} output - 输出字符串
   * @returns {object} - 解析结果
   */
  function parseJSON(output) {
    try {
      const data = JSON.parse(output);
      return { ok: true, data, type: 'json' };
    } catch (error) {
      return { ok: false, error: error.message, type: 'json' };
    }
  }

  /**
   * 解析行输出
   * @param {string} output - 输出字符串
   * @param {object} [options] - 解析选项
   * @returns {object} - 解析结果
   */
  function parseLines(output, options = {}) {
    const lines = output.split('\n');
    const result = {
      lines: [],
      count: lines.length
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = {
        lineNumber: i + 1,
        content: line,
        trimmed: line.trim(),
        isEmpty: line.trim() === ''
      };

      if (options.detectType) {
        parsed.type = detectLineType(line);
      }

      result.lines.push(parsed);
    }

    return { ok: true, data: result, type: 'lines' };
  }

  /**
   * 解析键值对输出
   * @param {string} output - 输出字符串
   * @param {object} [options] - 解析选项
   * @returns {object} - 解析结果
   */
  function parseKeyValue(output, options = {}) {
    const delimiter = options.delimiter || ':';
    const lines = output.split('\n');
    const result = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const idx = trimmed.indexOf(delimiter);
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        result[key] = value;
      }
    }

    return { ok: true, data: result, type: 'keyvalue' };
  }

  /**
   * 解析表格输出
   * @param {string} output - 输出字符串
   * @param {object} [options] - 解析选项
   * @returns {object} - 解析结果
   */
  function parseTable(output, options = {}) {
    const lines = output.split('\n').filter((l) => l.trim());
    if (lines.length === 0) {
      return { ok: true, data: [], type: 'table' };
    }

    // 检测分隔符
    const delimiter = options.delimiter || detectTableDelimiter(lines[0]);

    // 解析表头
    const headers = parseTableRow(lines[0], delimiter);

    // 解析数据行
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseTableRow(lines[i], delimiter);
      if (values.length > 0) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header || `col_${idx}`] = values[idx] || '';
        });
        rows.push(row);
      }
    }

    return { ok: true, data: { headers, rows }, type: 'table' };
  }

  /**
   * 解析 CSV 输出
   * @param {string} output - 输出字符串
   * @returns {object} - 解析结果
   */
  function parseCSV(output) {
    const lines = output.split('\n').filter((l) => l.trim());
    if (lines.length === 0) {
      return { ok: true, data: [], type: 'csv' };
    }

    const rows = lines.map((line) => parseCSVLine(line));

    return { ok: true, data: rows, type: 'csv' };
  }

  /**
   * 检测行类型
   * @param {string} line - 行内容
   * @returns {string} - 行类型
   */
  function detectLineType(line) {
    const lower = line.toLowerCase();

    if (lower.includes('error') || lower.includes('fail')) {
      return 'error';
    }
    if (lower.includes('warn')) {
      return 'warning';
    }
    if (lower.includes('success') || lower.includes('pass') || lower.includes('ok')) {
      return 'success';
    }
    if (lower.includes('info') || lower.includes('note')) {
      return 'info';
    }

    return 'normal';
  }

  /**
   * 检测表格分隔符
   * @param {string} line - 表头行
   * @returns {string} - 分隔符
   */
  function detectTableDelimiter(line) {
    const delimiters = ['|', '\t', ';', ','];
    let maxCount = 0;
    let bestDelimiter = '\t';

    for (const d of delimiters) {
      const count = (line.match(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = d;
      }
    }

    return bestDelimiter;
  }

  /**
   * 解析表格行
   * @param {string} line - 行内容
   * @param {string} delimiter - 分隔符
   * @returns {Array} - 单元格数组
   */
  function parseTableRow(line, delimiter) {
    return line
      .split(delimiter)
      .map((cell) => cell.trim())
      .filter((cell) => cell !== '');
  }

  /**
   * 解析 CSV 行
   * @param {string} line - 行内容
   * @returns {Array} - 字段数组
   */
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * 自动检测并解析
   * @param {string} output - 输出字符串
   * @returns {object} - 解析结果
   */
  function autoParse(output) {
    const trimmed = output.trim();

    // 尝试 JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const result = parseJSON(trimmed);
      if (result.ok) return result;
    }

    // 尝试键值对
    if (trimmed.includes(':') && !trimmed.includes('\n')) {
      return parseKeyValue(trimmed);
    }

    // 尝试表格
    if (trimmed.includes('|') || trimmed.includes('\t')) {
      return parseTable(trimmed);
    }

    // 默认返回行解析
    return parseLines(trimmed, { detectType: true });
  }

  return {
    parseJSON,
    parseLines,
    parseKeyValue,
    parseTable,
    parseCSV,
    autoParse,
    detectLineType
  };
}

module.exports = {
  createOutputParser
};