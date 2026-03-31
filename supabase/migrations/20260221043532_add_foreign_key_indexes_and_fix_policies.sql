/*
  # Add Foreign Key Indexes and Fix Duplicate Policies

  ## Performance Improvements

  1. **Foreign Key Indexes (21 indexes added)**
     - Creates indexes on all foreign key columns for optimal JOIN performance
     - Prevents full table scans on foreign key lookups
     - Essential for production performance at scale

  2. **Removed Unused Index**
     - Dropped unused index on materialized view

  ## Security Fixes

  1. **Consolidated Duplicate Policies**
     - Fixed overlapping policies on contractor_profiles
     - Fixed overlapping policies on realtor_profiles  
     - Fixed overlapping policies on job_request_categories
     - Ensures clear, single-source-of-truth for permissions

  ## Notes
  - All indexes use standard B-tree for optimal performance
  - Policies now have clear separation of concerns
  - No breaking changes to application functionality
*/

-- ================================================================
-- PART 1: Add Foreign Key Indexes for Performance
-- ================================================================

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Contractor categories junction
CREATE INDEX IF NOT EXISTS idx_contractor_categories_category_id ON contractor_categories(category_id);

-- Contractor documents
CREATE INDEX IF NOT EXISTS idx_contractor_documents_contractor_id ON contractor_documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_reviewed_by ON contractor_documents(reviewed_by);

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_job_request_id ON conversations(job_request_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_contractor_id ON invoices(contractor_id);

-- Job assignments
CREATE INDEX IF NOT EXISTS idx_job_assignments_contractor_id ON job_assignments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_job_request_id ON job_assignments(job_request_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_referral_id ON job_assignments(referral_id);

-- Job request categories junction
CREATE INDEX IF NOT EXISTS idx_job_request_categories_category_id ON job_request_categories(category_id);

-- Job requests
CREATE INDEX IF NOT EXISTS idx_job_requests_realtor_id ON job_requests(realtor_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Proof uploads
CREATE INDEX IF NOT EXISTS idx_proof_uploads_job_assignment_id ON proof_uploads(job_assignment_id);

-- Ratings
CREATE INDEX IF NOT EXISTS idx_ratings_contractor_id ON ratings(contractor_id);
CREATE INDEX IF NOT EXISTS idx_ratings_job_request_id ON ratings(job_request_id);
CREATE INDEX IF NOT EXISTS idx_ratings_realtor_id ON ratings(realtor_id);

-- Referrals
CREATE INDEX IF NOT EXISTS idx_referrals_contractor_id ON referrals(contractor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_job_request_id ON referrals(job_request_id);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_contractor_id ON subscriptions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier_id ON subscriptions(tier_id);

-- ================================================================
-- PART 2: Remove Unused Indexes
-- ================================================================

DROP INDEX IF EXISTS idx_active_contractors_view_contractor_id;

-- ================================================================
-- PART 3: Fix Multiple Permissive Policies
-- ================================================================

-- Fix contractor_profiles duplicate SELECT policies
DROP POLICY IF EXISTS "Contractors can view own profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Contractors view own profile or admin views all" ON contractor_profiles;

CREATE POLICY "Contractors view own profile or admin views all"
  ON contractor_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) 
    OR (SELECT is_admin())
  );

-- Fix contractor_profiles duplicate UPDATE policies
DROP POLICY IF EXISTS "Contractors can update own profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Contractors update own profile or admin updates all" ON contractor_profiles;

CREATE POLICY "Contractors update own profile or admin updates all"
  ON contractor_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) 
    OR (SELECT is_admin())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) 
    OR (SELECT is_admin())
  );

-- Fix realtor_profiles duplicate SELECT policies
DROP POLICY IF EXISTS "Realtors can view own profile" ON realtor_profiles;
DROP POLICY IF EXISTS "Realtors view own profile or admin views all" ON realtor_profiles;

CREATE POLICY "Realtors view own profile or admin views all"
  ON realtor_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) 
    OR (SELECT is_admin())
  );

-- Fix realtor_profiles duplicate UPDATE policies
DROP POLICY IF EXISTS "Realtors can update own profile" ON realtor_profiles;
DROP POLICY IF EXISTS "Realtors update own profile or admin updates all" ON realtor_profiles;

CREATE POLICY "Realtors update own profile or admin updates all"
  ON realtor_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) 
    OR (SELECT is_admin())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) 
    OR (SELECT is_admin())
  );

-- Fix job_request_categories duplicate SELECT policies
DROP POLICY IF EXISTS "Admins can manage job_request_categories" ON job_request_categories;
DROP POLICY IF EXISTS "Anyone can read job_request_categories" ON job_request_categories;

-- Create separate policies for different operations
CREATE POLICY "Anyone can read job_request_categories"
  ON job_request_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert job_request_categories"
  ON job_request_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = (SELECT auth.uid()) 
        AND users.role = 'ADMIN'::user_role
    )
  );

CREATE POLICY "Admins can update job_request_categories"
  ON job_request_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = (SELECT auth.uid()) 
        AND users.role = 'ADMIN'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = (SELECT auth.uid()) 
        AND users.role = 'ADMIN'::user_role
    )
  );

CREATE POLICY "Admins can delete job_request_categories"
  ON job_request_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = (SELECT auth.uid()) 
        AND users.role = 'ADMIN'::user_role
    )
  );

-- ================================================================
-- PART 4: Document Materialized View
-- ================================================================

COMMENT ON MATERIALIZED VIEW active_contractors_view IS 
  'Public lookup view for contractor availability. Contains only non-sensitive data (contractor availability by market/category). Safe for anon/authenticated access. Used for filtering available contractors on realtor request form.';

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW active_contractors_view;