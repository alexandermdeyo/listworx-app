-- ROLLBACK for 20261112000300_referral_columns.sql.
-- Restores production's original referral policies (contractors can read and
-- update their own referral rows again), removes the tally function and the
-- four added columns. Referrals and slot_number are kept.
begin;
drop function if exists public.my_referral_tally();

drop policy if exists "Admins read referrals" on public.referrals;
drop policy if exists "Referrals read access for involved parties" on public.referrals;
create policy "Referrals read access for involved parties" on public.referrals
  for select to authenticated
  using ((contractor_id in (select contractor_profiles.id from contractor_profiles where contractor_profiles.user_id = (select auth.uid()))) or is_admin());

drop policy if exists "Admins update referrals" on public.referrals;
drop policy if exists "Contractors update own referrals or admin updates all" on public.referrals;
create policy "Contractors update own referrals or admin updates all" on public.referrals
  for update to authenticated
  using ((contractor_id in (select contractor_profiles.id from contractor_profiles where contractor_profiles.user_id = (select auth.uid()))) or is_admin())
  with check ((contractor_id in (select contractor_profiles.id from contractor_profiles where contractor_profiles.user_id = (select auth.uid()))) or is_admin());

alter table public.referrals
  drop column if exists slot_position,
  drop column if exists email_sent_at,
  drop column if exists requester_contacted,
  drop column if exists requester_contacted_at;
commit;
