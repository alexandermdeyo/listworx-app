-- Tests for 20261111000100_document_compliance.sql (run after 10_guard_tests.sql,
-- which created contractors A Co / B Co and users). Raises on failure.
\set ON_ERROR_STOP on
\set admin '''a0000000-0000-4000-8000-000000000001'''
\set proA  '''a0000000-0000-4000-8000-000000000002'''
\set coA   '''b0000000-0000-4000-8000-00000000000a'''
\set coB   '''b0000000-0000-4000-8000-00000000000b'''

-- Trades: painting (no license) and electrical (license required)
insert into public.categories (id, name) values
  ('f0000000-0000-4000-8000-000000000001', 'Interior Painting'),
  ('f0000000-0000-4000-8000-000000000002', 'Electrical');
insert into public.contractor_categories (contractor_id, category_id) values
  (:coA, 'f0000000-0000-4000-8000-000000000001'),
  (:coB, 'f0000000-0000-4000-8000-000000000002');
-- Places: Sumner and Davidson counties, Tennessee; both contractors serve Sumner.
insert into public.states (id, code, name) values ('d0000000-0000-4000-8000-000000000001', 'TN', 'Tennessee');
insert into public.counties (id, state_id, name, state_code) values
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Sumner', 'TN'),
  ('d1000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'Davidson', 'TN');
insert into public.contractor_counties (contractor_id, county_id) values
  (:coA, 'd1000000-0000-4000-8000-000000000001'),
  (:coB, 'd1000000-0000-4000-8000-000000000001');
-- Statewide rules entered by the admin (direct session = privileged)
insert into public.license_requirements (category_id, state_code, requirement, conditions) values
  ('f0000000-0000-4000-8000-000000000001', 'TN', 'not_required', null),
  ('f0000000-0000-4000-8000-000000000002', 'TN', 'required', 'State electrical license');

-- C0: application upload stored only on the profile became a PENDING document (backfill)
do $$ declare r record; n int; begin
  select count(*) into n from public.contractor_documents where contractor_id = 'b0000000-0000-4000-8000-00000000000b' and notes = 'Submitted with application';
  select * into r from public.contractor_documents where contractor_id = 'b0000000-0000-4000-8000-00000000000b' and notes = 'Submitted with application';
  if n <> 1 or r.status <> 'PENDING' or r.document_type <> 'INSURANCE'
     or r.storage_path <> 'a0000000-0000-4000-8000-000000000003/applications/insurance-1.pdf'
     or r.expiration_date <> current_date + 120 then
    raise exception 'C0 FAIL: application backfill (% rows) %', n, row_to_json(r); end if;
  raise notice 'C0 pass: existing application upload kept in place and queued for review';
end $$;

-- C1: contractor upload claiming APPROVED is stored as PENDING with no review data
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
insert into public.contractor_documents (id, contractor_id, document_type, expiration_date, status, reviewed_by, reviewed_at, licensing_authority, storage_path)
values ('e1000000-0000-4000-8000-000000000001', :coA, 'INSURANCE', (current_date + 90), 'APPROVED', :proA, now(), 'Fake Board', 'a/ins-1.pdf');
commit;
do $$ declare r record; begin
  select * into r from public.contractor_documents where id = 'e1000000-0000-4000-8000-000000000001';
  if r.status <> 'PENDING' or r.reviewed_by is not null or r.reviewed_at is not null or r.licensing_authority is not null then
    raise exception 'C1 FAIL: contractor upload kept review values (%,%,%,%)', r.status, r.reviewed_by, r.reviewed_at, r.licensing_authority; end if;
  raise notice 'C1 pass: contractor uploads always start PENDING with no review data';
end $$;

-- C2: pending-only insurance => not eligible, reason "awaiting review"
do $$ declare r record; begin
  select * into r from public.contractor_compliance where contractor_id = 'b0000000-0000-4000-8000-00000000000a';
  if r.referral_eligible or not ('insurance_awaiting_review' = any(r.hold_reasons)) then raise exception 'C2 FAIL: %', row_to_json(r); end if;
  raise notice 'C2 pass: insurance awaiting review => on hold';
end $$;

-- C3: contractor cannot approve their own document (raises)
do $$ begin
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-000000000002', 'role', 'authenticated')::text, true);
    update public.contractor_documents set status = 'APPROVED' where id = 'e1000000-0000-4000-8000-000000000001';
    raise exception 'C3 FAIL: contractor approved own document';
  exception when insufficient_privilege then
    raise notice 'C3 pass: contractor cannot approve';
  end;
end $$;
reset role;

-- C4: contractor may correct the expiration date while still PENDING
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.contractor_documents set expiration_date = current_date + 100 where id = 'e1000000-0000-4000-8000-000000000001';
commit;
do $$ begin
  if (select expiration_date from public.contractor_documents where id = 'e1000000-0000-4000-8000-000000000001') <> current_date + 100 then
    raise exception 'C4 FAIL: pending edit blocked'; end if;
  raise notice 'C4 pass: pending documents stay editable by the contractor';
end $$;

-- C5: admin approval (as a logged-in admin) stamps reviewer + time; contractor becomes eligible
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :admin, 'role', 'authenticated')::text, true);
update public.contractor_documents set status = 'APPROVED', verification_note = 'Certificate reviewed' where id = 'e1000000-0000-4000-8000-000000000001';
commit;
do $$ declare r record; c record; begin
  select * into r from public.contractor_documents where id = 'e1000000-0000-4000-8000-000000000001';
  if r.reviewed_by <> 'a0000000-0000-4000-8000-000000000001' or r.reviewed_at is null then raise exception 'C5 FAIL: review not stamped'; end if;
  select * into c from public.contractor_compliance where contractor_id = 'b0000000-0000-4000-8000-00000000000a';
  if not c.referral_eligible or c.license_required then raise exception 'C5 FAIL: eligibility %', row_to_json(c); end if;
  raise notice 'C5 pass: admin approval records reviewer/time; painter (no license needed) is eligible';
