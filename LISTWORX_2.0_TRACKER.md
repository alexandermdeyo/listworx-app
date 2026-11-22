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
| Status | **LIVE in production** |
| Testing results | `npm run typecheck` clean; `npx next lint` — pre-existing `<img>`/LCP warnings only (unrelated, no new warnings); `npm test` 135/135 pass; live-verified in the browser, pre-deploy (dev) and post-deploy (production, https://listworx.co) on both desktop and mobile (375×812) — all copy blocks and the renamed CTA render correctly, no console/network errors, `/apply` href confirmed at the DOM level pre- and post-deploy, homeowner ("Start a request — free") and realtor ("How it works for agents") CTAs confirmed unchanged, job-request widget confirmed present and rendering live |
| Approval status | **Approved** (2026-11-17, after one correction round and one final accuracy check on the hero wording) |
| Production deployment status | **Deployed** — commit `8711c99` pushed directly to `origin/main`, Netlify production deploy published and verified live at https://listworx.co |
| Outstanding work | None for this release's own scope. Candidate for a later, separate release (not part of Release 1): the page's `<meta>` description in `pageMetadata(...)` was deliberately left untouched. The "THE IRONCLAD BADGE" section further down the homepage (not touched this release) still says "Every pro on ListWorx carries the IronClad Standards badge" — the same kind of absolute claim corrected in the hero this round; worth the same fix in a future release. |

**Correction history:**
- v1 (first pass) used "a steady stream of vetted referrals" and "not a marketing budget" — both removed per owner feedback: ListWorx cannot guarantee referral volume, and the business model now includes marketing/growth services, so "no marketing budget" was no longer accurate.
- Final pre-deploy check: verified the hero's "every pro is IronClad Verified" claim against the real authorization logic (`public.can_contractor_be_active()` in the production database checks only `partner_status = 'ACTIVE'` and an active subscription — it does **not** check `ironclad_certified`, which is a separate, manually admin-toggled flag). Since the badge is not guaranteed for every active contractor, both the hero pill ("IronClad Verified Contractors" → "Reviewed to IronClad Standards") and the hero paragraph were changed to accurate, process-based language ("every pro is reviewed against IronClad Standards... before they can take a referral") instead of a blanket certification claim.

**Deployment record**
- Commit: [`8711c99`](https://github.com/alexandermdeyo/listworx-app/commit/8711c99a77c9850c484754102d01bb1e87f45f9) on `main`, pushed 2026-11-17
- Netlify site: `earnest-longma-512604` (production, https://listworx.co), deploy context `production`
- Deployment method: a scoped git worktree branched from the latest `origin/main`, containing only the three approved files, committed once and pushed directly as a fast-forward to `main` — kept the unrelated, uncommitted IronClad Certification work on the local feature branch completely untouched throughout
- Verified live on desktop and mobile immediately after publish; no deployment failures

### Release 2 — Membership pricing presentation

| Field | Value |
| --- | --- |
| Scope | Public pricing/membership presentation only, on `/contractors` and the homepage's IronClad badge section. Replaces the retired Founding Partner narrative ($100/$175/$300 locked-forever, limited-spots-per-county) with the approved three-tier model: **Network — Free**, **Growth — $199/mo**, **Business Pro — $299/mo**. "Join Free" is now the prominent, repeated CTA (hero, tier card, inline bars, bottom CTA), all pointing to the existing `/apply` application form — no tier's CTA triggers payment. Fixes two more blanket "every pro/partner carries the IronClad badge" claims (comparison section, contractor-bridge paragraph) to Standards-required/reviewed language, matching Release 1's hero fix. FAQ rewritten to state explicitly: equal referral consideration on every tier, and certification is a separate review, never automatic. Marketing Studio labeled "coming soon" (confirmed not implemented anywhere in the codebase); ListWorx Academy mentions still gated behind the live `academy_enabled` toggle, unchanged. |
| Status | **Built, not yet deployed** — awaiting owner approval |
| Testing results | `npm run typecheck` clean; `npx next lint` — `app/contractors/page.tsx` fully clean (zero warnings), `app/page.tsx` only the same pre-existing unrelated `<img>`/LCP warnings; `npm test` 135/135 pass (no test referenced the retired founding/tier copy — checked). Live-verified in the browser, desktop and mobile (375×812): hero, all three tier cards, the "Why ListWorx" section, and the FAQ render correctly; confirmed via DOM query that every "Join Free" / "Apply for Growth" / "Apply for Business Pro" link resolves to `/apply`; confirmed the homepage badge paragraph no longer makes the blanket claim. |
| Approval status | **Pending** |
| Production deployment status | **Not deployed** |
| Outstanding work (explicitly out of this release's scope, flagged for a follow-up) | 1) **`/apply`'s own hero still says "Founding Contractor Spots Are Open" / "Founding rates lock in permanently"** — the same retired narrative, now visibly inconsistent with the page a visitor just left. This is the highest-priority follow-up since it's the very next page in the funnel. 2) The homepage's own "For contractors" bridge paragraph and `ContractorRecruitBar` still say "Founding spots in Middle Tennessee are limited" — inconsistent with retiring the concept on `/contractors`, not touched this release (narrower scope: only the badge claim on that paragraph was in scope for item 11). 3) `/founding-partner` page still exists but is no longer linked from `/contractors` — now orphaned; worth deciding whether to delete, redirect, or repurpose. 4) Per-tier feature bundling (badge kit, performance report, content support) is a presentation draft only — nothing in `lib/tiers-config.ts` or Stripe reflects the new Network/Growth/Business Pro names yet; real entitlement wiring is the explicit next step before checkout can be activated, per this release's own constraints. |

**Founding-partner decision:** confirmed with the owner before writing this release — the founding-partner concept is retired outright (0 real contractor_profiles/applications/founder_enrollments exist in production, so nothing concrete was broken), replaced by the three new tiers, rather than reframed onto them or kept running in parallel.

### Release 2 — Final signup consistency fix (before deploy)

| Field | Value |
| --- | --- |
| Scope | `/apply` hero and pricing-reminder section rewritten from "Founding Contractor Spots Are Open" / $100-$175-$300 "locked forever" language to Network-Free messaging matching `/contractors`; the conditional "Founding Partner Selection" banner's label softened to "Your Membership Selection" (text only — the underlying `founderSelection` query-param logic, `ApplicationForm` props, and all form fields/validation/submission are untouched, confirmed by diff). Homepage: `ContractorRecruitBar`'s "founding spots are open in your trade" → "join free in your trade"; the contractor-bridge paragraph's "Founding spots in Middle Tennessee are limited" replaced with "Join free, or go further with Growth or Business Pro." `/contractors` left completely untouched — no factual error was found in it. |
| Status | Built, not yet deployed — **blocked from deploying by the finding below, pending your decision** |
| Testing | `npm run typecheck` clean; `npx next lint` — zero new warnings on any changed file; `npm test` 135/135 pass. Visually verified: homepage (desktop + mobile, recruit bar and bridge section), `/contractors` (desktop + mobile, confirmed unchanged and still correct). `/apply`'s hero could not be screenshotted live — the page immediately client-redirects an unauthenticated visitor to `/contractor-portal` (pre-existing behavior, unrelated to this change) — verified instead by confirming the new copy in the server-rendered HTML via `curl` and confirming zero remaining matches for "Founding Contractor" / the old per-tier prices. |
| Application overpromise check (item 5) | **Already compliant, no change needed.** `ApplicationForm` requires an explicit checkbox: "I understand referral volume is not guaranteed" before submission — confirmed in `app/contractor-dashboard/ApplicationForm.tsx`. No automatic-acceptance or automatic-certification language found anywhere in the form. |

**🚫 Launch blocker found (item 6): a Free Network application cannot currently become an active membership without paying.**

Traced the full post-approval path:
- `getContractorDestination()` in `app/apply/page.tsx` sends an approved applicant to `/billing`.
- `/billing` ([app/billing/page.tsx](app/billing/page.tsx)) shows exactly three paid tiers — Network Member $125/mo, Network Partner $215/mo, Network Elite $365/mo — **there is no $0 / free option anywhere on this page**. Every "Select" button calls `/api/create-checkout-session` and redirects straight to Stripe Checkout. There is no "continue without paying" path.
- The database function `public.can_contractor_be_active()` requires **both** `partner_status = 'ACTIVE'` **and** a `subscriptions` row with `status = 'ACTIVE'` — and the only way a `subscriptions` row is created is through that same Stripe checkout flow.
- Net effect: an applicant who wants the free "Network" tier is funneled, after approval, into a page that only offers to charge them $125–$365/month, with no way to actually land on the free tier they applied for.

This is not something I can fix within this release's constraints (no database/billing/membership logic changes). It needs, at minimum: a $0 Stripe price + tier record, and updates to `/billing`'s tier list and `/api/create-checkout-session` to handle a free tier (or a direct activation path that skips Stripe for Network). **Recommend holding deployment of the "Join Free" messaging until this is resolved, or clearly communicating to users that Network is not yet actually free to activate.**

### Release 2 — Free Network membership activation (launch blocker fix)

| Field | Value |
| --- | --- |
| Scope | Makes the free "Network" tier actually activatable without Stripe. New `/api/activate-free-membership` route (session-derived contractor only, reuses the existing approved→active rule). New `canActivateFree()` helper in `lib/billing/subscription-record.ts` (same rule as `activationAfterPayment()`, explicit `already_active` outcome). `/billing` gets an additive "Network — Free / $0/mo / Join Free" card above the three existing paid tier cards — nothing about the paid tiers or their checkout flow was touched. Proposed, **unapplied** migration adds a `tiers` row named "Network" ($0), since `subscriptions.tier_id` is NOT NULL and no genuine free-tier row existed (the three existing $0-priced rows are placeholder targets for the paid basic/preferred/elite Stripe slug resolution and were deliberately not reused, to avoid collapsing paid and free activation onto the same tier id). |
| Status | Built, **not deployed**, migration **not applied** — awaiting your approval |
| Database change required | `supabase/proposed/20261118000000_network_free_tier.sql` — a single idempotent `insert ... where not exists` adding one `tiers` row. Rollback provided (`.rollback.sql`), guarded to refuse deletion if any subscription still references it. Safe application path: same as prior IronClad work — a short-lived, disposable Supabase branch built from the real `origin/main` lineage, verify there, delete immediately; or apply directly to production during a low-traffic window given this migration only adds one row and touches nothing else (your call — not done this turn either way). |
| Tests passed | `npm run typecheck` clean. `npx next lint` — zero new warnings on any changed/new file (one pre-existing, unrelated warning on `app/billing/page.tsx:154` predates this work). `npm test` **138/138 pass** (3 new: the approval-gate rule including the new `already_active` outcome; a free-tier subscription row stores genuinely `null` Stripe fields, never a placeholder string; a source-scan confirming the new route resolves the contractor from the session, never a request-body id, and uses the shared approval rule). |
| Tests NOT run | End-to-end live verification of `/billing` and the activation route against a real database — this page requires an authenticated contractor with `partner_status` already `approved`, which doesn't exist in production (0 contractor_profiles) and wasn't created this turn (no Supabase branch was authorized or created). All 10 requested test cases were instead verified by tracing the actual code path line by line (see the full report) rather than executed live. |
| Security review | See the full report for the two pre-existing, unrelated findings surfaced while investigating this (a dead/buggy `can_contractor_be_active()` SQL function, and a `contractor_profiles` UPDATE RLS policy that lets a contractor write their own `partner_status` directly) — neither was introduced or touched by this work, both flagged for separate follow-up. |
| Free activation end-to-end | Traced as correct in code: approve → `/billing` → "Join Free" → `/api/activate-free-membership` → subscriptions row (Network tier, null Stripe fields, status active) + `partner_status → active` → `/contractor-dashboard`. **Not been run against a live database this session.** |
| Requires production approval | Applying the migration; deploying the code. Nothing has been applied or deployed. |

### Release 2 — Security re-check (no changes made)

Investigated the suspected `contractor_profiles.partner_status` self-promotion vulnerability flagged last round. **Not confirmed — false alarm.** An existing trigger (`guard_contractor_profile`, already live and enabled in production) silently reverts `partner_status` and every other privileged field (subscription/Stripe/founder/`ironclad_certified`) back to their prior value for any non-privileged (non-admin, non-service-role) write — a contractor can only move their own status to `'applied'` (re-apply after rejection), never to `'approved'` or `'active'`. My earlier report missed this trigger by checking RLS only. No migration needed; nothing changed this turn.

### Release 2 — Growth/Business Pro Stripe prices created (live, inactive)

Test-mode Stripe access never connected this session despite several attempts (connector stayed on the live-only account). Per explicit approval, created the two prices directly in **live mode**, both the Product and Price set `active: false` — confirmed via the Stripe API immediately after creation and again on a final read-back. Neither is usable for checkout or any purchase until explicitly activated.

| Tier | Product ID | Price ID | Amount | Status |
| --- | --- | --- | --- | --- |
| Growth | `prod_Veznru8l3XkDbT` | `price_1UdfnX7JcUvuHoDOS3Ppns5T` | $199.00/mo | Inactive |
| Business Pro | `prod_VeznmiMses3SO9` | `price_1Udfni7JcUvuHoDOFUD3q7I8` | $299.00/mo | Inactive |

Price IDs added to local `.env.local` (gitignored, not committed) for `STRIPE_PRICE_GROWTH_MONTHLY` / `STRIPE_PRICE_BUSINESS_PRO_MONTHLY`. The real production secret key is a placeholder in this local file (the real one lives in Netlify's env config, not checked), so the checkout route's live behavior was verified by code review against the confirmed-inactive price objects, not by an actual local API call — see the full report.

### Release 2 — Growth/Business Pro wiring + Stripe test-mode blocker

Code is fully wired for all three memberships: `lib/stripe-prices.ts` has `growth`/`business_pro` `TierId`s reading new (unset) env vars, `/billing` shows exactly Free/Growth/Business Pro (old $125/$215/$365 cards removed), the webhook's `resolveTierId()` resolves `growth`→"Growth" and `business_pro`→"Business Pro", and two new proposed (unapplied) migrations seed the three `tiers` rows. **Could not create the Growth/Business Pro Stripe prices this session, test or live** — the connected Stripe integration only has a live-mode account (`acct_1Syy3O7JcUvuHoDO`, livemode:true) with no test-mode counterpart, and the app's own `.env.local` only has a live secret key (`sk_live_...`) — no test-mode credentials exist anywhere in this session. See the full report for options.

### Release 7: Consolidated launch (Nov 22 2026), branch `launch/media-services-membership`, NOT deployed

**Built (code complete, typecheck + build + 153 tests passing):**
- Approved membership benefits in one source (`lib/membership/benefits.ts`): cards + mobile comparison table on `/contractors`, same benefits on `/billing`, dashboard plan card, and Marketing upgrade cards. Removed advertised-but-unbuilt items (text alerts, performance report, badge kit, "Full Academy").
- Membership access from verified current subscriptions (`lib/server/membership.ts`, `/api/membership/me`): Flyer Builder is Business Pro only; member Learning Center resources are Growth+; expired, cancelled, past-due, and legacy tiers grant nothing. Referral matching untouched.
- Business Pro social posts: `/contractor-dashboard/social-posts` (2 per calendar month, one revision each, no rollover), admin `/admin/crm/social-posts`. Allowance enforced by a unique (contractor, month, slot) key.
- ListWorx Media Services: `/media-services`, `/media-services/book`, `/media-services/orders`. Server-side catalog pricing and membership discount (5% Growth, 10% Business Pro, never stacked, never from the browser). Add-ons require a qualifying service. Before-and-After books two visits. Matterport not sold. Stripe Checkout with inline line items (no new Stripe products). Verified webhook marks orders paid once (`mark_media_order_paid`), then emails admin and customer.
- Scheduling: admin `/admin/crm/media-schedule` (weekly hours, blocked/extra dates, durations, buffers, hold length, manual blocks, appointment list). Database exclusion constraint prevents overlapping holds/requests/confirmed/blocked times. Unpaid holds expire with the Checkout session.
- Admin orders: `/admin/crm/media-orders` (confirm, propose new time, status, assign provider, deliverables link, notes, cancel, Stripe refund with idempotency).
- Emails via existing Resend setup: admin paid-order alert; customer paid/pending, confirmed, new time proposed, canceled, refunded.
- Brand: `/faith-and-purpose`, approved mission and vision on `/about`, footer line and links, sitemap. Corrected claims: insurance "confirmed", homeowner ratings decide standing, "more visibility", founding offers on `/ironclad` and homepage, 24 to 48 hour approval, founding rates in `/contractors` meta, media partner directory on `/realtors`.
- Learning Center starter library (`/learning-center`): 4 free guides, 2 Growth+ resources served only through `/api/learning/[slug]`.

**Blocked:** applying migration `20261122200000_media_services_and_social_posts.sql` to production was refused by the session's safety check. Nothing was deployed. Deploy order: apply migration, then merge the branch to `main`.

**Deferred / manual:** add availability hours in `/admin/crm/media-schedule` before announcing booking (no hours = no bookable times). Optional: add `checkout.session.expired` to the live Stripe webhook (holds also expire automatically without it). End-to-end sandbox payment not run (no sandbox keys available to this session). Customers accept a proposed time by replying to the email; the admin then confirms.

## Verified-but-unchanged (Release 1 due diligence)

- The free contractor **application** destination is `/apply` (`app/apply/page.tsx` — the actual
  `ApplicationForm`). This was NOT changed.
- `/contractors` (`app/contractors/page.tsx`) is the contractor marketing/pricing/FAQ page, not
  the application form itself — it has its own path onward to `/apply`. Both the homepage's top
  recruiting banner (`ContractorRecruitBar`) and the bottom "Why partner with us" link correctly
  point here; the bottom "Apply to join" link correctly points straight to `/apply`. Both existing
  destinations are intentional, two different funnel entry points, and neither was touched.
