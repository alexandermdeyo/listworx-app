-- ============================================================================
-- PROPOSED MIGRATION — NOT APPLIED. Requires owner approval.
-- Runs AFTER 20261111000000_align_profiles_referrals.sql.
--
-- Insurance and license compliance (owner-approved rules, 2026-11-10):
--   * contractors upload/replace documents but cannot approve them or touch
--     review fields; reviewed documents are frozen (replace = new upload)
--   * history is kept: a replacement is a new row, old rows stay
--   * admin review records reviewer + timestamp
--   * referral eligibility is computed live from documents (see the view)
--   * a notification log prevents duplicate reminders
-- Holds are NOT enforced until admin_settings.compliance_holds_enforced = 'true'.
-- Additive only. Production had 0 contractor_documents rows on 2026-11-10.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Review details and replacement history on contractor_documents
--    (reviewed_by / reviewed_at already exist but were never filled).
-- ---------------------------------------------------------------------------
alter table public.contractor_documents
  add column if not exists licensing_authority  text,
  add column if not exists verification_note    text,
  add column if not exists replaces_document_id uuid
    references public.contractor_documents(id) on delete set null;

comment on column public.contractor_documents.licensing_authority is
  'Admin-entered: the agency whose records the license was checked against.';
comment on column public.contractor_documents.verification_note is
  'Admin-entered: what was checked (e.g. license number, lookup date). Insurance is reviewed from the submitted certificate, not verified with the insurer.';
comment on column public.contractor_documents.replaces_document_id is
  'The earlier document this upload renews. The earlier row is kept as history.';

create index if not exists contractor_documents_contractor_type_idx
  on public.contractor_documents (contractor_id, document_type, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Licensing rules by trade AND place (owner decision 2026-11-10: rules are
--    not uniform across states or counties; uncertain cases go to an admin).
--    * license_requirements: admin-maintained rule per trade + state, with an
--      optional county-level override. 'case_by_case' = depends on the job
--      (e.g. a project-value threshold) and needs an admin decision.
--    * contractor_license_determinations: the admin's decision for one
--      contractor + trade in one jurisdiction (a whole state, or one county):
--      required / not_required / awaiting_determination, with a note, a source
--      link and optionally the supporting document.
--    Resolution for a contractor, trade and county: the contractor's county
--    decision, else the county rule, else their statewide decision, else the
--    state rule, else 'needs_review' (a statewide decision never overrides a
--    stricter county rule). 'case_by_case' and 'awaiting_determination'
--    also mean 'needs_review'. A trade is never treated as license-required
--    unless an admin says so; a pending case blocks only that trade in that
--    jurisdiction (owner decision 2026-11-12).
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                  where t.typname = 'license_requirement' and n.nspname = 'public') then
    create type public.license_requirement as enum ('required', 'not_required', 'case_by_case', 'awaiting_determination');
  end if;
end $$;

