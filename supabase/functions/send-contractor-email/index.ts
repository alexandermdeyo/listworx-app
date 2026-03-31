import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  type: 'application_received' | 'application_approved' | 'application_declined' |
        'subscription_confirmation' | 'subscription_activated_welcome' | 'payment_failed' | 'subscription_suspended' |
        'elite_video_package' | 'addon_purchase_confirmation' | 'admin_new_application' | 'invoice' |
        'referral_notification';
  to: string;
  contractorName: string;
  companyName?: string;
  reason?: string;
  tierName?: string;
  isAnnual?: boolean;
  benefits?: string[];
  amountDue?: string;
  retryDate?: string;
  addonName?: string;
  addonDescription?: string;
  limitations?: string;
  email?: string;
  phone?: string;
  serviceArea?: string;
  categories?: string[];
  invoiceNumber?: string;
  amount?: string;
  paidAt?: string;
  invoicePdfUrl?: string;
  applicationId?: string;
  jobCategory?: string;
  jobCounty?: string;
  jobState?: string;
  jobDescription?: string;
  requesterType?: string;
  referralId?: string;
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured - emails cannot be sent');
  }

  const fromAddress = FROM_EMAIL.includes('@')
    ? `ListWorx <${FROM_EMAIL}>`
    : FROM_EMAIL;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const C = {
  rust:       '#C65A1E',
  rustDark:   '#A34A16',
  rustLight:  '#D97340',
  bg:         '#0E0E0E',
  surface:    '#161616',
  card:       '#1E1E1E',
  cardAlt:    '#242424',
  border:     '#2E2E2E',
  borderSoft: '#242424',
  white:      '#FFFFFF',
  gray100:    '#F0F0F0',
  gray200:    '#D4D4D4',
  gray400:    '#888888',
  gray600:    '#444444',
  gray700:    '#333333',
  danger:     '#E53E3E',
  dangerBg:   '#2D1414',
  success:    '#22C55E',
  successBg:  '#142D1A',
  font:       "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
};

/* ============================================================
   BASE COMPONENTS
   ============================================================ */

function badge(text: string, color = C.rust): string {
  return `<span style="display:inline-block;background-color:${color}20;border:1px solid ${color}50;color:${color};font-family:${C.font};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:3px 10px;border-radius:20px;">${text}</span>`;
}

function eyebrow(text: string, color = C.rust): string {
  return `<p style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${color};margin:0 0 10px 0;padding:0;">${text}</p>`;
}

function h1(text: string): string {
  return `<h1 style="font-family:${C.font};font-size:30px;font-weight:800;color:${C.white};margin:0 0 16px;line-height:1.2;letter-spacing:-0.5px;">${text}</h1>`;
}

function h2(text: string): string {
  return `<h2 style="font-family:${C.font};font-size:18px;font-weight:700;color:${C.white};margin:0 0 12px;line-height:1.3;">${text}</h2>`;
}

function p(text: string, color = C.gray200): string {
  return `<p style="font-family:${C.font};font-size:15px;color:${color};line-height:1.75;margin:0 0 16px;padding:0;">${text}</p>`;
}

function small(text: string, color = C.gray400): string {
  return `<p style="font-family:${C.font};font-size:13px;color:${color};line-height:1.6;margin:0 0 10px;padding:0;">${text}</p>`;
}

function divider(margin = '32px 0'): string {
  return `<div style="border:0;border-top:1px solid ${C.border};margin:${margin};"></div>`;
}

function spacer(height = 24): string {
  return `<div style="height:${height}px;line-height:${height}px;font-size:${height}px;">&nbsp;</div>`;
}

