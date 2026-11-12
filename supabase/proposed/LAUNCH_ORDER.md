# Minimum safe launch — database order and rollback

Branch `release/launch` holds the code. Nothing here has been applied to production.

## Before anything

1. Back up production (Supabase dashboard → Database → Backups, or a manual dump).
2. Confirm production still has 0 `subscriptions` rows and 0 `contractor_documents` rows (the migrations assume no conflicting data and will stop if duplicates exist).

## Order

| Step | What | When |
| --- | --- | --- |
| 1 | `20261111000000_align_profiles_referrals.sql` (columns the dashboard, referrals list and profile editor already use; admin-only certification) | Immediately before or with the code deploy |
| 2 | `20261112000100_billing_subscriptions.sql` (subscription records the webhook can save) | Before the code deploy (the new webhook expects it) |
| 3 | `20261112000200_document_review_guard.sql` (contractors cannot approve their own documents) | Before or with the code deploy |
| 4 | Deploy `release/launch` on Netlify and confirm it is live | — |
| 5 | `20261111000200_media_storage_ownership.sql` (storage ownership) | **Only after step 4 is live** — the new upload paths work under the old rules, but the old paths would be refused under the new ones |

Steps 1–3 are additive or compatible with the current site, so the live site keeps working between them and the deploy.

## Rollback (reverse order, only what was applied)

1. `20261111000200_media_storage_ownership_rollback.sql` (re-opens the storage hole — only if uploads break)
2. Revert the Netlify deploy to the previous one (Deploys → previous deploy → Publish deploy)
3. `20261112000200_document_review_guard.rollback.sql`
4. `20261112000100_billing_subscriptions.rollback.sql` (keeps subscription rows; converts status back)
5. `20261111000000_align_profiles_referrals.rollback.sql`

## Tested (local copy of production, 2026-11-12)

`run_launch.sh`: steps 1–3 in order, 25 checks (alignment, document guard, billing), rollback of all three with data present (structure restored, data kept), then re-apply. `run_media.sh`: storage rules, exploit confirmed before, blocked after, rollback and re-apply.
Not yet tested: the full browser flow on the separate Netlify test site with the Supabase test branch and Stripe test mode.
