# ListWorx 2.0 — Master Project Tracker

Incremental build-and-publish policy, effective 2026-11-18: each release is small, independent,
and production-ready on its own. A release is not started until the previous one is confirmed
live. Unfinished IronClad Certification work (the `supabase/proposed/` foundation, the
certification-demo pages, the contractor/admin certification UI) stays isolated from these
releases until it has its own, separately-approved go-live — it is not touched by, and does not
block, any release below.

Standing constraints for every release:
- No live Stripe pricing/subscription/billing changes without explicit approval.
- No rebuilding ListWorx Academy or Marketing Studio.
- Referral matching, certification permissions, subscriptions, and founding-member commitments
  are preserved exactly as they are unless a release is explicitly scoped to change one of them.

## Releases

### Release 1 — Homepage messaging

| Field | Value |
| --- | --- |
| Scope | Homepage copy only across `app/page.tsx` and `components/site/HomeownerHero.tsx`. Positions each audience explicitly: homeowners as served by "the trusted home-service referral network" (hero), realtors as getting a "reliable... connect your clients" contractor connection, contractors as getting a "partner in your growth" with marketing/business-growth support (not a promise of referral volume). Renamed the primary contractor CTA button text to "Join ListWorx Free" — same `/apply` destination, unchanged. No other CTA/link/route changes, no pricing, no Stripe, no database schema, no referral-matching or certification logic, no layout/design changes. |
| Status | **Built, not yet deployed** — awaiting owner approval (correction round 2, after Release 1 v1 was rejected as too limited) |
| Testing results | `npm run typecheck` clean; `npx next lint` — pre-existing `<img>`/LCP warnings only (unrelated, no new warnings); `npm test` 135/135 pass; live-verified in the browser on both desktop and mobile (375×812) viewports — all three updated copy blocks and the renamed CTA render correctly, no console/network errors, `/apply` href confirmed unchanged, homeowner ("Start a request — free") and realtor ("How it works for agents") CTAs confirmed unchanged |
| Approval status | **Pending** |
| Production deployment status | **Not deployed** |
| Outstanding work | None for this release's own scope. Candidate for a later, separate release (not part of Release 1): the page's `<meta>` description in `pageMetadata(...)` was deliberately left untouched. |

**Correction history:** v1 (first pass) used "a steady stream of vetted referrals" and "not a marketing budget" — both removed in this round per owner feedback: ListWorx cannot guarantee referral volume, and the business model now includes marketing/growth services, so "no marketing budget" was no longer accurate.

## Verified-but-unchanged (Release 1 due diligence)

- The free contractor **application** destination is `/apply` (`app/apply/page.tsx` — the actual
  `ApplicationForm`). This was NOT changed.
- `/contractors` (`app/contractors/page.tsx`) is the contractor marketing/pricing/FAQ page, not
  the application form itself — it has its own path onward to `/apply`. Both the homepage's top
  recruiting banner (`ContractorRecruitBar`) and the bottom "Why partner with us" link correctly
  point here; the bottom "Apply to join" link correctly points straight to `/apply`. Both existing
  destinations are intentional, two different funnel entry points, and neither was touched.
