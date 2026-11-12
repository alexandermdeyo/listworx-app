-- ============================================================================
-- ROLLBACK for 20261111000100_document_compliance.sql — owner approval only.
-- Run BEFORE the 20261111000000 rollback if undoing both.
-- Document rows uploaded meanwhile are kept (including PENDING records created
-- from application uploads); only the added columns, view, functions, licensing
-- rule tables, log table, trigger and setting are removed. Values in the removed columns
-- (licensing authority, verification notes, replacement links) are lost.
-- ============================================================================
begin;

drop policy if exists "Logged-in users read compliance enforcement setting" on public.admin_settings;
delete from public.admin_settings where key = 'compliance_holds_enforced';
drop table if exists public.document_notifications;
drop function if exists public.referral_eligibility(uuid[], uuid, uuid[]);
drop view if exists public.contractor_compliance;
drop function if exists public.compliance_today();
drop function if exists public.license_requirement_for(uuid, uuid, uuid);
drop table if exists public.contractor_license_determinations;
drop table if exists public.license_requirements;
drop type if exists public.license_requirement;
drop trigger if exists guard_contractor_document on public.contractor_documents;
drop function if exists public.guard_contractor_document();
drop index if exists public.contractor_documents_contractor_type_idx;
alter table public.contractor_documents
  drop column if exists replaces_document_id,
  drop column if exists verification_note,
  drop column if exists licensing_authority;

commit;

-- Storage (separately, if section 7 was applied): restore the original policies.
-- drop policy if exists "Contractors can delete their own profile documents" on storage.objects;
-- create policy "Contractors can update their own documents" on storage.objects for update to authenticated
--   using (bucket_id = 'contractor-documents' and (storage.foldername(name))[1] = (auth.uid())::text)
--   with check (bucket_id = 'contractor-documents' and (storage.foldername(name))[1] = (auth.uid())::text);
-- create policy "Contractors can delete their own documents" on storage.objects for delete to authenticated
--   using (bucket_id = 'contractor-documents' and (storage.foldername(name))[1] = (auth.uid())::text);
