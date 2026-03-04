#!/bin/bash

# OpenCode Cowork - One-click installer
# https://github.com/Lucifer1H/open-cowork

set -e

REPO_URL="https://raw.githubusercontent.com/Lucifer1H/open-cowork/main"
GLOBAL_COMMAND_DIR="$HOME/.config/opencode/command"

echo "🚀 Installing OpenCode Cowork..."
echo ""

# Create directory
mkdir -p "$GLOBAL_COMMAND_DIR"

# Detect if running from local repo or remote
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" 2>/dev/null)" && pwd 2>/dev/null)" || SCRIPT_DIR=""

if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/command/cowork.md" ]; then
    # Local installation
    echo "📁 Installing from local files..."
    if [ -f "$SCRIPT_DIR/dist/command/cowork.md" ]; then
        cp "$SCRIPT_DIR/dist/command/cowork.md" "$GLOBAL_COMMAND_DIR/cowork.md"
    else
        cp "$SCRIPT_DIR/command/cowork.md" "$GLOBAL_COMMAND_DIR/cowork.md"
    fi
else
    # Remote installation
    echo "📥 Downloading from GitHub..."
    curl -fsSL "$REPO_URL/command/cowork.md" -o "$GLOBAL_COMMAND_DIR/cowork.md"
fi

echo ""
echo "════════════════════════════════════════════════"
echo "✅ Installation complete!"
echo ""
echo "Usage: /cowork <task>"
echo ""
echo "Examples:"
echo "  /cowork Refactor src/utils.ts"
echo "  /cowork Generate README.md"
echo "  /cowork Find and fix security issues"
echo ""
echo "No extra API key needed - uses OpenCode's model!"
echo "════════════════════════════════════════════════"
