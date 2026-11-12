-- ============================================================================
-- PROPOSED — NOT APPLIED. Launch blocker: contractors must not approve their
-- own documents (owner-approved 2026-11-12, minimum safe launch).
--
-- Isolated from the larger document-compliance proposal: no new columns, no
-- expiry automation, no referral holds. Works with today's dashboard screens.
--   * A contractor's new document always starts PENDING with no review data.
--   * A contractor can never approve, reject or expire a document, or change
--     who reviewed it or when, which contractor it belongs to, or its type.
--   * Changing the file or expiration date of a reviewed document sends it
--     back to PENDING for re-review (approval is never kept on a changed file).
--   * Admins, the server (service role) and direct database sessions are not
--     restricted; when they approve or reject, reviewer and time are recorded.
-- Production had 0 contractor_documents rows on 2026-11-10. Safe to re-run.
-- ============================================================================
begin;

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
    new.status := 'PENDING';
    new.reviewed_by := null;
    new.reviewed_at := null;
    return new;
  end if;

  -- UPDATE by a contractor
  if new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.contractor_id is distinct from old.contractor_id
     or new.document_type is distinct from old.document_type then
    raise exception 'Only ListWorx administrators can review documents.' using errcode = '42501';
  end if;

  if new.status is distinct from old.status and new.status is distinct from 'PENDING' then
    raise exception 'Only ListWorx administrators can approve or reject documents.' using errcode = '42501';
  end if;

  -- A changed file or date must be reviewed again.
  if new.expiration_date is distinct from old.expiration_date
     or new.document_url is distinct from old.document_url
     or new.storage_path is distinct from old.storage_path
     or new.file_name is distinct from old.file_name then
    new.status := 'PENDING';
    new.reviewed_by := null;
    new.reviewed_at := null;
  elsif new.notes is distinct from old.notes and new.status is distinct from 'PENDING' then
    -- review notes belong to the administrator unless the contractor is resubmitting
    raise exception 'Only ListWorx administrators can change review notes.' using errcode = '42501';
  end if;

  return new;
end
$function$;

drop trigger if exists guard_contractor_document on public.contractor_documents;
create trigger guard_contractor_document
  before insert or update on public.contractor_documents
  for each row execute function public.guard_contractor_document();

commit;
