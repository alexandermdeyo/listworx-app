import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  type: 'job_submission' | 'contractor_match' | 'quality_assurance' | 'admin_new_job_request';
  to: string;
  realtorName: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyAddress?: string;
  services?: string[];
  contractors?: Array<{
    name: string;
    company: string;
    phone: string;
    email: string;
    website?: string;
    bio?: string;
    logoUrl?: string | null;
    profileUrl?: string;
    specialties: string[];
  }>;
  contractorName?: string;
  companyName?: string;
  jobRequestId?: string;
  matchedContractors?: number;
  feedbackToken?: string;
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

/* CONTRACTOR CARD — for requestor-facing emails */
function contractorCard(c: {
  name: string; company: string; phone: string; email: string;
  website?: string; bio?: string; logoUrl?: string | null;
  profileUrl?: string; specialties: string[];
}, index: number, total: number): string {
  const initials = c.company.charAt(0).toUpperCase();

  const logoBlock = c.logoUrl
    ? `<img src="${c.logoUrl}" alt="${c.company}" width="52" height="52" style="display:block;width:52px;height:52px;border-radius:8px;object-fit:contain;border:1px solid ${C.border};" />`
    : `<div style="width:52px;height:52px;border-radius:8px;background-color:${C.rust}18;border:2px solid ${C.rust}40;text-align:center;line-height:52px;font-family:${C.font};font-size:22px;font-weight:800;color:${C.rust};">${initials}</div>`;

  const specialtyTags = c.specialties.slice(0, 4).map(s =>
    `<span style="display:inline-block;background-color:${C.cardAlt};border:1px solid ${C.border};color:${C.gray200};font-family:${C.font};font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;margin:2px 4px 2px 0;">${s}</span>`
  ).join('');

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border:1px solid ${C.border};border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
    <!-- Card header -->
    <tr>
      <td style="background-color:${C.cardAlt};padding:18px 22px;border-bottom:1px solid ${C.border};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;width:68px;">${logoBlock}</td>
            <td style="vertical-align:middle;padding-left:16px;">
              <p style="font-family:${C.font};font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:${C.rust};margin:0 0 4px;padding:0;">Referral ${index + 1} of ${total}</p>
              <p style="font-family:${C.font};font-size:20px;font-weight:800;color:${C.heading};margin:0 0 2px;padding:0;line-height:1.2;">${c.company}</p>
              <p style="font-family:${C.font};font-size:13px;color:${C.gray400};margin:0;padding:0;">${c.name}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Card body -->
    <tr>
      <td style="background-color:${C.surface};padding:18px 22px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${c.phone ? `<tr><td style="padding:5px 0;width:80px;vertical-align:top;"><span style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${C.gray400};">Phone</span></td><td style="padding:5px 0;"><a href="tel:${c.phone}" style="font-family:${C.font};font-size:14px;color:${C.rust};text-decoration:none;font-weight:600;">${c.phone}</a></td></tr>` : ''}
          ${c.email ? `<tr><td style="padding:5px 0;width:80px;vertical-align:top;"><span style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${C.gray400};">Email</span></td><td style="padding:5px 0;"><a href="mailto:${c.email}" style="font-family:${C.font};font-size:14px;color:${C.rust};text-decoration:none;font-weight:600;">${c.email}</a></td></tr>` : ''}
          ${c.website ? `<tr><td style="padding:5px 0;width:80px;vertical-align:top;"><span style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${C.gray400};">Website</span></td><td style="padding:5px 0;"><a href="${c.website}" target="_blank" style="font-family:${C.font};font-size:14px;color:${C.rust};text-decoration:none;font-weight:600;">${c.website.replace(/^https?:\/\//, '')}</a></td></tr>` : ''}
          ${c.profileUrl ? `<tr><td style="padding:5px 0;width:80px;vertical-align:top;"><span style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${C.gray400};">Profile</span></td><td style="padding:5px 0;"><a href="${c.profileUrl}" target="_blank" style="font-family:${C.font};font-size:14px;color:${C.rust};text-decoration:none;font-weight:600;">View on ListWorx &rarr;</a></td></tr>` : ''}
        </table>
        ${c.bio ? `<p style="font-family:${C.font};font-size:13px;color:${C.gray400};line-height:1.65;margin:12px 0 0;padding-top:12px;border-top:1px solid ${C.borderSoft};">${c.bio}</p>` : ''}
        ${c.specialties.length > 0 ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid ${C.borderSoft};"><p style="font-family:${C.font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.gray400};margin:0 0 7px;">Specialties</p>${specialtyTags}</div>` : ''}
      </td>
    </tr>
  </table>`;
}

function layout(headline: string, subline: string, body: string, preheader = '', isRequestor = true): string {
  const BASE_URL = Deno.env.get('APP_BASE_URL') || Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'https://listworx.co';
  const footerLinks = isRequestor
    ? `<a href="${BASE_URL}/requestor-dashboard" style="color:${C.rust};text-decoration:none;font-weight:600;">My Requests</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/contractors" style="color:${C.gray400};text-decoration:none;">Find Contractors</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/ironclad" style="color:${C.gray400};text-decoration:none;">IronClad Standards</a>`
    : `<a href="${BASE_URL}/admin/crm/job-requests" style="color:${C.rust};text-decoration:none;font-weight:600;">Admin Dashboard</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/admin/crm/contractors" style="color:${C.gray400};text-decoration:none;">Contractors</a>`;

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
<p style="font-family:${C.font};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:${C.rust};margin:0 0 12px;padding:0;">ListWorx — Curated Contractor Referrals</p>
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
    const { type, to, realtorName } = request;
    const BASE_URL = Deno.env.get('APP_BASE_URL') || Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'https://listworx.co';

    let subject = '';
    let html = '';
    let text = '';

    switch (type) {

      case 'job_submission':
        subject = 'Your ListWorx Referrals Are Ready';
        html = layout(
          'Your Referrals Are Ready',
          `Hi ${realtorName} — ListWorx has matched your request with IronClad-certified contractors.`,
          `${p(`Your service request for <strong style="color:${C.heading};">${request.propertyAddress}</strong> has been received and your matched contractor referrals are below.`)}
          ${dataTable([['Submitted By', request.clientName || realtorName],['Property', request.propertyAddress || ''],...(request.services && request.services.length > 0 ? [['Services', request.services.join(', ')] as [string, string]] : [])])}
          ${sectionLabel('How It Works')}
          ${checkList(['<strong style="color:#1A1A1A;">You Review</strong> — Look over the matched contractors and their contact details','<strong style="color:#1A1A1A;">You Reach Out</strong> — Contact whichever contractor you prefer directly, at any time','<strong style="color:#1A1A1A;">Contractors Are Ready</strong> — Each has been notified of the referral and is expecting to hear from you','<strong style="color:#1A1A1A;">You Decide</strong> — No commitments, no pressure. Choose the best fit for your needs'])}
          ${sectionLabel('IronClad Standards')}
          ${p('Every contractor referred through ListWorx maintains verified licensing and insurance and is held to ongoing IronClad compliance standards.')}
          ${divider()}
          ${small(`Questions? <a href="mailto:support@listworx.co" style="color:${C.rust};text-decoration:none;">support@listworx.co</a>`)}`,
          'Your ListWorx contractor referrals are ready — review and contact whoever you prefer.'
        );
        text = `Your Contractor Referrals Are Ready\n\nHi ${realtorName},\n\nYour service request for ${request.propertyAddress} has been received.\n\nServices: ${request.services?.join(', ') || 'N/A'}\n\nReview the contractors and reach out to whoever you prefer. Each has been notified and is expecting to hear from you.\n\nQuestions? support@listworx.co\n\n— The ListWorx Team`;
        break;

      case 'contractor_match': {
        const count = request.contractors?.length || 0;
        subject = `Your ListWorx Referrals — ${count} IronClad Contractor${count !== 1 ? 's' : ''} Selected`;
        html = layout(
          'Your Contractor Referrals',
          `ListWorx has selected ${count} IronClad-certified contractor${count !== 1 ? 's' : ''} for your request.`,
          `${p(`Here are your matched referrals for <strong style="color:${C.heading};">${request.propertyAddress}</strong>. Review the options below and contact whoever you prefer — it's entirely your choice.`)}
          ${p(`Each contractor has been notified of this referral and is expecting to hear from you. They will not reach out to you unsolicited.`, C.gray400)}
          ${sectionLabel(`Your ${count} Matched Referral${count !== 1 ? 's' : ''}`)}
          ${request.contractors?.map((c, i) => contractorCard(c, i, count)).join('') || infoCard(`${p('No contractors were matched for this request. Our team has been notified and will follow up with you directly.', C.gray200)}`)}
          ${sectionLabel('Next Steps')}
          ${checkList(['Review the contractors above and their contact information','Reach out to whichever contractor you prefer — you are in control','Contractors have been notified and are expecting your call or email','No commitments — choose the best fit at your own pace'])}
          ${divider()}
          ${small(`All contractors are IronClad Standards&trade; certified. ListWorx curates this referral but is not a party to any service agreements. Questions? <a href="mailto:support@listworx.co" style="color:${C.rust};text-decoration:none;">support@listworx.co</a>`)}`,
          `Your ${count} referral${count !== 1 ? 's are' : ' is'} ready — review and contact whoever you prefer.`
        );
        text = `Your Contractor Referrals\n\nHi ${realtorName},\n\nListWorx has selected ${count} contractor${count !== 1 ? 's' : ''} for your request at ${request.propertyAddress}.\n\n${request.contractors?.map((c, i) => `Referral ${i + 1} of ${count}\n${c.company}\nContact: ${c.name}\nPhone: ${c.phone}\nEmail: ${c.email}\n${c.website ? `Website: ${c.website}\n` : ''}Specialties: ${c.specialties.join(', ')}`).join('\n\n') || 'No contractors matched.'}\n\nAll contractors are IronClad Standards certified.\n\n— The ListWorx Team`;
        break;
      }

      case 'quality_assurance':
        subject = 'How Did Your Service Go?';
        html = layout(
          'How Was Your Experience?',
          `Hi ${realtorName} — we'd love your feedback on the recent work at ${request.propertyAddress}.`,
          `${p(`We hope the work at <strong style="color:${C.heading};">${request.propertyAddress}</strong> with <strong style="color:${C.heading};">${request.companyName}</strong> went smoothly. Your feedback directly impacts the quality of our network.`)}
          ${p('It takes under 2 minutes and determines whether this contractor stays in the ListWorx network.')}
          ${cta('Leave Your Feedback &rarr;', `${BASE_URL}/feedback/${request.feedbackToken}`)}
          ${linkFallback(`${BASE_URL}/feedback/${request.feedbackToken}`)}
          ${sectionLabel('Why Your Feedback Matters')}
          ${checkList(['Ensures contractors maintain IronClad Standards','Improves future matching for you and your clients','Identifies top-performing contractors in the network','Allows us to address issues quickly'])}
          ${sectionLabel('Did Something Go Wrong?')}
          ${warningCard(`${p('If you experienced unprofessional conduct, missed appointments, surprise pricing, or any IronClad Standards violation — please let us know immediately.', C.gray100)}${small(`<a href="mailto:support@listworx.co" style="color:${C.rust};text-decoration:none;font-weight:600;">Report an issue directly &rarr;</a>`)}`)}`,
          `Quick feedback on your recent service — takes under 2 minutes.`
        );
        text = `How Was Your Experience?\n\nHi ${realtorName},\n\nWe hope the work at ${request.propertyAddress} with ${request.companyName} went well.\n\nLeave feedback (under 2 min):\n${BASE_URL}/feedback/${request.feedbackToken}\n\nIf something went wrong, contact support@listworx.co immediately.\n\n— The ListWorx Team`;
        break;

      case 'admin_new_job_request':
        subject = `New Job Request: ${request.propertyAddress}`;
        html = layout(
          'New Job Request',
          'A new service request has been submitted and contractor referrals have been sent.',
          `${dataTable([['Client', realtorName],['Email', `<a href="mailto:${request.clientEmail}" style="color:${C.rust};text-decoration:none;">${request.clientEmail}</a>`],['Phone', `<a href="tel:${request.clientPhone}" style="color:${C.rust};text-decoration:none;">${request.clientPhone}</a>`],['Property', request.propertyAddress || ''],...(request.services && request.services.length > 0 ? [['Services', request.services.join(', ')] as [string, string]] : []),['Matched Contractors', String(request.matchedContractors || 0)]])}
          ${cta('View in Admin Dashboard &rarr;', `${BASE_URL}/admin/crm/job-requests`)}
          ${p('The client has been notified and provided with their matched contractor referrals.', C.gray400)}`,
          `New job request at ${request.propertyAddress} — ${request.matchedContractors || 0} contractors matched.`,
          false
        );
        text = `New Job Request: ${request.propertyAddress}\n\nClient: ${realtorName}\nEmail: ${request.clientEmail}\nPhone: ${request.clientPhone}\nProperty: ${request.propertyAddress}\nServices: ${request.services?.join(', ') || 'N/A'}\nMatched Contractors: ${request.matchedContractors || 0}`;
        break;

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
