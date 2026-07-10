# Agent Guide — Orientation

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Guidance for AI coding agents (Claude Code and similar) working in this repo. Read this folder first, then act.

## Read order

1. **This folder** (`documentation/agents/`) — [codebase-map.md](codebase-map.md), [conventions.md](conventions.md), [guardrails.md](guardrails.md), [common-tasks.md](common-tasks.md).
2. **[../getting-started/setup.md](../getting-started/setup.md)** — local environment, database, running the stack.
3. **The domain doc for the area you are touching** — [../architecture/domains/README.md](../architecture/domains/README.md).

## Source-of-truth rule

**Implementation beats documentation.** When a doc and the code disagree, the code is right — verify claims in source before relying on them.

- The old doc trees (`updated_functional_architecture/`, `features/`, `bible/`, most of `docs/`) were **removed on 2026-07-04** — they were stale. If you find references to them, or resurrect them from git history, treat the content as unverified. The feature-ticket backlog formerly at `features/` now lives at [../improvements/backlog/](../improvements/backlog/README.md).
- Current documentation lives in `documentation/`.
- Three exceptions are audited current and authoritative:
  - `packages/ui/ui-ux-bible.md` — design rules (lint-enforced, see [conventions.md](conventions.md))
  - `packages/ui/PLATFORM-UX.md` — platform UX rules
  - `apps/web/components/features/marketing/CLAUDE.md` — marketing-folder policy

## Before you edit — checklist

1. **Find the owning domain module.** BFF work belongs in one of the 13 domains under `apps/bff/src/domains/` — see [codebase-map.md](codebase-map.md). Don't scatter logic across domains or into `common/` unless it is genuinely cross-cutting.
2. **Check for uncommitted work.** `git status` — this repo often has in-flight changes on `main`. Never revert or overwrite modifications you didn't make.
3. **Read the guardrails** in [guardrails.md](guardrails.md) — especially before touching the payment domain or migrations.
4. **After editing, verify the touched app:**
   - Lint: `pnpm --filter @welpco/<app> lint`
   - Types: `pnpm --filter @welpco/<app> type-check` (web, admin, bff all have it)
   - Tests: `pnpm --filter @welpco/bff test` for BFF unit tests; e2e per [conventions.md](conventions.md)
