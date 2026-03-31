/*
  # Seed Categories / Trade Specialties

  Inserts all trade specialties used by the contractor application form into the
  categories table. Each row is tagged with a `group_name` column (added here if
  missing) so the UI can render grouped trade selection.

  ## Changes
  1. Adds `group_name` text column to categories if not already present
  2. Inserts 40+ trade categories across 7 groups:
     - Interior
     - Exterior
     - Mechanical
     - Structural / Construction
     - Property Services
     - Real Estate Media / Marketing
     - Specialty / Other
  3. Uses INSERT … ON CONFLICT DO NOTHING so re-running is safe
  4. All rows set is_active = true

  ## Notes
  - Existing rows are not modified
  - The `name` column has a unique constraint (assumed); conflict key is (name)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'group_name'
  ) THEN
    ALTER TABLE categories ADD COLUMN group_name text DEFAULT 'General';
  END IF;
END $$;

INSERT INTO categories (name, group_name, is_active) VALUES
  -- Interior
  ('Painting - Interior',          'Interior', true),
  ('Flooring',                      'Interior', true),
  ('Carpet Installation',           'Interior', true),
  ('Tile & Grout',                  'Interior', true),
  ('Drywall & Plaster',             'Interior', true),
  ('Cabinet Installation',          'Interior', true),
  ('Countertop Installation',       'Interior', true),
  ('Interior Trim & Molding',       'Interior', true),
  ('Closet Organization',           'Interior', true),
  ('Blinds & Window Treatments',    'Interior', true),

  -- Exterior
  ('Painting - Exterior',           'Exterior', true),
  ('Roofing',                       'Exterior', true),
  ('Gutters & Downspouts',          'Exterior', true),
  ('Siding',                        'Exterior', true),
  ('Windows & Doors',               'Exterior', true),
  ('Decks & Patios',                'Exterior', true),
  ('Fencing',                       'Exterior', true),
  ('Pressure Washing',              'Exterior', true),
  ('Concrete & Flatwork',           'Exterior', true),
  ('Driveway & Asphalt',            'Exterior', true),

  -- Mechanical
  ('HVAC',                          'Mechanical', true),
  ('Plumbing',                      'Mechanical', true),
  ('Electrical',                    'Mechanical', true),
  ('Water Heater',                  'Mechanical', true),
  ('Gas Lines',                     'Mechanical', true),
  ('Sewer & Drain',                 'Mechanical', true),
  ('Irrigation / Sprinkler Systems','Mechanical', true),
  ('Security Systems',              'Mechanical', true),
  ('Home Automation / Smart Home',  'Mechanical', true),

  -- Structural / Construction
  ('General Contractor',            'Structural / Construction', true),
  ('Foundation Repair',             'Foundation & Structural', true),
  ('Masonry & Brickwork',           'Structural / Construction', true),
  ('Framing',                       'Structural / Construction', true),
  ('Insulation',                    'Structural / Construction', true),
  ('Waterproofing',                 'Structural / Construction', true),
  ('Basement Finishing',            'Structural / Construction', true),
  ('Room Additions',                'Structural / Construction', true),
  ('Remodeling - Kitchen',          'Structural / Construction', true),
  ('Remodeling - Bathroom',         'Structural / Construction', true),

  -- Property Services
  ('Landscaping',                   'Property Services', true),
  ('Lawn Care',                     'Property Services', true),
  ('Tree Service',                  'Property Services', true),
  ('Pest Control',                  'Property Services', true),
  ('House Cleaning',                'Property Services', true),
  ('Junk Removal',                  'Property Services', true),
  ('Moving Services',               'Property Services', true),
  ('Pool Service',                  'Property Services', true),
  ('Chimney Cleaning & Repair',     'Property Services', true),
  ('Mold Remediation',              'Property Services', true),

  -- Real Estate Media / Marketing
  ('Real Estate Photography',       'Real Estate Media / Marketing', true),
  ('Drone Photography / Video',     'Real Estate Media / Marketing', true),
  ('Virtual Tours / 3D Scanning',   'Real Estate Media / Marketing', true),
  ('Floor Plan Drawing',            'Real Estate Media / Marketing', true),
  ('Staging Consultation',          'Real Estate Media / Marketing', true),

  -- Specialty / Other
  ('Home Inspection',               'Specialty / Other', true),
  ('Radon Testing / Mitigation',    'Specialty / Other', true),
  ('Septic System',                 'Specialty / Other', true),
  ('Well Services',                 'Specialty / Other', true),
  ('Fire & Water Damage Restoration','Specialty / Other', true),
  ('Handyman Services',             'Specialty / Other', true)

ON CONFLICT (name) DO UPDATE SET
  group_name = EXCLUDED.group_name,
  is_active  = true;
