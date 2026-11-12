-- ROLLBACK for 20261112000100_billing_subscriptions.sql.
-- Restores the original subscriptions structure. Subscription rows written
-- meanwhile are kept; their status is converted back to the uppercase enum and
-- the added columns (customer id, billing period, cancel flag) are dropped.
-- The three added plan names are removed only if no subscription uses them.
begin;

alter table public.subscriptions drop constraint if exists subscriptions_contractor_id_key;
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions alter column status drop default;
alter table public.subscriptions
  alter column status type public.subscription_status using upper(status)::public.subscription_status;
alter table public.subscriptions alter column status set default 'INCOMPLETE'::public.subscription_status;

alter table public.subscriptions drop constraint if exists subscriptions_billing_period_check;
alter table public.subscriptions
  drop column if exists cancel_at_period_end,
  drop column if exists billing_period,
  drop column if exists stripe_customer_id;

delete from public.tiers t
 where t.name in ('Basic Partner', 'Preferred Partner', 'Elite Partner')
   and not exists (select 1 from public.subscriptions s where s.tier_id = t.id);

commit;
