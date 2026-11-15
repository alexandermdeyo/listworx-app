-- ROLLBACK for 20261114000100_active_contractors_view_privacy.sql:
-- restores the previous (full) access for anon and authenticated.
begin;
revoke select (contractor_id) on public.active_contractors_view from anon, authenticated;
grant all on public.active_contractors_view to anon, authenticated;
commit;
