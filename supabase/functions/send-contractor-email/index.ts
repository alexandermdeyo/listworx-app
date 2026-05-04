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
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@listworx.co';
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
  const fromAddress = FROM_EMAIL.includes('@') ? `ListWorx <${FROM_EMAIL}>` : FROM_EMAIL;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromAddress, to: [to], subject, html, text }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Resend API error: ${JSON.stringify(data)}`);
  return { success: true, messageId: data.id };
}

/* DESIGN TOKENS — ListWorx Brand (White Background) */
const C = {
  rust:         '#E85000',
  rustDark:     '#C44000',
  outerBg:      '#F2F2F2',
  surface:      '#FFFFFF',
  card:         '#F7F7F7',
  cardAlt:      '#F2F2F2',
  border:       '#E2E2E2',
  borderSoft:   '#EBEBEB',
  white:        '#FFFFFF',
  heading:      '#1A1A1A',
  gray100:      '#2C2C2C',
  gray200:      '#444444',
  gray400:      '#777777',
  gray600:      '#AAAAAA',
  dark:         '#1A1A1A',
  danger:       '#D93025',
  dangerBg:     '#FFF4F4',
  dangerBorder: '#FACCCC',
  success:      '#1A7A35',
  successBg:    '#F0FAF2',
  successBorder:'#A8DFB8',
  font:         "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
};

function p(text: string, color = C.gray200): string {
  return `<p style="font-family:${C.font};font-size:15px;color:${color};line-height:1.75;margin:0 0 16px;padding:0;">${text}</p>`;
}
function small(text: string, color = C.gray400): string {
  return `<p style="font-family:${C.font};font-size:13px;color:${color};line-height:1.6;margin:0 0 10px;padding:0;">${text}</p>`;
}
function divider(margin = '28px 0'): string {
  return `<div style="border:0;border-top:1px solid ${C.border};margin:${margin};"></div>`;
}
function sectionLabel(text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 12px;"><tr><td><p style="font-family:${C.font};font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:${C.rust};margin:0 0 6px;padding:0;">${text}</p><div style="height:2px;background-color:${C.rust};width:28px;border-radius:1px;"></div></td></tr></table>`;
}
function infoCard(content: string, accent = C.rust): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;"><tr><td style="background-color:${C.cardAlt};border:1px solid ${C.border};border-left:4px solid ${accent};border-radius:8px;padding:20px 24px;">${content}</td></tr></table>`;
}
function warningCard(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;"><tr><td style="background-color:${C.dangerBg};border:1px solid ${C.dangerBorder};border-left:4px solid ${C.danger};border-radius:8px;padding:20px 24px;">${content}</td></tr></table>`;
}
function successCard(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;"><tr><td style="background-color:${C.successBg};border:1px solid ${C.successBorder};border-left:4px solid ${C.success};border-radius:8px;padding:20px 24px;">${content}</td></tr></table>`;
}
function dataTable(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.border};border-radius:8px;overflow:hidden;margin:16px 0;">${rows.map(([label, value], i) => `<tr><td style="padding:12px 18px;${i < rows.length - 1 ? `border-bottom:1px solid ${C.borderSoft};` : ''}background-color:${C.cardAlt};width:36%;vertical-align:top;"><span style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${C.gray400};">${label}</span></td><td style="padding:12px 18px;${i < rows.length - 1 ? `border-bottom:1px solid ${C.borderSoft};` : ''}background-color:${C.surface};vertical-align:top;"><span style="font-family:${C.font};font-size:14px;color:${C.gray100};line-height:1.5;">${value}</span></td></tr>`).join('')}</table>`;
}
function checkList(items: string[]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0;">${items.map(item => `<tr><td style="padding:5px 0;vertical-align:top;width:22px;"><span style="color:${C.rust};font-size:13px;font-weight:800;line-height:1.75;">&#10003;</span></td><td style="padding:5px 0 5px 6px;"><span style="font-family:${C.font};font-size:14px;color:${C.gray200};line-height:1.75;">${item}</span></td></tr>`).join('')}</table>`;
}
function cta(label: string, href: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;"><tr><td align="center"><a href="${href}" target="_blank" style="display:inline-block;background-color:${C.rust};color:${C.white};font-family:${C.font};font-size:15px;font-weight:700;letter-spacing:0.3px;text-decoration:none;padding:14px 34px;border-radius:7px;line-height:1.4;">${label}</a></td></tr></table>`;
}
function linkFallback(href: string): string {
  return `<p style="font-family:${C.font};font-size:12px;color:${C.gray400};margin:6px 0 0;word-break:break-all;">Or copy this link: <a href="${href}" style="color:${C.rust};text-decoration:underline;">${href}</a></p>`;
}

