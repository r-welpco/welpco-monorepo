#!/bin/bash
set -e

# Reset PostgreSQL database for Welpco single backend.
# Drops all tables (public schema), recreates schema, re-adds extensions.
# Run after: docker compose up -d
# Then: start BFF once so TypeORM creates tables (synchronize), then: pnpm seed:users

echo "🔄 Resetting database welpco_dev..."

docker exec welpco-postgres psql -v ON_ERROR_STOP=1 -U welpco -d welpco_dev <<-EOSQL
  DROP SCHEMA IF EXISTS public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO welpco;
  GRANT ALL ON SCHEMA public TO public;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOSQL

echo "✅ Database reset successfully!"
echo ""
echo "Next: Start the BFF so TypeORM creates tables (synchronize: true in dev), then seed:"
echo "  1. pnpm dev   (or: pnpm --filter @welpco/bff dev)"
echo "  2. In another terminal: pnpm seed:users"
echo "  Or run BFF once (e.g. timeout 15s), then: pnpm seed:users"
echo ""
