#!/usr/bin/env bash
# Runs the proposed migrations against a throwaway LOCAL Postgres database.
# Usage: PGHOST=/tmp PGPORT=55432 PGUSER=postgres bash supabase/proposed/test/run.sh
# Never point this at Supabase.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
m1="$here/../20261111000000_align_profiles_referrals"
m2="$here/../20261111000100_document_compliance"
db=listworx_migration_test
psql -v ON_ERROR_STOP=1 -qc "drop database if exists $db" -c "create database $db" postgres
run() { psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$1"; }
echo "== replica";                  run "$here/00_replica.sql"; run "$here/01_replica_documents.sql"
echo "== seed (pre)";               run "$here/05_seed_before.sql"
echo "== migration 1";              run "$m1.sql"
echo "== migration 2";              run "$m2.sql"
echo "== profile/referral tests";   run "$here/10_guard_tests.sql"
echo "== document compliance tests"; run "$here/20_compliance_tests.sql"
echo "== rollback 2, rollback 1";   run "$m2.rollback.sql"; run "$m1.rollback.sql"
echo "== re-apply 1 and 2";         run "$m1.sql"; run "$m2.sql"
echo "== all steps completed"
