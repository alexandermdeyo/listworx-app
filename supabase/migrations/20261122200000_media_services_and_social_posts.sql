-- ListWorx Media Services: orders, scheduling, and Business Pro social post requests.
-- All tables are server-only: RLS is enabled with no anon/authenticated policies,
-- so every read and write goes through API routes that use the service role and
-- check the caller (customer or ADMIN) first.

-- The overlap guard uses a plain range exclusion constraint (built-in GiST
-- range support); no extension is required.

-- ── Scheduling settings (single row) ─────────────────────────────────────────
create table if not exists public.media_schedule_settings (
  id int primary key default 1 check (id = 1),
  timezone text not null default 'America/Chicago',
  slot_interval_minutes int not null default 30 check (slot_interval_minutes between 15 and 120),
  buffer_minutes int not null default 30 check (buffer_minutes between 0 and 240),
  hold_minutes int not null default 35 check (hold_minutes between 31 and 1440),
  min_notice_hours int not null default 48 check (min_notice_hours between 0 and 720),
  booking_window_days int not null default 60 check (booking_window_days between 1 and 365),
  durations jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.media_schedule_settings (id) values (1) on conflict (id) do nothing;

-- Weekly availability: weekday 0 = Sunday … 6 = Saturday, local times.
create table if not exists public.media_availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  created_at timestamptz not null default now()
);

-- One-off open dates or blocked days/hours (null times = whole day).
create table if not exists public.media_availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  kind text not null check (kind in ('open', 'blocked')),
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now(),
  check ((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time > start_time)),
  check (kind = 'blocked' or start_time is not null)
);

-- ── Orders ──────────────────────────────────────────────────────────────────
create sequence if not exists public.media_order_number_seq start 1001;

create table if not exists public.media_orders (
  id uuid primary key default gen_random_uuid(),
  order_number int not null unique default nextval('public.media_order_number_seq'),
  customer_user_id uuid references public.users(id) on delete set null,
  customer_type text not null check (customer_type in ('contractor', 'realtor', 'guest')),
  contractor_id uuid references public.contractor_profiles(id) on delete set null,
  customer_name text not null,
  business_name text,
  email text not null,
  phone text not null,
  project_address text not null,
  project_notes text,
  service_code text not null,
  addon_codes text[] not null default '{}',
  line_items jsonb not null,
  retail_cents int not null check (retail_cents >= 0),
  discount_percent int not null default 0 check (discount_percent in (0, 5, 10)),
  discount_cents int not null default 0 check (discount_cents >= 0),
  total_cents int not null check (total_cents >= 0),
  membership_tier text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'expired', 'refunded', 'partially_refunded')),
  fulfillment_status text not null default 'awaiting_payment'
    check (fulfillment_status in ('awaiting_payment', 'pending_confirmation', 'needs_scheduling', 'reschedule_proposed', 'confirmed', 'in_progress', 'delivered', 'completed', 'canceled')),
  visits_required int not null default 1 check (visits_required between 1 and 2),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  paid_at timestamptz,
  assigned_provider text,
  deliverables_url text,
  admin_notes text,
  refunded_cents int not null default 0 check (refunded_cents >= 0),
  refunded_at timestamptz,
  stripe_refund_ids text[] not null default '{}',
  refund_notified_cents int not null default 0 check (refund_notified_cents >= 0),
  refund_lock_at timestamptz,
  admin_notified_at timestamptz,
  customer_notified_at timestamptz,
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists media_orders_user_idx on public.media_orders (customer_user_id);
create index if not exists media_orders_status_idx on public.media_orders (fulfillment_status, created_at desc);

-- ── Appointments (one per visit; Before-and-After has two) ──────────────────
-- block_start/block_end include the travel/setup buffer on both sides.
-- The exclusion constraint is the double-booking guard: no two live rows
-- (hold, requested, proposed, confirmed, blocked) may overlap.
create table if not exists public.media_appointments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.media_orders(id) on delete cascade,
  visit_number int not null default 1 check (visit_number between 1 and 2),
  status text not null check (status in ('hold', 'requested', 'proposed', 'confirmed', 'completed', 'canceled', 'expired', 'blocked')),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  block_start timestamptz not null,
  block_end timestamptz not null check (block_end > block_start),
  requested_starts_at timestamptz,
  hold_expires_at timestamptz,
  confirmed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_appointments_no_overlap exclude using gist (
    tstzrange(block_start, block_end, '[)') with &&
  ) where (status in ('hold', 'requested', 'proposed', 'confirmed', 'blocked'))
);
create index if not exists media_appointments_order_idx on public.media_appointments (order_id);
create index if not exists media_appointments_time_idx on public.media_appointments (block_start, block_end);

