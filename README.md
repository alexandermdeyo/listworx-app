# ListWorx - Professional Contractor Referral SaaS Platform

A production-ready contractor referral platform connecting realtors and homeowners with vetted, subscription-paying contractors. Built with Next.js, TypeScript, Supabase, and Stripe.

## 🚀 Features

- Contractor application system with IronClad Standards verification
- Job request matching algorithm (connects realtors/homeowners with contractors)
- Admin dashboard for contractor approvals
- Stripe subscription integration (3 tiers + add-ons)
- Email notifications via Resend
- 182 markets (95 TN + 87 MN counties)
- 70+ trade categories
- Complete billing and invoice management

---

## 📦 Prerequisites

- Node.js 18+ and npm
- Supabase account (database already configured)
- Stripe account with products/prices created
- Resend account for email notifications
- Netlify account for deployment
- GitHub account

---

## 🔧 Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/alexanderdeyo/listworx-app.git
cd listworx-app
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your actual values (see "Environment Variables Guide" below).

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## 🌍 Environment Variables Guide

### Supabase Configuration

Get these from your Supabase project dashboard (Settings → API):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Where used:**
- `NEXT_PUBLIC_SUPABASE_URL` - Client-side Supabase connection (all pages)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client-side auth (all pages)
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only (API routes, webhooks)

**Files:**
- `lib/supabase.ts` - Client creation
- `app/api/*/route.ts` - All API routes
- `middleware.ts` - Auth middleware

---

### Stripe Configuration

Get these from your Stripe dashboard (Developers → API keys):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_WEBHOOK_PATH=/api/stripe-webhook
```

**Where used:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-side Stripe.js (if needed)
- `STRIPE_SECRET_KEY` - Server-only (API routes)
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `STRIPE_WEBHOOK_PATH` - Webhook endpoint path

**Files:**
- `app/api/create-checkout-session/route.ts` - Creates Stripe checkout
- `app/api/stripe-webhook/route.ts` - Handles subscription events

---

### Stripe Price IDs

Create these products in Stripe Dashboard → Products:

**Subscription Tiers:**
```env
STRIPE_PRICE_BASIC_MONTHLY=price_xxxxx
STRIPE_PRICE_BASIC_ANNUAL=price_xxxxx
STRIPE_PRICE_PREFERRED_MONTHLY=price_xxxxx
STRIPE_PRICE_PREFERRED_ANNUAL=price_xxxxx
STRIPE_PRICE_ELITE_MONTHLY=price_xxxxx
STRIPE_PRICE_ELITE_ANNUAL=price_xxxxx
```

**Add-ons:**
```env
STRIPE_ADDON_TERRITORY_LOCK_MONTHLY=price_xxxxx
STRIPE_ADDON_TERRITORY_LOCK_ANNUAL=price_xxxxx
STRIPE_ADDON_FEATURED_SPOTLIGHT_MONTHLY=price_xxxxx
STRIPE_ADDON_FEATURED_SPOTLIGHT_ANNUAL=price_xxxxx
STRIPE_ADDON_IRONCLAD_BADGE_KIT_ONETIME=price_xxxxx
```

**Where used:**
- These are passed to `app/api/create-checkout-session/route.ts` when creating checkouts
- Reference them in your frontend billing components

---

### Application Configuration

```env
NEXT_PUBLIC_BASE_URL=https://listworx.co
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=adeyo@listworx.co
ADMIN_NOTIFICATION_EMAIL=adeyo@listworx.co
```

**Where used:**
- `NEXT_PUBLIC_BASE_URL` - Stripe success/cancel URLs
- `RESEND_API_KEY` - Email sending (Edge Functions)
- `RESEND_FROM_EMAIL` - Email sender address
- `ADMIN_NOTIFICATION_EMAIL` - Admin notifications

**Files:**
- `app/api/create-checkout-session/route.ts` - Checkout URLs
- `supabase/functions/send-contractor-email/index.ts` - Email sending
- `supabase/functions/send-realtor-email/index.ts` - Email sending
- `app/api/contractor-application/route.ts` - Admin notifications
- `app/api/job-request/route.ts` - Admin notifications

---

## 🚀 Netlify Deployment

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Production-ready ListWorx platform"
git push origin main
```

