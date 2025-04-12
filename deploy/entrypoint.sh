#!/bin/bash

# Wait for Supabase to be ready if using external Supabase
if [ "$WAIT_FOR_SUPABASE" = "true" ]; then
    echo "Waiting for Supabase to be ready..."
    
    # Use pg_isready to check PostgreSQL availability
    while ! pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" > /dev/null 2>&1; do
        echo "Waiting for PostgreSQL to be ready..."
        sleep 2
    done
    
    echo "PostgreSQL is ready!"
fi

# Run database migrations
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "${DB_HOST:-localhost}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-postgres}" -f /app/database/migrations/schema.sql
    
    # Run seed data if specified
    if [ "$SEED_DATABASE" = "true" ]; then
        echo "Seeding database with test data..."
        PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "${DB_HOST:-localhost}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-postgres}" -f /app/database/seed.sql
    fi
    
    echo "Database setup completed"
fi

# Start the supervisor service which manages the Flask application
exec /usr/bin/supervisord
