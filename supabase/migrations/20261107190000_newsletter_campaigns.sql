/*
  Newsletter sending for ListWorx ("The ListWorx Standard")

  1. newsletter_subscribers.unsubscribe_token: one-click unsubscribe link in
     every email (required by CAN-SPAM). Backfilled for existing rows.
  2. newsletter_campaigns: drafts and sent emails, admin only.
*/

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_key
  ON newsletter_subscribers (unsubscribe_token);
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  preview_text text,
  body_html text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent')),
  source_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  sent_at timestamptz,
  recipient_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS newsletter_campaigns_admin_all ON newsletter_campaigns;
CREATE POLICY newsletter_campaigns_admin_all ON newsletter_campaigns
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
