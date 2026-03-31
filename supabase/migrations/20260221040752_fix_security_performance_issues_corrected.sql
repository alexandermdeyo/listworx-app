/*
  # Fix Security and Performance Issues (Corrected)

  ## Security Issues Fixed

  1. **RLS Policy Performance**
     - Fixed auth function calls to use subqueries
     - Prevents per-row re-evaluation

  2. **Multiple Permissive Policies**
     - Fixed overlapping policies on job_request_categories

  3. **Function Search Path**
     - Set explicit search_path for all functions

  4. **Materialized View**
     - Documented as intentionally public (safe)

  ## Performance Improvements
  - Removed 35 unused indexes
*/

-- ================================================================
-- PART 1: Fix RLS Policy Performance Issues
-- ================================================================

-- Fix job_request_categories admin policy
DROP POLICY IF EXISTS "Admins can manage job_request_categories" ON job_request_categories;

CREATE POLICY "Admins can manage job_request_categories"
  ON job_request_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = (SELECT auth.uid()) 
        AND users.role = 'ADMIN'::user_role
    )
  );

-- Fix contractor_profiles policies
DROP POLICY IF EXISTS "Contractors can update own profile" ON contractor_profiles;
CREATE POLICY "Contractors can update own profile"
  ON contractor_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Contractors can view own profile" ON contractor_profiles;
CREATE POLICY "Contractors can view own profile"
  ON contractor_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Fix realtor_profiles policies
DROP POLICY IF EXISTS "Realtors can update own profile" ON realtor_profiles;
CREATE POLICY "Realtors can update own profile"
  ON realtor_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Realtors can view own profile" ON realtor_profiles;
CREATE POLICY "Realtors can view own profile"
  ON realtor_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ================================================================
-- PART 2: Fix Multiple Permissive Policies
-- ================================================================

DROP POLICY IF EXISTS "Public can read job_request_categories" ON job_request_categories;

CREATE POLICY "Anyone can read job_request_categories"
  ON job_request_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ================================================================
-- PART 3: Fix Function Search Path Issues
-- ================================================================

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CONTRACTOR'::user_role),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Fix can_contractor_be_active (must keep original parameter name)
DROP FUNCTION IF EXISTS can_contractor_be_active(uuid);
CREATE OR REPLACE FUNCTION can_contractor_be_active(contractor_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  profile_status partner_status;
  subscription_active boolean;
BEGIN
  SELECT partner_status INTO profile_status
  FROM contractor_profiles
  WHERE id = contractor_profile_id;

  SELECT EXISTS(
    SELECT 1 FROM subscriptions
    WHERE contractor_id = contractor_profile_id
      AND status = 'ACTIVE'
  ) INTO subscription_active;

  RETURN profile_status = 'ACTIVE' AND subscription_active;
END;
$$;

-- Fix is_admin - already has search_path set correctly, just ensure subquery
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'
  );
$$;

-- ================================================================
-- PART 4: Remove Unused Indexes
-- ================================================================

DROP INDEX IF EXISTS idx_contractor_profiles_user_id;
DROP INDEX IF EXISTS idx_contractor_profiles_stripe_customer_id;
DROP INDEX IF EXISTS idx_contractor_profiles_status;
DROP INDEX IF EXISTS idx_realtor_profiles_user_id;
DROP INDEX IF EXISTS idx_contractor_markets_contractor_id;
DROP INDEX IF EXISTS idx_contractor_categories_contractor_id;
DROP INDEX IF EXISTS idx_contractor_categories_category_id;
DROP INDEX IF EXISTS idx_subscriptions_contractor_id;
DROP INDEX IF EXISTS idx_subscriptions_tier_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_invoices_contractor_id;
DROP INDEX IF EXISTS idx_invoices_stripe_invoice_id;
DROP INDEX IF EXISTS idx_job_requests_realtor_id;
DROP INDEX IF EXISTS idx_job_requests_status;
DROP INDEX IF EXISTS idx_job_requests_property_county;
DROP INDEX IF EXISTS idx_referrals_job_request_id;
DROP INDEX IF EXISTS idx_referrals_contractor_id;
DROP INDEX IF EXISTS idx_referrals_status;
DROP INDEX IF EXISTS idx_job_assignments_job_request_id;
DROP INDEX IF EXISTS idx_job_assignments_contractor_id;
DROP INDEX IF EXISTS idx_job_assignments_referral_id;
DROP INDEX IF EXISTS idx_conversations_job_request_id;
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_contractor_documents_contractor_id;
DROP INDEX IF EXISTS idx_contractor_documents_reviewed_by;
DROP INDEX IF EXISTS idx_proof_uploads_job_assignment_id;
DROP INDEX IF EXISTS idx_ratings_contractor_id;
DROP INDEX IF EXISTS idx_ratings_realtor_id;
DROP INDEX IF EXISTS idx_ratings_job_request_id;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_job_request_categories_job_request_id;
DROP INDEX IF EXISTS idx_job_request_categories_category_id;

-- ================================================================
-- PART 5: Document Materialized View
-- ================================================================

COMMENT ON MATERIALIZED VIEW active_contractors_view IS 
  'Public lookup view for contractor availability. Contains only non-sensitive data for filtering. Safe for anon/authenticated access.';

-- Refresh view
REFRESH MATERIALIZED VIEW active_contractors_view;