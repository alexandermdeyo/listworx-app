-- ============================================================================
-- PROPOSED — NOT APPLIED. Launch blocker found in browser testing (2026-11-12):
-- a contractor's dashboard showed "No referrals yet" even though a referral had
-- been created for them.
--
-- The app reads and writes referral columns production does not have:
--   * slot_position          — contractor Referrals list and admin Job Requests
--                              list select it; production calls it slot_number,
--                              so the whole query fails and the list is empty
--   * email_sent_at          — admin "resend referral email" records it
--   * requester_contacted,
--     requester_contacted_at — admin "mark contacted" records them
-- Additive only: four nullable/defaulted columns, existing rows and slot_number
-- are kept. Nothing else changes (no policies, no triggers).
-- Production had 0 referrals on 2026-11-10. Safe to re-run.
-- ============================================================================
begin;

alter table public.referrals
  add column if not exists slot_position          integer,
  add column if not exists email_sent_at          timestamptz,
  add column if not exists requester_contacted    boolean not null default false,
  add column if not exists requester_contacted_at timestamptz;

-- Carry over any slot numbers already recorded under the old name.
update public.referrals
   set slot_position = slot_number
 where slot_position is null and slot_number is not null;

commit;