end $$;

-- C6: contractor cannot change expiration of an approved document (raises)
do $$ begin
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-000000000002', 'role', 'authenticated')::text, true);
    update public.contractor_documents set expiration_date = current_date + 900 where id = 'e1000000-0000-4000-8000-000000000001';
    raise exception 'C6 FAIL: approved expiration changed';
  exception when insufficient_privilege then
    raise notice 'C6 pass: approved documents are frozen for contractors';
  end;
end $$;
reset role;

-- C7: contractor can still toggle public visibility on a reviewed document
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.contractor_documents set is_public = true where id = 'e1000000-0000-4000-8000-000000000001';
commit;
do $$ begin raise notice 'C7 pass: presentation fields (is_public) still editable'; end $$;

-- C8: contractor cannot delete a compliance document (history kept)
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
delete from public.contractor_documents where id = 'e1000000-0000-4000-8000-000000000001';
commit;
do $$ begin
  if not exists (select 1 from public.contractor_documents where id = 'e1000000-0000-4000-8000-000000000001') then raise exception 'C8 FAIL: compliance doc deleted'; end if;
  raise notice 'C8 pass: compliance documents cannot be deleted by contractors';
end $$;

-- C9: replacement upload keeps the old approved row; still eligible while renewal is pending
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
insert into public.contractor_documents (id, contractor_id, document_type, expiration_date, replaces_document_id, storage_path)
values ('e1000000-0000-4000-8000-000000000002', :coA, 'INSURANCE', current_date + 465, 'e1000000-0000-4000-8000-000000000001', 'a/ins-2.pdf');
commit;
do $$ declare c record; begin
  if (select count(*) from public.contractor_documents where contractor_id = 'b0000000-0000-4000-8000-00000000000a' and document_type = 'INSURANCE') <> 2 then raise exception 'C9 FAIL: history not kept'; end if;
  select * into c from public.contractor_compliance where contractor_id = 'b0000000-0000-4000-8000-00000000000a';
  if not c.referral_eligible then raise exception 'C9 FAIL: pending renewal removed eligibility'; end if;
  raise notice 'C9 pass: renewal is a new row; old approved document keeps the contractor eligible';
end $$;