-- Atomic reservation: expire stale holds, then insert this order's holds.
-- Any overlap raises exclusion_violation (23P01) and nothing is inserted.
create or replace function public.reserve_media_appointments(p_order_id uuid, p_slots jsonb, p_hold_expires_at timestamptz)
returns setof public.media_appointments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare s jsonb;
begin
  update public.media_appointments
     set status = 'expired', updated_at = now()
   where status = 'hold' and hold_expires_at < now();

  for s in select * from jsonb_array_elements(p_slots) loop
    return query
    insert into public.media_appointments
      (order_id, visit_number, status, starts_at, ends_at, block_start, block_end, requested_starts_at, hold_expires_at)
    values
      (p_order_id, (s->>'visit')::int, 'hold', (s->>'starts_at')::timestamptz, (s->>'ends_at')::timestamptz,
       (s->>'block_start')::timestamptz, (s->>'block_end')::timestamptz, (s->>'starts_at')::timestamptz, p_hold_expires_at)
    returning *;
  end loop;
end $$;

-- Paid: record the payment, then try to turn every reservation into a request.
-- A hold that expired (or was released) is re-reserved only if its time is still
-- free; otherwise it stays released. If any required visit has no live request,
-- the order goes to needs_scheduling (payment preserved, admin alerted by the
-- webhook). Returns 'scheduled', 'needs_scheduling', 'already_paid', or
-- 'not_found'. Only the first call for a session returns a fresh result, so
-- webhook retries never re-run the transition.
create or replace function public.mark_media_order_paid(p_session_id text, p_payment_intent text, p_customer text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_visits int;
  v_live int;
  a record;
begin
  update public.media_orders
     set payment_status = 'paid', paid_at = now(),
         stripe_payment_intent_id = p_payment_intent, stripe_customer_id = p_customer,
         hold_expires_at = null, updated_at = now()
   where stripe_checkout_session_id = p_session_id and payment_status in ('pending', 'expired')
   returning id, visits_required into v_id, v_visits;
  if v_id is null then
    if exists (select 1 from public.media_orders where stripe_checkout_session_id = p_session_id) then
      return 'already_paid';
    end if;
    return 'not_found';
  end if;

  for a in select id from public.media_appointments
            where order_id = v_id and status in ('hold', 'expired') order by visit_number loop
    begin
      update public.media_appointments
         set status = 'requested', hold_expires_at = null, updated_at = now()
       where id = a.id;
    exception when exclusion_violation then
      update public.media_appointments set status = 'expired', updated_at = now() where id = a.id;
    end;
  end loop;

  select count(distinct visit_number) into v_live
    from public.media_appointments where order_id = v_id and status = 'requested';

  update public.media_orders
     set fulfillment_status = case when v_live >= v_visits then 'pending_confirmation' else 'needs_scheduling' end,
         updated_at = now()
   where id = v_id;
  return case when v_live >= v_visits then 'scheduled' else 'needs_scheduling' end;
end $$;

-- ── Business Pro social post requests (2 per calendar month) ────────────────
create table if not exists public.social_post_requests (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractor_profiles(id) on delete cascade,
  period_month date not null check (extract(day from period_month) = 1),
  slot_number int not null check (slot_number between 1 and 2),
  status text not null default 'requested'
    check (status in ('requested', 'in_progress', 'delivered', 'revision_requested', 'completed', 'canceled')),
  topic text not null,
  details text,
  photo_links text,
  platforms text,
  revision_used boolean not null default false,
  revision_notes text,
  deliverable_url text,
  caption text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contractor_id, period_month, slot_number)
);

alter table public.media_schedule_settings enable row level security;
alter table public.media_availability_rules enable row level security;
alter table public.media_availability_exceptions enable row level security;
alter table public.media_orders enable row level security;
alter table public.media_appointments enable row level security;
alter table public.social_post_requests enable row level security;

-- Explicit table access: only the server (service_role) reads and writes these
-- tables. Don't rely on project default privileges, which differ between the
-- production project and preview branches.
revoke all on public.media_schedule_settings, public.media_availability_rules, public.media_availability_exceptions,
  public.media_orders, public.media_appointments, public.social_post_requests from anon, authenticated;
grant select, insert, update, delete on public.media_schedule_settings, public.media_availability_rules, public.media_availability_exceptions,
  public.media_orders, public.media_appointments, public.social_post_requests to service_role;
revoke all on sequence public.media_order_number_seq from anon, authenticated;
grant usage, select on sequence public.media_order_number_seq to service_role;

revoke all on function public.reserve_media_appointments(uuid, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.mark_media_order_paid(text, text, text) from public, anon, authenticated;
grant execute on function public.reserve_media_appointments(uuid, jsonb, timestamptz) to service_role;
grant execute on function public.mark_media_order_paid(text, text, text) to service_role;

-- Membership benefit lists shown from the tiers table (display only; prices unchanged).
update public.tiers set features_json = '["Contractor profile","Equal referral eligibility","IronClad Standards participation","Basic AI Toolkit","Basic educational resources","Media services at retail pricing"]'::jsonb where name = 'Network';
update public.tiers set features_json = '["Everything in Network","Advanced business manuals and templates","Marketing templates and content resources","5% off ListWorx Media Services"]'::jsonb where name = 'Growth';
update public.tiers set features_json = '["Everything in Growth","2 custom branded social posts per month","Full Flyer Builder","10% off ListWorx Media Services"]'::jsonb where name = 'Business Pro';
