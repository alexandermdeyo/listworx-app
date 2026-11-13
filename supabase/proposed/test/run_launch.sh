#!/usr/bin/env bash
# Minimum-safe-launch database changes, in production order, on a throwaway LOCAL Postgres.
# Usage: PGHOST=/tmp PGPORT=55432 PGUSER=postgres bash supabase/proposed/test/run_launch.sh
# Order: 20261111000000 (alignment) -> 20261112000100 (billing) -> 20261112000200 (document guard) -> 20261112000300 (referral columns).
# The media storage rules (20261111000200) are tested separately by run_media.sh and go last in production.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"
P="$here/.."
m1="$P/20261111000000_align_profiles_referrals"
m2="$P/20261112000100_billing_subscriptions"
m3="$P/20261112000200_document_review_guard"
m4="$P/20261112000300_referral_columns"
db=listworx_launch_test
psql -v ON_ERROR_STOP=1 -qc "drop database if exists $db" -c "create database $db" postgres
run() { psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$1"; }
q() { psql -v ON_ERROR_STOP=1 -qtA -d "$db" -c "$1"; }
echo "== replica of production";   run 00_replica.sql; run 01_replica_documents.sql; run 02_replica_billing.sql; run 05_seed_before.sql
echo "== apply 1, 2, 3, 4 in order";  run "$m1.sql"; run "$m2.sql"; run "$m3.sql"; run "$m4.sql"
echo "== alignment tests";         run 10_guard_tests.sql
echo "== document guard tests";    run 40_document_guard_tests.sql
echo "== billing tests";           run 50_billing_tests.sql
echo "== referral column tests";   run 60_referral_columns_tests.sql
echo "== rollback 4, 3, 2, 1 (with test data present)"; run "$m4.rollback.sql"; run "$m3.rollback.sql"; run "$m2.rollback.sql"; run "$m1.rollback.sql"
[ "$(q "select format_type(atttypid, atttypmod) from pg_attribute where attrelid='public.subscriptions'::regclass and attname='status'")" = "subscription_status" ] || { echo "ROLLBACK FAIL: status type"; exit 1; }
[ "$(q "select status from public.subscriptions limit 1")" = "PAST_DUE" ] || { echo "ROLLBACK FAIL: existing row status not converted"; exit 1; }
[ "$(q "select count(*) from information_schema.columns where table_name='subscriptions' and column_name in ('billing_period','stripe_customer_id','cancel_at_period_end')")" = "0" ] || { echo "ROLLBACK FAIL: columns remain"; exit 1; }
[ "$(q "select count(*) from information_schema.columns where table_name='referrals' and column_name in ('slot_position','email_sent_at','requester_contacted','requester_contacted_at')")" = "0" ] || { echo "ROLLBACK FAIL: referral columns remain"; exit 1; }
[ "$(q "select count(*) from public.referrals")" -ge "2" ] || { echo "ROLLBACK FAIL: referrals lost"; exit 1; }
[ "$(q "select count(*) from pg_proc where proname='my_referral_tally'")" = "0" ] && [ "$(q "select count(*) from pg_policies where tablename='referrals' and policyname='Referrals read access for involved parties'")" = "1" ] || { echo "ROLLBACK FAIL: referral policies not restored"; exit 1; }
[ "$(q "select count(*) from pg_trigger where tgname='guard_contractor_document'")" = "0" ] || { echo "ROLLBACK FAIL: guard remains"; exit 1; }
[ "$(q "select count(*) from information_schema.columns where table_name='contractor_profiles' and column_name='ironclad_certified'")" = "0" ] || { echo "ROLLBACK FAIL: alignment columns remain"; exit 1; }
[ "$(q "select count(*) from public.tiers where name like 'Network %'")" = "6" ] || { echo "ROLLBACK FAIL: original plans changed"; exit 1; }
echo "rollback checks passed: production structure restored, data kept"
echo "== re-apply 1, 2, 3, 4 after rollback"; run "$m1.sql"; run "$m2.sql"; run "$m3.sql"; run "$m4.sql"
[ "$(q "select status from public.subscriptions limit 1")" = "past_due" ] || { echo "RE-APPLY FAIL"; exit 1; }
echo "== all steps completed"
