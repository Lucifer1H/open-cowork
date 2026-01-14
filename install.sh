#!/bin/bash

# OpenCode Cowork 插件安装脚本

set -e

echo "🚀 安装 OpenCode Cowork 插件..."
echo ""

# 检查 Claude Code CLI
if ! command -v claude &> /dev/null; then
    echo "❌ 未检测到 Claude Code CLI"
    echo "   请先安装: npm install -g @anthropic-ai/claude-code"
    exit 1
fi
echo "✅ Claude Code CLI 已安装"

# 检查 ANTHROPIC_API_KEY
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  未设置 ANTHROPIC_API_KEY 环境变量"
    echo "   请在 ~/.zshrc 或 ~/.bashrc 中添加:"
    echo "   export ANTHROPIC_API_KEY=your-api-key"
fi

# 创建目录
GLOBAL_TOOL_DIR="$HOME/.config/opencode/tool"
GLOBAL_COMMAND_DIR="$HOME/.config/opencode/command"
GLOBAL_CONFIG_DIR="$HOME/.config/opencode"

mkdir -p "$GLOBAL_TOOL_DIR"
mkdir -p "$GLOBAL_COMMAND_DIR"

echo ""
echo "📁 安装目录:"
echo "   工具: $GLOBAL_TOOL_DIR"
echo "   命令: $GLOBAL_COMMAND_DIR"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 复制文件
cp "$SCRIPT_DIR/plugin/cowork.ts" "$GLOBAL_TOOL_DIR/cowork.ts"
cp "$SCRIPT_DIR/command/cowork.md" "$GLOBAL_COMMAND_DIR/"

echo "✅ 插件文件已复制"

# 安装依赖
echo ""
echo "📦 安装依赖..."

cd "$GLOBAL_CONFIG_DIR"

# 检查或创建 package.json
if [ ! -f "package.json" ]; then
    echo '{"name": "opencode-config", "private": true, "dependencies": {}}' > package.json
fi

# 使用 bun 或 npm 安装依赖
if command -v bun &> /dev/null; then
    bun add @anthropic-ai/claude-agent-sdk
else
    npm install @anthropic-ai/claude-agent-sdk
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ 安装完成!"
echo ""
echo "使用方法:"
echo "  在 OpenCode 中输入: /cowork <你的任务>"
echo ""
echo "示例:"
echo "  /cowork 重构 src/utils.ts，提取公共函数"
echo "  /cowork 分析项目结构，生成 README.md"
echo "  /cowork 找出所有 TODO 注释并创建任务列表"
echo "═══════════════════════════════════════════════════════"
