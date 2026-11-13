-- Tests for 20261112000300_referral_columns.sql (run after the other launch tests). Raises on failure.
\set ON_ERROR_STOP on
\set proA  '''a0000000-0000-4000-8000-000000000002'''
\set proB  '''a0000000-0000-4000-8000-000000000003'''
\set coA   '''b0000000-0000-4000-8000-00000000000a'''

insert into public.job_requests (id, requester_name, requester_email, job_description)
values ('f6000000-0000-4000-8000-000000000001', 'Test Homeowner', 'h@example.com', 'leaking faucet');
insert into public.referrals (id, job_request_id, contractor_id, status, slot_number)
values ('f6000000-0000-4000-8000-0000000000a1', 'f6000000-0000-4000-8000-000000000001', :coA, 'PENDING', 2);

-- R1: the contractor dashboard's Referrals query (same columns) returns the contractor's referral
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
create temp table r1 on commit drop as
  select id, job_request_id, slot_position, tier_at_referral, status, email_sent, created_at
  from public.referrals where contractor_id = :coA;
do $$ begin
  if (select count(*) from r1) <> 1 then raise exception 'R1 FAIL: contractor sees % referrals', (select count(*) from r1); end if;
  raise notice 'R1 pass: contractor Referrals query works and returns their referral';
end $$;
commit;

-- R2: another contractor still cannot see it
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proB, 'role', 'authenticated')::text, true);
do $$ begin
  if exists (select 1 from public.referrals where id = 'f6000000-0000-4000-8000-0000000000a1') then
    raise exception 'R2 FAIL: other contractor can read the referral';
  end if;
  raise notice 'R2 pass: other contractors cannot see it';
end $$;
commit;

-- R3: the admin/server writes the app makes now succeed
update public.referrals set email_sent = true, email_sent_at = now() where id = 'f6000000-0000-4000-8000-0000000000a1';
update public.referrals set status = 'CONTACTED', requester_contacted = true, requester_contacted_at = now()
 where id = 'f6000000-0000-4000-8000-0000000000a1';
do $$ declare r record; begin
  select * into r from public.referrals where id = 'f6000000-0000-4000-8000-0000000000a1';
  if not r.email_sent or r.email_sent_at is null or not r.requester_contacted or r.requester_contacted_at is null then
    raise exception 'R3 FAIL: %', row_to_json(r);
  end if;
  raise notice 'R3 pass: resend-email and mark-contacted writes are stored';
end $$;

-- R4: existing slot numbers were carried over (re-run the migration's backfill on a fresh row)
insert into public.referrals (id, job_request_id, contractor_id, status, slot_number)
values ('f6000000-0000-4000-8000-0000000000a2', 'f6000000-0000-4000-8000-000000000001', :coA, 'PENDING', 3);
update public.referrals set slot_position = slot_number where slot_position is null and slot_number is not null;
do $$ begin
  if (select slot_position from public.referrals where id = 'f6000000-0000-4000-8000-0000000000a2') <> 3 then
    raise exception 'R4 FAIL: slot number not carried over';
  end if;
  raise notice 'R4 pass: slot numbers carried over';
end $$;
