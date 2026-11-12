-- Tests for 20261112000200_document_review_guard.sql (run after 10_guard_tests.sql). Raises on failure.
\set ON_ERROR_STOP on
\set admin '''a0000000-0000-4000-8000-000000000001'''
\set proA  '''a0000000-0000-4000-8000-000000000002'''
\set proB  '''a0000000-0000-4000-8000-000000000003'''
\set coA   '''b0000000-0000-4000-8000-00000000000a'''

-- G1: contractor upload claiming APPROVED is stored PENDING with no review data
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
insert into public.contractor_documents (id, contractor_id, document_type, document_url, expiration_date, status, reviewed_by, reviewed_at)
values ('e3000000-0000-4000-8000-000000000001', :coA, 'INSURANCE', 'u', current_date + 90, 'APPROVED', :proA, now());
commit;
do $$ declare r record; begin
  select * into r from public.contractor_documents where id = 'e3000000-0000-4000-8000-000000000001';
  if r.status <> 'PENDING' or r.reviewed_by is not null or r.reviewed_at is not null then raise exception 'G1 FAIL: %', row_to_json(r); end if;
  raise notice 'G1 pass: contractor uploads start PENDING';
end $$;

-- G2/G3: contractor cannot approve, or set reviewer fields
do $$ begin
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-000000000002', 'role', 'authenticated')::text, true);
    update public.contractor_documents set status = 'APPROVED' where id = 'e3000000-0000-4000-8000-000000000001';
    raise exception 'G2 FAIL: contractor approved own document';
  exception when insufficient_privilege then null; end;
  reset role;
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-000000000002', 'role', 'authenticated')::text, true);
    update public.contractor_documents set reviewed_at = now() where id = 'e3000000-0000-4000-8000-000000000001';
    raise exception 'G3 FAIL: contractor set review time';
  exception when insufficient_privilege then null; end;
  reset role;
  raise notice 'G2/G3 pass: contractors cannot approve or edit review fields';
end $$;

-- G4: logged-in admin approval records reviewer and time
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :admin, 'role', 'authenticated')::text, true);
update public.contractor_documents set status = 'APPROVED' where id = 'e3000000-0000-4000-8000-000000000001';
commit;
do $$ declare r record; begin
  select * into r from public.contractor_documents where id = 'e3000000-0000-4000-8000-000000000001';
  if r.status <> 'APPROVED' or r.reviewed_by <> 'a0000000-0000-4000-8000-000000000001' or r.reviewed_at is null then raise exception 'G4 FAIL: %', row_to_json(r); end if;
  raise notice 'G4 pass: admin approval records reviewer and time';
end $$;

-- G5: contractor toggles public visibility on an approved document -> stays approved
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.contractor_documents set is_public = true where id = 'e3000000-0000-4000-8000-000000000001';
commit;
do $$ begin
  if (select status from public.contractor_documents where id = 'e3000000-0000-4000-8000-000000000001') <> 'APPROVED' then raise exception 'G5 FAIL'; end if;
  raise notice 'G5 pass: harmless edits keep the approval';
end $$;

-- G6: contractor extends the expiration date of an approved document -> back to PENDING
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.contractor_documents set expiration_date = current_date + 900 where id = 'e3000000-0000-4000-8000-000000000001';
commit;
do $$ declare r record; begin
  select * into r from public.contractor_documents where id = 'e3000000-0000-4000-8000-000000000001';
  if r.status <> 'PENDING' or r.reviewed_by is not null then raise exception 'G6 FAIL: %', row_to_json(r); end if;
  raise notice 'G6 pass: a changed date needs re-review';
end $$;

-- G7: rejected document can be resubmitted (new file + PENDING + notes cleared), as the renewal screen does
update public.contractor_documents set status = 'REJECTED', notes = 'Blurry' where id = 'e3000000-0000-4000-8000-000000000001';
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.contractor_documents set document_url = 'u2', status = 'PENDING', notes = null, file_name = 'new.pdf' where id = 'e3000000-0000-4000-8000-000000000001';
commit;
do $$ begin
  if (select status from public.contractor_documents where id = 'e3000000-0000-4000-8000-000000000001') <> 'PENDING' then raise exception 'G7 FAIL'; end if;
  raise notice 'G7 pass: resubmission works';
end $$;

-- G8: contractor cannot rewrite an admin's notes on a reviewed document
update public.contractor_documents set status = 'REJECTED', notes = 'Wrong policy' where id = 'e3000000-0000-4000-8000-000000000001';
do $$ begin
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-000000000002', 'role', 'authenticated')::text, true);
    update public.contractor_documents set notes = 'Looks great' where id = 'e3000000-0000-4000-8000-000000000001';
    raise exception 'G8 FAIL: contractor edited review notes';
  exception when insufficient_privilege then null; end;
  reset role;
  raise notice 'G8 pass: review notes are admin-only';
end $$;

-- G9: another contractor cannot touch it at all (existing row security)
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proB, 'role', 'authenticated')::text, true);
update public.contractor_documents set is_public = false where id = 'e3000000-0000-4000-8000-000000000001';
commit;
do $$ begin
  if not (select is_public from public.contractor_documents where id = 'e3000000-0000-4000-8000-000000000001') then raise exception 'G9 FAIL: contractor B changed A''s document'; end if;
  raise notice 'G9 pass: other contractors cannot change it';
end $$;

-- G10: server (service role) can still write review states for admin tooling
begin;
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
update public.contractor_documents set status = 'APPROVED' where id = 'e3000000-0000-4000-8000-000000000001';
commit;
do $$ begin
  if (select status from public.contractor_documents where id = 'e3000000-0000-4000-8000-000000000001') <> 'APPROVED' then raise exception 'G10 FAIL'; end if;
  raise notice 'G10 pass: admin/server review still works';
end $$;
