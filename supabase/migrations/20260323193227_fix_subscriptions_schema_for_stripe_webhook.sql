/*
  # Fix Subscriptions Schema for Stripe Webhook

  ## Summary
  The subscriptions table was missing columns that the Stripe webhook handler
  tries to write, causing silent failures during subscription creation and updates.
  This migration adds the missing columns and fixes the unique constraint strategy.

  ## Changes

  ### New Columns on `subscriptions`
  - `cancel_at_period_end` (boolean, default false) — tracks whether Stripe will
    cancel the subscription at the end of the current billing period
  - `cancelled_at` (timestamptz, nullable) — records when the subscription was
    cancelled via the webhook

  ### New Unique Constraint
  - `subscriptions_contractor_id_key` — ensures one active subscription row per
    contractor. This allows the webhook to upsert on `contractor_id` without
    creating duplicate rows.

  ## Important Notes
  1. The webhook previously used `onConflict: 'contractor_id,tier_id'` but no such
     unique constraint existed — causing the upsert to insert new rows every time
     and potentially duplicate rows, or silently fail if Supabase rejected it.
  2. The unique constraint on `stripe_subscription_id` is kept for looking up
     subscriptions during update/delete webhook events.
  3. `cancel_at_period_end` and `cancelled_at` were referenced by the webhook code
     but did not exist, causing update operations to fail silently.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'cancel_at_period_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN cancelled_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'subscriptions' AND indexname = 'subscriptions_contractor_id_key'
  ) THEN
    CREATE UNIQUE INDEX subscriptions_contractor_id_key ON subscriptions (contractor_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'subscriptions' AND indexname = 'idx_subscriptions_contractor_id'
  ) THEN
    CREATE INDEX idx_subscriptions_contractor_id ON subscriptions (contractor_id);
  END IF;
END $$;
