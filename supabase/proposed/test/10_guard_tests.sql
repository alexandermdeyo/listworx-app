-- Tests for 20261111000000_align_profiles_referrals.sql on the local replica.
-- Each check raises an exception on failure; psql runs with ON_ERROR_STOP.
\set ON_ERROR_STOP on
\set admin    '''a0000000-0000-4000-8000-000000000001'''
\set proA     '''a0000000-0000-4000-8000-000000000002'''
\set proB     '''a0000000-0000-4000-8000-000000000003'''
\set proC     '''a0000000-0000-4000-8000-000000000004'''

-- Users and "B Co" were seeded before the migration (05_seed_before.sql).
-- Seed A Co as a direct database session (privileged, like a migration).
insert into public.contractor_profiles (id, user_id, company_name, owner_name, partner_status, ironclad_accepted)
values ('b0000000-0000-4000-8000-00000000000a', :proA, 'A Co', 'Ann', 'approved', true);

-- T1: contractor tries to self-certify, self-publish, set slug/counter, self-activate; edits allowed fields
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.contractor_profiles
   set ironclad_certified = true, profile_published = true, profile_slug = 'a-co',
       total_referrals_received = 99, partner_status = 'active',
       tagline = 'Quality work', show_phone_public = true, business_description = 'We paint.'
 where user_id = :proA;
commit;
do $$ declare r record; begin
  select * into r from public.contractor_profiles where company_name = 'A Co';
  if r.ironclad_certified then raise exception 'T1 FAIL: contractor self-certified'; end if;
  if r.profile_published then raise exception 'T1 FAIL: contractor self-published'; end if;
  if r.profile_slug is not null then raise exception 'T1 FAIL: contractor set own slug'; end if;
  if r.total_referrals_received <> 0 then raise exception 'T1 FAIL: contractor changed rotation counter'; end if;
  if r.partner_status <> 'approved' then raise exception 'T1 FAIL: contractor self-activated'; end if;
  if r.tagline <> 'Quality work' or not r.show_phone_public or r.business_description <> 'We paint.' then
    raise exception 'T1 FAIL: permitted profile edits were blocked'; end if;
  raise notice 'T1 pass: protected fields held, permitted fields saved';
end $$;

-- T2: new contractor inserts a profile pre-set as certified/published/active
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proC, 'role', 'authenticated')::text, true);
insert into public.contractor_profiles (user_id, company_name, owner_name, partner_status, ironclad_certified, profile_published, profile_slug, total_referrals_received)
values (:proC, 'C Co', 'Cy', 'active', true, true, 'c-co', 50);
commit;
do $$ declare r record; begin
  select * into r from public.contractor_profiles where company_name = 'C Co';
  if r.ironclad_certified or r.profile_published or r.profile_slug is not null or r.total_referrals_received <> 0 or r.partner_status <> 'applied' then
    raise exception 'T2 FAIL: insert kept protected values (%, %, %, %, %)', r.ironclad_certified, r.profile_published, r.profile_slug, r.total_referrals_received, r.partner_status;
  end if;
  raise notice 'T2 pass: insert cannot pre-set protected fields';
end $$;

-- T3: contractor cannot touch another contractor's row (RLS)
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.contractor_profiles set tagline = 'hijacked' where company_name = 'B Co';
commit;
do $$ begin
  if (select tagline from public.contractor_profiles where company_name = 'B Co') is not null then raise exception 'T3 FAIL: cross-contractor edit'; end if;
  raise notice 'T3 pass: cross-contractor edit blocked';
end $$;

-- T4: administrator awards certification, publishes, sets slug
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :admin, 'role', 'authenticated')::text, true);
update public.contractor_profiles set ironclad_certified = true, profile_published = true, profile_slug = 'a-co' where company_name = 'A Co';
commit;
do $$ declare r record; begin
  select * into r from public.contractor_profiles where company_name = 'A Co';
  if not r.ironclad_certified or not r.profile_published or r.profile_slug <> 'a-co' then raise exception 'T4 FAIL: admin could not set fields'; end if;
  raise notice 'T4 pass: admin can certify, publish and set slug';
end $$;

-- T5: contractor cannot revoke/unpublish/rename either
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.contractor_profiles set ironclad_certified = false, profile_published = false, profile_slug = 'renamed' where user_id = :proA;
commit;
do $$ declare r record; begin
  select * into r from public.contractor_profiles where company_name = 'A Co';
  if not r.ironclad_certified or not r.profile_published or r.profile_slug <> 'a-co' then raise exception 'T5 FAIL: contractor changed admin decision'; end if;
  raise notice 'T5 pass: contractor cannot change admin decisions in either direction';
end $$;

-- T6: rotation counter — service role can increment, contractors cannot call it
begin;
set local role service_role;
select set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
select public.increment_referral_count('b0000000-0000-4000-8000-00000000000a');
select public.increment_referral_count('b0000000-0000-4000-8000-00000000000a');
commit;
do $$ begin
  if (select total_referrals_received from public.contractor_profiles where company_name = 'A Co') <> 2 then raise exception 'T6 FAIL: counter not incremented'; end if;
end $$;
do $$ begin
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-000000000002', 'role', 'authenticated')::text, true);
    perform public.increment_referral_count('b0000000-0000-4000-8000-00000000000a');
    raise exception 'T6 FAIL: contractor could call increment_referral_count';
  exception when insufficient_privilege then
    raise notice 'T6 pass: service role increments counter; contractors are refused';
  end;
end $$;
reset role;

-- T7: slug rules — format and uniqueness (even for admin)
do $$ begin
  begin
    update public.contractor_profiles set profile_slug = 'Bad Slug!' where company_name = 'B Co';
    raise exception 'T7 FAIL: invalid slug accepted';
  exception when check_violation then null; end;
  begin
    update public.contractor_profiles set profile_slug = 'a-co' where company_name = 'B Co';
    raise exception 'T7 FAIL: duplicate slug accepted';
  exception when unique_violation then null; end;
  raise notice 'T7 pass: slug format and uniqueness enforced';
end $$;

-- T8: only one chosen contractor per request
insert into public.job_requests (id, requester_name, requester_email, job_description)
values ('c0000000-0000-4000-8000-000000000001', 'Home Owner', 'home@example.com', 'Paint kitchen');
insert into public.referrals (id, job_request_id, contractor_id, slot_number) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-00000000000a', 1),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-00000000000b', 2);
update public.referrals set status = 'CONTACTED' where id = 'd0000000-0000-4000-8000-000000000001';
do $$ begin
  begin
    update public.referrals set status = 'CONTACTED' where id = 'd0000000-0000-4000-8000-000000000002';
    raise exception 'T8 FAIL: second chosen contractor accepted';
  exception when unique_violation then
    raise notice 'T8 pass: one chosen contractor per request';
  end;
end $$;
update public.referrals set status = 'COMPLETED' where id = 'd0000000-0000-4000-8000-000000000001';
do $$ begin raise notice 'T8b pass: chosen referral can still move CONTACTED -> COMPLETED'; end $$;

-- T9: existing rows got safe defaults
do $$ declare r record; begin
  select * into r from public.contractor_profiles where company_name = 'B Co';
  if r.ironclad_certified or r.profile_published or r.show_phone_public or r.show_email_public then
    raise exception 'T9 FAIL: unsafe default on existing row'; end if;
  raise notice 'T9 pass: existing rows default to not certified, not published, contact hidden';
end $$;
