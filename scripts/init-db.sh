#!/bin/bash
set -e

# Initialize PostgreSQL for Welpco single backend.
# Only postgres; no Redis/Kafka/OpenSearch.
# The default database is welpco_dev (from POSTGRES_DB in docker-compose).

echo "Initializing database..."

# Create extensions in the default database (welpco_dev)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOSQL

echo "✅ Database initialized successfully!"
