# Deployment

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

**Status: there is no deployment pipeline. This document describes a gap, not a process.** Nothing below should be read as "how we deploy" — it is "what exists today and what a deploy would require by hand."

## What does NOT exist (verified)

- No `.github/workflows` directory — no CI at all (also checked: `.gitlab-ci.yml`, `.circleci`, `Jenkinsfile`, `.buildkite`, `cloudbuild.yaml`, `azure-pipelines.yml`).
- No `vercel.json`, `netlify.toml`, `fly.toml`, `render.yaml`, `Procfile`.
- No `Dockerfile` for any app (the root `docker-compose.yml` is dev-only: `postgres:16.6-alpine` + MailHog, hardcoded `welpco_dev` credentials).
- No deploy scripts in any `package.json`.
- Root `README.md` mentions AWS CDK in the tech-stack table but contains zero deployment instructions.

## What exists: `infrastructure/` (AWS CDK scaffolding only)

Single CDK app (`infrastructure/bin/infrastructure.ts`) defining one stack:

| Stack | File | Contents |
|---|---|---|
| `InfrastructureStack` | `infrastructure/lib/infrastructure-stack.ts` | **Empty.** Constructor body is a TODO: "Add DatabaseStack (RDS PostgreSQL) and compute for single backend (e.g. ECS Fargate service or Lambda). No Kafka, OpenSearch, or Redis." |
| `DatabaseStack` | `infrastructure/lib/stacks/database-stack.ts` | **Placeholder.** "This will be implemented later with actual RDS configuration" — no resources declared, and it is not instantiated by the bin entrypoint |

`infrastructure/cdk.out/` contains a synthesized `InfrastructureStack.template.json` (last synth 2025-01-30) holding only CDK metadata — no AWS resources. There is no evidence anything was ever deployed: no deploy scripts (`package.json` has only `build`/`watch`/`test`/`cdk`), no environment/account configuration, no secrets wiring.

The intended architecture (per the stack's own comments): single NestJS backend + RDS PostgreSQL; explicitly no MSK/OpenSearch/ElastiCache.

## What a deploy currently requires (manual)

Until the gap is closed, deploying means doing all of this by hand:

### 1. Provision infrastructure

Nothing is automated: you need a Postgres 16 instance (with `uuid-ossp` and `pg_trgm` extensions — see `scripts/init-db.sh`), compute for the three apps, an S3 bucket, and DNS/TLS. The CDK stacks would have to be implemented first to be useful.

### 2. Provision environment

Per-app env vars — full inventory in `documentation/operations/environment-variables.md`. Hard minimums: BFF needs `DB_*`, `JWT_*`, `AWS_S3_*`/`AWS_*` (throws at startup without them), `GOOGLE_MAPS_API_KEY`, `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`, `CORS_ORIGINS`, email (Resend or SMTP); web/admin need `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL` (note: `NEXT_PUBLIC_*` and the vars listed in `turbo.json`'s `@welpco/web#build` env list must be present **at build time**). Stripe webhooks must be pointed at `<bff>/api/webhooks/stripe` with the event set documented in `stripe-webhook.controller.ts`.

### 3. Build

```bash
pnpm install
pnpm build          # turbo run build across the workspace
```

Per app:

| App | Build | Serve | Port |
|---|---|---|---|
| BFF (`@welpco/bff`) | `nest build` (prebuild compiles `@welpco/email`, `@welpco/database`) | `node dist/main` (`start:prod`) | `PORT` (default 3000) |
| Web (`@welpco/web`) | `next build` | `next start -p 8081` | 8081 (hardcoded) |
| Admin (`@welpco/admin`) | `next build` | `next start -p 8082` | 8082 (hardcoded) |

### 4. Migrate

`pnpm db:migrate` against the target DB (SSL auto-enables with `NODE_ENV=production`; see `documentation/operations/migrations.md`). No pipeline runs this — it must be an explicit release step.

### 5. Seed (first boot only)

Content-only: `SEED_CONFIRM_PRODUCTION=yes SEED_SKIP_USERS=1 pnpm seed:users`, then `pnpm create:admin`. See `documentation/operations/seeds.md`.

## Gap summary

| Needed | Status |
|---|---|
| CI (tests/lint on PR) | Missing |
| CD (build + deploy) | Missing |
| Container images | Missing (no Dockerfiles) |
| IaC | CDK skeleton with TODO-only stacks |
| Migration automation | Missing (manual `pnpm db:migrate`) |
| Secrets management | Missing (only `.env.example` templates) |
| Rollback strategy | Missing (no `migration:revert`, no release versioning) |
