-- ============================================================================
-- PROPOSED — NOT APPLIED. Launch blocker: let the Stripe webhook record
-- contractor subscriptions (owner-approved 2026-11-12, minimum safe launch).
--
-- Production's subscriptions table and tiers rows do not match what the app
-- already writes and reads (webhook, /billing, dashboard subscription section,
-- admin subscription override, backfill):
--   * app writes/reads lowercase status ('active', 'past_due', ...); the column
--     is an uppercase enum            -> becomes text with a lowercase check
--   * app writes stripe_customer_id, billing_period, cancel_at_period_end;
--     the columns do not exist        -> added
--   * webhook upserts on contractor_id; no unique key -> unique key added
--   * app resolves plans named 'Basic Partner' / 'Preferred Partner' /
--     'Elite Partner'; production only has 'Network ... — Founding/Standard'
--                                     -> the three names are added; existing
--                                        rows are left untouched
-- Prices live in Stripe; nothing in the app reads tiers prices (checked).
-- Production had 0 subscriptions rows on 2026-11-12. Safe to re-run.
-- ============================================================================
begin;

-- Stop rather than guess if duplicates ever appear before this runs.
do $$ begin
  if exists (select contractor_id from public.subscriptions group by contractor_id having count(*) > 1) then
    raise exception 'subscriptions has more than one row for a contractor; resolve before applying';
  end if;
end $$;

-- 1. Plan names the app uses
insert into public.tiers (name)
select v.name from (values ('Basic Partner'), ('Preferred Partner'), ('Elite Partner')) v(name)
where not exists (select 1 from public.tiers t where lower(t.name) = lower(v.name));

-- 2. Columns the webhook writes and the billing pages read
alter table public.subscriptions
  add column if not exists stripe_customer_id   text,
  add column if not exists billing_period       text    not null default 'monthly',
  add column if not exists cancel_at_period_end boolean not null default false;

alter table public.subscriptions drop constraint if exists subscriptions_billing_period_check;
alter table public.subscriptions
  add constraint subscriptions_billing_period_check check (billing_period in ('monthly', 'annual'));

-- 3. Status: lowercase text, as written by the webhook and read by /billing and the dashboard
alter table public.subscriptions alter column status drop default;
alter table public.subscriptions
  alter column status type text using lower(status::text);
alter table public.subscriptions alter column status set default 'incomplete';
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('active', 'past_due', 'cancelled', 'incomplete', 'trialing'));

-- 4. One subscription record per contractor (the webhook upserts on it)
alter table public.subscriptions drop constraint if exists subscriptions_contractor_id_key;
alter table public.subscriptions
  add constraint subscriptions_contractor_id_key unique (contractor_id);

commit;