create table if not exists public.license_requirements (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories(id) on delete cascade,
  state_code   text not null check (state_code ~ '^[A-Z]{2}$'),
  county_id    uuid references public.counties(id) on delete cascade,
  requirement  public.license_requirement not null,
  conditions   text,
  source_url   text,
  reviewed_by  uuid references public.users(id) on delete set null default auth.uid(),
  reviewed_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create unique index if not exists license_requirements_scope_uidx
  on public.license_requirements (category_id, state_code, coalesce(county_id, '00000000-0000-0000-0000-000000000000'::uuid));
comment on table public.license_requirements is
  'Admin-maintained licensing rule per trade and state (county_id null) or county (override). Source and conditions record why.';

create table if not exists public.contractor_license_determinations (
  id                  uuid primary key default gen_random_uuid(),
  contractor_id       uuid not null references public.contractor_profiles(id) on delete cascade,
  category_id         uuid not null references public.categories(id) on delete cascade,
  state_code          text not null check (state_code ~ '^[A-Z]{2}$'),
  county_id           uuid references public.counties(id) on delete cascade,
  requirement         public.license_requirement not null check (requirement <> 'case_by_case'),
  note                text,
  source_url          text,
  supporting_document_id uuid references public.contractor_documents(id) on delete set null,
  decided_by          uuid references public.users(id) on delete set null default auth.uid(),
  decided_at          timestamptz not null default now()
);
create unique index if not exists contractor_license_determinations_scope_uidx
  on public.contractor_license_determinations
  (contractor_id, category_id, state_code, coalesce(county_id, '00000000-0000-0000-0000-000000000000'::uuid));
comment on table public.contractor_license_determinations is
  'Admin decision for one contractor, trade and jurisdiction (state, or one county): required, not_required or awaiting_determination, with supporting information.';

alter table public.license_requirements enable row level security;
alter table public.contractor_license_determinations enable row level security;

drop policy if exists "Logged-in users read license rules" on public.license_requirements;
create policy "Logged-in users read license rules" on public.license_requirements
  for select to authenticated using (true);
drop policy if exists "Admins manage license rules" on public.license_requirements;
create policy "Admins manage license rules" on public.license_requirements
  for all to authenticated using ((select is_admin())) with check ((select is_admin()));

drop policy if exists "Contractors read own license decisions" on public.contractor_license_determinations;
create policy "Contractors read own license decisions" on public.contractor_license_determinations
  for select to authenticated
  using ((select is_admin()) or contractor_id in (select id from public.contractor_profiles where user_id = (select auth.uid())));
drop policy if exists "Admins manage license decisions" on public.contractor_license_determinations;
create policy "Admins manage license decisions" on public.contractor_license_determinations
  for all to authenticated using ((select is_admin())) with check ((select is_admin()));

revoke all on public.license_requirements, public.contractor_license_determinations from anon;
grant select on public.license_requirements, public.contractor_license_determinations to authenticated;
grant insert, update, delete on public.license_requirements, public.contractor_license_determinations to authenticated;

-- 'required' | 'not_required' | 'needs_review' for one contractor, trade and county.
create or replace function public.license_requirement_for(p_contractor_id uuid, p_category_id uuid, p_county_id uuid)
returns text language sql stable security invoker set search_path = public as $$
  with place as (select c.id as county_id, c.state_code from public.counties c where c.id = p_county_id),
  candidates as (
    -- 1. admin decision for this contractor in this county
    select d.requirement::text as req, 1 as prio from public.contractor_license_determinations d, place
     where d.contractor_id = p_contractor_id and d.category_id = p_category_id
       and d.state_code = place.state_code and d.county_id = place.county_id
    union all
    -- 2. county rule
    select r.requirement::text, 2 from public.license_requirements r, place
     where r.category_id = p_category_id and r.state_code = place.state_code and r.county_id = place.county_id
    union all
    -- 3. admin decision for this contractor statewide
    select d.requirement::text, 3 from public.contractor_license_determinations d, place
     where d.contractor_id = p_contractor_id and d.category_id = p_category_id
       and d.state_code = place.state_code and d.county_id is null
    union all
    -- 4. state rule
    select r.requirement::text, 4 from public.license_requirements r, place
     where r.category_id = p_category_id and r.state_code = place.state_code and r.county_id is null
  )
  select case (select req from candidates order by prio limit 1)
    when 'required' then 'required'
    when 'not_required' then 'not_required'
    else 'needs_review'   -- case_by_case, awaiting_determination, or nothing recorded
  end
$$;

-- ---------------------------------------------------------------------------
-- 3. Guard: contractors can upload and edit their own PENDING documents only.
--    Admins / service role / direct sessions (is_privileged_writer) are not
--    restricted, and an admin status change stamps reviewer + time.
-- ---------------------------------------------------------------------------
create or replace function public.guard_contractor_document()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if public.is_privileged_writer() then
    if tg_op = 'UPDATE' and new.status is distinct from old.status
       and new.status in ('APPROVED', 'REJECTED') then
      if new.reviewed_at is not distinct from old.reviewed_at then
        new.reviewed_at := now();
      end if;
      if new.reviewed_by is not distinct from old.reviewed_by and auth.uid() is not null then
        new.reviewed_by := auth.uid();
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Every contractor upload starts unreviewed, whatever the client sent.
    new.status := 'PENDING';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.notes := '';
    new.licensing_authority := null;
    new.verification_note := null;
    if new.replaces_document_id is not null and not exists (
      select 1 from public.contractor_documents d
       where d.id = new.replaces_document_id
         and d.contractor_id = new.contractor_id
         and d.document_type = new.document_type
    ) then
      new.replaces_document_id := null;
    end if;
    return new;
  end if;

  -- UPDATE by a contractor
  if new.status is distinct from old.status
     or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.notes is distinct from old.notes
     or new.licensing_authority is distinct from old.licensing_authority
     or new.verification_note is distinct from old.verification_note
     or new.contractor_id is distinct from old.contractor_id
     or new.document_type is distinct from old.document_type
     or new.replaces_document_id is distinct from old.replaces_document_id then
    raise exception 'Only ListWorx administrators can review documents.'
      using errcode = '42501';
  end if;

  if old.status is distinct from 'PENDING' and (
       new.expiration_date is distinct from old.expiration_date
       or new.document_url is distinct from old.document_url
       or new.storage_path is distinct from old.storage_path
       or new.file_name is distinct from old.file_name) then
    raise exception 'This document has already been reviewed. Upload a replacement instead.'
      using errcode = '42501';
  end if;

  return new;
end
$function$;

drop trigger if exists guard_contractor_document on public.contractor_documents;
create trigger guard_contractor_document
  before insert or update on public.contractor_documents
  for each row execute function public.guard_contractor_document();

-- ---------------------------------------------------------------------------
-- 4. Live referral eligibility. Evaluated at query time, so matching uses
--    today's date (Central time) — no dependence on the daily job.
--    A document is current when APPROVED, has an expiration date, and that
--    date is today or later. A pending renewal does not cancel a still-current
--    approved document; pending alone is not current.
-- ---------------------------------------------------------------------------
create or replace function public.compliance_today()
returns date language sql stable set search_path = public as $$
  select (now() at time zone 'America/Chicago')::date
$$;

create or replace view public.contractor_compliance
with (security_invoker = true) as
with current_docs as (
  select distinct on (d.contractor_id, d.document_type)
         d.contractor_id, d.document_type, d.id, d.expiration_date
    from public.contractor_documents d
   where d.status = 'APPROVED'
     and d.document_type in ('LICENSE', 'INSURANCE')
     and d.expiration_date is not null
     and d.expiration_date >= public.compliance_today()
   order by d.contractor_id, d.document_type, d.expiration_date desc
),
pending_docs as (
  select d.contractor_id, d.document_type
    from public.contractor_documents d
   where d.status = 'PENDING' and d.document_type in ('LICENSE', 'INSURANCE')
   group by d.contractor_id, d.document_type
),
license_rule as (
  -- Across every trade the contractor offers in every county they serve.
  select cc.contractor_id,
         bool_or(x.req = 'required')     as required,
         bool_or(x.req = 'needs_review') as review_needed
    from public.contractor_categories cc
    join public.contractor_counties ct on ct.contractor_id = cc.contractor_id
    cross join lateral (select public.license_requirement_for(cc.contractor_id, cc.category_id, ct.county_id) as req) x
   group by cc.contractor_id
)
select p.id as contractor_id,
       ins.id is not null                        as insurance_current,
       ins.expiration_date                        as insurance_expires,
       coalesce(lr.required, false)               as license_required,
       lic.id is not null                         as license_current,
       lic.expiration_date                        as license_expires,
       (ins.id is not null and (not coalesce(lr.required, false) or lic.id is not null)
        and not coalesce(lr.review_needed, false))
                                                  as referral_eligible,
       array_remove(array[
         case when ins.id is null then
           case when pi.contractor_id is not null then 'insurance_awaiting_review' else 'insurance_missing_or_expired' end
         end,
         case when coalesce(lr.required, false) and lic.id is null then
           case when pl.contractor_id is not null then 'license_awaiting_review' else 'license_missing_or_expired' end
         end,
         case when coalesce(lr.review_needed, false) then 'license_requirement_under_review' end
       ], null)                                   as hold_reasons,
       coalesce(lr.review_needed, false)          as license_review_needed
  from public.contractor_profiles p
  left join current_docs ins on ins.contractor_id = p.id and ins.document_type = 'INSURANCE'
  left join current_docs lic on lic.contractor_id = p.id and lic.document_type = 'LICENSE'
  left join pending_docs pi  on pi.contractor_id = p.id and pi.document_type = 'INSURANCE'
  left join pending_docs pl  on pl.contractor_id = p.id and pl.document_type = 'LICENSE'
  left join license_rule lr  on lr.contractor_id = p.id;

comment on view public.contractor_compliance is
  'Live insurance/license compliance per contractor across all trades and counties served (dashboard view). Matching uses referral_eligibility() for the job''s own county and trades. security_invoker: contractors see only their own row through existing RLS.';
revoke all on public.contractor_compliance from anon;
grant select on public.contractor_compliance to authenticated, service_role;

-- Eligibility for ONE job: only the job's county and the requested trades count,
-- so a painter who also lists a licensed trade is not held from painting jobs.
create or replace function public.referral_eligibility(p_contractor_ids uuid[], p_county_id uuid, p_category_ids uuid[])
returns table (contractor_id uuid, referral_eligible boolean, hold_reasons text[])
language sql stable security invoker set search_path = public as $$
  with req as (
    select cc.contractor_id,
           bool_or(x.req = 'required')     as required,
           bool_or(x.req = 'needs_review') as review_needed
      from public.contractor_categories cc
      cross join lateral (select public.license_requirement_for(cc.contractor_id, cc.category_id, p_county_id) as req) x
     where cc.contractor_id = any(p_contractor_ids)
       and cc.category_id = any(p_category_ids)
     group by cc.contractor_id
  )
  select c.contractor_id,
         c.insurance_current
           and (not coalesce(r.required, false) or c.license_current)
           and not coalesce(r.review_needed, false),
         array_remove(array[
           case when not c.insurance_current then
             case when 'insurance_awaiting_review' = any(c.hold_reasons) then 'insurance_awaiting_review' else 'insurance_missing_or_expired' end
           end,
           case when coalesce(r.required, false) and not c.license_current then
             case when exists (select 1 from public.contractor_documents d
                                where d.contractor_id = c.contractor_id and d.document_type = 'LICENSE' and d.status = 'PENDING')
                  then 'license_awaiting_review' else 'license_missing_or_expired' end
           end,
           case when coalesce(r.review_needed, false) then 'license_requirement_under_review' end
         ], null)
    from public.contractor_compliance c
    left join req r on r.contractor_id = c.contractor_id
   where c.contractor_id = any(p_contractor_ids)
$$;
revoke all on function public.referral_eligibility(uuid[], uuid, uuid[]) from public, anon;
grant execute on function public.referral_eligibility(uuid[], uuid, uuid[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Notification log — one row per (document, notice). The unique key is
--    the duplicate guard: a sender claims the row first, then sends.
--    RLS on with no policies: only the service role (server) can use it.
-- ---------------------------------------------------------------------------
create table if not exists public.document_notifications (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.contractor_documents(id) on delete cascade,
  kind        text not null check (kind in
                ('expiry_60', 'expiry_30', 'expiry_14', 'expiry_7',
                 'expired', 'admin_expired', 'admin_pending')),
  sent_at     timestamptz not null default now(),
  unique (document_id, kind)
);
alter table public.document_notifications enable row level security;
revoke all on public.document_notifications from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Enforcement switch — OFF. Matching only logs would-be holds until the
--    owner sets this to 'true' (after the customer-facing disclosures ship).
--    Logged-in users may read (not change) this one key, so the contractor
--    dashboard can say whether a hold is in effect.
-- ---------------------------------------------------------------------------
insert into public.admin_settings (key, value)
values ('compliance_holds_enforced', 'false')
on conflict (key) do nothing;
drop policy if exists "Logged-in users read compliance enforcement setting" on public.admin_settings;
create policy "Logged-in users read compliance enforcement setting" on public.admin_settings
  for select to authenticated using (key = 'compliance_holds_enforced');

commit;

-- ---------------------------------------------------------------------------
-- 6b. Application uploads become reviewable documents (owner decision
--     2026-11-10: the application uses the same review system as renewals).
--     Existing application files are kept where they are; this only adds a
--     PENDING document record pointing at each one that has no record yet.
--     Production had 0 such profiles on 2026-11-10; safe to re-run.
-- ---------------------------------------------------------------------------
insert into public.contractor_documents
  (contractor_id, document_type, document_url, storage_path, expiration_date, status, file_name, notes)
select p.id, v.doc_type::public.document_type, v.url, v.path, v.exp, 'PENDING',
       regexp_replace(v.path, '^.*/', ''), 'Submitted with application'
  from public.contractor_profiles p
  cross join lateral (values
      ('LICENSE',   nullif(p.license_document_url, ''),   p.license_expiration_date),
      ('INSURANCE', nullif(p.insurance_document_url, ''), p.insurance_expiration_date)
    ) v0(doc_type, url, exp)
  cross join lateral (select v0.doc_type, v0.url, v0.exp,
      substring(v0.url from '/object/(?:sign|public|authenticated)/contractor-documents/([^?]+)') as path) v
 where v.path is not null
   and not exists (select 1 from public.contractor_documents d
                    where d.contractor_id = p.id and d.storage_path = v.path);

-- ---------------------------------------------------------------------------
-- 7. Storage (bucket contractor-documents). Run separately: policies on
--    storage.objects belong to supabase_storage_admin; if the SQL editor
--    refuses, make the same change in Dashboard → Storage → Policies.
--    * Remove contractors' UPDATE on files (no overwriting a reviewed file).
--    * Contractors may delete only their own optional profile documents,
--      never license/insurance/application files.
-- ---------------------------------------------------------------------------
-- drop policy if exists "Contractors can update their own documents" on storage.objects;
-- drop policy if exists "Contractors can delete their own documents" on storage.objects;
-- create policy "Contractors can delete their own profile documents" on storage.objects
--   for delete to authenticated
--   using (bucket_id = 'contractor-documents'
--          and (storage.foldername(name))[1] = (auth.uid())::text
--          and (storage.foldername(name))[2] = 'profile-documents');