function sectionLabel(text: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 14px;">
    <tr>
      <td>
        <p style="font-family:${C.font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:${C.rust};margin:0 0 8px;padding:0;">${text}</p>
        <div style="height:1px;background-color:${C.border};"></div>
      </td>
    </tr>
  </table>`;
}

function infoCard(content: string, accent = C.rust): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:${C.cardAlt};border:1px solid ${C.border};border-radius:10px;padding:24px 28px;position:relative;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:3px;background-color:${accent};border-radius:2px;vertical-align:top;"></td>
            <td style="padding-left:18px;">${content}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function warningCard(content: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:${C.dangerBg};border:1px solid ${C.danger}40;border-radius:10px;padding:22px 26px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:3px;background-color:${C.danger};border-radius:2px;vertical-align:top;"></td>
            <td style="padding-left:18px;">${content}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function successCard(content: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:${C.successBg};border:1px solid ${C.success}40;border-radius:10px;padding:22px 26px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:3px;background-color:${C.success};border-radius:2px;vertical-align:top;"></td>
            <td style="padding-left:18px;">${content}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function dataTable(rows: Array<[string, string]>): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.border};border-radius:10px;overflow:hidden;margin:16px 0;">
    ${rows.map(([label, value], i) => `
    <tr>
      <td style="padding:13px 20px;${i < rows.length - 1 ? `border-bottom:1px solid ${C.borderSoft};` : ''}background-color:${C.cardAlt};width:38%;vertical-align:top;">
        <span style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${C.gray400};">${label}</span>
      </td>
      <td style="padding:13px 20px;${i < rows.length - 1 ? `border-bottom:1px solid ${C.borderSoft};` : ''}background-color:${C.card};vertical-align:top;">
        <span style="font-family:${C.font};font-size:14px;color:${C.gray100};line-height:1.5;">${value}</span>
      </td>
    </tr>`).join('')}
  </table>`;
}

