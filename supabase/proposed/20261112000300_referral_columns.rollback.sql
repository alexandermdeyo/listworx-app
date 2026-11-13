-- ROLLBACK for 20261112000300_referral_columns.sql.
-- Removes the four added columns; referrals and slot_number are kept.
-- After rollback the contractor Referrals list is empty again (the original bug).
begin;
alter table public.referrals
  drop column if exists slot_position,
  drop column if exists email_sent_at,
  drop column if exists requester_contacted,
  drop column if exists requester_contacted_at;
commit;