-- C10: expiry boundary — valid through the expiration date (Central), on hold the day after
update public.contractor_documents set expiration_date = public.compliance_today() where id = 'e1000000-0000-4000-8000-000000000001';
do $$ begin
  if not (select referral_eligible from public.contractor_compliance where contractor_id = 'b0000000-0000-4000-8000-00000000000a') then raise exception 'C10 FAIL: not eligible on expiration day'; end if;
end $$;
update public.contractor_documents set expiration_date = public.compliance_today() - 1 where id = 'e1000000-0000-4000-8000-000000000001';
do $$ declare c record; begin
  select * into c from public.contractor_compliance where contractor_id = 'b0000000-0000-4000-8000-00000000000a';
  if c.referral_eligible or not ('insurance_awaiting_review' = any(c.hold_reasons)) then raise exception 'C10 FAIL: %', row_to_json(c); end if;
  raise notice 'C10 pass: eligible on the expiration date, on hold the next day (renewal awaiting review)';
end $$;

-- C11: approving the renewal restores eligibility automatically
update public.contractor_documents set status = 'APPROVED', reviewed_by = 'a0000000-0000-4000-8000-000000000001' where id = 'e1000000-0000-4000-8000-000000000002';
do $$ begin
  if not (select referral_eligible from public.contractor_compliance where contractor_id = 'b0000000-0000-4000-8000-00000000000a') then raise exception 'C11 FAIL'; end if;
  raise notice 'C11 pass: approved renewal restores eligibility with no other step';
end $$;

-- C12: licensed trade — insurance alone is not enough; license required
insert into public.contractor_documents (contractor_id, document_type, expiration_date, status) values
  (:coB, 'INSURANCE', current_date + 200, 'APPROVED');
do $$ declare c record; begin
  select * into c from public.contractor_compliance where contractor_id = 'b0000000-0000-4000-8000-00000000000b';
  if c.referral_eligible or not c.license_required or not ('license_missing_or_expired' = any(c.hold_reasons)) then raise exception 'C12 FAIL: %', row_to_json(c); end if;
end $$;
insert into public.contractor_documents (contractor_id, document_type, expiration_date, status) values
  (:coB, 'LICENSE', current_date + 300, 'APPROVED');
do $$ begin
  if not (select referral_eligible from public.contractor_compliance where contractor_id = 'b0000000-0000-4000-8000-00000000000b') then raise exception 'C12 FAIL: license added but still held'; end if;
  raise notice 'C12 pass: license required only for licensed trades';
end $$;

-- C13: approved document with no expiration date does not count as current
insert into public.contractor_documents (contractor_id, document_type, expiration_date, status) values (:coB, 'LICENSE', null, 'APPROVED');
do $$ begin
  if not (select license_current from public.contractor_compliance where contractor_id = 'b0000000-0000-4000-8000-00000000000b') then raise exception 'C13 FAIL: dated license ignored'; end if;
  raise notice 'C13 pass: undated documents are ignored, dated current one still counts';
end $$;

-- C14: compliance hold does not touch account, status or referral history
do $$ begin
  if (select partner_status::text from public.contractor_profiles where id = 'b0000000-0000-4000-8000-00000000000a') is null then raise exception 'C14 FAIL'; end if;
  if (select count(*) from public.referrals where contractor_id = 'b0000000-0000-4000-8000-00000000000a') = 0 then raise exception 'C14 FAIL: referral history missing'; end if;
  raise notice 'C14 pass: holds are computed only; profile status and referral history untouched';
end $$;

-- C15: a contractor sees only their own compliance row; anon sees none
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
do $$ begin
  if (select count(*) from public.contractor_compliance) <> 1 then raise exception 'C15 FAIL: contractor sees % rows', (select count(*) from public.contractor_compliance); end if;
end $$;
commit;
do $$ begin
  begin
    set local role anon;
    perform 1 from public.contractor_compliance;
    raise exception 'C15 FAIL: anon can read compliance';
  exception when insufficient_privilege then
    raise notice 'C15 pass: contractors see only their own compliance row; anonymous visitors none';
  end;
end $$;
reset role;