function checkList(items: string[], check = '&#10003;'): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0;">
    ${items.map(item => `
    <tr>
      <td style="padding:5px 0;vertical-align:top;width:22px;">
        <span style="color:${C.rust};font-size:13px;font-weight:700;line-height:1.7;">${check}</span>
      </td>
      <td style="padding:5px 0 5px 6px;">
        <span style="font-family:${C.font};font-size:14px;color:${C.gray200};line-height:1.7;">${item}</span>
      </td>
    </tr>`).join('')}
  </table>`;
}

function cta(label: string, href: string, fullWidth = false): string {
  const style = fullWidth
    ? `display:block;width:100%;text-align:center;box-sizing:border-box;`
    : `display:inline-block;`;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 10px;">
    <tr>
      <td align="center">
        <a href="${href}" target="_blank" style="${style}background-color:${C.rust};color:${C.white};font-family:${C.font};font-size:15px;font-weight:700;letter-spacing:0.3px;text-decoration:none;padding:15px 36px;border-radius:8px;line-height:1.4;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function linkFallback(href: string): string {
  return `<p style="font-family:${C.font};font-size:12px;color:${C.gray400};margin:8px 0 0;word-break:break-all;">Or copy: <a href="${href}" style="color:${C.rust};text-decoration:underline;">${href}</a></p>`;
}

/* ============================================================
   MASTER LAYOUT
   ============================================================ */

function layout(
  headline: string,
  subline: string,
  body: string,
  preheader = '',
  isContractor = true
): string {
  const BASE_URL = Deno.env.get('APP_BASE_URL') || Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'https://listworx.co';

  const footerLinks = isContractor
    ? `<a href="${BASE_URL}/contractor-dashboard" style="color:${C.rust};text-decoration:none;font-weight:600;">Partner Dashboard</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/apply" style="color:${C.gray400};text-decoration:none;">Join the Network</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/ironclad" style="color:${C.gray400};text-decoration:none;">IronClad Standards</a>`
    : `<a href="${BASE_URL}/request" style="color:${C.rust};text-decoration:none;font-weight:600;">Request a Contractor</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/contractors" style="color:${C.gray400};text-decoration:none;">Find Contractors</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/ironclad" style="color:${C.gray400};text-decoration:none;">IronClad Standards</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ListWorx</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @media only screen and (max-width:620px){
      .email-container{width:100%!important;}
      .content-pad{padding:28px 20px!important;}
      .header-pad{padding:24px 20px!important;}
      .footer-pad{padding:24px 20px!important;}
      h1.hero-title{font-size:24px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${preheader ? `<div style="display:none;font-size:1px;color:${C.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background-color:${C.bg};">
    <tr>
      <td align="center" style="padding:40px 16px 60px;">

        <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- LOGO BAR -->
          <tr>
            <td style="padding:0 0 20px;">
              <img src="${BASE_URL}/Listworx_wordmark_logo.png" alt="ListWorx" width="140" height="auto" style="display:block;border:0;height:auto;max-width:140px;" />
            </td>
          </tr>

          <!-- HERO HEADER -->
          <tr>
            <td style="background-color:${C.surface};border-radius:14px 14px 0 0;padding:44px 48px 40px;border-bottom:3px solid ${C.rust};" class="header-pad">
              <p style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:${C.rust};margin:0 0 14px;padding:0;">ListWorx IronClad Partner Network</p>
              <h1 class="hero-title" style="font-family:${C.font};font-size:30px;font-weight:800;color:${C.white};margin:0 0 14px;line-height:1.2;letter-spacing:-0.5px;">${headline}</h1>
              <p style="font-family:${C.font};font-size:16px;color:${C.gray200};line-height:1.6;margin:0;padding:0;">${subline}</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:${C.surface};padding:40px 48px 44px;" class="content-pad">
              ${body}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:${C.card};border-radius:0 0 14px 14px;padding:28px 48px;border-top:1px solid ${C.border};" class="footer-pad">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="font-family:${C.font};font-size:13px;font-weight:700;color:${C.gray200};margin:0 0 4px;">${footerLinks}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;border-top:1px solid ${C.border};margin-top:16px;">
                    <p style="font-family:${C.font};font-size:12px;color:${C.gray600};line-height:1.6;margin:0 0 4px;">
                      <strong style="color:${C.gray400};">ListWorx LLC</strong> &mdash; Professional Contractor Referral Network
                    </p>
                    <p style="font-family:${C.font};font-size:12px;color:${C.gray600};margin:0;">
                      2147 Springdale Ln F104, Gallatin, TN 37066 &nbsp;&bull;&nbsp;
                      <a href="tel:6153624996" style="color:${C.gray600};text-decoration:none;">615-362-4996</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ============================================================
   EMAIL HANDLER
   ============================================================ */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const request: EmailRequest = await req.json();
    const { type, to, contractorName, companyName } = request;
    const BASE_URL = Deno.env.get('APP_BASE_URL') || Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'https://listworx.co';

    let subject = '';
    let html = '';
    let text = '';

    switch (type) {

      /* ── APPLICATION RECEIVED ─────────────────────────── */
      case 'application_received':
        subject = 'Your ListWorx Application Has Been Received';
        html = layout(
          'Application Received',
          `Thank you for applying to join the ListWorx IronClad Partner Network, ${contractorName}.`,
          `
          ${p(`We've received your application for <strong style="color:${C.white};">${companyName}</strong>. Our team will review it and respond within <strong style="color:${C.white};">2–3 business days</strong>.`)}

          ${sectionLabel('What We Review')}
          ${checkList([
            'State licensing status and documentation',
            'Active general liability insurance',
            'Business credentials and service history',
            'Alignment with IronClad Standards',
          ])}

          ${sectionLabel('IronClad Standards')}
          ${p('Every ListWorx partner must meet and maintain the IronClad Standards — a non-negotiable set of requirements covering licensing, insurance, communication, and professional conduct.')}

          ${divider()}
          ${small(`Questions? Reply to this email or reach us at <a href="mailto:support@listworx.com" style="color:${C.rust};text-decoration:none;">support@listworx.com</a>`)}
          `,
          "Your application is under review — we'll be in touch within 2–3 business days."
        );
        text = `Application Received\n\nHi ${contractorName},\n\nWe've received your application for ${companyName}. Our team will review it within 2–3 business days.\n\nWe review: licensing, insurance, credentials, and IronClad Standards alignment.\n\nQuestions? Email support@listworx.com\n\n— The ListWorx Team`;
        break;

      /* ── APPLICATION APPROVED ─────────────────────────── */
      case 'application_approved':
        subject = "You're Approved — Sign In and Choose Your Plan";
        html = layout(
          'Application Approved',
          `Congratulations, ${contractorName} — ${companyName} has been approved.`,
          `
          ${successCard(`
            ${p(`<strong style="color:${C.white};">You're in the network.</strong> Sign in to your dashboard, select your partnership tier, and complete checkout to activate your account and start receiving referrals.`, C.gray200)}
            ${cta('Sign In &amp; Choose Your Plan &rarr;', `${BASE_URL}/contractor-portal?email=${encodeURIComponent(to)}`)}
            ${linkFallback(`${BASE_URL}/contractor-portal?email=${encodeURIComponent(to)}`)}
          `)}

          ${sectionLabel('Once Active You Receive')}
          ${checkList([
            'Qualified referrals from realtors and homeowners in your service counties',
            'IronClad Partner recognition and badge for your marketing',
            'Listing in the ListWorx contractor directory',
            'Full dashboard access to track referrals and performance',
          ])}

          ${sectionLabel('Ongoing Requirements')}
          ${checkList([
            'Maintain valid licensing and insurance at all times',
            'Respond to every referral within 24 hours',
            'Uphold IronClad Standards throughout your membership',
          ])}

          ${divider()}
          ${small(`Need help? Reply to this email or contact <a href="mailto:support@listworx.com" style="color:${C.rust};text-decoration:none;">support@listworx.com</a>`)}
          `,
          'Congratulations — your application has been approved. Sign in to get started.'
        );
        text = `You're Approved\n\nCongratulations, ${contractorName},\n\n${companyName} has been approved to join the ListWorx IronClad Partner Network.\n\nSign in to your dashboard and choose your plan:\n${BASE_URL}/contractor-portal?email=${encodeURIComponent(to)}\n\nOnce active you'll receive qualified referrals from realtors and homeowners in your area.\n\n— The ListWorx Team`;
        break;

      /* ── APPLICATION DECLINED ─────────────────────────── */
      case 'application_declined':
        subject = 'ListWorx Application Update';
        html = layout(
          'Application Update',
          `Hi ${contractorName}, thank you for your interest in joining the ListWorx network.`,
          `
          ${p("After careful review, we're unable to approve your application at this time.")}

          ${request.reason ? `
            ${sectionLabel('Reason for Decision')}
            ${warningCard(p(request.reason, C.gray100))}
          ` : ''}

          ${sectionLabel('What You Can Do')}
          ${checkList([
            `Contact us at <a href="mailto:support@listworx.com" style="color:${C.rust};text-decoration:none;">support@listworx.com</a> for clarification`,
            "Reapply once you've addressed the concerns noted above",
            'Request a formal review of your application',
          ])}

          ${divider()}
          ${small('We appreciate your interest and wish you success. If circumstances change, we encourage you to reapply.')}
          `,
          'An update regarding your ListWorx contractor application.'
        );
        text = `Application Update\n\nHi ${contractorName},\n\nThank you for your interest in ListWorx. After careful review, we're unable to approve your application at this time.\n\n${request.reason ? `Reason: ${request.reason}\n\n` : ''}Contact support@listworx.com for clarification or reapply when circumstances change.\n\n— The ListWorx Team`;
        break;

      /* ── SUBSCRIPTION WELCOME (ACTIVATED) ─────────────── */
      case 'subscription_activated_welcome': {
        const tier = request.tierName || 'Partner';
        const tierBenefitsMap: Record<string, string[]> = {
          'Basic': [
            'Up to 5 qualified referrals per month in your service area',
            'ListWorx Verified Partner badge on your profile',
            'Listed in the contractor directory',
            'Access to your contractor dashboard and lead tracking',
          ],
          'Preferred': [
            'Up to 15 qualified referrals per month in your service area',
            'IronClad Certified Partner badge on your profile',
            'Priority placement in the contractor directory',
            'Access to your contractor dashboard and lead tracking',
            'Dedicated account support',
          ],
          'Elite': [
            'Unlimited qualified referrals in your service area',
            'Elite IronClad Certified Partner badge on your profile',
            'Top placement in the contractor directory',
            'Access to your contractor dashboard and lead tracking',
            'Dedicated account manager',
            'Professional promotional video package (annual plan)',
            'Featured contractor spotlight opportunities',
          ],
        };
        const tierKey = Object.keys(tierBenefitsMap).find(k => tier.toLowerCase().includes(k.toLowerCase())) || 'Basic';
        const activatedBenefits = tierBenefitsMap[tierKey];
        subject = `Welcome to ListWorx — Your ${tier} Account Is Now Active`;
        html = layout(
          `Welcome to the Network`,
          `Your ${tier} membership is active, ${contractorName}. You can start receiving referrals today.`,
          `
          ${successCard(`
            ${p(`<strong style="color:${C.white};">Your account is live.</strong> ${companyName} is now a verified IronClad Partner and eligible to receive qualified referrals in your service area.`, C.gray200)}
          `)}

          ${sectionLabel(`Your ${tier} Benefits`)}
          ${checkList(activatedBenefits)}

          ${cta('Go to Your Dashboard &rarr;', `${BASE_URL}/contractor-dashboard`)}

          ${sectionLabel('Getting Your First Referrals')}
          ${checkList([
            'Make sure your service counties and trade specialties are fully filled in',
            'Upload your compliance documents so your profile shows as verified',
            'Keep your contact information current',
          ])}

          ${divider()}
          ${small(`Questions? Contact Alexander Deyo, Founder &mdash; <a href="mailto:adeyo@listworx.co" style="color:${C.rust};text-decoration:none;">adeyo@listworx.co</a> &nbsp;|&nbsp; 615-362-4996`)}
          `,
          `Your ${tier} account is active — start receiving referrals today.`
        );
        text = `Welcome to ListWorx — Your ${tier} Account Is Now Active\n\nWelcome, ${contractorName},\n\nYour ${tier} membership for ${companyName} is now fully active.\n\nBenefits:\n${activatedBenefits.map(b => `- ${b}`).join('\n')}\n\nDashboard: ${BASE_URL}/contractor-dashboard\n\nContact: adeyo@listworx.co | 615-362-4996\n\n— The ListWorx Team`;
        break;
      }

      /* ── SUBSCRIPTION CONFIRMATION ─────────────────────── */
      case 'subscription_confirmation': {
        const tierName = request.tierName || 'Partner';
        const benefits = request.benefits || [];
        subject = `Welcome to ListWorx — ${tierName} Membership Activated`;
        html = layout(
          'Membership Activated',
          `Welcome to the network, ${contractorName}. Your membership is now live.`,
          `
          ${dataTable([
            ['Tier', tierName],
            ['Billing Cycle', request.isAnnual ? 'Annual' : 'Monthly'],
            ['Status', '<span style="color:#22C55E;font-weight:700;">Active</span>'],
          ])}

          ${benefits.length > 0 ? `
            ${sectionLabel("What's Included")}
            ${checkList(benefits)}
          ` : ''}

          ${cta('Go to Your Dashboard &rarr;', `${BASE_URL}/contractor-dashboard`)}

          ${sectionLabel('IronClad Standards Reminder')}
          ${checkList([
            'Maintain valid licensing and insurance at all times',
            'Respond to every referral within 24 hours',
            'Provide written estimates for work over $500',
            'Professional communication and clean job sites',
          ])}

          ${small(`Non-compliance may result in suspension or removal from the network.`, C.gray400)}
          `,
          `Your ${tierName} membership is active — start receiving referrals today.`
        );
        text = `Membership Activated\n\nWelcome, ${contractorName},\n\nYour ${tierName} membership (${request.isAnnual ? 'Annual' : 'Monthly'}) is now active.\n\n${benefits.length > 0 ? `Benefits: ${benefits.join(', ')}\n\n` : ''}Dashboard: ${BASE_URL}/contractor-dashboard\n\nMaintain IronClad Standards to keep your active status.\n\n— The ListWorx Team`;
        break;
      }

      /* ── PAYMENT FAILED ────────────────────────────────── */
      case 'payment_failed':
        subject = 'Action Required — Membership Payment Issue';
        html = layout(
          'Payment Issue',
          `Hi ${contractorName}, we need you to update your billing information.`,
          `
          ${p('We were unable to process your ListWorx membership payment. Please update your payment method to avoid interruption to your referral access.')}

          ${dataTable([
            ['Amount Due', request.amountDue || ''],
            ['Next Retry', request.retryDate || ''],
            ['Grace Period', '7 days'],
          ])}

          ${warningCard(`
            ${p(`<strong style="color:${C.white};">Your account is in a grace period.</strong> You will continue receiving referrals for 7 days. If payment is not resolved, your membership will be suspended and referrals will stop.`, C.gray100)}
          `)}

          ${cta('Update Payment Method &rarr;', `${BASE_URL}/billing`)}
          ${linkFallback(`${BASE_URL}/billing`)}

          ${divider()}
          ${small(`Believe this is an error? Contact <a href="mailto:billing@listworx.com" style="color:${C.rust};text-decoration:none;">billing@listworx.com</a> immediately.`)}
          `,
          'Your payment failed — update your billing info to keep receiving referrals.'
        );
        text = `Payment Issue — Action Required\n\nHi ${contractorName},\n\nWe were unable to process your ListWorx membership payment.\n\nAmount Due: ${request.amountDue}\nNext Retry: ${request.retryDate}\n\nYou have a 7-day grace period. Update your payment method:\n${BASE_URL}/billing\n\nIf unresolved, your account will be suspended.\n\n— The ListWorx Team`;
        break;

      /* ── SUBSCRIPTION SUSPENDED ───────────────────────── */
      case 'subscription_suspended':
        subject = 'ListWorx Membership Paused';
        html = layout(
          'Membership Paused',
          `Hi ${contractorName}, your ListWorx membership has been paused.`,
          `
          ${p('While paused, you will not receive new referrals and your profile is hidden from the directory.')}

          ${request.reason ? `
            ${sectionLabel('Reason for Pause')}
            ${warningCard(p(request.reason, C.gray100))}
          ` : ''}

          ${sectionLabel('What This Means')}
          ${checkList([
            'No new referrals will be sent to you',
            'Your profile is hidden from the contractor directory',
            'Your IronClad Partner badge is inactive',
          ])}

          ${sectionLabel('How to Reactivate')}
          ${checkList([
            'Address the reason for pause noted above',
            `Contact us at <a href="mailto:support@listworx.com" style="color:${C.rust};text-decoration:none;">support@listworx.com</a>`,
            'Update your payment method if applicable',
          ])}

          ${cta('Reactivate Membership &rarr;', `${BASE_URL}/billing`)}

          ${divider()}
          ${small('We hope to have you back in the network soon.')}
          `,
          'Your ListWorx membership has been paused.'
        );
        text = `Membership Paused\n\nHi ${contractorName},\n\nYour ListWorx membership has been paused.\n\n${request.reason ? `Reason: ${request.reason}\n\n` : ''}You will not receive referrals and your profile is hidden.\n\nTo reactivate: ${BASE_URL}/billing\n\n— The ListWorx Team`;
        break;

      /* ── ELITE VIDEO PACKAGE ──────────────────────────── */
      case 'elite_video_package':
        subject = "Your Elite Video Package — Schedule Your Shoot";
        html = layout(
          'Elite Video Package',
          `Your Annual Elite benefit is ready to activate, ${contractorName}.`,
          `
          ${p(`As an <strong style="color:${C.white};">Annual Elite Partner</strong>, you're entitled to our Professional Promotional Video Package — a $499 value included with your membership.`)}

          ${sectionLabel("What's Included")}
          ${infoCard(`
            ${checkList([
              'Professional video shoot at your job site or office',
              'Listing-quality footage and professional editing',
              'Marketing-ready 60–90 second promotional video',
              'Full usage rights for your website and social media',
              'Featured rotating placement on the ListWorx homepage',
            ])}
          `)}

          ${p(`This benefit is exclusive to <strong style="color:${C.white};">Annual Elite Partners</strong> only. Monthly Elite members do not receive this package.`)}

          ${cta('Schedule Your Video Shoot &rarr;', 'mailto:marketing@listworx.com?subject=Schedule My Elite Video Package')}

          ${divider()}
          ${small('Our production team will reach out within 2 business days to coordinate timing and location.')}
          `,
          'Your Annual Elite video package benefit is ready to schedule.'
        );
        text = `Your Elite Video Package\n\nHi ${contractorName},\n\nAs an Annual Elite Partner, you're entitled to our Professional Promotional Video Package (a $499 value).\n\nIncludes: professional video shoot, editing, 60-90 second promo, full usage rights, and featured homepage placement.\n\nThis benefit is exclusive to Annual Elite members.\n\nEmail marketing@listworx.com to schedule.\n\n— The ListWorx Marketing Team`;
        break;

      /* ── ADDON PURCHASE CONFIRMATION ─────────────────── */
      case 'addon_purchase_confirmation':
        subject = `Add-On Activated — ${request.addonName}`;
        html = layout(
          'Add-On Activated',
          `${request.addonName} is now active on your account.`,
          `
          ${p(`Your purchase of <strong style="color:${C.white};">${request.addonName}</strong> has been confirmed and is now active.`)}

          ${sectionLabel('What This Add-On Provides')}
          ${infoCard(p(request.addonDescription || '', C.gray200))}

          ${request.limitations ? `
            ${sectionLabel('Important Limitations')}
            ${warningCard(p(request.limitations, C.gray100))}
          ` : ''}

          ${cta('Manage Your Add-Ons &rarr;', `${BASE_URL}/billing`)}

          ${divider()}
          ${small(`Questions? Contact <a href="mailto:support@listworx.com" style="color:${C.rust};text-decoration:none;">support@listworx.com</a>`)}
          `,
          `${request.addonName} is now active on your account.`
        );
        text = `Add-On Activated: ${request.addonName}\n\nHi ${contractorName},\n\nYour ${request.addonName} add-on is now active.\n\n${request.addonDescription}\n\n${request.limitations ? `Limitations: ${request.limitations}\n\n` : ''}Manage add-ons at ${BASE_URL}/billing\n\n— The ListWorx Team`;
        break;

      /* ── ADMIN NEW APPLICATION ────────────────────────── */
      case 'admin_new_application':
        subject = `New Contractor Application: ${companyName}`;
        html = layout(
          'New Application',
          `A new contractor has submitted an application for review.`,
          `
          ${dataTable([
            ['Company', companyName || ''],
            ['Contact', contractorName],
            ['Email', `<a href="mailto:${request.email}" style="color:${C.rust};text-decoration:none;">${request.email}</a>`],
            ['Phone', `<a href="tel:${request.phone}" style="color:${C.rust};text-decoration:none;">${request.phone}</a>`],
            ['Service Area', request.serviceArea || 'Not specified'],
          ])}

          ${cta('Review Application &rarr;', `${BASE_URL}/admin${request.applicationId ? `?application=${request.applicationId}` : ''}`)}
          ${linkFallback(`${BASE_URL}/admin${request.applicationId ? `?application=${request.applicationId}` : ''}`)}
          `,
          `New application received from ${companyName} — review required.`,
          false
        );
        text = `New Contractor Application: ${companyName}\n\nContact: ${contractorName}\nEmail: ${request.email}\nPhone: ${request.phone}\nService Area: ${request.serviceArea || 'Not specified'}\n\nReview Application:\n${BASE_URL}/admin${request.applicationId ? `?application=${request.applicationId}` : ''}\n\n— The ListWorx Team`;
        break;

      /* ── INVOICE ──────────────────────────────────────── */
      case 'invoice':
        subject = `Invoice ${request.invoiceNumber} — Payment Received`;
        html = layout(
          'Payment Confirmed',
          `Thank you, ${contractorName}. Your payment has been processed.`,
          `
          ${dataTable([
            ['Invoice Number', request.invoiceNumber || ''],
            ['Amount Paid', `$${request.amount}`],
            ['Payment Date', request.paidAt || ''],
            ['Company', companyName || ''],
          ])}

          ${request.invoicePdfUrl ? cta('Download Invoice PDF &rarr;', request.invoicePdfUrl) : ''}
          ${cta('View All Invoices &rarr;', `${BASE_URL}/billing`)}

          ${divider()}
          ${small('Thank you for being a valued ListWorx partner!')}
          `,
          `Payment confirmed — Invoice ${request.invoiceNumber} has been processed.`
        );
        text = `Payment Received\n\nHi ${contractorName},\n\nYour payment has been successfully processed.\n\nInvoice: ${request.invoiceNumber}\nAmount: $${request.amount}\nDate: ${request.paidAt}\nCompany: ${companyName}\n\n${request.invoicePdfUrl ? `Download PDF: ${request.invoicePdfUrl}\n` : ''}View invoices: ${BASE_URL}/billing\n\n— The ListWorx Team`;
        break;

      /* ── REFERRAL NOTIFICATION ────────────────────────── */
      case 'referral_notification': {
        const category = request.jobCategory || 'General Services';
        const county = request.jobCounty || 'Your Service Area';
        const state = request.jobState || '';
        const locationStr = state ? `${county} County, ${state}` : `${county} County`;
        const requesterType = request.requesterType || 'Homeowner';
        subject = `You've Been Referred — ${category} in ${county} County`;
        html = layout(
          "You've Been Referred",
          `ListWorx has referred ${companyName} for a new service request in your area.`,
          `
          ${p(`Your contact information has been shared with a ${requesterType.toLowerCase()} in <strong style="color:${C.white};">${locationStr}</strong>. They may reach out to you directly.`)}

          ${dataTable([
            ['Service Category', category],
            ['Location', locationStr],
            ['Requester Type', requesterType],
            ...(request.jobDescription ? [['Project Summary', request.jobDescription] as [string, string]] : []),
          ])}

          ${infoCard(`
            ${p(`<strong style="color:${C.white};">What to expect:</strong> The ${requesterType.toLowerCase()} has received your business name, phone number, email, and website. They choose who to contact — you do not need to reach out to them. Simply be ready and responsive when they do.`, C.gray200)}
          `)}

          ${sectionLabel('How to Be Ready')}
          ${checkList([
            'Stay available — be responsive when the client reaches out to you',
            'Be professional — your conduct directly reflects your IronClad standing',
            'Keep your profile current — accurate contact info ensures you get the right referrals',
            'Deliver quality work — satisfied clients lead to strong reviews and more referrals',
          ])}

          ${cta('View Your Dashboard &rarr;', `${BASE_URL}/contractor-dashboard`)}

          ${divider()}
          ${small(`Questions? Contact Alexander Deyo, Founder &mdash; <a href="mailto:adeyo@listworx.co" style="color:${C.rust};text-decoration:none;">adeyo@listworx.co</a> &nbsp;|&nbsp; 615-362-4996`)}
          `,
          `You've been referred for ${category} in ${county} County — be ready if the client reaches out.`
        );
        text = `You've Been Referred — ${category} in ${county} County\n\nHi ${contractorName},\n\nListWorx has referred ${companyName} for a service request in ${locationStr}.\n\nService: ${category}\nRequester: ${requesterType}\n${request.jobDescription ? `Project: ${request.jobDescription}\n` : ''}\nThe client has your contact information and will reach out if interested. Be ready and responsive.\n\nDashboard: ${BASE_URL}/contractor-dashboard\n\nContact: adeyo@listworx.co | 615-362-4996\n\n— The ListWorx Team`;
        break;
      }

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const result = await sendEmail(to, subject, html, text);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
