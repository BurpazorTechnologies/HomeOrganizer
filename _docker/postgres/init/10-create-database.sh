#!/bin/sh
set -eu

readonly ADMIN_USER="postgres"
readonly ADMIN_PASS="superSecureRootPass"

#
# Ensure psql can authenticate non-interactively using the admin password.
# This is required because the official Postgres image may default to password
# authentication (e.g. scram-sha-256) for TCP connections, and our init script
# must be able to connect without prompting for a password.
#
export PGPASSWORD="${ADMIN_PASS}"

readonly APP_DB="homeorganizerdb_pg"
readonly APP_DB_TEST="homeorganizerdb_pg_testing"
readonly APP_USER="homeorganizerdb_pg_user"
readonly APP_PASS="homeorganizerDbPgPassword"

PSQL="psql -v ON_ERROR_STOP=1 --username ${ADMIN_USER}"

$PSQL <<-EOSQL
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${APP_USER}') THEN
      CREATE ROLE ${APP_USER}
        LOGIN
        PASSWORD '${APP_PASS}'
        NOSUPERUSER
        NOCREATEDB
        NOCREATEROLE
        NOREPLICATION
        INHERIT;
   END IF;
END
\$\$;
EOSQL

if ! $PSQL -tAc "SELECT 1 FROM pg_database WHERE datname='${APP_DB}'" | grep -q 1; then
  $PSQL -c "CREATE DATABASE ${APP_DB};"
fi
$PSQL -c "ALTER DATABASE ${APP_DB} OWNER TO ${APP_USER};"

$PSQL --dbname "${APP_DB}" <<-EOSQL
-- Ensure schema exists and is owned by the app role
CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION ${APP_USER};
ALTER SCHEMA public OWNER TO ${APP_USER};

GRANT USAGE, CREATE ON SCHEMA public TO ${APP_USER};

-- Default privileges for objects CREATED BY the app role in this DB
-- (run as superuser, target the app role explicitly)
ALTER DEFAULT PRIVILEGES FOR ROLE ${APP_USER} IN SCHEMA public GRANT ALL ON TABLES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES FOR ROLE ${APP_USER} IN SCHEMA public GRANT ALL ON SEQUENCES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES FOR ROLE ${APP_USER} IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${APP_USER};

-- Optional: convenience
ALTER ROLE ${APP_USER} SET search_path TO public;
EOSQL

if ! $PSQL -tAc "SELECT 1 FROM pg_database WHERE datname='${APP_DB_TEST}'" | grep -q 1; then
  $PSQL -c "CREATE DATABASE ${APP_DB_TEST};"
fi
$PSQL -c "ALTER DATABASE ${APP_DB_TEST} OWNER TO ${APP_USER};"

$PSQL --dbname "${APP_DB_TEST}" <<-EOSQL
CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION ${APP_USER};
ALTER SCHEMA public OWNER TO ${APP_USER};

GRANT USAGE, CREATE ON SCHEMA public TO ${APP_USER};

ALTER DEFAULT PRIVILEGES FOR ROLE ${APP_USER} IN SCHEMA public GRANT ALL ON TABLES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES FOR ROLE ${APP_USER} IN SCHEMA public GRANT ALL ON SEQUENCES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES FOR ROLE ${APP_USER} IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${APP_USER};

ALTER ROLE ${APP_USER} SET search_path TO public;
EOSQL
