#!/usr/bin/env bash
# Runs the proposed migration against a throwaway LOCAL Postgres database.
# Usage: PGHOST=/tmp PGPORT=55432 PGUSER=postgres bash supabase/proposed/test/run.sh
# Never point this at Supabase.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
db=listworx_migration_test
psql -v ON_ERROR_STOP=1 -qc "drop database if exists $db" -c "create database $db" postgres
run() { psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$1"; }
echo "== replica";        run "$here/00_replica.sql"
echo "== seed (pre)";     run "$here/05_seed_before.sql"
echo "== migration";      run "$here/../20261111000000_align_profiles_referrals.sql"
echo "== tests";          run "$here/10_guard_tests.sql"
echo "== rollback";       run "$here/../20261111000000_align_profiles_referrals.rollback.sql"
echo "== re-apply after rollback"; run "$here/../20261111000000_align_profiles_referrals.sql"
echo "== all steps completed"
