/**
 * 创建工具输出检查器
 * 解析和分析工具执行输出，提取错误和建议
 */

/**
 * 常见错误模式
 */
const ERROR_PATTERNS = {
  // JavaScript/TypeScript
  typescript: {
    patterns: [
      /error TS(\d+):\s*(.+)/gi,
      /Type '(.+)' is not assignable to type '(.+)'/gi
    ],
    language: 'typescript'
  },
  eslint: {
    patterns: [
      /(\d+):(\d+)\s+error\s+(.+)\s+(.+)\s/gi,
      /ESLint:\s*(.+)/gi
    ],
    language: 'javascript'
  },
  node: {
    patterns: [
      /Error:\s*(.+)/gi,
      /TypeError:\s*(.+)/gi,
      /ReferenceError:\s*(.+)/gi,
      /SyntaxError:\s*(.+)/gi,
      /at\s+(.+)\s+\((.+):(\d+):(\d+)\)/gi
    ],
    language: 'javascript'
  },
  // 通用
  generic: {
    patterns: [
      /error:\s*(.+)/gi,
      /failed:\s*(.+)/gi,
      /fatal:\s*(.+)/gi,
      /exception:\s*(.+)/gi
    ],
    language: 'generic'
  }
};

/**
 * 常见修复建议
 */
const FIX_SUGGESTIONS = {
  'Cannot find module': {
    suggestion: 'Install the missing module or check the import path',
    actions: ['npm install <module>', 'Check import path', 'Verify module exists']
  },
  'is not defined': {
    suggestion: 'Define the variable before using it',
    actions: ['Add variable declaration', 'Check for typos', 'Verify scope']
  },
  'Cannot read property': {
    suggestion: 'Add null/undefined check before accessing property',
    actions: ['Add optional chaining (?.)', 'Add null check', 'Initialize object']
  },
  'is not a function': {
    suggestion: 'Verify the value is callable',
    actions: ['Check if imported correctly', 'Verify function exists', 'Check binding']
  },
  'SyntaxError': {
    suggestion: 'Fix the syntax error in the code',
    actions: ['Check for missing brackets', 'Check for missing quotes', 'Verify syntax']
  }
};

/**
 * 创建工具检查器
 * @param {object} options - 配置选项
 * @returns {object} - 检查器实例
 */
