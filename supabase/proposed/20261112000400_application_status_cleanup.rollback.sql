-- ROLLBACK for 20261112000400_application_status_cleanup.sql.
-- Puts back exactly the rows the cleanup changed (still 'approved'), then drops the log.
begin;
update public.contractor_applications ca
   set status = l.previous_status, updated_at = now()
  from public.application_status_cleanup_20261112 l
 where ca.id = l.application_id and ca.status = 'approved';
drop table if exists public.application_status_cleanup_20261112;
commit;
