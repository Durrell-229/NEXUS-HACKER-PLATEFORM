#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# NEXUS Platform — PostgreSQL Initialization Script
# Executed by the official postgres Docker entrypoint on first start.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "=== NEXUS DB Initialization ==="

# Variables (defaults from Docker env)
DB_NAME="${POSTGRES_DB:-nexus_db}"
DB_USER="${POSTGRES_USER:-nexus_user}"

# ─── Extensions ───────────────────────────────────────────────────────────────
echo "Creating PostgreSQL extensions..."
psql -v ON_ERROR_STOP=1 --username "$DB_USER" --dbname "$DB_NAME" <<-EOSQL
    -- UUID generation
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Trigram full-text search (used by Codex search)
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- Cryptographic functions
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- Unaccent for search normalization
    CREATE EXTENSION IF NOT EXISTS unaccent;

    -- Statistics
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EOSQL

echo "Extensions created."

# ─── Test database ────────────────────────────────────────────────────────────
echo "Creating test database..."
psql -v ON_ERROR_STOP=1 --username "$DB_USER" <<-EOSQL
    SELECT 'CREATE DATABASE nexus_test OWNER ${DB_USER}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nexus_test')\gexec
EOSQL

# Add extensions to test database too
psql -v ON_ERROR_STOP=1 --username "$DB_USER" --dbname "nexus_test" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE EXTENSION IF NOT EXISTS unaccent;
EOSQL

echo "Test database configured."

# ─── Performance settings ─────────────────────────────────────────────────────
echo "Applying performance configuration..."
psql -v ON_ERROR_STOP=1 --username "$DB_USER" --dbname "$DB_NAME" <<-EOSQL
    -- Optimize for containerized workloads
    ALTER SYSTEM SET shared_buffers = '256MB';
    ALTER SYSTEM SET effective_cache_size = '1GB';
    ALTER SYSTEM SET maintenance_work_mem = '64MB';
    ALTER SYSTEM SET checkpoint_completion_target = 0.9;
    ALTER SYSTEM SET wal_buffers = '16MB';
    ALTER SYSTEM SET default_statistics_target = 100;
    ALTER SYSTEM SET random_page_cost = 1.1;

    -- Logging
    ALTER SYSTEM SET log_min_duration_statement = 500;
    ALTER SYSTEM SET log_checkpoints = on;
EOSQL

echo "=== Database initialization complete ==="
