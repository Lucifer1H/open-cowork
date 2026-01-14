# 🤝 OpenCode Cowork

<p align="center">
  <strong>Autonomous AI assistant for complex file operations in OpenCode</strong>
</p>

<p align="center">
  English | <a href="./README_ZH.md">简体中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenCode-Command-blue" alt="OpenCode Command">
  <img src="https://img.shields.io/badge/Zero-Dependencies-green" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## 🎯 What is this?

OpenCode Cowork brings [Claude Cowork](https://www.anthropic.com/news/cowork)'s autonomous agent capabilities to [OpenCode](https://github.com/sst/opencode).

Instead of just answering questions, Cowork **actively completes tasks** - reading files, making edits, running commands, and verifying results autonomously.

```
/cowork Reorganize the src folder, separate utils into their own modules
```

Cowork will:
1. 📖 Explore the codebase to understand the structure
2. 📝 Create a reorganization plan
3. ✏️ Execute file moves and edits step by step
4. ✅ Verify everything works correctly
5. 📋 Summarize what was done

## ✨ Features

- **🤖 Autonomous Agent** - Works like a colleague, not just a chatbot
- **📋 Task Planning** - Analyzes tasks and creates execution plans
- **🔄 Progress Updates** - Shows what it's doing at each step
- **🔒 Safe by Default** - Uses OpenCode's built-in permission system
- **📦 Zero Dependencies** - Just one markdown file
- **🔌 Model Agnostic** - Works with any model configured in OpenCode

## 📋 Prerequisites

- [OpenCode](https://github.com/sst/opencode) installed and configured

That's it! No extra API key needed.

## 🚀 Installation

### One-line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/Lucifer1H/open-cowork/main/install.sh | bash
```

### Or Clone & Install

```bash
git clone https://github.com/Lucifer1H/open-cowork.git
cd open-cowork && ./install.sh
```

### Manual Installation

```bash
mkdir -p ~/.config/opencode/command
curl -fsSL https://raw.githubusercontent.com/Lucifer1H/open-cowork/main/command/cowork.md -o ~/.config/opencode/command/cowork.md
```

## 📖 Usage

```bash
# Start OpenCode
opencode

# Use /cowork command
/cowork <your task description>
```

### Examples

```bash
# Code refactoring
/cowork Refactor the authentication module, extract validation logic

# File organization
/cowork Reorganize the components folder by feature instead of type

# Documentation
/cowork Analyze the codebase and generate comprehensive API documentation

# Bug investigation
/cowork Find why the login fails intermittently and fix it

# Code migration
/cowork Convert all class components to functional components with hooks

# Data processing
/cowork Parse all JSON files in data/ and create a summary spreadsheet
```

## ⚙️ Customization

Edit `~/.config/opencode/command/cowork.md` to customize the AI's behavior, add specific guidelines for your project, or change the execution flow.

## 🔌 Oh My OpenCode Integration

If you use [Oh My OpenCode](https://github.com/code-yeongyu/oh-my-opencode), add to `oh-my-opencode.json`:

```json
{
  "agents": {
    "cowork": {
      "description": "Cowork mode - Autonomously complete complex tasks",
      "prompt_append": "Enter Cowork mode. Complete tasks autonomously, explain before each modification."
    }
  }
}
```

Then use `@cowork` to invoke.

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[MIT](./LICENSE)

## 🙏 Acknowledgments

- [OpenCode](https://github.com/sst/opencode) - Powerful terminal AI coding assistant
- [Claude-Cowork](https://github.com/DevAgentForge/Claude-Cowork) - Inspiration source

---

<p align="center">
  If this project helps you, please give it a ⭐️
</p>
