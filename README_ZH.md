# 🤝 OpenCode Cowork

<p align="center">
  <strong>在 OpenCode 中自主完成复杂任务的 AI 代理</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> | 简体中文
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenCode-Command-blue" alt="OpenCode Command">
  <img src="https://img.shields.io/badge/零依赖-green" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## 🎯 这是什么？

OpenCode Cowork 将 [Claude Cowork](https://www.anthropic.com/news/cowork) 的自主代理能力带入 [OpenCode](https://github.com/sst/opencode)。

不只是回答问题，Cowork **主动完成任务** - 读取文件、进行编辑、运行命令、验证结果，全程自主执行。

```
/cowork 重组 src 文件夹，将工具函数分离到独立模块
```

Cowork 会：
1. 📖 探索代码库，理解结构
2. 📝 制定重组计划
3. ✏️ 逐步执行文件移动和编辑
4. ✅ 验证一切正常工作
5. 📋 总结完成的工作

## ✨ 特性

- **🤖 自主代理** - 像同事一样工作，而不只是聊天机器人
- **📋 任务规划** - 分析任务并制定执行计划
- **🔄 进度更新** - 每一步都展示正在做什么
- **🔒 安全可控** - 使用 OpenCode 内置的权限系统
- **🧩 插件化运行时（v3 Beta）** - 内置 planner/executor/validator 和能力插件
- **🔁 强兼容** - `/cowork` 用法与 `install.sh` 保持不变
- **📦 零外部依赖** - 运行时与测试不依赖第三方 npm 包
- **🔌 模型无关** - 使用你在 OpenCode 中配置的任何模型

## 🧱 v3 架构（Beta）

`open-cowork` 现在采用双轨设计：

- 兼容适配层：保留 `command/cowork.md`，保证老用户体验不变
- 核心运行时：`planner` + `executor` + `validator` + `reporter`
- 能力插件：`refactor`、`bugfix`、`docgen`、`migration`
- 配置策略：`safe`、`balanced`、`aggressive`

命令入口仍然是 `/cowork <task>`，现有安装和使用方式继续有效。

## 📋 前置要求

- [OpenCode](https://github.com/sst/opencode) 已安装并配置

就这些！不需要额外的 API Key。

## 🚀 安装

### 一键安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/Lucifer1H/open-cowork/main/install.sh | bash
```

### 或者克隆安装

```bash
git clone https://github.com/Lucifer1H/open-cowork.git
cd open-cowork && ./install.sh
```

### 手动安装

```bash
mkdir -p ~/.config/opencode/command
curl -fsSL https://raw.githubusercontent.com/Lucifer1H/open-cowork/main/command/cowork.md -o ~/.config/opencode/command/cowork.md
```

## 📖 使用

```bash
# 启动 OpenCode
opencode

# 使用 /cowork 命令
/cowork <你的任务描述>
```

### 示例

```bash
# 代码重构
/cowork 重构认证模块，提取验证逻辑

# 文件整理
/cowork 按功能重新组织 components 文件夹

# 生成文档
/cowork 分析代码库并生成完整的 API 文档

# Bug 调查
/cowork 找出登录间歇性失败的原因并修复

# 代码迁移
/cowork 将所有类组件转换为带 hooks 的函数式组件
```

## ⚙️ 自定义

编辑 `~/.config/opencode/command/cowork.md` 可以自定义 AI 的行为、添加项目特定的指导原则或修改执行流程。

## 🤝 贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## ⭐ Star 趋势图

[![Star History Chart](https://api.star-history.com/svg?repos=Lucifer1H/open-cowork&type=Date)](https://www.star-history.com/#Lucifer1H/open-cowork&Date)

## 📄 许可证

[MIT](./LICENSE)

## 🙏 致谢

- [OpenCode](https://github.com/sst/opencode) - 强大的终端 AI 编码助手
- [Claude Cowork](https://www.anthropic.com/news/cowork) - 灵感来源

---

<p align="center">
  如果这个项目对你有帮助，请给一个 ⭐️
</p>
