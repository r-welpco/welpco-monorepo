# Zellij Setup for Welpco Monorepo

## What is Zellij?

Zellij is a terminal workspace manager that allows you to split your terminal into multiple panes, each running a different service. This gives you a visual separation of all your services' logs.

## Installation

### macOS
```bash
brew install zellij
```

### Linux
```bash
cargo install zellij
```

### Other methods
Visit: https://zellij.dev/documentation/installation.html

## Usage

### Option 1: Using the script (Recommended)
```bash
pnpm dev:zellij
# or
./scripts/dev-zellij.sh
```

### Option 2: Manual launch
```bash
zellij --layout .zellij/layouts/welpco-dev.kdl
```

## Layout Structure

The layout stacks three horizontal bands:

- **Top row**: **Web** (Next.js `:8081`) | **BFF** (NestJS `:3000`)
- **Middle row**: **Admin** (`:8082`) | **Design system** (Storybook `:6006`) | **Stripe CLI** (`stripe listen` → `http://127.0.0.1:3000/api/webhooks/stripe`)
- **Bottom row**: **Docker Compose** (`docker compose up` — Postgres `:5432`, Mailhog UI `:8025`)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) so the Stripe pane starts. If `stripe` is missing, that pane will exit; you can run the same command manually in a spare pane. **Docker Desktop** (or another Docker engine) must be running or the Compose pane will fail.

## Zellij Keyboard Shortcuts

- `Ctrl + g` then `d` - Detach from session (keeps services running)
- `Ctrl + g` then `z` - Toggle fullscreen on current pane
- `Ctrl + g` then `←→↑↓` - Navigate between panes
- `Ctrl + g` then `c` - Create new pane
- `Ctrl + g` then `x` - Close current pane
- `Ctrl + g` then `?` - Show all shortcuts

## Customizing the Layout

Edit `.zellij/layouts/welpco-dev.kdl` to customize:
- Pane sizes
- Service arrangement
- Add/remove services

## Alternative: TMUX

If you prefer tmux, use:
```bash
./scripts/dev-tmux.sh
```

TMUX provides similar functionality with different keyboard shortcuts.

