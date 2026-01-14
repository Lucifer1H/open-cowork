# 🤝 OpenCode Cowork

<p align="center">
  <strong>将 Claude-Cowork 的自主文件操作能力带入 OpenCode 终端环境</strong>
</p>

<p align="center">
  <a href="#-特性">特性</a> •
  <a href="#-安装">安装</a> •
  <a href="#-使用">使用</a> •
  <a href="#-配置">配置</a> •
  <a href="#-oh-my-opencode-集成">Oh My OpenCode</a> •
  <a href="#-贡献">贡献</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenCode-Plugin-blue" alt="OpenCode Plugin">
  <img src="https://img.shields.io/badge/Claude-Agent%20SDK-orange" alt="Claude Agent SDK">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## 🎯 这是什么？

OpenCode Cowork 是一个 [OpenCode](https://github.com/sst/opencode) 插件，将 [Claude-Cowork](https://github.com/DevAgentForge/Claude-Cowork) 的核心能力集成到终端环境中。

通过简单的 `/cowork` 命令，你可以让 AI 自主完成复杂的文件操作任务：

```
/cowork 重构 src/utils.ts，提取公共函数到单独的模块
```

AI 会自动：
1. 📖 读取相关文件，理解代码结构
2. 📝 制定重构计划
3. ✏️ 逐步执行修改（每次都会请求确认）
4. ✅ 验证结果

## ✨ 特性

- **🤖 自主执行** - AI 自动分析任务、探索代码、执行修改
- **🔒 安全确认** - 每次文件操作都需要用户确认
- **📺 流式输出** - 实时显示 AI 的思考过程和工具调用
- **🔧 完整工具集** - 读取、写入、编辑、搜索、执行命令
- **🔌 深度集成** - 与 Oh My OpenCode 无缝配合

## 📋 前置要求

- [OpenCode](https://github.com/sst/opencode) 已安装
- [Claude Code CLI](https://www.npmjs.com/package/@anthropic-ai/claude-code) 已安装并认证
- `ANTHROPIC_API_KEY` 环境变量已设置

```bash
# 安装 Claude Code CLI
npm install -g @anthropic-ai/claude-code

# 认证
claude

# 设置 API Key
export ANTHROPIC_API_KEY=your-api-key
```

## 🚀 安装

### 方式一：一键安装（推荐）

```bash
git clone https://github.com/YOUR_USERNAME/open-cowork.git
cd open-cowork
./install.sh
```

### 方式二：手动安装

```bash
# 1. 复制工具文件
mkdir -p ~/.config/opencode/tool
cp plugin/cowork.ts ~/.config/opencode/tool/cowork.ts

# 2. 复制命令文件
mkdir -p ~/.config/opencode/command
cp command/cowork.md ~/.config/opencode/command/

# 3. 安装依赖
cd ~/.config/opencode
npm install @anthropic-ai/claude-agent-sdk
```

### 方式三：项目级安装

```bash
# 在你的项目目录中
mkdir -p .opencode/tool .opencode/command
cp plugin/cowork.ts .opencode/tool/cowork.ts
cp command/cowork.md .opencode/command/
```

## 📖 使用

### 基本用法

```bash
# 启动 OpenCode
opencode

# 使用 /cowork 命令
/cowork <你的任务描述>
```

### 示例

```bash
# 代码重构
/cowork 将 src/components 中的类组件重构为函数式组件

# 生成文档
/cowork 分析项目结构，生成详细的 README.md

# Bug 修复
/cowork 找出 auth.ts 中的安全漏洞并修复

# 代码分析
/cowork 找出所有 TODO 注释，创建任务清单

# 添加功能
/cowork 为 User 模型添加邮箱验证功能
```

### 输出示例

```
╔══════════════════════════════════════════════════════════╗
║ 🤖 Cowork 模式启动                                        ║
╠══════════════════════════════════════════════════════════╣
║ 📁 目录: /Users/dev/my-project                           ║
║ 🧠 模型: sonnet                                          ║
║ 🔧 工具: Read, Write, Edit, Glob, Grep, Bash             ║
╠══════════════════════════════════════════════════════════╣
║ 📋 任务:                                                  ║
║   重构 src/utils.ts，提取公共函数到单独的模块              ║
╚══════════════════════════════════════════════════════════╝

🔗 会话: abc123...

────────────────────────────────────────────────────────────
💭 思考 [轮次 1]:

   首先，我需要读取 src/utils.ts 文件，了解其中包含哪些函数...

🔨 工具调用 #1: Read
   📖 读取: src/utils.ts
   📤 结果预览:
      export function formatDate(date: Date): string { ... }
      export function debounce(fn: Function, delay: number) { ... }
      ...

────────────────────────────────────────────────────────────
💭 思考 [轮次 2]:

   我发现文件中有以下几类函数：
   1. 日期处理函数
   2. 工具函数（debounce, throttle）
   3. 字符串处理函数
   
   我将创建三个独立模块...

🔨 工具调用 #2: Write
   ✏️ 写入: src/utils/date.ts
   📝 内容: 156 字符

════════════════════════════════════════════════════════════
✅ Cowork 任务完成!

📊 统计:
   • 耗时: 45.2s
   • 轮次: 8
   • 工具调用: 12
   • 费用: $0.0234
   • Token: 3420 输入 / 1856 输出
════════════════════════════════════════════════════════════
```

## ⚙️ 配置

### 修改默认配置

编辑 `~/.config/opencode/tool/cowork.ts` 中的 `DEFAULT_CONFIG`：

```typescript
const DEFAULT_CONFIG: CoworkConfig = {
  model: "sonnet",           // opus | sonnet | haiku
  maxTurns: 50,              // 最大交互轮数
  permissionMode: "default", // default | acceptEdits | bypassPermissions
  allowedTools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
};
```

### 权限模式说明

| 模式 | 说明 |
|------|------|
| `default` | 每次操作都需要确认（推荐） |
| `acceptEdits` | 自动批准文件编辑，其他操作需确认 |
| `bypassPermissions` | 完全自主，无需确认（谨慎使用） |

## 🔌 Oh My OpenCode 集成

如果你使用 [Oh My OpenCode](https://github.com/code-yeongyu/oh-my-opencode)，可以更深度地集成。

### 作为自定义 Agent

在 `oh-my-opencode.json` 中添加：

```json
{
  "agents": {
    "cowork": {
      "model": "anthropic/claude-sonnet-4-5",
      "description": "Cowork 模式 - 自主读写文件完成复杂任务",
      "prompt_append": "进入 Cowork 模式。自主完成任务，每次修改前说明，完成后验证。",
      "permission": {
        "edit": "ask",
        "bash": "ask"
      }
    }
  }
}
```

然后使用 `@cowork` 调用：

```
@cowork 重构这个文件
```

### 结合 ultrawork

```
ultrawork cowork: 重构整个 src/components 目录
```

详细集成指南请参考 [oh-my-opencode-integration.md](./oh-my-opencode-integration.md)。

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/open-cowork.git
cd open-cowork

# 安装依赖
npm install

# TypeScript 检查
npm run lint

# 本地测试
./install.sh
```

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

[MIT](./LICENSE)

## 🙏 致谢

- [OpenCode](https://github.com/sst/opencode) - 强大的终端 AI 编码助手
- [Oh My OpenCode](https://github.com/code-yeongyu/oh-my-opencode) - OpenCode 增强插件
- [Claude-Cowork](https://github.com/DevAgentForge/Claude-Cowork) - 灵感来源
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript) - 核心能力支持

---

<p align="center">
  如果这个项目对你有帮助，请给一个 ⭐️
</p>
