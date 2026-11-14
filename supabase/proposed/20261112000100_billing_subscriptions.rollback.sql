-- ROLLBACK for 20261112000100_billing_subscriptions.sql.
-- Restores the original subscriptions structure. Subscription rows written
-- meanwhile are kept; their status is converted back to the uppercase enum and
-- the added columns (customer id, billing period, cancel flag) are dropped.
-- The three added plan names are removed only if no subscription uses them.
begin;

alter table public.subscriptions drop constraint if exists subscriptions_contractor_id_key;
drop materialized view if exists public.active_contractors_view;
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions alter column status drop default;
alter table public.subscriptions
  alter column status type public.subscription_status using upper(status)::public.subscription_status;
alter table public.subscriptions alter column status set default 'INCOMPLETE'::public.subscription_status;
create materialized view public.active_contractors_view as
 SELECT DISTINCT cp.id AS contractor_id,
    cp.user_id, cp.company_name, cp.owner_name, u.email, u.phone, cp.website,
    cp.years_in_business, cp.bio,
    COALESCE(s.status, 'INCOMPLETE'::subscription_status) AS subscription_status,
    cp.partner_status, cp.ironclad_accepted
   FROM contractor_profiles cp
     JOIN users u ON cp.user_id = u.id
     LEFT JOIN subscriptions s ON cp.id = s.contractor_id
  WHERE cp.partner_status = 'active'::partner_status AND cp.ironclad_accepted = true AND (s.status = 'ACTIVE'::subscription_status OR s.status IS NULL);


alter table public.subscriptions drop constraint if exists subscriptions_billing_period_check;
alter table public.subscriptions
  drop column if exists cancel_at_period_end,
  drop column if exists billing_period,
  drop column if exists stripe_customer_id;

delete from public.tiers t
 where t.name in ('Basic Partner', 'Preferred Partner', 'Elite Partner')
   and not exists (select 1 from public.subscriptions s where s.tier_id = t.id);

commit;
