-- ============================================================================
-- PROPOSED — Stage 1A (owner-approved for test 2026-11-14).
-- active_contractors_view is readable by anyone with the public key and holds
-- each active contractor's email, phone, user id, owner name and bio. The site
-- only reads contractor_id from it (/api/markets/active, /api/categories/active).
-- Visitors and signed-in users keep SELECT on contractor_id only. service_role
-- (server code) and the owner keep full access. The view's definition and
-- contents are unchanged.
-- ============================================================================
begin;
revoke all on public.active_contractors_view from anon, authenticated;
grant select (contractor_id) on public.active_contractors_view to anon, authenticated;
commit;
