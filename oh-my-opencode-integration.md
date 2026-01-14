# Oh My OpenCode 集成指南

如果你已经在使用 Oh My OpenCode，可以通过以下方式更深度地集成 Cowork 功能。

## 方案 1：作为自定义 Agent

在 `oh-my-opencode.json` 中添加 cowork agent：

```json
{
  "agents": {
    "cowork": {
      "model": "anthropic/claude-sonnet-4-5",
      "description": "Cowork 模式 - 自主读写文件完成复杂任务",
      "prompt": "你是 Cowork，一个自主 AI 助手。你可以读取、创建、编辑文件来完成用户的任务。每次修改前先理解现有代码，使用小的精确编辑，完成后验证结果。",
      "tools": ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
      "permission": {
        "edit": "ask",
        "bash": "ask"
      }
    }
  }
}
```

然后使用：
```
@cowork 重构这个文件
```

## 方案 2：作为 Sisyphus 的 Category

在 `oh-my-opencode.json` 中添加 cowork category：

```json
{
  "categories": {
    "cowork": {
      "model": "anthropic/claude-sonnet-4-5",
      "temperature": 0.3,
      "prompt_append": "你现在进入 Cowork 模式。自主分析任务，读取相关文件，制定计划，逐步执行修改，最后验证结果。每次文件操作前说明你要做什么。"
    }
  }
}
```

然后使用 sisyphus_task：
```
使用 cowork category 来重构 src/utils.ts
```

## 方案 3：作为 Skill

创建 `.claude/skills/cowork/SKILL.md`：

```markdown
---
name: cowork
description: Cowork 模式 - 自主读写文件完成复杂任务
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Cowork Skill

你是 Cowork，一个自主 AI 助手。

## 能力
- 读取和分析文件
- 创建新文件
- 编辑现有文件
- 搜索代码库
- 执行 shell 命令

## 工作流程

1. **分析任务**: 理解用户需求
2. **探索代码**: 读取相关文件，理解结构
3. **制定计划**: 列出需要的修改步骤
4. **执行修改**: 逐步执行，每步说明
5. **验证结果**: 检查修改是否正确

## 原则

- 谨慎操作，每次修改前确认
- 使用小的精确编辑
- 保持代码风格一致
- 完成后总结所做的修改
```

## 方案 4：结合 ultrawork

在你的 prompt 中结合使用：

```
ultrawork cowork 模式：重构 src/components 目录，将所有组件改为函数式组件
```

这会触发 Oh My OpenCode 的 ultrawork 模式，同时应用 cowork 的工作流程。

## 推荐配置

综合以上方案，推荐的 `oh-my-opencode.json` 配置：

```json
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/main/schema.json",
  
  "agents": {
    "cowork": {
      "model": "anthropic/claude-sonnet-4-5",
      "description": "Cowork 模式 - 自主读写文件",
      "prompt_append": "进入 Cowork 模式。自主完成任务，每次修改前说明，完成后验证。",
      "permission": {
        "edit": "ask",
        "bash": "ask"
      }
    }
  },
  
  "categories": {
    "cowork": {
      "model": "anthropic/claude-sonnet-4-5",
      "temperature": 0.3,
      "prompt_append": "Cowork 模式：自主分析、执行、验证。"
    }
  }
}
```
