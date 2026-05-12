-- Site content blocks table
CREATE TABLE IF NOT EXISTS site_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page text NOT NULL,
  section_key text NOT NULL,
  section_label text NOT NULL,
  content_type text NOT NULL,
  -- types: text, richtext, image_url, video_url,
  --        boolean, json, color
  value text,
  is_visible boolean DEFAULT true,
  display_order integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.users(id),
  UNIQUE(page, section_key)
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_site_content"
  ON site_content FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_site_content"
  ON site_content FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

INSERT INTO site_content
  (page, section_key, section_label, content_type,
   value, is_visible, display_order)
VALUES
('home', 'hero_visible', 'Hero Section — Visible', 'boolean', 'true', true, 1),
('home', 'hero_headline', 'Hero — Headline', 'text', 'The Contractor Network Built on Trust, Not Transactions.', true, 2),
('home', 'hero_subheadline', 'Hero — Subheadline', 'richtext', 'ListWorx connects realtors and homeowners with vetted, IronClad-certified contractors. No lead fees. No bidding wars. Just trusted referrals — and only three per request.', true, 3),
('home', 'hero_background_image_url', 'Hero — Background Image URL', 'image_url', '', true, 4),
('home', 'hero_video_url', 'Hero — Background Video URL', 'video_url', '', true, 5),
('home', 'hero_cta_contractor_label', 'Hero — Contractor Button Label', 'text', 'Apply to Join the Network', true, 6),
('home', 'hero_cta_requestor_label', 'Hero — Requestor Button Label', 'text', 'Request a Referral', true, 7),
('home', 'why_visible', 'Why Different Section — Visible', 'boolean', 'true', true, 10),
('home', 'why_headline', 'Why Different — Headline', 'text', 'Why We Are Different', true, 11),
('home', 'why_card_1_headline', 'Why Card 1 — Headline', 'text', 'Not a Lead Marketplace', true, 12),
('home', 'why_card_1_body', 'Why Card 1 — Body', 'richtext', 'We do not sell your contact info to the highest bidder. ListWorx is a vetted referral network. Contractors pay a flat monthly fee and get connected to people who actually need their work.', true, 13),
('home', 'why_card_2_headline', 'Why Card 2 — Headline', 'text', 'Only 3 Referrals Per Request', true, 14),
('home', 'why_card_2_body', 'Why Card 2 — Body', 'richtext', 'Every requestor gets exactly three contractor referrals — not a dozen. Quality over volume. The contractors we send are vetted, IronClad-certified, and ready to work.', true, 15),
('home', 'why_card_3_headline', 'Why Card 3 — Headline', 'text', 'IronClad Standards Required', true, 16),
('home', 'why_card_3_body', 'Why Card 3 — Body', 'richtext', 'Every contractor in the network must maintain IronClad Standards — fast response, valid insurance, professional communication, no ghosting. Fall short and you are out.', true, 17),
('home', 'founder_banner_visible', 'Founding Partner Banner — Visible', 'boolean', 'true', true, 20),
('home', 'founder_banner_headline', 'Founder Banner — Headline', 'text', 'Founding Partner Spots Are Open — But Not For Long', true, 21),
('home', 'founder_banner_body', 'Founder Banner — Body', 'richtext', 'We are accepting a limited number of Founding Partners in each trade and county. When your trade fills, that is it. No exceptions, no waitlist.', true, 22),
('home', 'founder_banner_bg_color', 'Founder Banner — Background Color', 'color', '#C2410C', true, 23),
('home', 'ironclad_visible', 'IronClad Section — Visible', 'boolean', 'true', true, 30),
('home', 'ironclad_headline', 'IronClad — Headline', 'text', 'What IronClad Standards Mean', true, 31),
('home', 'ironclad_body', 'IronClad — Body', 'richtext', 'Every contractor in the ListWorx network is held to IronClad Standards. This is not a suggestion. It is the cost of being in the network.', true, 32),
('home', 'testimonials_visible', 'Testimonials Section — Visible', 'boolean', 'true', true, 40),
('home', 'testimonials_headline', 'Testimonials — Headline', 'text', 'What Contractors Are Saying', true, 41),
('home', 'testimonials_json', 'Testimonials — Cards (JSON)', 'json', '[{"name":"Mike R.","trade":"Painter","city":"Gallatin TN","quote":"Finally a platform that treats contractors like professionals, not commodities."},{"name":"Sarah T.","trade":"HVAC","city":"Hendersonville TN","quote":"I was skeptical after Angi. ListWorx is completely different."}]', true, 42),
('home', 'final_cta_visible', 'Final CTA Section — Visible', 'boolean', 'true', true, 50),
('home', 'final_cta_headline', 'Final CTA — Headline', 'text', 'Ready to Join the Network?', true, 51),
('founding_partner', 'fp_hero_headline', 'FP Page — Hero Headline', 'text', 'Become a Founding Partner', true, 1),
('founding_partner', 'fp_hero_subheadline', 'FP Page — Hero Subheadline', 'richtext', 'This is not a discount. This is a founder opportunity. A limited number of contractors will lock in permanent pricing, territory reservation, and Founding Partner status before we open to the public.', true, 2),
('founding_partner', 'fp_visible', 'Founding Partner Page — Visible', 'boolean', 'true', true, 3),
('pricing', 'pricing_banner_visible', 'Pricing — Urgency Banner Visible', 'boolean', 'true', true, 1),
('pricing', 'pricing_banner_text', 'Pricing — Urgency Banner Text', 'text', 'Founding Partner spots are open in Nashville and Sumner County. Limited per trade.', true, 2),
('global', 'company_facebook_url', 'Company Facebook URL', 'text', '', true, 1),
('global', 'company_instagram_url', 'Company Instagram URL', 'text', '', true, 2),
('global', 'company_tiktok_url', 'Company TikTok URL', 'text', '', true, 3),
('global', 'company_linkedin_url', 'Company LinkedIn URL', 'text', '', true, 4),
('global', 'company_youtube_url', 'Company YouTube URL', 'text', '', true, 5),
('global', 'company_support_email', 'Support Email Address', 'text', 'support@listworx.co', true, 6),
('global', 'company_phone', 'Company Phone Number', 'text', '', true, 7),
('global', 'footer_tagline', 'Footer Tagline', 'text', 'The contractor network built on trust, not transactions.', true, 8)
ON CONFLICT (page, section_key) DO NOTHING;

INSERT INTO storage.buckets
  (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  52428800,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp',
        'image/gif','video/mp4','video/webm']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "admin_upload_site_media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-media'
    AND auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

CREATE POLICY "public_read_site_media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-media');
