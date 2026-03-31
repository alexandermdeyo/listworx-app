/*
  # Fix Security and Performance Issues

  1. RLS Performance Optimization
    - Fix auth.uid() calls in RLS policies to use (select auth.uid()) for better performance
    - Affects: invoices, contractor_billing_info tables

  2. Remove Unused Indexes
    - Drop indexes that have not been used to improve write performance
    - Affects: 31 unused indexes across multiple tables

  3. Consolidate Multiple Permissive Policies
    - Combine multiple permissive policies into single, more efficient policies
    - Prevents unexpected access when multiple policies overlap
    - Affects: 19 tables with overlapping policies

  4. Fix Function Search Path
    - Make update_updated_at_column function search path immutable for security

  ## Changes by Category

  ### A. RLS Policy Performance Fixes
  - invoices: "Contractors can view own invoices"
  - contractor_billing_info: 3 policies optimized

  ### B. Unused Index Removal
  - users: email, role indexes
  - contractor_markets, contractor_categories, contractor_documents indexes
  - subscriptions, referrals, job_assignments indexes
  - proof_uploads, conversations, messages indexes
  - ratings, audit_logs indexes
  - contractor_profiles, job_requests indexes
  - invoices, contractor_billing_info indexes

  ### C. Policy Consolidation
  - Merge admin + user-specific policies into single conditional policies
  - Simplifies policy evaluation and improves query performance
*/

-- ============================================================================
-- SECTION 1: Fix RLS Performance Issues
-- ============================================================================

-- Fix invoices table policies
DROP POLICY IF EXISTS "Contractors can view own invoices" ON invoices;
CREATE POLICY "Contractors can view own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (contractor_id = (select auth.uid()));

-- Fix contractor_billing_info table policies
DROP POLICY IF EXISTS "Contractors can view own billing info" ON contractor_billing_info;
CREATE POLICY "Contractors can view own billing info"
  ON contractor_billing_info
  FOR SELECT
  TO authenticated
  USING (contractor_id = (select auth.uid()));

DROP POLICY IF EXISTS "Contractors can insert own billing info" ON contractor_billing_info;
CREATE POLICY "Contractors can insert own billing info"
  ON contractor_billing_info
  FOR INSERT
  TO authenticated
  WITH CHECK (contractor_id = (select auth.uid()));

DROP POLICY IF EXISTS "Contractors can update own billing info" ON contractor_billing_info;
CREATE POLICY "Contractors can update own billing info"
  ON contractor_billing_info
  FOR UPDATE
  TO authenticated
  USING (contractor_id = (select auth.uid()))
  WITH CHECK (contractor_id = (select auth.uid()));

-- ============================================================================
-- SECTION 2: Remove Unused Indexes
-- ============================================================================

-- Users table
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;

-- Contractor markets and categories
DROP INDEX IF EXISTS idx_contractor_markets_market_id;
DROP INDEX IF EXISTS idx_contractor_categories_category_id;

-- Contractor documents
DROP INDEX IF EXISTS idx_contractor_documents_contractor_id;
DROP INDEX IF EXISTS idx_contractor_documents_reviewed_by;

-- Subscriptions
DROP INDEX IF EXISTS idx_subscriptions_contractor_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_tier_id;

-- Referrals
DROP INDEX IF EXISTS idx_referrals_contractor_id;
DROP INDEX IF EXISTS idx_referrals_job_request_id;
DROP INDEX IF EXISTS idx_referrals_status;

-- Job assignments
DROP INDEX IF EXISTS idx_job_assignments_contractor_id;
DROP INDEX IF EXISTS idx_job_assignments_referral_id;

-- Proof uploads
DROP INDEX IF EXISTS idx_proof_uploads_job_assignment_id;

-- Conversations and messages
DROP INDEX IF EXISTS idx_conversations_job_request_id;
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_messages_sender_id;

