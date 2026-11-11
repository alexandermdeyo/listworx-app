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
-- 2. Which trades require a professional license (set by the admin).
-- ---------------------------------------------------------------------------
alter table public.categories
  add column if not exists requires_license boolean not null default false;
comment on column public.categories.requires_license is
  'Admin-set. When true, contractors in this trade need a current approved LICENSE document to receive referrals.';

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
  select cc.contractor_id, bool_or(c.requires_license) as required
    from public.contractor_categories cc
    join public.categories c on c.id = cc.category_id
   group by cc.contractor_id
)
select p.id as contractor_id,
       ins.id is not null                        as insurance_current,
       ins.expiration_date                        as insurance_expires,
       coalesce(lr.required, false)               as license_required,
       lic.id is not null                         as license_current,
       lic.expiration_date                        as license_expires,
       (ins.id is not null and (not coalesce(lr.required, false) or lic.id is not null))
                                                  as referral_eligible,
       array_remove(array[
         case when ins.id is null then
           case when pi.contractor_id is not null then 'insurance_awaiting_review' else 'insurance_missing_or_expired' end
         end,
         case when coalesce(lr.required, false) and lic.id is null then
           case when pl.contractor_id is not null then 'license_awaiting_review' else 'license_missing_or_expired' end
         end
       ], null)                                   as hold_reasons
  from public.contractor_profiles p
  left join current_docs ins on ins.contractor_id = p.id and ins.document_type = 'INSURANCE'
  left join current_docs lic on lic.contractor_id = p.id and lic.document_type = 'LICENSE'
  left join pending_docs pi  on pi.contractor_id = p.id and pi.document_type = 'INSURANCE'
  left join pending_docs pl  on pl.contractor_id = p.id and pl.document_type = 'LICENSE'
  left join license_rule lr  on lr.contractor_id = p.id;

comment on view public.contractor_compliance is
  'Live insurance/license compliance per contractor. security_invoker: contractors see only their own row through existing RLS.';
revoke all on public.contractor_compliance from anon;
grant select on public.contractor_compliance to authenticated, service_role;

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
