-- active_contractors_view equivalence (2026-11-14): contractors in every subscription state,
-- snapshot the view under the OLD enum definition; 55_view_equiv_after.sql compares after the change.
insert into public.users (id, role, name, email) values
  ('c0000000-0000-4000-8000-000000000001','CONTRACTOR','V1','v1@example.com'),
  ('c0000000-0000-4000-8000-000000000002','CONTRACTOR','V2','v2@example.com'),
  ('c0000000-0000-4000-8000-000000000003','CONTRACTOR','V3','v3@example.com'),
  ('c0000000-0000-4000-8000-000000000004','CONTRACTOR','V4','v4@example.com'),
  ('c0000000-0000-4000-8000-000000000005','CONTRACTOR','V5','v5@example.com'),
  ('c0000000-0000-4000-8000-000000000006','CONTRACTOR','V6','v6@example.com');
insert into public.contractor_profiles (id, user_id, company_name, owner_name, partner_status, ironclad_accepted) values
  ('d0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','V1 active sub','V1','active',true),
  ('d0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000002','V2 past_due','V2','active',true),
  ('d0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000003','V3 cancelled','V3','active',true),
  ('d0000000-0000-4000-8000-000000000004','c0000000-0000-4000-8000-000000000004','V4 no sub','V4','active',true),
  ('d0000000-0000-4000-8000-000000000005','c0000000-0000-4000-8000-000000000005','V5 not accepted','V5','active',false),
  ('d0000000-0000-4000-8000-000000000006','c0000000-0000-4000-8000-000000000006','V6 approved only','V6','approved',true);
insert into public.tiers (name) values ('View Test Tier');
insert into public.subscriptions (contractor_id, tier_id, status)
select v.cid::uuid, (select id from public.tiers where name='View Test Tier'), v.st::public.subscription_status
from (values ('d0000000-0000-4000-8000-000000000001','ACTIVE'),('d0000000-0000-4000-8000-000000000002','PAST_DUE'),
             ('d0000000-0000-4000-8000-000000000003','CANCELLED'),('d0000000-0000-4000-8000-000000000005','ACTIVE'),
             ('d0000000-0000-4000-8000-000000000006','ACTIVE')) v(cid, st);
refresh materialized view public.active_contractors_view;
create table public._view_before as
  select contractor_id, lower(subscription_status::text) as subscription_status from public.active_contractors_view;
