#!/usr/bin/env bash
# Stage 1B content workflow migration on a throwaway LOCAL Postgres replica.
# Usage: PGHOST=/tmp PGPORT=55432 PGUSER=postgres bash supabase/proposed/test/run_stage1b.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; cd "$here"
m="$here/../20261115000100_content_workflow"
db=listworx_stage1b_test
psql -v ON_ERROR_STOP=1 -qc "drop database if exists $db" -c "create database $db" postgres
run() { psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$1"; }
q() { psql -v ON_ERROR_STOP=1 -qtA -d "$db" -c "$1"; }
echo "== replica"; run 00_replica.sql; run 03_replica_blog.sql
echo "== apply";   run "$m.sql"
echo "== tests";   run 80_content_workflow_tests.sql
echo "== rollback"; run "$m.rollback.sql"
[ "$(q "select count(*) from information_schema.columns where table_name='blog_posts' and column_name in ('status','scheduled_for','seo_title','sources')")" = "0" ] || { echo "ROLLBACK FAIL: columns remain"; exit 1; }
[ "$(q "select count(*) from pg_tables where tablename in ('content_publish_log','automation_settings')")" = "0" ] || { echo "ROLLBACK FAIL: tables remain"; exit 1; }
[ "$(q "select count(*) from pg_trigger where tgname in ('sync_blog_post_status','log_blog_post_status')")" = "0" ] || { echo "ROLLBACK FAIL: triggers remain"; exit 1; }
[ "$(q "select is_draft from blog_posts where slug='published-post'")" = "f" ] || { echo "ROLLBACK FAIL: published post unpublished"; exit 1; }
[ "$(q "select count(*) from blog_posts")" = "3" ] || { echo "ROLLBACK FAIL: articles lost"; exit 1; }
[ "$(q "select count(*) from pg_policies where tablename='blog_posts'")" = "2" ] || { echo "ROLLBACK FAIL: blog policies changed"; exit 1; }
echo "rollback checks passed: blog_posts back to its original shape, articles and publish state kept"
echo "== re-apply after rollback"; run "$m.sql"
[ "$(q "select status from blog_posts where slug='published-post'")" = "published" ] || { echo "RE-APPLY FAIL"; exit 1; }
echo "== all stage 1B database steps completed"
