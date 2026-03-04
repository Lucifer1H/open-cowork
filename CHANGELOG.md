# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0-beta.2] - 2026-03-04

### Added
- approval gate orchestration with `plan_only` and `approvalToken` support
- deterministic task session state machine and risk policy engine
- scheduler core for once and interval jobs
- global + project instruction layering
- observability event store and metrics snapshot
- plugin manifest compatibility validation
- golden task regression runner (`npm run golden:run`)
- docs consistency checker script (`scripts/docs-check.cjs`)

### Changed
- README and README_ZH now document approval flow, scheduling API, and instruction files
- CONTRIBUTING includes golden runner in local validation workflow

## [3.0.0-beta.1] - 2026-03-04

### Added
- Plugin runtime core modules: planner, executor, validator, reporter
- Built-in capability plugins: refactor, bugfix, docgen, migration
- Profile and project-level config loading (`safe`, `balanced`, `aggressive`)
- Adapter build pipeline and compatibility tests
- Node built-in test suite for core runtime and command compatibility

### Changed
- Keep `/cowork` command entrypoint while introducing runtime adapter architecture
- `install.sh` now prefers generated `dist/command/cowork.md` when available
- Package scripts now include `npm test` and `npm run build` for verification

## [2.0.0] - 2026-01-14

### Changed
- **Breaking**: Simplified to zero-dependency command mode
- No longer requires `@anthropic-ai/claude-agent-sdk`
- No longer requires `ANTHROPIC_API_KEY` - uses OpenCode's configured model
- Converted from TypeScript plugin to simple markdown command

### Added
- One-line remote installation: `curl -fsSL .../install.sh | bash`
- Enhanced autonomous agent behavior similar to Claude Cowork
- Bilingual README (English/Chinese)

### Removed
- `plugin/cowork.ts` - TypeScript plugin
- `tsconfig.json` - TypeScript config
- All npm dependencies

## [1.0.0] - 2026-01-14

### Added
- Initial release
- `/cowork` command for autonomous file operations
- Integration with Claude Agent SDK
- Oh My OpenCode integration support
