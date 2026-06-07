ALTER TABLE contractor_applications
  ADD COLUMN IF NOT EXISTS founder_tier text,
  ADD COLUMN IF NOT EXISTS founder_addons text[];
