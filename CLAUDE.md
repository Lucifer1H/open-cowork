# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**请用中文与我交流。每次回答之前请先称呼"黄总"。**

## Project Overview

OpenCode Cowork is an autonomous AI agent plugin for [OpenCode](https://github.com/sst/opencode). It enables users to delegate complex file operations to an AI agent that can read, edit, create files, run commands, and verify results autonomously.

- **Zero external npm dependencies** - All runtime and tests use Node.js built-in modules only
- **Model agnostic** - Works with any model configured in OpenCode
- **Target Platform**: OpenCode CLI (terminal AI assistant)

## Commands

```bash
# Run all tests
npm test

# Run a single test file
node --test tests/core/models.test.js

# Build (syntax check + generate command)
npm run build

# Check documentation coverage
npm run docs:check

# Run golden regression tests
npm run golden:run

# Install command globally to ~/.config/opencode/command/
npm run install:global

# Install command locally to .opencode/command/
npm run install:local
```

## Architecture

OpenCode Cowork uses a dual-track design:

### 1. Legacy Adapter Layer
- `src/adapter/legacy-adapter.cjs` - Maintains backward compatibility with existing `/cowork` command
- Reads from `command/cowork.md` template, generates to `dist/command/cowork.md`

### 2. Core Runtime (`src/index.cjs`)
Entry point: `createCoworkRuntime()`

Core modules in `src/core/`:
- **Orchestrator** (`orchestrator.cjs`) - Main task execution coordinator
- **Models** (`models.cjs`) - Task request models, risk levels, modes
- **Task Session** (`task-session.cjs`) - State machine for task lifecycle
- **Policy Engine** (`policy-engine.cjs`) - Risk-based approval decisions
- **Planner** (`planner.cjs`) - Task decomposition
- **Executor** (`executor.cjs`) - Step execution pipeline
- **Validator** (`validator.cjs`) - Result verification
- **Reporter** (`reporter.cjs`) - Progress and summary generation
- **Plugin Registry** (`plugin-registry.cjs`) - Plugin management and routing

### 3. Capability Plugins (`src/plugins/`)
Built-in plugins: `refactor.cjs`, `bugfix.cjs`, `docgen.cjs`, `migration.cjs`

Each plugin implements:
```javascript
{
  id: string,
  manifest: { name, version, runtime, capabilities },
  canHandle(task): boolean,
  plan(): Plan,
  run(): RunResult,
  verify(): VerifyResult
}
```

### 4. Configuration Profiles (`src/config/profiles.cjs`)
| Profile | Auto Execute | Max Parallel Steps |
|---------|-------------|-------------------|
| `safe` | false | 1 |
| `balanced` (default) | true | 2 |
| `aggressive` | true | 4 |

### 5. Scheduler (`src/scheduler/engine.cjs`)
- `createOnceJob()` - One-time scheduled tasks
- `createIntervalJob()` - Recurring tasks
- `pollDueJobs()` - Check and return due jobs

### 6. Observability (`src/observability/`)
- `event-store.cjs` - Event logging
- `metrics.cjs` - Metrics snapshot computation

## Task Execution Flow

```
UNDERSTAND → EXPLORE → PLAN → EXECUTE → VERIFY → SUMMARIZE
```

- Tasks can be in `plan_only` mode (returns plan for approval)
- High-risk tasks require `approvalToken` before execution
- Risk policies control auto-approval thresholds

## Key Files

| File | Purpose |
|------|---------|
| `command/cowork.md` | Main command template for OpenCode |
| `src/index.cjs` | Runtime entry point |
| `install.sh` | Installation script |
| `.opencode/cowork.config.json` | Project-level config |
| `.opencode/cowork.instructions.json` | Project-level instructions |
| `~/.config/opencode/cowork.instructions.json` | Global instructions |