### Step 2: Connect to Netlify

1. Log into Netlify: https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Select GitHub and choose `alexanderdeyo/listworx-app`
4. Build settings (should auto-detect):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 18.x or 20.x

### Step 3: Add Environment Variables in Netlify

Go to Site settings → Environment variables → Add all variables from your `.env` file:

**Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_WEBHOOK_PATH
STRIPE_PRICE_BASIC_MONTHLY
STRIPE_PRICE_BASIC_ANNUAL
STRIPE_PRICE_PREFERRED_MONTHLY
STRIPE_PRICE_PREFERRED_ANNUAL
STRIPE_PRICE_ELITE_MONTHLY
STRIPE_PRICE_ELITE_ANNUAL
STRIPE_ADDON_TERRITORY_LOCK_MONTHLY
STRIPE_ADDON_TERRITORY_LOCK_ANNUAL
STRIPE_ADDON_FEATURED_SPOTLIGHT_MONTHLY
STRIPE_ADDON_FEATURED_SPOTLIGHT_ANNUAL
STRIPE_ADDON_IRONCLAD_BADGE_KIT_ONETIME
NEXT_PUBLIC_BASE_URL
RESEND_API_KEY
RESEND_FROM_EMAIL
ADMIN_NOTIFICATION_EMAIL
```

### Step 4: Deploy

Click "Deploy site" and wait for build to complete.

### Step 5: Configure Custom Domain

1. In Netlify: Domain settings → Add custom domain → `listworx.co`
2. In GoDaddy:
   - Add A record: `@` → `75.2.60.5`
   - Add CNAME: `www` → `your-site.netlify.app`
3. Enable HTTPS in Netlify (auto-provisions SSL)

---

## 🔗 Stripe Webhook Setup

### Create Webhook Endpoint

1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://listworx.co/api/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Update `STRIPE_WEBHOOK_SECRET` in Netlify environment variables
7. Redeploy site

---

## 📧 Resend Email Setup

### Configure Resend

1. Go to Resend Dashboard: https://resend.com/domains
2. Add domain: `listworx.co`
3. Add DNS records to GoDaddy (for email verification)
4. Verify domain
5. Create API key
6. Add `RESEND_API_KEY` to Netlify environment variables

### Email Templates

The following email types are configured:
- Application received confirmation
- Application approved notification
- Subscription confirmation
- Payment failed alert
- Invoice receipts
- Add-on purchase confirmation

---

## 🗄️ Supabase Configuration

### Database Status

Your database is already configured with:
- ✅ 182 markets (95 TN + 87 MN counties)
- ✅ 70 trade categories
- ✅ 3 subscription tiers
- ✅ All tables with RLS policies
- ✅ Indexes for performance

### Create Admin User

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO users (role, name, email, phone)
VALUES ('ADMIN', 'Your Name', 'your-email@listworx.co', '555-1234')
RETURNING id;
```

Then log in at https://listworx.co/admin

### Edge Functions

Deploy Edge Functions for email sending:

```bash
# Deploy contractor email function
supabase functions deploy send-contractor-email

# Deploy realtor email function
supabase functions deploy send-realtor-email
```

Or they're already deployed in your Supabase project.

---

## 🧪 Testing the Application

### Test Contractor Application
1. Visit: https://listworx.co/apply
2. Fill out complete form
3. Select TN or MN markets and counties
4. Select trade categories
5. Submit and verify success page
6. Check email for confirmation

### Test Job Request
1. Visit: https://listworx.co/request
2. Enter property and requester details
3. Select market, county, and services
4. Submit and see matched contractors
5. Check email for confirmation

### Test Admin Dashboard
1. Visit: https://listworx.co/admin
2. Log in with admin credentials
3. View pending contractor applications
4. Approve/decline applications
5. Verify email notifications sent

