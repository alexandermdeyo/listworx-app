/*
  # Add Invoices and Enhanced Billing Information
  
  1. New Tables
    - `invoices`
      - `id` (uuid, primary key) - Unique invoice identifier
      - `contractor_id` (uuid, foreign key) - References contractor_profiles table
      - `stripe_invoice_id` (text, unique) - Stripe invoice ID
      - `invoice_number` (text, unique) - Human-readable invoice number
      - `amount` (integer) - Amount in cents
      - `currency` (text) - Currency code (default: usd)
      - `status` (text) - Invoice status (paid, pending, failed)
      - `invoice_pdf_url` (text, nullable) - URL to PDF invoice from Stripe
      - `period_start` (timestamptz) - Billing period start
      - `period_end` (timestamptz) - Billing period end
      - `paid_at` (timestamptz, nullable) - When invoice was paid
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `contractor_billing_info`
      - `id` (uuid, primary key) - Unique identifier
      - `contractor_id` (uuid, unique, foreign key) - References contractor_profiles table
      - `company_name` (text) - Business/company name
      - `billing_address` (text) - Street address
      - `billing_city` (text) - City
      - `billing_state` (text) - State
      - `billing_zip` (text) - ZIP code
      - `tax_id` (text, nullable) - Tax ID / EIN
      - `phone` (text) - Contact phone
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on both tables
    - Contractors can read their own invoices
    - Contractors can read and update their own billing info
  
  3. Indexes
    - Index on contractor_id for fast lookups
    - Index on stripe_invoice_id for webhook processing
    - Index on created_at for sorting
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  stripe_invoice_id text UNIQUE NOT NULL,
  invoice_number text UNIQUE NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('paid', 'pending', 'failed')),
  invoice_pdf_url text,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contractor billing info table
CREATE TABLE IF NOT EXISTS contractor_billing_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid UNIQUE NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  billing_address text NOT NULL,
  billing_city text NOT NULL,
  billing_state text NOT NULL,
  billing_zip text NOT NULL,
  tax_id text,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_contractor_id ON invoices(contractor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_info_contractor_id ON contractor_billing_info(contractor_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_billing_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Contractors can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id IN (
        SELECT id FROM users WHERE email = auth.jwt()->>'email'
      )
    )
  );

-- RLS Policies for contractor billing info
CREATE POLICY "Contractors can view own billing info"
  ON contractor_billing_info FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id IN (
        SELECT id FROM users WHERE email = auth.jwt()->>'email'
      )
    )
  );

CREATE POLICY "Contractors can insert own billing info"
  ON contractor_billing_info FOR INSERT
  TO authenticated
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id IN (
        SELECT id FROM users WHERE email = auth.jwt()->>'email'
      )
    )
  );

CREATE POLICY "Contractors can update own billing info"
  ON contractor_billing_info FOR UPDATE
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id IN (
        SELECT id FROM users WHERE email = auth.jwt()->>'email'
      )
    )
  )
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id IN (
        SELECT id FROM users WHERE email = auth.jwt()->>'email'
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_info_updated_at ON contractor_billing_info;
CREATE TRIGGER update_billing_info_updated_at
  BEFORE UPDATE ON contractor_billing_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();