# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
