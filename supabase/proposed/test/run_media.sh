#!/usr/bin/env bash
# Media-ownership fix on a throwaway LOCAL Postgres database.
# Usage: PGHOST=/tmp PGPORT=55432 PGUSER=postgres bash supabase/proposed/test/run_media.sh
# Never point this at Supabase.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"
db=listworx_media_test
fresh() { psql -v ON_ERROR_STOP=1 -qc "drop database if exists $db" -c "create database $db" postgres; psql -v ON_ERROR_STOP=1 -q -d "$db" -f media_replica.sql; }
run() { psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$1"; }
echo "== 1. current production policies: confirm the vulnerability"; fresh; run 25_media_exploit_before.sql
echo "== 2. apply fix and test";        fresh; run ../20261111000200_media_storage_ownership.sql; run 30_media_tests.sql
echo "== 3. rollback restores old behaviour"; run ../20261111000200_media_storage_ownership_rollback.sql; run 25_media_exploit_before.sql
echo "== 4. re-apply after rollback";   run ../20261111000200_media_storage_ownership.sql; run 30_media_tests.sql
echo "== all steps completed"