### Test Stripe Checkout
1. Approve a contractor via admin dashboard
2. Contractor logs in and visits billing page
3. Select subscription tier
4. Complete Stripe checkout
5. Verify subscription created in Supabase
6. Verify contractor status updated to ACTIVE

---

## 📊 Project Structure

```
listworx-app/
├── app/
│   ├── page.tsx                       # Landing page
│   ├── apply/page.tsx                 # Contractor application
│   ├── request/page.tsx               # Job request form
│   ├── admin/page.tsx                 # Admin dashboard
│   ├── billing/                       # Billing portal
│   ├── contractors/page.tsx           # Contractor directory
│   ├── realtors/page.tsx              # Realtor info page
│   ├── ironclad/page.tsx              # IronClad Standards
│   └── api/
│       ├── contractor-application/    # Application submission
│       ├── job-request/               # Request + matching
│       ├── create-checkout-session/   # Stripe checkout
│       ├── stripe-webhook/            # Webhook handler
│       ├── categories/                # Fetch trades
│       └── markets/                   # Fetch markets
├── components/
│   ├── Navigation.tsx                 # Site navigation
│   └── ui/                            # Shadcn components
├── lib/
│   ├── supabase.ts                    # Database client
│   ├── auth.ts                        # Auth utilities
│   └── utils.ts                       # Utility functions
├── supabase/
│   ├── migrations/                    # Database migrations
│   └── functions/                     # Edge functions
├── middleware.ts                      # Auth middleware
├── .env.example                       # Environment template
└── netlify.toml                       # Netlify config
```

---

## 🔐 Security Features

- Row Level Security (RLS) on all Supabase tables
- Role-based access control (ADMIN, CONTRACTOR, REALTOR)
- Middleware protection for admin routes
- Stripe webhook signature verification
- Service role key used only server-side
- Environment variables never committed to git
- Audit logging for critical actions

---

## 📝 API Endpoints

### Public Endpoints
- `GET /api/categories` - Fetch trade categories
- `GET /api/markets` - Fetch available markets
- `GET /api/available-trades` - Fetch trades by market
- `POST /api/contractor-application` - Submit application
- `POST /api/job-request` - Submit job request

### Protected Endpoints (require auth)
- `POST /api/create-checkout-session` - Create Stripe checkout
- `POST /api/stripe-webhook` - Handle Stripe events (verified)

---

## 🎯 Deployment Checklist

Before going live, ensure:

- [ ] All environment variables set in Netlify
- [ ] Stripe webhook configured and tested
- [ ] Resend domain verified
- [ ] Custom domain DNS configured
- [ ] SSL certificate enabled
- [ ] Admin user created in Supabase
- [ ] Edge Functions deployed
- [ ] Stripe products/prices created
- [ ] Test contractor application flow
- [ ] Test job request and matching
- [ ] Test admin approvals
- [ ] Test Stripe checkout flow
- [ ] Verify email notifications work

---

## 🐛 Troubleshooting

### Build Fails
- Check all environment variables are set
- Verify Node version is 18.x or 20.x
- Clear Netlify cache and retry

### Stripe Webhook Not Working
- Verify webhook URL is correct
- Check webhook secret matches Netlify env var
- Look at Stripe webhook logs for errors

### Emails Not Sending
- Verify Resend domain is verified
- Check Resend API key is valid
- Look at Supabase Edge Function logs

### Supabase Connection Errors
- Verify service role key is correct
- Check RLS policies allow required access
- Look at Supabase logs for errors

---

## 📞 Support

For issues or questions:
- Check Netlify build logs
- Check Supabase logs
- Check Stripe webhook logs
- Check browser console for errors

---

## 🏗️ Built With

- **Framework:** Next.js 13.5.1 with App Router
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe
- **Email:** Resend
- **Hosting:** Netlify
- **UI:** Shadcn/ui + Tailwind CSS
- **Language:** TypeScript

---

**Status:** Production-ready and deployed at https://listworx.co

**Built with IronClad Standards.**