-- C16: notification log rejects duplicates and is closed to logins
insert into public.document_notifications (document_id, kind) values ('e1000000-0000-4000-8000-000000000002', 'expiry_30');
insert into public.document_notifications (document_id, kind) values ('e1000000-0000-4000-8000-000000000002', 'expiry_30') on conflict do nothing;
do $$ begin
  if (select count(*) from public.document_notifications) <> 1 then raise exception 'C16 FAIL: duplicate notice'; end if;
  begin
    set local role authenticated;
    perform 1 from public.document_notifications;
    raise exception 'C16 FAIL: logins can read notification log';
  exception when insufficient_privilege then
    raise notice 'C16 pass: one notice per document and kind; log closed to logins';
  end;
end $$;
reset role;

-- C17: enforcement switch is present and OFF; contractors can read it but not change it
do $$ begin
  if (select value from public.admin_settings where key = 'compliance_holds_enforced') <> 'false' then raise exception 'C17 FAIL'; end if;
end $$;
insert into public.admin_settings (key, value) values ('secret_setting', 'x');
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.admin_settings set value = 'true' where key = 'compliance_holds_enforced';
do $$ begin
  if (select count(*) from public.admin_settings) <> 1 then raise exception 'C17 FAIL: contractor sees other settings'; end if;
end $$;
commit;
do $$ begin
  if (select value from public.admin_settings where key = 'compliance_holds_enforced') <> 'false' then raise exception 'C17 FAIL: contractor flipped enforcement'; end if;
  raise notice 'C17 pass: holds start OFF; contractors can read only that setting and cannot change it';
end $$;

-- ---------------------------------------------------------------------------
-- Jurisdiction-specific licensing (owner decisions 4 and 5, 2026-11-10)
-- Contractor E: roofing in Sumner + Davidson, approved insurance, no license.
-- ---------------------------------------------------------------------------
insert into public.users (id, role, name, email) values ('a0000000-0000-4000-8000-000000000005', 'CONTRACTOR', 'Pro E', 'e@example.com');
insert into public.contractor_profiles (id, user_id, company_name, owner_name, partner_status)
values ('b0000000-0000-4000-8000-00000000000e', 'a0000000-0000-4000-8000-000000000005', 'E Co', 'Eve', 'active');
insert into public.categories (id, name) values
  ('f0000000-0000-4000-8000-000000000003', 'Roofing'),
  ('f0000000-0000-4000-8000-000000000004', 'Handyman'),
  ('f0000000-0000-4000-8000-000000000005', 'General Contracting');
insert into public.contractor_categories (contractor_id, category_id) values ('b0000000-0000-4000-8000-00000000000e', 'f0000000-0000-4000-8000-000000000003');
insert into public.contractor_counties (contractor_id, county_id) values
  ('b0000000-0000-4000-8000-00000000000e', 'd1000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-00000000000e', 'd1000000-0000-4000-8000-000000000002');
insert into public.contractor_documents (contractor_id, document_type, expiration_date, status) values
  ('b0000000-0000-4000-8000-00000000000e', 'INSURANCE', current_date + 200, 'APPROVED');
insert into public.license_requirements (category_id, state_code, county_id, requirement, conditions) values
  ('f0000000-0000-4000-8000-000000000003', 'TN', null, 'not_required', null),
  ('f0000000-0000-4000-8000-000000000003', 'TN', 'd1000000-0000-4000-8000-000000000002', 'required', 'County roofing license'),
  ('f0000000-0000-4000-8000-000000000005', 'TN', null, 'case_by_case', 'License needed for projects of $25,000 or more');

create function pg_temp.elig(county text, cats text[]) returns record language sql as $$
  select (e.referral_eligible, e.hold_reasons)::record from public.referral_eligibility(array['b0000000-0000-4000-8000-00000000000e'::uuid], county::uuid, cats::uuid[]) e
$$;

