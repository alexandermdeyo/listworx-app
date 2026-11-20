-- ROLLBACK for 20261119000000_growth_business_pro_tiers.sql.
-- Removes the 'Growth' / 'Business Pro' tiers rows ONLY if no subscription
-- currently references them.
begin;

delete from public.tiers
where name in ('Growth', 'Business Pro')
  and not exists (
    select 1 from public.subscriptions where subscriptions.tier_id = tiers.id
  );

commit;
