-- ROLLBACK for 20261118000000_network_free_tier.sql.
-- Removes the 'Network' tiers row ONLY if no subscription currently
-- references it -- never drop a tier a contractor (free or otherwise) is
-- actually subscribed to out from under them.
begin;

delete from public.tiers
where name = 'Network'
  and not exists (
    select 1 from public.subscriptions where subscriptions.tier_id = tiers.id
  );

commit;
