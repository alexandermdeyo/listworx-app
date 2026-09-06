/*
  # Backfill tables the app referenced but that were never applied to prod

  Audit found these referenced in code with no live table:
  - contact_submissions   (/api/contact)
  - blog_posts            (/api/blog, /blog)
  - media_items           (/api/media, admin media library)
  - contractor_work_photos / contractor_work_videos
      (contractor dashboard profile editor + public /contractors/[id])
      + the contractor-work-photos public storage bucket

  Skipped intentionally:
  - active_contractors_view  — /api/{markets,categories}/active degrade gracefully
                               and the old definition is stale (uppercase partner_status)
  - contractor_selections    — SelectContractorModal is not wired into any page (dead code)

  Applied to the database out of band; this file records it.
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new','read','responded','archived')),
  admin_notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;
CREATE POLICY "Anyone can submit contact form" ON contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can read contact submissions" ON contact_submissions;
CREATE POLICY "Admins can read contact submissions" ON contact_submissions FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update contact submissions" ON contact_submissions;
CREATE POLICY "Admins can update contact submissions" ON contact_submissions FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  excerpt text, body text, featured_image_url text,
  author_name text NOT NULL DEFAULT 'ListWorx Team',
  is_draft boolean NOT NULL DEFAULT true,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_unique_idx ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON public.blog_posts (published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_is_draft_idx ON public.blog_posts (is_draft);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blog_posts_public_read_published" ON public.blog_posts;
CREATE POLICY "blog_posts_public_read_published" ON public.blog_posts FOR SELECT TO anon, authenticated USING (is_draft = false);
DROP POLICY IF EXISTS "blog_posts_admin_all" ON public.blog_posts;
CREATE POLICY "blog_posts_admin_all" ON public.blog_posts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT 'other',
  url text NOT NULL DEFAULT '',
  thumbnail_url text, description text,
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_items_active_order_idx ON public.media_items (is_active, display_order, created_at DESC);
CREATE INDEX IF NOT EXISTS media_items_featured_active_idx ON public.media_items (is_featured) WHERE is_active = true;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "media_items_public_read_active" ON public.media_items;
CREATE POLICY "media_items_public_read_active" ON public.media_items FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "media_items_admin_all" ON public.media_items;
CREATE POLICY "media_items_admin_all" ON public.media_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.contractor_work_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL DEFAULT '',
  public_url text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contractor_work_photos_contractor_idx ON public.contractor_work_photos (contractor_id, display_order, created_at);
ALTER TABLE public.contractor_work_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "work_photos_public_read" ON public.contractor_work_photos;
CREATE POLICY "work_photos_public_read" ON public.contractor_work_photos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "work_photos_owner_write" ON public.contractor_work_photos;
CREATE POLICY "work_photos_owner_write" ON public.contractor_work_photos FOR ALL TO authenticated
  USING (public.is_admin() OR contractor_id IN (SELECT id FROM contractor_profiles WHERE user_id = auth.uid()))
  WITH CHECK (public.is_admin() OR contractor_id IN (SELECT id FROM contractor_profiles WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.contractor_work_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  video_url text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT 'other',
  caption text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contractor_work_videos_contractor_idx ON public.contractor_work_videos (contractor_id, display_order, created_at);
ALTER TABLE public.contractor_work_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "work_videos_public_read" ON public.contractor_work_videos;
CREATE POLICY "work_videos_public_read" ON public.contractor_work_videos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "work_videos_owner_write" ON public.contractor_work_videos;
CREATE POLICY "work_videos_owner_write" ON public.contractor_work_videos FOR ALL TO authenticated
  USING (public.is_admin() OR contractor_id IN (SELECT id FROM contractor_profiles WHERE user_id = auth.uid()))
  WITH CHECK (public.is_admin() OR contractor_id IN (SELECT id FROM contractor_profiles WHERE user_id = auth.uid()));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('contractor-work-photos','contractor-work-photos', true, 10485760,
        ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "work_photos_bucket_public_read" ON storage.objects;
CREATE POLICY "work_photos_bucket_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'contractor-work-photos');
DROP POLICY IF EXISTS "work_photos_bucket_auth_write" ON storage.objects;
CREATE POLICY "work_photos_bucket_auth_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contractor-work-photos');
DROP POLICY IF EXISTS "work_photos_bucket_auth_delete" ON storage.objects;
CREATE POLICY "work_photos_bucket_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'contractor-work-photos');
