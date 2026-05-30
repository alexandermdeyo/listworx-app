-- ─────────────────────────────────────────────────────────────────────────────
-- realtor_brand_kits
-- Stores the brand identity / contact info for each realtor's public profile
-- and all generated marketing materials.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists realtor_brand_kits (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        references auth.users(id) on delete cascade unique,
  display_name       text,
  job_title          text,          -- "Realtor", "Broker", "Agent", etc.
  brokerage_name     text,
  license_number     text,
  phone              text,
  email              text,
  website            text,
  headshot_url       text,
  cover_photo_url    text,
  personal_logo_url  text,
  brokerage_logo_url text,
  primary_color      text        default '#E8621A',
  instagram_handle   text,
  facebook_url       text,
  linkedin_url       text,
  bio                text,
  preferred_cta      text,
  disclaimer_text    text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table realtor_brand_kits enable row level security;

-- Owner: full access
create policy "Users can manage their own brand kit"
  on realtor_brand_kits for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public: read-only (needed for public profile pages)
create policy "Brand kits are publicly readable"
  on realtor_brand_kits for select
  using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- listings.show_on_profile
-- Controls which listings appear on the realtor's public profile page.
-- ─────────────────────────────────────────────────────────────────────────────

alter table listings add column if not exists show_on_profile boolean default true;

-- ─────────────────────────────────────────────────────────────────────────────
-- realtor_showcase_posts
-- Social media screenshots / marketing graphics uploaded by the realtor.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists realtor_showcase_posts (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        references auth.users(id) on delete cascade,
  image_url     text        not null,
  caption       text,
  display_order int         default 0,
  created_at    timestamptz default now()
);

alter table realtor_showcase_posts enable row level security;

-- Owner: full access
create policy "Users can manage their own showcase posts"
  on realtor_showcase_posts for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public: read-only (needed for public profile pages)
create policy "Showcase posts are publicly readable"
  on realtor_showcase_posts for select
  using (true);