function layout(headline: string, subline: string, body: string, preheader = '', isContractor = true): string {
  const BASE_URL = Deno.env.get('APP_BASE_URL') || Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'https://listworx.co';
  const footerLinks = isContractor
    ? `<a href="${BASE_URL}/contractor-dashboard" style="color:${C.rust};text-decoration:none;font-weight:600;">Partner Dashboard</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/ironclad" style="color:${C.gray400};text-decoration:none;">IronClad Standards</a>`
    : `<a href="${BASE_URL}/request" style="color:${C.rust};text-decoration:none;font-weight:600;">Request a Contractor</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/ironclad" style="color:${C.gray400};text-decoration:none;">IronClad Standards</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>ListWorx</title>
<style>
@media only screen and (max-width:620px){
  .email-container{width:100%!important;}
  .content-pad{padding:24px 18px!important;}
  .header-pad{padding:24px 18px!important;}
  .footer-pad{padding:18px 18px!important;}
  h1.hero-title{font-size:22px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.outerBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${preheader ? `<div style="display:none;font-size:1px;color:${C.outerBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.outerBg}" style="background-color:${C.outerBg};">
<tr><td align="center" style="padding:32px 16px 48px;">
<table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">

<!-- LOGO HEADER BAR -->
<tr><td style="background-color:${C.dark};padding:20px 36px;" class="header-pad">
<img src="${BASE_URL}/LW_LOGO.png" alt="ListWorx" width="130" height="auto" style="display:block;border:0;height:auto;max-width:130px;" />
</td></tr>

<!-- ORANGE ACCENT BAR -->
<tr><td style="background-color:${C.rust};height:4px;font-size:4px;line-height:4px;">&nbsp;</td></tr>

<!-- HERO HEADER -->
<tr><td style="background-color:${C.surface};padding:36px 44px 28px;" class="header-pad">
<p style="font-family:${C.font};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:${C.rust};margin:0 0 12px;padding:0;">ListWorx IronClad Partner Network</p>
<h1 class="hero-title" style="font-family:${C.font};font-size:27px;font-weight:800;color:${C.heading};margin:0 0 12px;line-height:1.2;letter-spacing:-0.4px;">${headline}</h1>
<p style="font-family:${C.font};font-size:15px;color:${C.gray200};line-height:1.65;margin:0;padding:0;">${subline}</p>
</td></tr>

<!-- DIVIDER -->
<tr><td style="background-color:${C.surface};padding:0 44px;"><div style="border-top:1px solid ${C.border};"></div></td></tr>

<!-- BODY -->
<tr><td style="background-color:${C.surface};padding:32px 44px 40px;" class="content-pad">${body}</td></tr>

<!-- FOOTER LINKS -->
<tr><td style="background-color:${C.card};padding:22px 44px;border-top:1px solid ${C.border};" class="footer-pad">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td><p style="font-family:${C.font};font-size:13px;color:${C.gray200};margin:0 0 14px;">${footerLinks}</p></td></tr>
<tr><td style="border-top:1px solid ${C.border};padding-top:14px;">
<p style="font-family:${C.font};font-size:12px;color:${C.gray400};line-height:1.6;margin:0 0 3px;"><strong style="color:${C.gray200};">ListWorx LLC</strong> &mdash; Professional Contractor Referral Network</p>
<p style="font-family:${C.font};font-size:12px;color:${C.gray400};margin:0;">2147 Springdale Ln F104, Gallatin, TN 37066 &nbsp;&bull;&nbsp;<a href="tel:6153624996" style="color:${C.gray400};text-decoration:none;">615-362-4996</a></p>
</td></tr>
</table>
</td></tr>

<!-- IRONCLAD STANDARDS BADGE -->
<tr><td style="background-color:${C.dark};padding:18px 44px;text-align:center;" class="footer-pad">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center"><img src="${BASE_URL}/Ironclad_Standards_Logo.png" alt="Ironclad Standards" height="54" style="display:inline-block;height:54px;width:auto;border:0;" /></td></tr>
<tr><td align="center" style="padding-top:8px;"><p style="font-family:${C.font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#888888;margin:0;">IronClad Standards Certified Partner Network</p></td></tr>
</table>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

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

      case 'application_received':
        subject = 'Your ListWorx Application Has Been Received';
        html = layout(
          'Application Received',
          `Thank you for applying to join the ListWorx IronClad Partner Network, ${contractorName}.`,
          `${p(`We've received your application for <strong style="color:${C.heading};">${companyName}</strong>. Our team will review it and respond within <strong style="color:${C.heading};">2–3 business days</strong>.`)}
          ${sectionLabel('What We Review')}
          ${checkList(['State licensing status and documentation','Active general liability insurance','Business credentials and service history','Alignment with IronClad Standards'])}
          ${sectionLabel('IronClad Standards')}
          ${p('Every ListWorx partner must meet and maintain the IronClad Standards — a non-negotiable set of requirements covering licensing, insurance, communication, and professional conduct.')}
          ${divider()}
          ${small(`Questions? Reply to this email or reach us at <a href="mailto:support@listworx.co" style="color:${C.rust};text-decoration:none;">support@listworx.co</a>`)}`,
          "Your application is under review — we'll be in touch within 2–3 business days."
        );
        text = `Application Received\n\nHi ${contractorName},\n\nWe've received your application for ${companyName}. Our team will review it within 2–3 business days.\n\n— The ListWorx Team`;
        break;

      case 'application_approved':
        subject = "You're Approved — Sign In and Choose Your Plan";
        html = layout(
          'Application Approved',
          `Congratulations, ${contractorName} — ${companyName} has been approved.`,
          `${successCard(`${p(`<strong style="color:${C.heading};">You're in the network.</strong> Sign in to your dashboard, select your partnership tier, and complete checkout to activate your account and start receiving referrals.`, C.gray200)}${cta('Sign In to Your Dashboard &rarr;', `${BASE_URL}/contractor-portal?email=${encodeURIComponent(to)}&redirect=${encodeURIComponent('/contractor-dashboard')}`)}${linkFallback(`${BASE_URL}/contractor-portal?email=${encodeURIComponent(to)}&redirect=${encodeURIComponent('/contractor-dashboard')}`)}`)}
          ${sectionLabel('Once Active You Receive')}
          ${checkList(['Qualified referrals from realtors and homeowners in your service counties','IronClad Partner recognition and badge for your marketing','Listing in the ListWorx contractor directory','Full dashboard access to track referrals and performance'])}
          ${sectionLabel('Ongoing Requirements')}
          ${checkList(['Maintain valid licensing and insurance at all times','Respond to every referral within 24 hours','Uphold IronClad Standards throughout your membership'])}
          ${divider()}
          ${small(`Need help? Reply to this email or contact <a href="mailto:support@listworx.co" style="color:${C.rust};text-decoration:none;">support@listworx.co</a>`)}`,
          'Congratulations — your application has been approved. Sign in to get started.'
        );
        text = `You're Approved\n\nCongratulations, ${contractorName},\n\n${companyName} has been approved to join the ListWorx IronClad Partner Network.\n\nSign in: ${BASE_URL}/contractor-portal\n\n— The ListWorx Team`;
        break;

      case 'application_declined':
        subject = 'ListWorx Application Update';
        html = layout(
          'Application Update',
          `Hi ${contractorName}, thank you for your interest in joining the ListWorx network.`,
          `${p("After careful review, we're unable to approve your application at this time.")}
          ${request.reason ? `${sectionLabel('Reason for Decision')}${warningCard(p(request.reason, C.gray100))}` : ''}
          ${sectionLabel('What You Can Do')}
          ${checkList([`Contact us at <a href="mailto:support@listworx.co" style="color:${C.rust};text-decoration:none;">support@listworx.co</a> for clarification`,"Reapply once you've addressed the concerns noted above",'Request a formal review of your application'])}
          ${divider()}
          ${small('We appreciate your interest and wish you success. If circumstances change, we encourage you to reapply.')}`,
          'An update regarding your ListWorx contractor application.'
        );
        text = `Application Update\n\nHi ${contractorName},\n\nAfter careful review, we're unable to approve your application at this time.\n\n${request.reason ? `Reason: ${request.reason}\n\n` : ''}Contact support@listworx.co for clarification.\n\n— The ListWorx Team`;
        break;

      case 'subscription_activated_welcome': {
        const tier = request.tierName || 'Partner';
        const tierBenefitsMap: Record<string, string[]> = {
          'Basic': ['Up to 5 qualified referrals per month in your service area','ListWorx Verified Partner badge on your profile','Listed in the contractor directory','Access to your contractor dashboard and lead tracking'],
          'Preferred': ['Up to 15 qualified referrals per month in your service area','IronClad Certified Partner badge on your profile','Priority placement in the contractor directory','Access to your contractor dashboard and lead tracking','Dedicated account support'],
          'Elite': ['Unlimited qualified referrals in your service area','Elite IronClad Certified Partner badge on your profile','Top placement in the contractor directory','Access to your contractor dashboard and lead tracking','Dedicated account manager','Professional promotional video package (annual plan)','Featured contractor spotlight opportunities'],
        };
        const tierKey = Object.keys(tierBenefitsMap).find(k => tier.toLowerCase().includes(k.toLowerCase())) || 'Basic';
        const activatedBenefits = tierBenefitsMap[tierKey];
        subject = `Welcome to ListWorx — Your ${tier} Account Is Now Active`;
        html = layout(
          `Welcome to the Network`,
          `Your ${tier} membership is active, ${contractorName}. You can start receiving referrals today.`,
          `${successCard(`${p(`<strong style="color:${C.heading};">Your account is live.</strong> ${companyName} is now a verified IronClad Partner and eligible to receive qualified referrals in your service area.`, C.gray200)}`)}
          ${sectionLabel(`Your ${tier} Benefits`)}${checkList(activatedBenefits)}
          ${cta('Go to Your Dashboard &rarr;', `${BASE_URL}/contractor-dashboard`)}
          ${sectionLabel('Getting Your First Referrals')}
          ${checkList(['Make sure your service counties and trade specialties are fully filled in','Upload your compliance documents so your profile shows as verified','Keep your contact information current'])}
          ${divider()}
          ${small(`Questions? Contact Alexander Deyo, Founder &mdash; <a href="mailto:adeyo@listworx.co" style="color:${C.rust};text-decoration:none;">adeyo@listworx.co</a> &nbsp;|&nbsp; 615-362-4996`)}`,
          `Your ${tier} account is active — start receiving referrals today.`
        );
        text = `Welcome to ListWorx — Your ${tier} Account Is Now Active\n\nWelcome, ${contractorName},\n\nYour ${tier} membership for ${companyName} is now fully active.\n\nBenefits:\n${activatedBenefits.map(b => `- ${b}`).join('\n')}\n\nDashboard: ${BASE_URL}/contractor-dashboard\n\n— The ListWorx Team`;
        break;
      }

      case 'subscription_confirmation': {
        const tierName = request.tierName || 'Partner';
        const benefits = request.benefits || [];
        subject = `Welcome to ListWorx — ${tierName} Membership Activated`;
        html = layout(
          'Membership Activated',
          `Welcome to the network, ${contractorName}. Your membership is now live.`,
          `${dataTable([['Tier', tierName],['Billing Cycle', request.isAnnual ? 'Annual' : 'Monthly'],['Status', `<span style="color:${C.success};font-weight:700;">Active</span>`]])}
          ${benefits.length > 0 ? `${sectionLabel("What's Included")}${checkList(benefits)}` : ''}
          ${cta('Go to Your Dashboard &rarr;', `${BASE_URL}/contractor-dashboard`)}
          ${sectionLabel('IronClad Standards Reminder')}
          ${checkList(['Maintain valid licensing and insurance at all times','Respond to every referral within 24 hours','Provide written estimates for work over $500','Professional communication and clean job sites'])}
          ${small(`Non-compliance may result in suspension or removal from the network.`, C.gray400)}`,
          `Your ${tierName} membership is active — start receiving referrals today.`
        );
        text = `Membership Activated\n\nWelcome, ${contractorName},\n\nYour ${tierName} membership (${request.isAnnual ? 'Annual' : 'Monthly'}) is now active.\n\nDashboard: ${BASE_URL}/contractor-dashboard\n\n— The ListWorx Team`;
        break;
      }

      case 'payment_failed':
        subject = 'Action Required — Membership Payment Issue';
        html = layout(
          'Payment Issue',
          `Hi ${contractorName}, we need you to update your billing information.`,
          `${p('We were unable to process your ListWorx membership payment. Please update your payment method to avoid interruption to your referral access.')}
          ${dataTable([['Amount Due', request.amountDue || ''],['Next Retry', request.retryDate || ''],['Grace Period', '7 days']])}
          ${warningCard(`${p(`<strong style="color:${C.heading};">Your account is in a grace period.</strong> You will continue receiving referrals for 7 days. If payment is not resolved, your membership will be suspended and referrals will stop.`, C.gray100)}`)}
          ${cta('Update Payment Method &rarr;', `${BASE_URL}/billing`)}
          ${linkFallback(`${BASE_URL}/billing`)}
          ${divider()}
          ${small(`Believe this is an error? Contact <a href="mailto:billing@listworx.co" style="color:${C.rust};text-decoration:none;">billing@listworx.co</a> immediately.`)}`,
          'Your payment failed — update your billing info to keep receiving referrals.'
        );
        text = `Payment Issue — Action Required\n\nHi ${contractorName},\n\nWe were unable to process your membership payment.\n\nAmount Due: ${request.amountDue}\nNext Retry: ${request.retryDate}\n\nUpdate payment method: ${BASE_URL}/billing\n\n— The ListWorx Team`;
        break;

      case 'subscription_suspended':
        subject = 'ListWorx Membership Paused';
        html = layout(
          'Membership Paused',
          `Hi ${contractorName}, your ListWorx membership has been paused.`,
          `${p('While paused, you will not receive new referrals and your profile is hidden from the directory.')}
          ${request.reason ? `${sectionLabel('Reason for Pause')}${warningCard(p(request.reason, C.gray100))}` : ''}
          ${sectionLabel('What This Means')}
          ${checkList(['No new referrals will be sent to you','Your profile is hidden from the contractor directory','Your IronClad Partner badge is inactive'])}
          ${sectionLabel('How to Reactivate')}
          ${checkList(['Address the reason for pause noted above',`Contact us at <a href="mailto:support@listworx.co" style="color:${C.rust};text-decoration:none;">support@listworx.co</a>`,'Update your payment method if applicable'])}
          ${cta('Reactivate Membership &rarr;', `${BASE_URL}/billing`)}
          ${divider()}
          ${small('We hope to have you back in the network soon.')}`,
          'Your ListWorx membership has been paused.'
        );
        text = `Membership Paused\n\nHi ${contractorName},\n\nYour ListWorx membership has been paused.\n\n${request.reason ? `Reason: ${request.reason}\n\n` : ''}To reactivate: ${BASE_URL}/billing\n\n— The ListWorx Team`;
        break;

      case 'elite_video_package':
        subject = "Your Elite Video Package — Schedule Your Shoot";
        html = layout(
          'Elite Video Package',
          `Your Annual Elite benefit is ready to activate, ${contractorName}.`,
          `${p(`As an <strong style="color:${C.heading};">Annual Elite Partner</strong>, you're entitled to our Professional Promotional Video Package — a $499 value included with your membership.`)}
          ${sectionLabel("What's Included")}
          ${infoCard(checkList(['Professional video shoot at your job site or office','Listing-quality footage and professional editing','Marketing-ready 60–90 second promotional video','Full usage rights for your website and social media','Featured rotating placement on the ListWorx homepage']))}
          ${p(`This benefit is exclusive to <strong style="color:${C.heading};">Annual Elite Partners</strong> only. Monthly Elite members do not receive this package.`)}
          ${cta('Schedule Your Video Shoot &rarr;', 'mailto:marketing@listworx.co?subject=Schedule My Elite Video Package')}
          ${divider()}
          ${small('Our production team will reach out within 2 business days to coordinate timing and location.')}`,
          'Your Annual Elite video package benefit is ready to schedule.'
        );
        text = `Your Elite Video Package\n\nHi ${contractorName},\n\nAs an Annual Elite Partner, you're entitled to our Professional Promotional Video Package ($499 value).\n\nEmail marketing@listworx.co to schedule.\n\n— The ListWorx Marketing Team`;
        break;

      case 'addon_purchase_confirmation':
        subject = `Add-On Activated — ${request.addonName}`;
        html = layout(
          'Add-On Activated',
          `${request.addonName} is now active on your account.`,
          `${p(`Your purchase of <strong style="color:${C.heading};">${request.addonName}</strong> has been confirmed and is now active.`)}
          ${sectionLabel('What This Add-On Provides')}
          ${infoCard(p(request.addonDescription || '', C.gray200))}
          ${request.limitations ? `${sectionLabel('Important Limitations')}${warningCard(p(request.limitations, C.gray100))}` : ''}
          ${cta('Manage Your Add-Ons &rarr;', `${BASE_URL}/billing`)}
          ${divider()}
          ${small(`Questions? Contact <a href="mailto:support@listworx.co" style="color:${C.rust};text-decoration:none;">support@listworx.co</a>`)}`,
          `${request.addonName} is now active on your account.`
        );
        text = `Add-On Activated: ${request.addonName}\n\nHi ${contractorName},\n\nYour ${request.addonName} add-on is now active.\n\n${request.addonDescription}\n\nManage add-ons: ${BASE_URL}/billing\n\n— The ListWorx Team`;
        break;

      case 'admin_new_application':
        subject = `New Contractor Application: ${companyName}`;
        html = layout(
          'New Application',
          `A new contractor has submitted an application for review.`,
          `${dataTable([['Company', companyName || ''],['Contact', contractorName],['Email', `<a href="mailto:${request.email}" style="color:${C.rust};text-decoration:none;">${request.email}</a>`],['Phone', `<a href="tel:${request.phone}" style="color:${C.rust};text-decoration:none;">${request.phone}</a>`],['Service Area', request.serviceArea || 'Not specified']])}
          ${cta('Review Application &rarr;', `${BASE_URL}/admin${request.applicationId ? `/crm/applications` : ''}`)}
          ${linkFallback(`${BASE_URL}/admin/crm/applications`)}`,
          `New application received from ${companyName} — review required.`,
          false
        );
        text = `New Contractor Application: ${companyName}\n\nContact: ${contractorName}\nEmail: ${request.email}\nPhone: ${request.phone}\nService Area: ${request.serviceArea || 'Not specified'}\n\nReview: ${BASE_URL}/admin/crm/applications\n\n— The ListWorx Team`;
        break;

      case 'invoice':
        subject = `Invoice ${request.invoiceNumber} — Payment Received`;
        html = layout(
          'Payment Confirmed',
          `Thank you, ${contractorName}. Your payment has been processed.`,
          `${dataTable([['Invoice Number', request.invoiceNumber || ''],['Amount Paid', `$${request.amount}`],['Payment Date', request.paidAt || ''],['Company', companyName || '']])}
          ${request.invoicePdfUrl ? cta('Download Invoice PDF &rarr;', request.invoicePdfUrl) : ''}
          ${cta('View All Invoices &rarr;', `${BASE_URL}/billing`)}
          ${divider()}
          ${small('Thank you for being a valued ListWorx partner!')}`,
          `Payment confirmed — Invoice ${request.invoiceNumber} has been processed.`
        );
        text = `Payment Received\n\nHi ${contractorName},\n\nInvoice: ${request.invoiceNumber}\nAmount: $${request.amount}\nDate: ${request.paidAt}\n\n${request.invoicePdfUrl ? `Download PDF: ${request.invoicePdfUrl}\n` : ''}View invoices: ${BASE_URL}/billing\n\n— The ListWorx Team`;
        break;

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
          `${p(`Your contact information has been shared with a ${requesterType.toLowerCase()} in <strong style="color:${C.heading};">${locationStr}</strong>. They may reach out to you directly.`)}
          ${dataTable([['Service Category', category],['Location', locationStr],['Requester Type', requesterType],...(request.jobDescription ? [['Project Summary', request.jobDescription] as [string, string]] : [])])}
          ${infoCard(`${p(`<strong style="color:${C.heading};">What to expect:</strong> The ${requesterType.toLowerCase()} has received your business name, phone number, email, and website. They choose who to contact — you do not need to reach out to them. Simply be ready and responsive when they do.`, C.gray200)}`)}
          ${sectionLabel('How to Be Ready')}
          ${checkList(['Stay available — be responsive when the client reaches out to you','Be professional — your conduct directly reflects your IronClad standing','Keep your profile current — accurate contact info ensures you get the right referrals','Deliver quality work — satisfied clients lead to strong reviews and more referrals'])}
          ${cta('View Your Dashboard &rarr;', `${BASE_URL}/contractor-dashboard`)}
          ${divider()}
          ${small(`Questions? Contact Alexander Deyo, Founder &mdash; <a href="mailto:adeyo@listworx.co" style="color:${C.rust};text-decoration:none;">adeyo@listworx.co</a> &nbsp;|&nbsp; 615-362-4996`)}`,
          `You've been referred for ${category} in ${county} County — be ready if the client reaches out.`
        );
        text = `You've Been Referred — ${category} in ${county} County\n\nHi ${contractorName},\n\nListWorx has referred ${companyName} for a service request in ${locationStr}.\n\nService: ${category}\nRequester type: ${requesterType}\n\nThe client has your contact info and will reach out if interested. Be ready and responsive.\n\nDashboard: ${BASE_URL}/contractor-dashboard\n\n— The ListWorx Team`;
        break;
      }

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const result = await sendEmail(to, subject, html, text);
    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
