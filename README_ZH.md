# 🤝 OpenCode Cowork

<p align="center">
  <strong>将 Claude-Cowork 的自主文件操作能力带入 OpenCode 终端环境</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> | 简体中文
</p>

---

## 🎯 这是什么？

OpenCode Cowork 是一个 [OpenCode](https://github.com/sst/opencode) 插件，让你在终端中通过简单的 `/cowork` 命令，让 AI 自主完成复杂的文件操作任务。

```
/cowork 重构 src/utils.ts，提取公共函数到单独的模块
```

## ✨ 特性

- **🤖 自主执行** - AI 自动分析任务、探索代码、执行修改
- **🔒 安全确认** - 每次文件操作都需要用户确认
- **📺 流式输出** - 实时显示 AI 的思考过程
- **🔌 深度集成** - 与 Oh My OpenCode 无缝配合

## 🚀 快速开始

```bash
# 前置要求
npm install -g @anthropic-ai/claude-code
export ANTHROPIC_API_KEY=your-api-key

# 安装
git clone https://github.com/YOUR_USERNAME/open-cowork.git
cd open-cowork
./install.sh

# 使用
opencode
/cowork 你的任务描述
```

## 📖 使用示例

```bash
/cowork 将类组件重构为函数式组件
/cowork 分析项目结构，生成 README.md
/cowork 找出安全漏洞并修复
/cowork 为 User 模型添加邮箱验证
```

## 📄 许可证

MIT
