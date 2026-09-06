/*
  # Job requests: optional street address + submission-origin / spam signals

  - property_address is no longer NOT NULL (the request form now only requires
    county / city / state — address is optional).
  - New columns capture where a submission came from so spammy ones can be
    triaged: source_ip, user_agent, source_referer, plus a computed spam_score
    and flagged_spam flag (set by /api/job-request).
*/

ALTER TABLE job_requests
  ADD COLUMN IF NOT EXISTS source_ip text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS source_referer text,
  ADD COLUMN IF NOT EXISTS spam_score integer,
  ADD COLUMN IF NOT EXISTS flagged_spam boolean NOT NULL DEFAULT false;

ALTER TABLE job_requests ALTER COLUMN property_address DROP NOT NULL;