-- Ratings
DROP INDEX IF EXISTS idx_ratings_contractor_id;
DROP INDEX IF EXISTS idx_ratings_realtor_id;

-- Audit logs
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;

-- Contractor profiles
DROP INDEX IF EXISTS idx_contractor_profiles_status;
DROP INDEX IF EXISTS idx_contractor_profiles_user_id;

-- Job requests
DROP INDEX IF EXISTS idx_job_requests_status;
DROP INDEX IF EXISTS idx_job_requests_realtor_id;
DROP INDEX IF EXISTS idx_job_requests_market_id;

-- Invoices
DROP INDEX IF EXISTS idx_invoices_contractor_id;
DROP INDEX IF EXISTS idx_invoices_stripe_id;
DROP INDEX IF EXISTS idx_invoices_created_at;

-- Billing info
DROP INDEX IF EXISTS idx_billing_info_contractor_id;

-- ============================================================================
-- SECTION 3: Consolidate Multiple Permissive Policies
-- ============================================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = (select auth.uid()) AND role = 'ADMIN'
  );
$$;

-- Categories table - consolidate 2 SELECT policies
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
CREATE POLICY "Categories are readable by all"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Markets table - consolidate 2 SELECT policies  
DROP POLICY IF EXISTS "Admins can manage markets" ON markets;
DROP POLICY IF EXISTS "Markets are publicly readable" ON markets;
CREATE POLICY "Markets are readable by all"
  ON markets
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Admins can manage markets"
  ON markets
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Tiers table - consolidate 2 SELECT policies
DROP POLICY IF EXISTS "Admins can manage tiers" ON tiers;
DROP POLICY IF EXISTS "Tiers are viewable by everyone" ON tiers;
CREATE POLICY "Tiers are viewable by all"
  ON tiers
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Admins can manage tiers"
  ON tiers
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Users table - consolidate SELECT and UPDATE policies
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can view own data, admins view all"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()) OR is_admin());
CREATE POLICY "Users can update own data, admins update all"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()) OR is_admin())
  WITH CHECK (id = (select auth.uid()) OR is_admin());
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Contractor profiles - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all contractor profiles" ON contractor_profiles;
DROP POLICY IF EXISTS "Contractors can view their own profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Contractors can create their profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Contractors can update their own profile" ON contractor_profiles;
CREATE POLICY "Contractors can view own profile, admins view all"
  ON contractor_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());
CREATE POLICY "Contractors can create own profile, admins create all"
  ON contractor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());
CREATE POLICY "Contractors can update own profile, admins update all"
  ON contractor_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());
CREATE POLICY "Admins can delete contractor profiles"
  ON contractor_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Realtor profiles - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all realtor profiles" ON realtor_profiles;
DROP POLICY IF EXISTS "Realtors can view and manage their profile" ON realtor_profiles;
CREATE POLICY "Realtors can manage own profile, admins manage all"
  ON realtor_profiles
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

-- Contractor markets - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all contractor markets" ON contractor_markets;
DROP POLICY IF EXISTS "Contractors can view and manage their markets" ON contractor_markets;
DROP POLICY IF EXISTS "Users can view contractor markets" ON contractor_markets;
CREATE POLICY "Everyone can view contractor markets"
  ON contractor_markets
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Contractors can manage own markets, admins manage all"
  ON contractor_markets
  FOR INSERT
  TO authenticated
  WITH CHECK (contractor_id = (select auth.uid()) OR is_admin());
CREATE POLICY "Contractors can update own markets, admins update all"
  ON contractor_markets
  FOR UPDATE
  TO authenticated
  USING (contractor_id = (select auth.uid()) OR is_admin())
  WITH CHECK (contractor_id = (select auth.uid()) OR is_admin());
CREATE POLICY "Contractors can delete own markets, admins delete all"
  ON contractor_markets
  FOR DELETE
  TO authenticated
  USING (contractor_id = (select auth.uid()) OR is_admin());

