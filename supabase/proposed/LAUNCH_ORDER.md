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
| 4 | `20261112000300_referral_columns.sql` (referral columns the contractor Referrals list and admin screens already use) | Before or with the code deploy |
| 5 | Deploy `release/launch` on Netlify and confirm it is live | — |
| 6 | `20261111000200_media_storage_ownership.sql` (storage ownership) | **Only after step 5 is live** — the new upload paths work under the old rules, but the old paths would be refused under the new ones |

Steps 1–4 are additive or compatible with the current site, so the live site keeps working between them and the deploy.

## Rollback (reverse order, only what was applied)

1. `20261111000200_media_storage_ownership_rollback.sql` (re-opens the storage hole — only if uploads break)
2. Revert the Netlify deploy to the previous one (Deploys → previous deploy → Publish deploy)
3. `20261112000300_referral_columns.rollback.sql` (keeps referrals; the Referrals list breaks again)
4. `20261112000200_document_review_guard.rollback.sql`
5. `20261112000100_billing_subscriptions.rollback.sql` (keeps subscription rows; converts status back)
6. `20261111000000_align_profiles_referrals.rollback.sql`

## Tested (local copy of production, 2026-11-12)

`run_launch.sh`: steps 1–4 in order, 29 checks (alignment, document guard, billing, referral columns), rollback of all four with data present (structure restored, data kept), then re-apply. `run_media.sh`: storage rules, exploit confirmed before, blocked after, rollback and re-apply.
Browser flow on the Netlify test site + Supabase test branch (2026-11-12): sign-up, application, admin approval, dashboard, documents, logo, cross-account checks and referral match tested. Step 4 was found by that test. Not yet tested: Stripe test-mode payment.
