-- Tests for 20261112000100_billing_subscriptions.sql. Raises on failure.
\set ON_ERROR_STOP on
\set proA '''a0000000-0000-4000-8000-000000000002'''
\set proB '''a0000000-0000-4000-8000-000000000003'''
\set coA  '''b0000000-0000-4000-8000-00000000000a'''
\set coB  '''b0000000-0000-4000-8000-00000000000b'''

-- B1: plan names the app uses exist; production's six rows untouched
do $$ begin
  if (select count(*) from public.tiers where name in ('Basic Partner','Preferred Partner','Elite Partner')) <> 3 then raise exception 'B1 FAIL: app plan names missing'; end if;
  if (select count(*) from public.tiers where name like 'Network %') <> 6 then raise exception 'B1 FAIL: existing plans changed'; end if;
  raise notice 'B1 pass: plan names resolve; existing plans untouched';
end $$;

-- B2/B3: the webhook's upsert (service role) records and then updates one row per contractor
begin;
set local role service_role;
insert into public.subscriptions (contractor_id, tier_id, stripe_subscription_id, stripe_customer_id, status, billing_period, current_period_start, cancel_at_period_end)
values (:coA, (select id from public.tiers where name = 'Basic Partner'), 'sub_test_1', 'cus_test_1', 'active', 'annual', now(), false)
on conflict (contractor_id) do update set status = excluded.status, updated_at = now();
insert into public.subscriptions (contractor_id, tier_id, stripe_subscription_id, stripe_customer_id, status, billing_period, current_period_start, cancel_at_period_end)
values (:coA, (select id from public.tiers where name = 'Basic Partner'), 'sub_test_1', 'cus_test_1', 'past_due', 'annual', now(), true)
on conflict (contractor_id) do update set status = excluded.status, cancel_at_period_end = excluded.cancel_at_period_end, updated_at = now();
commit;
do $$ declare r record; n int; begin
  select count(*) into n from public.subscriptions where contractor_id = 'b0000000-0000-4000-8000-00000000000a';
  select * into r from public.subscriptions where contractor_id = 'b0000000-0000-4000-8000-00000000000a';
  if n <> 1 or r.status <> 'past_due' or r.billing_period <> 'annual' or not r.cancel_at_period_end or r.stripe_customer_id <> 'cus_test_1' then
    raise exception 'B2/B3 FAIL: % rows %', n, row_to_json(r); end if;
  raise notice 'B2/B3 pass: webhook upsert records, then updates, a single row';
end $$;

-- B4: values outside what the app writes are rejected
do $$ begin
  begin update public.subscriptions set status = 'ACTIVE' where contractor_id = 'b0000000-0000-4000-8000-00000000000a'; raise exception 'B4 FAIL: uppercase accepted';
  exception when check_violation then null; end;
  begin update public.subscriptions set billing_period = 'weekly' where contractor_id = 'b0000000-0000-4000-8000-00000000000a'; raise exception 'B4 FAIL: weekly accepted';
  exception when check_violation then null; end;
  begin insert into public.subscriptions (contractor_id, tier_id, status) values ('b0000000-0000-4000-8000-00000000000a', (select id from public.tiers limit 1), 'active'); raise exception 'B4 FAIL: second row accepted';
  exception when unique_violation then null; end;
  raise notice 'B4 pass: bad statuses, periods and duplicate rows are rejected';
end $$;

-- B5: contractors read only their own subscription and cannot write it
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
create temp table b5a as select count(*) n from public.subscriptions;
update public.subscriptions set status = 'active' where contractor_id = :coA;
commit;
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proB, 'role', 'authenticated')::text, true);
create temp table b5b as select count(*) n from public.subscriptions;
commit;
do $$ begin
  if (select n from b5a) <> 1 then raise exception 'B5 FAIL: owner cannot read own subscription'; end if;
  if (select n from b5b) <> 0 then raise exception 'B5 FAIL: other contractor can read it'; end if;
  if (select status from public.subscriptions where contractor_id = 'b0000000-0000-4000-8000-00000000000a') <> 'past_due' then raise exception 'B5 FAIL: contractor changed own billing status'; end if;
  raise notice 'B5 pass: own row readable, others hidden, contractors cannot change billing status';
end $$;