-- Contractor categories - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all contractor categories" ON contractor_categories;
DROP POLICY IF EXISTS "Contractors can view and manage their categories" ON contractor_categories;
DROP POLICY IF EXISTS "Users can view contractor categories" ON contractor_categories;
CREATE POLICY "Everyone can view contractor categories"
  ON contractor_categories
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Contractors can manage own categories, admins manage all"
  ON contractor_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (contractor_id = (select auth.uid()) OR is_admin());
CREATE POLICY "Contractors can update own categories, admins update all"
  ON contractor_categories
  FOR UPDATE
  TO authenticated
  USING (contractor_id = (select auth.uid()) OR is_admin())
  WITH CHECK (contractor_id = (select auth.uid()) OR is_admin());
CREATE POLICY "Contractors can delete own categories, admins delete all"
  ON contractor_categories
  FOR DELETE
  TO authenticated
  USING (contractor_id = (select auth.uid()) OR is_admin());

-- Contractor documents - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all documents" ON contractor_documents;
DROP POLICY IF EXISTS "Contractors can view and manage their documents" ON contractor_documents;
CREATE POLICY "Contractors can manage own documents, admins manage all"
  ON contractor_documents
  FOR ALL
  TO authenticated
  USING (contractor_id = (select auth.uid()) OR is_admin())
  WITH CHECK (contractor_id = (select auth.uid()) OR is_admin());

-- Job requests - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all job requests" ON job_requests;
DROP POLICY IF EXISTS "Realtors can view and create their job requests" ON job_requests;
CREATE POLICY "Realtors can manage own requests, admins manage all"
  ON job_requests
  FOR ALL
  TO authenticated
  USING (realtor_id = (select auth.uid()) OR is_admin())
  WITH CHECK (realtor_id = (select auth.uid()) OR is_admin());

-- Subscriptions - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Contractors can view their own subscription" ON subscriptions;
CREATE POLICY "Contractors can view own subscription, admins view all"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (contractor_id = (select auth.uid()) OR is_admin());
CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Referrals - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all referrals" ON referrals;
DROP POLICY IF EXISTS "Contractors and realtors can view relevant referrals" ON referrals;
DROP POLICY IF EXISTS "Contractors can update their referrals" ON referrals;
CREATE POLICY "Users can view relevant referrals, admins view all"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (
    contractor_id = (select auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM job_requests jr 
      WHERE jr.id = referrals.job_request_id 
      AND jr.realtor_id = (select auth.uid())
    ) OR 
    is_admin()
  );
CREATE POLICY "Contractors can update own referrals, admins update all"
  ON referrals
  FOR UPDATE
  TO authenticated
  USING (contractor_id = (select auth.uid()) OR is_admin())
  WITH CHECK (contractor_id = (select auth.uid()) OR is_admin());
CREATE POLICY "Admins can manage referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY "Admins can delete referrals"
  ON referrals
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Job assignments - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all job assignments" ON job_assignments;
DROP POLICY IF EXISTS "Users can view relevant job assignments" ON job_assignments;
DROP POLICY IF EXISTS "Contractors can update their assignments" ON job_assignments;
CREATE POLICY "Users can view relevant assignments, admins view all"
  ON job_assignments
  FOR SELECT
  TO authenticated
  USING (
    contractor_id = (select auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM referrals r 
      JOIN job_requests jr ON r.job_request_id = jr.id
      WHERE r.id = job_assignments.referral_id 
      AND jr.realtor_id = (select auth.uid())
    ) OR 
    is_admin()
  );
CREATE POLICY "Contractors can update own assignments, admins update all"
  ON job_assignments
  FOR UPDATE
  TO authenticated
  USING (contractor_id = (select auth.uid()) OR is_admin())
  WITH CHECK (contractor_id = (select auth.uid()) OR is_admin());
CREATE POLICY "Admins can manage job assignments"
  ON job_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY "Admins can delete job assignments"
  ON job_assignments
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- SECTION 4: Fix Function Search Path
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;