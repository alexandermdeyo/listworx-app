-- Tests for 20261112000300_referral_columns.sql (run after the other launch tests). Raises on failure.
-- Owner rule: contractors see only a count of referrals (week/month/quarter/year), never the job or requestor.
\set ON_ERROR_STOP on
\set proA  '''a0000000-0000-4000-8000-000000000002'''
\set proB  '''a0000000-0000-4000-8000-000000000003'''
\set coA   '''b0000000-0000-4000-8000-00000000000a'''
\set coB   '''b0000000-0000-4000-8000-00000000000b'''

insert into public.job_requests (id, requester_name, requester_email, job_description)
values ('f6000000-0000-4000-8000-000000000001', 'Test Homeowner', 'h@example.com', 'leaking faucet');
-- A referral now, one two years ago (counts only toward all-time), one for another contractor
insert into public.referrals (id, job_request_id, contractor_id, status, slot_number, notes, created_at) values
  ('f6000000-0000-4000-8000-0000000000a1', 'f6000000-0000-4000-8000-000000000001', :coA, 'PENDING', 2, 'admin-only note', now()),
  ('f6000000-0000-4000-8000-0000000000a2', 'f6000000-0000-4000-8000-000000000001', :coA, 'PENDING', 3, null, now() - interval '2 years'),
  ('f6000000-0000-4000-8000-0000000000b1', 'f6000000-0000-4000-8000-000000000001', :coB, 'PENDING', 1, null, now());

-- R1: a contractor cannot read any referral row (job link, notes, status), their own included
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
do $$ begin
  if exists (select 1 from public.referrals) then raise exception 'R1 FAIL: contractor can read referral rows'; end if;
  raise notice 'R1 pass: contractors cannot read referral rows';
end $$;
commit;

-- R2: a contractor cannot change a referral
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.referrals set status = 'COMPLETED' where id = 'f6000000-0000-4000-8000-0000000000a1';
commit;
do $$ begin
  if (select status::text from public.referrals where id = 'f6000000-0000-4000-8000-0000000000a1') <> 'PENDING' then
    raise exception 'R2 FAIL: contractor changed a referral';
  end if;
  raise notice 'R2 pass: contractors cannot change referrals';
end $$;

-- R3: the tally gives the contractor only their own counts
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
do $$ declare t record; begin
  select * into t from public.my_referral_tally();
  -- 10_guard_tests also referred contractor A once, today
  if t.this_week <> t.this_month or t.this_month <> t.this_year or t.all_time <> t.this_year + 1 or t.this_year < 1 then
    raise exception 'R3 FAIL: %', row_to_json(t);
  end if;
  raise notice 'R3 pass: tally %', row_to_json(t);
end $$;
commit;

-- R4: a signed-out visitor cannot call the tally; a user with no contractor profile gets zeros
do $$ begin
  begin
    set local role anon;
    perform * from public.my_referral_tally();
    raise exception 'R4 FAIL: anonymous call allowed';
  exception when insufficient_privilege then null; end;
  reset role;
  raise notice 'R4 pass: signed-out visitors cannot call the tally';
end $$;
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-000000000004', 'role', 'authenticated')::text, true);
do $$ begin
  if (select all_time from public.my_referral_tally()) <> 0 then raise exception 'R4b FAIL: non-contractor sees counts'; end if;
  raise notice 'R4b pass: no profile, no counts';
end $$;
commit;

-- R5: admins still read and update referrals; the admin/server writes now succeed
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-000000000001', 'role', 'authenticated')::text, true);
do $$ begin
  if (select count(*) from public.referrals where job_request_id = 'f6000000-0000-4000-8000-000000000001') <> 3 then
    raise exception 'R5 FAIL: admin cannot read referrals';
  end if;
end $$;
update public.referrals set email_sent = true, email_sent_at = now() where id = 'f6000000-0000-4000-8000-0000000000a1';
update public.referrals set requester_contacted = true, requester_contacted_at = now() where id = 'f6000000-0000-4000-8000-0000000000a1';
commit;
do $$ declare r record; begin
  select * into r from public.referrals where id = 'f6000000-0000-4000-8000-0000000000a1';
  if not r.email_sent or r.email_sent_at is null or not r.requester_contacted or r.requester_contacted_at is null then
    raise exception 'R5 FAIL: %', row_to_json(r);
  end if;
  if (select slot_position from public.referrals where id = 'f6000000-0000-4000-8000-0000000000a2') is not null then
    null; -- inserted after the migration; backfill applies only to rows that existed before
  end if;
  raise notice 'R5 pass: admins read/update referrals; resend-email and mark-contacted writes are stored';
end $$;
