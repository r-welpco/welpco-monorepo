#!/bin/bash

# Alternative: TMUX script for separate panes
# If you prefer tmux over Zellij

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux is not installed."
    echo "Install it with: brew install tmux (macOS) or apt-get install tmux (Linux)"
    exit 1
fi

cd "$MONOREPO_DIR"

# Create new tmux session or attach to existing
SESSION_NAME="welpco-dev"

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "📋 Attaching to existing session: $SESSION_NAME"
    tmux attach -t "$SESSION_NAME"
else
    echo "🚀 Creating new tmux session: $SESSION_NAME"
    
    # Create new session with first window
    tmux new-session -d -s "$SESSION_NAME" -n "web" -c "$MONOREPO_DIR" "pnpm --filter web dev"
    
    # Split window and create panes for each service
    tmux split-window -h -t "$SESSION_NAME:web" "pnpm --filter user-management dev"
    tmux split-window -v -t "$SESSION_NAME:web" "pnpm --filter profile-management dev"
    
    # Create new windows for other services
    tmux new-window -t "$SESSION_NAME" -n "services-1" -c "$MONOREPO_DIR" "pnpm --filter service-discovery dev"
    tmux split-window -h -t "$SESSION_NAME:services-1" "pnpm --filter job-posting-matching dev"
    tmux split-window -v -t "$SESSION_NAME:services-1" "pnpm --filter booking-scheduling dev"
    
    tmux new-window -t "$SESSION_NAME" -n "services-2" -c "$MONOREPO_DIR" "pnpm --filter payment-processing dev"
    tmux split-window -h -t "$SESSION_NAME:services-2" "pnpm --filter communication dev"
    tmux split-window -v -t "$SESSION_NAME:services-2" "pnpm --filter review-rating dev"
    
    tmux new-window -t "$SESSION_NAME" -n "services-3" -c "$MONOREPO_DIR" "pnpm --filter dispute-resolution dev"
    tmux split-window -h -t "$SESSION_NAME:services-3" "pnpm --filter safety-verification dev"
    tmux split-window -h -t "$SESSION_NAME:services-3" "pnpm --filter notification dev"
    tmux split-window -h -t "$SESSION_NAME:services-3" "pnpm --filter content-management dev"
    
    # Select first window and attach
    tmux select-window -t "$SESSION_NAME:web"
    tmux attach -t "$SESSION_NAME"
fi

