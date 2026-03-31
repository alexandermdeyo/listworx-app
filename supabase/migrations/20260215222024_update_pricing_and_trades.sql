/*
  # Update Pricing and Complete Trades List

  ## Overview
  Updates tier pricing to match actual ListWorx pricing structure
  and adds complete categorized trades/categories list

  ## Changes
  1. Update tier pricing:
     - Basic: $199/month, $1,990/year
     - Preferred: $349/month, $3,590/year
     - Elite: $599/month, $5,990/year
  
  2. Clear existing categories and insert complete categorized list
  
  3. Update tier features to match specifications
*/

-- Update tier pricing and features
UPDATE tiers SET
  monthly_price = 19900,
  annual_price = 199000,
  features_json = '[
    "Listed in contractor directory",
    "Eligible for referral routing",
    "Standard listing placement",
    "Company name + contact visibility",
    "Access to onboarding materials"
  ]'::jsonb
WHERE name = 'Basic';

UPDATE tiers SET
  monthly_price = 34900,
  annual_price = 359000,
  features_json = '[
    "Everything in Basic",
    "Priority placement above Basic contractors",
    "Increased referral routing weight",
    "Logo placement in listing",
    "Highlighted directory listing",
    "Preferred Partner designation badge",
    "Performance tracking"
  ]'::jsonb
WHERE name = 'Preferred';

UPDATE tiers SET
  monthly_price = 59900,
  annual_price = 599000,
  features_json = '[
    "Everything in Preferred",
    "Limited partner slots per city",
    "Priority inclusion in referral sets",
    "Premium top-tier directory placement",
    "Website logo placement",
    "IronClad Certification badge eligible",
    "Digital badge pack",
    "Quarterly featured spotlight (annual)",
    "Professional promotional video (annual)"
  ]'::jsonb
WHERE name = 'Elite';

-- Clear existing categories
DELETE FROM categories;

-- Insert complete categorized trades list
INSERT INTO categories (name, description, icon, is_active) VALUES

-- CORE REPAIR & STRUCTURAL
('Asphalt / Driveway Repair', 'Core Repair & Structural', 'hammer', true),
('Basement Waterproofing', 'Core Repair & Structural', 'droplet', true),
('Carpentry (Finish & Trim)', 'Core Repair & Structural', 'ruler', true),
('Carpentry (Framing)', 'Core Repair & Structural', 'hammer', true),
('Chimney Repair', 'Core Repair & Structural', 'home', true),
('Concrete', 'Core Repair & Structural', 'box', true),
('Deck & Patio Construction', 'Core Repair & Structural', 'home', true),
('Demolition', 'Core Repair & Structural', 'trash', true),
('Drywall Installation & Repair', 'Core Repair & Structural', 'square', true),
('Electrical', 'Core Repair & Structural', 'zap', true),
('Excavation / Grading', 'Core Repair & Structural', 'mountain', true),
('Fencing', 'Core Repair & Structural', 'layout-grid', true),
('Flooring Installation', 'Core Repair & Structural', 'layers', true),
('Foundation Repair', 'Core Repair & Structural', 'home', true),
('Garage Door Installation & Repair', 'Core Repair & Structural', 'door-open', true),
('General Contractor', 'Core Repair & Structural', 'briefcase', true),
('Handyman Services', 'Core Repair & Structural', 'tool', true),
('HVAC', 'Core Repair & Structural', 'wind', true),
('Insulation', 'Core Repair & Structural', 'home', true),
('Masonry', 'Core Repair & Structural', 'box', true),
('Plumbing', 'Core Repair & Structural', 'wrench', true),
('Roofing', 'Core Repair & Structural', 'home', true),
('Siding Installation & Repair', 'Core Repair & Structural', 'home', true),
('Structural Repair', 'Core Repair & Structural', 'home', true),
('Window & Door Installation', 'Core Repair & Structural', 'door-open', true),