function createToolInspector(options = {}) {
  /**
   * 解析工具输出
   * @param {string} toolName - 工具名称
   * @param {string} output - 输出内容
   * @returns {object} - 解析结果
   */
  function parseOutput(toolName, output) {
    const result = {
      tool: toolName,
      raw: output,
      errors: [],
      warnings: [],
      info: [],
      summary: {
        hasErrors: false,
        hasWarnings: false,
        errorCount: 0,
        warningCount: 0
      }
    };

    if (!output || typeof output !== 'string') {
      return result;
    }

    // 根据工具类型选择解析策略
    const parser = getParser(toolName);
    const parsed = parser(output);

    result.errors = parsed.errors || [];
    result.warnings = parsed.warnings || [];
    result.info = parsed.info || [];
    result.summary.hasErrors = result.errors.length > 0;
    result.summary.hasWarnings = result.warnings.length > 0;
    result.summary.errorCount = result.errors.length;
    result.summary.warningCount = result.warnings.length;

    return result;
  }

  /**
   * 获取解析器
   * @param {string} toolName - 工具名称
   * @returns {function} - 解析函数
   */
  function getParser(toolName) {
    const parsers = {
      'npm': parseNpmOutput,
      'node': parseNodeOutput,
      'tsc': parseTypeScriptOutput,
      'eslint': parseEslintOutput,
      'jest': parseJestOutput,
      'git': parseGitOutput,
      'default': parseGenericOutput
    };

    return parsers[toolName.toLowerCase()] || parsers.default;
  }

  /**
   * 提取错误信息
   * @param {string} output - 输出内容
   * @returns {Array} - 错误列表
   */
  function extractErrors(output) {
    const errors = [];

    for (const [category, config] of Object.entries(ERROR_PATTERNS)) {
      for (const pattern of config.patterns) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);

        while ((match = regex.exec(output)) !== null) {
          errors.push({
            category,
            language: config.language,
            match: match[0],
            groups: match.slice(1),
            index: match.index
          });
        }
      }
    }

    return errors;
  }

  /**
   * 生成修复建议
   * @param {object} error - 错误对象
   * @returns {object} - 修复建议
   */
  function suggestFix(error) {
    const errorText = error.match || '';

    for (const [pattern, suggestion] of Object.entries(FIX_SUGGESTIONS)) {
      if (errorText.includes(pattern)) {
        return {
          matched: pattern,
          ...suggestion
        };
      }
    }

    return {
      matched: null,
      suggestion: 'Review the error message and fix accordingly',
      actions: ['Check documentation', 'Search for similar issues']
    };
  }

  /**
   * 验证结果是否符合预期
   * @param {string} toolName - 工具名称
   * @param {object} expected - 预期结果
   * @param {object} actual - 实际结果
   * @returns {object} - 验证结果
   */
  function validateResult(toolName, expected, actual) {
    const issues = [];

    // 检查错误数量
    if (expected.maxErrors !== undefined && actual.summary.errorCount > expected.maxErrors) {
      issues.push({
        type: 'error_count_exceeded',
        expected: expected.maxErrors,
        actual: actual.summary.errorCount
      });
    }

    // 检查警告数量
    if (expected.maxWarnings !== undefined && actual.summary.warningCount > expected.maxWarnings) {
      issues.push({
        type: 'warning_count_exceeded',
        expected: expected.maxWarnings,
        actual: actual.summary.warningCount
      });
    }

    // 检查是否应该有错误
    if (expected.shouldFail === false && actual.summary.hasErrors) {
      issues.push({
        type: 'unexpected_errors',
        message: 'Expected no errors but found some'
      });
    }

    // 检查是否应该有错误但没有
    if (expected.shouldFail === true && !actual.summary.hasErrors) {
      issues.push({
        type: 'expected_errors_missing',
        message: 'Expected errors but found none'
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * 生成可读报告
   * @param {object} result - 解析结果
   * @returns {string} - 格式化报告
   */
  function formatReport(result) {
    const lines = [];

    lines.push(`=== Tool Output Report: ${result.tool} ===`);
    lines.push('');

    if (result.summary.hasErrors) {
      lines.push(`❌ Errors (${result.summary.errorCount}):`);
      for (const error of result.errors) {
        lines.push(`  - ${error.match}`);
        const fix = suggestFix(error);
        if (fix.suggestion) {
          lines.push(`    💡 ${fix.suggestion}`);
        }
      }
      lines.push('');
    }

    if (result.summary.hasWarnings) {
      lines.push(`⚠️  Warnings (${result.summary.warningCount}):`);
      for (const warning of result.warnings) {
        lines.push(`  - ${warning}`);
      }
      lines.push('');
    }

    if (!result.summary.hasErrors && !result.summary.hasWarnings) {
      lines.push('✅ No issues found');
    }

    return lines.join('\n');
  }

  return {
    parseOutput,
    extractErrors,
    suggestFix,
    validateResult,
    formatReport
  };
}

/**
 * 解析 NPM 输出
 */
function parseNpmOutput(output) {
  const errors = [];
  const warnings = [];
  const info = [];

  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes('npm ERR!') || line.includes('error')) {
      errors.push({ match: line.trim(), category: 'npm' });
    } else if (line.includes('npm WARN') || line.includes('warn')) {
      warnings.push(line.trim());
    } else if (line.trim()) {
      info.push(line.trim());
    }
  }

  return { errors, warnings, info };
}

/**
 * 解析 Node 输出
 */
function parseNodeOutput(output) {
  const errors = [];
  const warnings = [];
  const info = [];

  // 匹配常见 Node 错误
  const errorPatterns = [
    /Error:\s*(.+)/gi,
    /TypeError:\s*(.+)/gi,
    /ReferenceError:\s*(.+)/gi,
    /SyntaxError:\s*(.+)/gi
  ];

  for (const pattern of errorPatterns) {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      errors.push({ match: match[0], category: 'node' });
    }
  }

  return { errors, warnings, info };
}

/**
 * 解析 TypeScript 输出
 */
function parseTypeScriptOutput(output) {
  const errors = [];
  const warnings = [];
  const info = [];

  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes('error TS')) {
      errors.push({ match: line.trim(), category: 'typescript' });
    } else if (line.trim()) {
      info.push(line.trim());
    }
  }

  return { errors, warnings, info };
}

/**
 * 解析 ESLint 输出
 */
function parseEslintOutput(output) {
  const errors = [];
  const warnings = [];
  const info = [];

  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes('  error  ')) {
      errors.push({ match: line.trim(), category: 'eslint' });
    } else if (line.includes('  warn  ')) {
      warnings.push(line.trim());
    } else if (line.trim()) {
      info.push(line.trim());
    }
  }

  return { errors, warnings, info };
}

/**
 * 解析 Jest 输出
 */
function parseJestOutput(output) {
  const errors = [];
  const warnings = [];
  const info = [];

  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes('FAIL') || line.includes('Error')) {
      errors.push({ match: line.trim(), category: 'jest' });
    } else if (line.includes('PASS')) {
      info.push(line.trim());
    }
  }

  return { errors, warnings, info };
}

/**
 * 解析 Git 输出
 */
function parseGitOutput(output) {
  const errors = [];
  const warnings = [];
  const info = [];

  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes('error:') || line.includes('fatal:')) {
      errors.push({ match: line.trim(), category: 'git' });
    } else if (line.includes('warning:')) {
      warnings.push(line.trim());
    } else if (line.trim()) {
      info.push(line.trim());
    }
  }

  return { errors, warnings, info };
}

/**
 * 解析通用输出
 */
function parseGenericOutput(output) {
  const errors = [];
  const warnings = [];
  const info = [];

  const lines = output.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('error') || lower.includes('failed') || lower.includes('fatal')) {
      errors.push({ match: line.trim(), category: 'generic' });
    } else if (lower.includes('warn')) {
      warnings.push(line.trim());
    } else if (line.trim()) {
      info.push(line.trim());
    }
  }

  return { errors, warnings, info };
}

module.exports = {
  createToolInspector,
  ERROR_PATTERNS,
  FIX_SUGGESTIONS
};