#!/usr/bin/env bash
# Stage 2 photo library migration on a throwaway LOCAL Postgres replica.
# Usage: PGHOST=/tmp PGPORT=55432 PGUSER=postgres bash supabase/proposed/test/run_stage2.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; cd "$here"
p="$here/../20261116000100_photo_library"
v="$here/../20261116000200_photo_private_storage"
db=listworx_stage2_test
psql -v ON_ERROR_STOP=1 -qc "drop database if exists $db" -c "create database $db" postgres
run() { psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$1"; }
q() { psql -v ON_ERROR_STOP=1 -qtA -d "$db" -c "$1"; }
echo "== replica (with Stage 1B)"; run 00_replica.sql; run 03_replica_blog.sql
for m in 20261115000100_content_workflow 20261115000200_content_actor 20261115000300_featured_image_display; do run "$here/../$m.sql"; done
posts_before=$(q "select string_agg(md5(t::text), ',' order by id) from blog_posts t")
echo "== apply photo library"; run "$p.sql"
echo "== tests"; run 90_photo_library_tests.sql
echo "== apply private storage"; run "$v.sql"
run 91_photo_private_tests.sql
echo "== rollback private storage"; run "$v.rollback.sql"
[ "$(q "select count(*) from pg_proc where proname in ('photo_public_copy','photo_secure_original')")" = "0" ] || { echo "ROLLBACK FAIL: private storage functions"; exit 1; }
[ "$(q "select count(*) from information_schema.columns where table_name='photo_assets' and column_name in ('public_path','public_copy_live')")" = "0" ] || { echo "ROLLBACK FAIL: columns"; exit 1; }
[ "$(q "select count(*) from photo_assets")" = "3" ] || { echo "ROLLBACK FAIL: rows lost"; exit 1; }
echo "private storage rollback checks passed (rows kept)"
[ "$(q "select string_agg(md5(t::text), ',' order by id) from blog_posts t")" = "$posts_before" ] || { echo "FAIL: articles changed"; exit 1; }
echo "== rollback"; run "$p.rollback.sql"
[ "$(q "select count(*) from pg_tables where tablename in ('photo_assets','photo_review_log')")" = "0" ] || { echo "ROLLBACK FAIL"; exit 1; }
[ "$(q "select count(*) from pg_proc where proname in ('photo_review','photo_assets_guard')")" = "0" ] || { echo "ROLLBACK FAIL: functions"; exit 1; }
[ "$(q "select string_agg(md5(t::text), ',' order by id) from blog_posts t")" = "$posts_before" ] || { echo "ROLLBACK FAIL: articles changed"; exit 1; }
echo "rollback checks passed"
echo "== re-apply"; run "$p.sql"; run "$v.sql"
echo "== all stage 2 database steps completed"
