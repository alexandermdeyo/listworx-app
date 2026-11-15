#!/usr/bin/env bash
# Stage 2 photo library migration on a throwaway LOCAL Postgres replica.
# Usage: PGHOST=/tmp PGPORT=55432 PGUSER=postgres bash supabase/proposed/test/run_stage2.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; cd "$here"
p="$here/../20261116000100_photo_library"
db=listworx_stage2_test
psql -v ON_ERROR_STOP=1 -qc "drop database if exists $db" -c "create database $db" postgres
run() { psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$1"; }
q() { psql -v ON_ERROR_STOP=1 -qtA -d "$db" -c "$1"; }
echo "== replica (with Stage 1B)"; run 00_replica.sql; run 03_replica_blog.sql
for m in 20261115000100_content_workflow 20261115000200_content_actor 20261115000300_featured_image_display; do run "$here/../$m.sql"; done
posts_before=$(q "select string_agg(md5(t::text), ',' order by id) from blog_posts t")
echo "== apply photo library"; run "$p.sql"
echo "== tests"; run 90_photo_library_tests.sql
[ "$(q "select string_agg(md5(t::text), ',' order by id) from blog_posts t")" = "$posts_before" ] || { echo "FAIL: articles changed"; exit 1; }
echo "== rollback"; run "$p.rollback.sql"
[ "$(q "select count(*) from pg_tables where tablename in ('photo_assets','photo_review_log')")" = "0" ] || { echo "ROLLBACK FAIL"; exit 1; }
[ "$(q "select count(*) from pg_proc where proname in ('photo_review','photo_assets_guard')")" = "0" ] || { echo "ROLLBACK FAIL: functions"; exit 1; }
[ "$(q "select string_agg(md5(t::text), ',' order by id) from blog_posts t")" = "$posts_before" ] || { echo "ROLLBACK FAIL: articles changed"; exit 1; }
echo "rollback checks passed"
echo "== re-apply"; run "$p.sql"
echo "== all stage 2 database steps completed"