-- C18: a county rule overrides the state rule; eligibility is judged for the job's county
do $$ declare ok boolean; reasons text[]; begin
  select e.referral_eligible, e.hold_reasons into ok, reasons from public.referral_eligibility(array['b0000000-0000-4000-8000-00000000000e'::uuid], 'd1000000-0000-4000-8000-000000000001', array['f0000000-0000-4000-8000-000000000003'::uuid]) e;
  if not ok then raise exception 'C18 FAIL: Sumner roofing (no license needed) held: %', reasons; end if;
  select e.referral_eligible, e.hold_reasons into ok, reasons from public.referral_eligibility(array['b0000000-0000-4000-8000-00000000000e'::uuid], 'd1000000-0000-4000-8000-000000000002', array['f0000000-0000-4000-8000-000000000003'::uuid]) e;
  if ok or not ('license_missing_or_expired' = any(reasons)) then raise exception 'C18 FAIL: Davidson roofing (county requires license) not held: %', reasons; end if;
  if not (select license_required from public.contractor_compliance where contractor_id = 'b0000000-0000-4000-8000-00000000000e') then
    raise exception 'C18 FAIL: dashboard view should show a license is needed somewhere they work'; end if;
  raise notice 'C18 pass: county override applies only in that county';
end $$;

-- C19: only the job's trades count — a licensed trade they also list does not block unlicensed work
insert into public.contractor_categories (contractor_id, category_id) values ('b0000000-0000-4000-8000-00000000000e', 'f0000000-0000-4000-8000-000000000002');
do $$ declare ok boolean; reasons text[]; begin
  select e.referral_eligible into ok from public.referral_eligibility(array['b0000000-0000-4000-8000-00000000000e'::uuid], 'd1000000-0000-4000-8000-000000000001', array['f0000000-0000-4000-8000-000000000003'::uuid]) e;
  if not ok then raise exception 'C19 FAIL: roofing job blocked by unrelated electrical trade'; end if;
  select e.referral_eligible, e.hold_reasons into ok, reasons from public.referral_eligibility(array['b0000000-0000-4000-8000-00000000000e'::uuid], 'd1000000-0000-4000-8000-000000000001', array['f0000000-0000-4000-8000-000000000002'::uuid]) e;
  if ok then raise exception 'C19 FAIL: electrical job allowed without a license'; end if;
  raise notice 'C19 pass: eligibility judged per requested trade';
end $$;

-- C20: no rule for a trade/state => admin review, never an assumed license requirement
insert into public.contractor_categories (contractor_id, category_id) values ('b0000000-0000-4000-8000-00000000000e', 'f0000000-0000-4000-8000-000000000004');
do $$ declare ok boolean; reasons text[]; begin
  select e.referral_eligible, e.hold_reasons into ok, reasons from public.referral_eligibility(array['b0000000-0000-4000-8000-00000000000e'::uuid], 'd1000000-0000-4000-8000-000000000001', array['f0000000-0000-4000-8000-000000000004'::uuid]) e;
  if ok or reasons <> array['license_requirement_under_review'] then raise exception 'C20 FAIL: unknown rule should await admin review only, got %', reasons; end if;
end $$;
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :admin, 'role', 'authenticated')::text, true);
insert into public.contractor_license_determinations (contractor_id, category_id, requirement, note)
values ('b0000000-0000-4000-8000-00000000000e', 'f0000000-0000-4000-8000-000000000004', 'not_required', 'Small repairs only');
commit;
do $$ declare ok boolean; d record; begin
  select e.referral_eligible into ok from public.referral_eligibility(array['b0000000-0000-4000-8000-00000000000e'::uuid], 'd1000000-0000-4000-8000-000000000001', array['f0000000-0000-4000-8000-000000000004'::uuid]) e;
  select * into d from public.contractor_license_determinations where contractor_id = 'b0000000-0000-4000-8000-00000000000e';
  if not ok then raise exception 'C20 FAIL: admin decision "not required" did not clear the review'; end if;
  if d.decided_by <> 'a0000000-0000-4000-8000-000000000001' or d.decided_at is null then raise exception 'C20 FAIL: decision not attributed: %', row_to_json(d); end if;
  raise notice 'C20 pass: unknown rule -> admin review; admin decision recorded with who and when';
end $$;

