#!/bin/bash

# Launch Zellij with Welpco development layout
# This creates separate panes for each service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if Zellij is installed
if ! command -v zellij &> /dev/null; then
    echo "❌ Zellij is not installed."
    echo "Install it with: cargo install zellij"
    echo "Or visit: https://zellij.dev/documentation/installation.html"
    exit 1
fi

# Change to monorepo directory
cd "$MONOREPO_DIR"

# Update the layout file with the current directory
LAYOUT_FILE=".zellij/layouts/welpco-dev.kdl"
TEMP_LAYOUT="/tmp/welpco-dev-$$.kdl"

# Replace the absolute path in the layout with the current directory
sed "s|/Users/rabie/Developer/welpco/welpco-monorepo|$MONOREPO_DIR|g" "$LAYOUT_FILE" > "$TEMP_LAYOUT"

# Launch Zellij with the layout
echo "🚀 Launching Zellij with Welpco development layout..."
echo "📁 Monorepo directory: $MONOREPO_DIR"
zellij --layout "$TEMP_LAYOUT"

# Cleanup
rm -f "$TEMP_LAYOUT"