-- COSMETIC / PRE-LISTING IMPROVEMENT
('Cabinet Installation', 'Cosmetic / Pre-Listing Improvement', 'box', true),
('Cabinet Refinishing', 'Cosmetic / Pre-Listing Improvement', 'paintbrush', true),
('Countertop Installation', 'Cosmetic / Pre-Listing Improvement', 'square', true),
('Epoxy Floor Coating', 'Cosmetic / Pre-Listing Improvement', 'layers', true),
('Exterior Painting', 'Cosmetic / Pre-Listing Improvement', 'paintbrush', true),
('Interior Painting', 'Cosmetic / Pre-Listing Improvement', 'paintbrush', true),
('Pressure Washing', 'Cosmetic / Pre-Listing Improvement', 'droplet', true),
('Tile Installation', 'Cosmetic / Pre-Listing Improvement', 'grid', true),
('Wallpaper Removal', 'Cosmetic / Pre-Listing Improvement', 'file-minus', true),

-- EXTERIOR / CURB APPEAL
('Gutter Installation & Cleaning', 'Exterior / Curb Appeal', 'home', true),
('Irrigation / Sprinkler Systems', 'Exterior / Curb Appeal', 'droplet', true),
('Landscaping', 'Exterior / Curb Appeal', 'trees', true),
('Lawn Care & Maintenance', 'Exterior / Curb Appeal', 'leaf', true),
('Retaining Walls', 'Exterior / Curb Appeal', 'box', true),
('Snow Removal', 'Exterior / Curb Appeal', 'snowflake', true),
('Stump Grinding', 'Exterior / Curb Appeal', 'tree', true),
('Tree Removal', 'Exterior / Curb Appeal', 'tree', true),
('Window Cleaning', 'Exterior / Curb Appeal', 'sparkles', true),

-- CLEANUP / TURNOVER / PREP
('Dumpster / Roll-Off Rental', 'Cleanup / Turnover / Prep', 'trash', true),
('Junk Removal', 'Cleanup / Turnover / Prep', 'trash-2', true),
('Move-In / Move-Out Cleaning', 'Cleanup / Turnover / Prep', 'sparkles', true),
('Post-Construction Cleaning', 'Cleanup / Turnover / Prep', 'sparkles', true),
('Property Clean-Out', 'Cleanup / Turnover / Prep', 'trash', true),
('Residential Cleaning', 'Cleanup / Turnover / Prep', 'sparkles', true),

-- INSPECTION & RESTORATION
('Fire & Water Restoration', 'Inspection & Restoration', 'flame', true),
('Home Inspection Services', 'Inspection & Restoration', 'search', true),
('Mold Remediation', 'Inspection & Restoration', 'shield', true),
('Pest Control', 'Inspection & Restoration', 'bug', true),
('Radon Mitigation', 'Inspection & Restoration', 'shield', true),
('Septic Services', 'Inspection & Restoration', 'wrench', true),
('Well Services', 'Inspection & Restoration', 'droplet', true),

-- REAL ESTATE MEDIA & PRESENTATION
('Aerial Drone Photography', 'Real Estate Media & Presentation', 'camera', true),
('Floor Plan Creation', 'Real Estate Media & Presentation', 'map', true),
('Real Estate Photography', 'Real Estate Media & Presentation', 'camera', true),
('Real Estate Videography', 'Real Estate Media & Presentation', 'video', true),
('Social Media Listing Videos', 'Real Estate Media & Presentation', 'video', true),
('Virtual Staging', 'Real Estate Media & Presentation', 'image', true),
('3D Virtual Tours / Matterport', 'Real Estate Media & Presentation', 'box', true),

-- TRANSACTION SUPPORT
('Appraisal Services', 'Transaction Support', 'file-text', true),
('Home Staging', 'Transaction Support', 'home', true),
('Lighting Installation', 'Transaction Support', 'lightbulb', true),
('Lock & Rekey Services', 'Transaction Support', 'key', true),
('Moving Services', 'Transaction Support', 'truck', true),
('Smart Home Installation', 'Transaction Support', 'smartphone', true),
('Solar Installation', 'Transaction Support', 'sun', true);
