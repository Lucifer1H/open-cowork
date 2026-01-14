/**
 * OpenCode Cowork Custom Tool
 * 
 * Bring Claude-Cowork's autonomous file operation capabilities to OpenCode.
 * 
 * @see https://github.com/YOUR_USERNAME/open-cowork
 */

import { tool } from "@opencode-ai/plugin";
import { query } from "@anthropic-ai/claude-agent-sdk";

// ============================================
// Configuration
// ============================================

const DEFAULT_CONFIG = {
  model: "sonnet" as const,
  maxTurns: 50,
  permissionMode: "default" as const,
  allowedTools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
};

// ============================================
// Custom Tool Definition
// ============================================

/**
 * Cowork 执行工具 - 自主完成复杂任务
 */
export default tool({
  description: `启动 Cowork 模式执行复杂任务。
  
Cowork 是一个自主 AI 助手，可以：
- 📖 读取和分析文件
- ✏️ 创建和编辑文件  
- 🔍 搜索代码库
- 💻 执行 shell 命令

每次文件操作都会请求确认，确保安全。

适用场景：重构代码、添加新功能、修复 bug、生成文档、代码审查`,
  args: {
    task: tool.schema.string().describe("要执行的任务描述，越详细越好"),
    workingDirectory: tool.schema.string().optional().describe("工作目录路径"),
  },
  async execute(args, _context) {
    const { task, workingDirectory } = args;
    const cwd = workingDirectory || process.cwd();
    
    const output: string[] = [];
    const startTime = Date.now();
    
    // 头部信息
    output.push("╔" + "═".repeat(58) + "╗");
    output.push("║ 🤖 Cowork 模式启动                                      ║");
    output.push("╠" + "═".repeat(58) + "╣");
    output.push(`║ 📁 目录: ${cwd.slice(0, 45).padEnd(47)}║`);
    output.push(`║ 🧠 模型: ${DEFAULT_CONFIG.model.padEnd(47)}║`);
    output.push("╚" + "═".repeat(58) + "╝");
    output.push("");

    let turnCount = 0;
    let toolCallCount = 0;

    try {
      for await (const message of query({
        prompt: task,
        options: {
          model: DEFAULT_CONFIG.model,
          cwd,
          allowedTools: DEFAULT_CONFIG.allowedTools,
          permissionMode: DEFAULT_CONFIG.permissionMode,
          maxTurns: DEFAULT_CONFIG.maxTurns,
        },
      })) {
        // 系统初始化
        if (message.type === "system" && message.subtype === "init") {
          output.push(`🔗 会话: ${(message as any).session_id?.slice(0, 20)}...`);
          output.push("");
        }

        // Assistant 消息
        if (message.type === "assistant") {
          turnCount++;
          const content = (message as any).message?.content || [];
          
          for (const block of content) {
            // 思考内容
            if (block.text) {
              output.push("─".repeat(60));
              output.push(`💭 思考 [轮次 ${turnCount}]:`);
              output.push("");
              for (const line of block.text.split("\n")) {
                output.push(`   ${line}`);
              }
              output.push("");
            }
            
            // 工具调用
            if (block.name) {
              toolCallCount++;
              output.push(`🔨 工具调用 #${toolCallCount}: ${block.name}`);
              output.push(formatToolCall(block.name, block.input || {}));
              output.push("");
            }
          }
        }

        // 最终结果
        if (message.type === "result") {
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          output.push("═".repeat(60));
          
          if (message.subtype === "success") {
            output.push("✅ Cowork 任务完成!");
            output.push("");
            output.push(`📊 统计: 耗时 ${duration}s | 轮次 ${turnCount} | 工具调用 ${toolCallCount}`);
            
            const cost = (message as any).total_cost_usd;
            if (cost) {
              output.push(`💰 费用: $${cost.toFixed(4)}`);
            }
          } else {
            output.push(`❌ 任务失败: ${message.subtype}`);
          }
          output.push("═".repeat(60));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      output.push("");
      output.push("═".repeat(60));
      output.push(`❌ Cowork 执行出错: ${errorMessage}`);
      output.push("");
      output.push(getErrorHelp(errorMessage));
      output.push("═".repeat(60));
    }

    return output.join("\n");
  },
});

// ============================================
// Helper Functions
// ============================================

function formatToolCall(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case "Read":
      return `   📖 读取: ${input.file_path || input.path}`;
    case "Write":
      return `   ✏️ 写入: ${input.file_path || input.path}`;
    case "Edit":
      return `   🔧 编辑: ${input.file_path || input.path}`;
    case "Glob":
      return `   🔍 搜索文件: ${input.pattern}`;
    case "Grep":
      return `   🔎 搜索内容: "${input.pattern}"`;
    case "Bash":
      return `   💻 命令: ${input.command}`;
    default:
      return `   📌 参数: ${JSON.stringify(input).slice(0, 80)}`;
  }
}

function getErrorHelp(errorMessage: string): string {
  if (errorMessage.includes("ANTHROPIC_API_KEY")) {
    return "💡 提示: 请设置 ANTHROPIC_API_KEY 环境变量";
  }
  if (errorMessage.includes("claude") && errorMessage.includes("not found")) {
    return "💡 提示: 请安装 Claude Code CLI: npm install -g @anthropic-ai/claude-code";
  }
  return "💡 提示: 请检查网络连接和 API 配置";
}
