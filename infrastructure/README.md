# Welpco Infrastructure (AWS CDK)

This directory contains the AWS CDK app for Welpco. The **simplified architecture** deploys:

- **Single NestJS backend** — One compute unit (e.g. ECS Fargate service or Lambda).
- **RDS PostgreSQL** — Single database (see `lib/stacks/database-stack.ts` when implemented).

## What is not included

The following are **not** part of the simplified stack (and are not in this CDK app):

- **Amazon MSK (Kafka)** — Replaced by synchronous in-process communication.
- **Amazon OpenSearch** — Replaced by PostgreSQL full-text search and pg_trgm.
- **ElastiCache (Redis)** — Replaced by in-memory cache in the backend.

## Project layout

- `bin/infrastructure.ts` — CDK app entrypoint; instantiates `InfrastructureStack`.
- `lib/infrastructure-stack.ts` — Main stack; add DatabaseStack and compute here when implementing.
- `lib/stacks/database-stack.ts` — Placeholder for RDS PostgreSQL (to be implemented).

## Useful commands

- `npm run build` — Compile TypeScript
- `npm run watch` — Watch and compile
- `npm run test` — Run unit tests
- `npx cdk synth` — Synthesize CloudFormation template
- `npx cdk diff` — Compare deployed stack with current state
- `npx cdk deploy` — Deploy stack to your default AWS account/region