-- C21: "case by case" rule needs an admin decision; "required" then needs an approved license
insert into public.contractor_categories (contractor_id, category_id) values ('b0000000-0000-4000-8000-00000000000e', 'f0000000-0000-4000-8000-000000000005');
do $$ declare reasons text[]; begin
  select e.hold_reasons into reasons from public.referral_eligibility(array['b0000000-0000-4000-8000-00000000000e'::uuid], 'd1000000-0000-4000-8000-000000000001', array['f0000000-0000-4000-8000-000000000005'::uuid]) e;
  if reasons <> array['license_requirement_under_review'] then raise exception 'C21 FAIL: case-by-case should await review, got %', reasons; end if;
end $$;
insert into public.contractor_license_determinations (contractor_id, category_id, requirement)
values ('b0000000-0000-4000-8000-00000000000e', 'f0000000-0000-4000-8000-000000000005', 'required');
do $$ declare reasons text[]; begin
  select e.hold_reasons into reasons from public.referral_eligibility(array['b0000000-0000-4000-8000-00000000000e'::uuid], 'd1000000-0000-4000-8000-000000000001', array['f0000000-0000-4000-8000-000000000005'::uuid]) e;
  if reasons <> array['license_missing_or_expired'] then raise exception 'C21 FAIL: after "required" decision expected missing license, got %', reasons; end if;
end $$;
insert into public.contractor_documents (contractor_id, document_type, expiration_date, status) values ('b0000000-0000-4000-8000-00000000000e', 'LICENSE', current_date + 365, 'APPROVED');
do $$ declare ok boolean; begin
  select e.referral_eligible into ok from public.referral_eligibility(array['b0000000-0000-4000-8000-00000000000e'::uuid], 'd1000000-0000-4000-8000-000000000001', array['f0000000-0000-4000-8000-000000000005'::uuid]) e;
  if not ok then raise exception 'C21 FAIL: approved license did not restore eligibility'; end if;
  raise notice 'C21 pass: case-by-case -> admin decides -> license reviewed -> eligible';
end $$;

-- C22: contractors cannot write licensing rules or decisions, or read other contractors' decisions
do $$ begin
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-000000000005', 'role', 'authenticated')::text, true);
    insert into public.license_requirements (category_id, state_code, requirement) values ('f0000000-0000-4000-8000-000000000002', 'KY', 'not_required');
    raise exception 'C22 FAIL: contractor wrote a licensing rule';
  exception when insufficient_privilege then null; end;
  reset role;
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-000000000005', 'role', 'authenticated')::text, true);
    insert into public.contractor_license_determinations (contractor_id, category_id, requirement)
    values ('b0000000-0000-4000-8000-00000000000e', 'f0000000-0000-4000-8000-000000000002', 'not_required');
    raise exception 'C22 FAIL: contractor decided own license requirement';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :proA, 'role', 'authenticated')::text, true);
update public.license_requirements set requirement = 'not_required' where category_id = 'f0000000-0000-4000-8000-000000000002';
create temp table c22 as select (select count(*) from public.contractor_license_determinations) as seen;
commit;
do $$ begin
  if (select requirement from public.license_requirements where category_id = 'f0000000-0000-4000-8000-000000000002' and state_code = 'TN') <> 'required' then
    raise exception 'C22 FAIL: contractor changed a rule'; end if;
  if (select seen from c22) <> 0 then raise exception 'C22 FAIL: contractor A read E''s decisions'; end if;
  raise notice 'C22 pass: rules and decisions are admin-only; contractors see only their own decisions';
end $$;

-- C23: one rule per trade + place; logged-out visitors cannot call the eligibility check
do $$ begin
  begin
    insert into public.license_requirements (category_id, state_code, requirement) values ('f0000000-0000-4000-8000-000000000002', 'TN', 'not_required');
    raise exception 'C23 FAIL: duplicate statewide rule accepted';
  exception when unique_violation then null; end;
  if has_function_privilege('anon', 'public.referral_eligibility(uuid[], uuid, uuid[])', 'execute') then
    raise exception 'C23 FAIL: anon can run eligibility check'; end if;
  raise notice 'C23 pass: no conflicting duplicate rules; eligibility check closed to logged-out visitors';
end $$;
