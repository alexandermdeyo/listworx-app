export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const C = {
  rust:       '#C65A1E',
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
  danger:     '#E53E3E',
  dangerBg:   '#2D1414',
  success:    '#22C55E',
  successBg:  '#142D1A',
  font:       "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
};

const BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://listworx.co';

/* ============================================================
   BASE COMPONENTS
   ============================================================ */

function p(text: string, color = C.gray200): string {
  return `<p style="font-family:${C.font};font-size:15px;color:${color};line-height:1.75;margin:0 0 16px;padding:0;">${text}</p>`;
}

function small(text: string, color = C.gray400): string {
  return `<p style="font-family:${C.font};font-size:13px;color:${color};line-height:1.6;margin:0 0 10px;padding:0;">${text}</p>`;
}

function divider(margin = '32px 0'): string {
  return `<div style="border:0;border-top:1px solid ${C.border};margin:${margin};"></div>`;
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
      <td style="background-color:${C.cardAlt};border:1px solid ${C.border};border-radius:10px;padding:24px 28px;">
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

function checkList(items: string[]): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0;">
    ${items.map(item => `
    <tr>
      <td style="padding:5px 0;vertical-align:top;width:22px;">
        <span style="color:${C.rust};font-size:13px;font-weight:700;line-height:1.7;">&#10003;</span>
      </td>
      <td style="padding:5px 0 5px 6px;">
        <span style="font-family:${C.font};font-size:14px;color:${C.gray200};line-height:1.7;">${item}</span>
      </td>
    </tr>`).join('')}
  </table>`;
}

function cta(label: string, href: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 10px;">
    <tr>
      <td align="center">
        <a href="${href}" target="_blank" style="display:inline-block;background-color:${C.rust};color:${C.white};font-family:${C.font};font-size:15px;font-weight:700;letter-spacing:0.3px;text-decoration:none;padding:15px 36px;border-radius:8px;line-height:1.4;">${label}</a>
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
  footerVariant: 'contractor' | 'requestor' | 'admin' = 'contractor'
): string {
  const footerLinks =
    footerVariant === 'contractor'
      ? `<a href="${BASE_URL}/contractor-dashboard" style="color:${C.rust};text-decoration:none;font-weight:600;">Partner Dashboard</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/apply" style="color:${C.gray400};text-decoration:none;">Join the Network</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/ironclad" style="color:${C.gray400};text-decoration:none;">IronClad Standards</a>`
      : footerVariant === 'requestor'
      ? `<a href="${BASE_URL}/request" style="color:${C.rust};text-decoration:none;font-weight:600;">Request a Contractor</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/requestor-dashboard" style="color:${C.gray400};text-decoration:none;">My Requests</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/ironclad" style="color:${C.gray400};text-decoration:none;">IronClad Standards</a>`
      : `<a href="${BASE_URL}/admin/crm/job-requests" style="color:${C.rust};text-decoration:none;font-weight:600;">Admin Dashboard</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="${BASE_URL}/admin/crm/contractors" style="color:${C.gray400};text-decoration:none;">Contractors</a>`;

  const eyebrowText =
    footerVariant === 'requestor'
      ? 'ListWorx — Curated Contractor Referrals'
      : 'ListWorx IronClad Partner Network';

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
              <p style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:${C.rust};margin:0 0 14px;padding:0;">${eyebrowText}</p>
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
                  <td style="padding-bottom:16px;">
                    <p style="font-family:${C.font};font-size:13px;color:${C.gray200};margin:0;">${footerLinks}</p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid ${C.border};padding-top:16px;">
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
   CONTRACTOR EMAIL TEMPLATES
   ============================================================ */

export const contractorEmails = {

  applicationReceived: (contractorName: string, companyName: string): EmailTemplate => ({
    subject: 'Your ListWorx Application Has Been Received',
    html: layout(
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
      "Your application is under review — we'll be in touch within 2–3 business days.",
      'contractor'
    ),
    text: `Application Received\n\nHi ${contractorName},\n\nWe've received your application for ${companyName}. Our team will review it within 2–3 business days.\n\nWe review: licensing, insurance, credentials, and IronClad Standards alignment.\n\nQuestions? Email support@listworx.com\n\n— The ListWorx Team`,
  }),

  applicationApproved: (contractorName: string, companyName: string): EmailTemplate => ({
    subject: "You're Approved — Sign In and Choose Your Plan",
    html: layout(
      'Application Approved',
      `Congratulations, ${contractorName} — ${companyName} has been approved.`,
      `
      ${successCard(`
        ${p(`<strong style="color:${C.white};">You're in the network.</strong> Sign in to your dashboard, select your partnership tier, and complete checkout to activate your account and start receiving referrals.`, C.gray200)}
        ${cta('Sign In &amp; Choose Your Plan &rarr;', `${BASE_URL}/login?redirect=/billing`)}
        ${linkFallback(`${BASE_URL}/login?redirect=/billing`)}
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
      'Congratulations — your application has been approved. Sign in to get started.',
      'contractor'
    ),
    text: `You're Approved\n\nCongratulations, ${contractorName},\n\n${companyName} has been approved to join the ListWorx IronClad Partner Network.\n\nSign in to your dashboard and choose your plan:\n${BASE_URL}/login?redirect=/billing\n\nOnce active you'll receive qualified referrals from realtors and homeowners in your area.\n\n— The ListWorx Team`,
  }),

  applicationDeclined: (contractorName: string, reason: string): EmailTemplate => ({
    subject: 'ListWorx Application Update',
    html: layout(
      'Application Update',
      `Hi ${contractorName}, thank you for your interest in joining the ListWorx network.`,
      `
      ${p("After careful review, we're unable to approve your application at this time.")}

      ${sectionLabel('Reason for Decision')}
      ${warningCard(p(reason, C.gray100))}

      ${sectionLabel('What You Can Do')}
      ${checkList([
        `Contact us at <a href="mailto:support@listworx.com" style="color:${C.rust};text-decoration:none;">support@listworx.com</a> for clarification`,
        "Reapply once you've addressed the concerns noted above",
        'Request a formal review of your application',
      ])}

      ${divider()}
      ${small('We appreciate your interest and wish you success. If circumstances change, we encourage you to reapply.')}
      `,
      'An update regarding your ListWorx contractor application.',
      'contractor'
    ),
    text: `Application Update\n\nHi ${contractorName},\n\nThank you for your interest in ListWorx. After careful review, we're unable to approve your application at this time.\n\nReason: ${reason}\n\nContact support@listworx.com for clarification or reapply when circumstances change.\n\n— The ListWorx Team`,
  }),

  subscriptionConfirmation: (contractorName: string, tierName: string, isAnnual: boolean, benefits: string[]): EmailTemplate => ({
    subject: `Welcome to ListWorx — ${tierName} Membership Activated`,
    html: layout(
      'Membership Activated',
      `Welcome to the network, ${contractorName}. Your membership is now live.`,
      `
      ${dataTable([
        ['Tier', tierName],
        ['Billing Cycle', isAnnual ? 'Annual' : 'Monthly'],
        ['Status', `<span style="color:${C.success};font-weight:700;">Active</span>`],
      ])}

      ${benefits.length > 0 ? `
        ${sectionLabel("What's Included")}
        ${checkList(benefits)}
      ` : ''}

      ${isAnnual && tierName.toLowerCase().includes('elite') ? `
        ${sectionLabel('Annual Elite Bonus')}
        ${infoCard(p(`As an Annual Elite member, you're eligible for our <strong style="color:${C.white};">Professional Promotional Video Package</strong> — a $499 value included with your membership. Our team will reach out to schedule your shoot.`, C.gray200))}
      ` : ''}

      ${cta('Go to Your Dashboard &rarr;', `${BASE_URL}/contractor-dashboard`)}

      ${sectionLabel('IronClad Standards Reminder')}
      ${checkList([
        'Maintain valid licensing and insurance at all times',
        'Respond to every referral within 24 hours',
        'Provide written estimates for work over $500',
        'Professional communication and clean job sites',
      ])}

      ${small('Non-compliance may result in suspension or removal from the network.', C.gray400)}
      `,
      `Your ${tierName} membership is active — start receiving referrals today.`,
      'contractor'
    ),
    text: `Membership Activated\n\nWelcome, ${contractorName},\n\nYour ${tierName} membership (${isAnnual ? 'Annual' : 'Monthly'}) is now active.\n\nBenefits: ${benefits.join(', ')}\n\n${isAnnual && tierName.toLowerCase().includes('elite') ? "As an Annual Elite member, you're eligible for a Professional Video Package. We'll be in touch to schedule.\n\n" : ''}Dashboard: ${BASE_URL}/contractor-dashboard\n\nMaintain IronClad Standards to keep your active status.\n\n— The ListWorx Team`,
  }),

  paymentFailed: (contractorName: string, amountDue: string, retryDate: string): EmailTemplate => ({
    subject: 'Action Required — Membership Payment Issue',
    html: layout(
      'Payment Issue',
      `Hi ${contractorName}, we need you to update your billing information.`,
      `
      ${p('We were unable to process your ListWorx membership payment. Please update your payment method to avoid interruption to your referral access.')}

      ${dataTable([
        ['Amount Due', amountDue],
        ['Next Retry', retryDate],
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
      'Your payment failed — update your billing info to keep receiving referrals.',
      'contractor'
    ),
    text: `Payment Issue — Action Required\n\nHi ${contractorName},\n\nWe were unable to process your ListWorx membership payment.\n\nAmount Due: ${amountDue}\nNext Retry: ${retryDate}\n\nYou have a 7-day grace period. Update your payment method:\n${BASE_URL}/billing\n\nIf unresolved, your account will be suspended and you'll stop receiving referrals.\n\nContact billing@listworx.com for assistance.\n\n— The ListWorx Team`,
  }),

  subscriptionPaused: (contractorName: string, reason: string): EmailTemplate => ({
    subject: 'ListWorx Membership Paused',
    html: layout(
      'Membership Paused',
      `Hi ${contractorName}, your ListWorx membership has been paused.`,
      `
      ${p('While paused, you will not receive new referrals and your profile is hidden from the directory.')}

      ${sectionLabel('Reason for Pause')}
      ${warningCard(p(reason, C.gray100))}

      ${sectionLabel('What This Means')}
      ${checkList([
        'No new referrals will be sent to you',
        'Your profile is hidden from the contractor directory',
        'Your IronClad Partner badge is inactive',
        'Dashboard access is limited to view-only',
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
      'Your ListWorx membership has been paused.',
      'contractor'
    ),
    text: `Membership Paused\n\nHi ${contractorName},\n\nYour ListWorx membership has been paused.\n\nReason: ${reason}\n\nYou will not receive referrals and your profile is hidden. To reactivate, contact support@listworx.com or visit ${BASE_URL}/billing.\n\n— The ListWorx Team`,
  }),

  eliteVideoPackage: (contractorName: string): EmailTemplate => ({
    subject: 'Your Elite Video Package — Schedule Your Shoot',
    html: layout(
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
      ${small('Our production team will reach out within 2 business days to coordinate timing and location. Any questions? Reply to this email.')}
      `,
      'Your Annual Elite video package benefit is ready to schedule.',
      'contractor'
    ),
    text: `Your Elite Video Package\n\nHi ${contractorName},\n\nAs an Annual Elite Partner, you're entitled to our Professional Promotional Video Package (a $499 value).\n\nIncludes: professional video shoot, editing, 60-90 second promo, full usage rights, and featured homepage placement.\n\nThis benefit is exclusive to Annual Elite members.\n\nEmail marketing@listworx.com to schedule.\n\n— The ListWorx Marketing Team`,
  }),

  subscriptionCancellation: (contractorName: string, companyName: string, tierName: string, endDate: string): EmailTemplate => ({
    subject: 'Your ListWorx Membership Has Been Cancelled',
    html: layout(
      'Membership Cancellation Confirmed',
      `Hi ${contractorName}, your cancellation has been confirmed.`,
      `
      ${p(`Your cancellation for the <strong style="color:${C.white};">${tierName}</strong> membership for <strong style="color:${C.white};">${companyName}</strong> has been processed.`)}

      ${dataTable([
        ['Access Through', endDate],
        ['Referrals', `Continue until ${endDate}`],
        ['After End Date', 'Account deactivated, no new referrals'],
      ])}

      ${sectionLabel('Changed Your Mind?')}
      ${p(`You can reactivate before <strong style="color:${C.white};">${endDate}</strong> with no interruption to your referral access.`)}
      ${cta('Reactivate Membership &rarr;', `${BASE_URL}/contractor-dashboard`)}

      ${divider()}
      ${small(`We're sorry to see you go. If there's anything we could have done better, we'd love to hear from you at <a href="mailto:adeyo@listworx.co" style="color:${C.rust};text-decoration:none;">adeyo@listworx.co</a>. Thank you for being a ListWorx partner.`)}
      `,
      `Your membership ends on ${endDate} — you can still reactivate before then.`,
      'contractor'
    ),
    text: `Membership Cancellation Confirmed\n\nHi ${contractorName},\n\nYour ${tierName} membership for ${companyName} has been cancelled.\n\nYour access continues through ${endDate}. After that, your account will be deactivated.\n\nReactivate any time before ${endDate}: ${BASE_URL}/contractor-dashboard\n\nThank you for being a ListWorx partner.\n\n— The ListWorx Team`,
  }),

  addonPurchaseConfirmation: (contractorName: string, addonName: string, addonDescription: string, limitations: string): EmailTemplate => ({
    subject: `Add-On Activated — ${addonName}`,
    html: layout(
      'Add-On Activated',
      `${addonName} is now active on your account.`,
      `
      ${p(`Your purchase of <strong style="color:${C.white};">${addonName}</strong> has been confirmed and is now active on your account.`)}

      ${sectionLabel('What This Add-On Provides')}
      ${infoCard(p(addonDescription, C.gray200))}

      ${limitations ? `
        ${sectionLabel('Important Limitations')}
        ${warningCard(p(limitations, C.gray100))}
      ` : ''}

      ${cta('Manage Your Add-Ons &rarr;', `${BASE_URL}/billing`)}

      ${divider()}
      ${small(`Questions about your add-on? Contact <a href="mailto:support@listworx.com" style="color:${C.rust};text-decoration:none;">support@listworx.com</a>`)}
      `,
      `${addonName} is now active on your account.`,
      'contractor'
    ),
    text: `Add-On Activated: ${addonName}\n\nHi ${contractorName},\n\nYour ${addonName} add-on is now active.\n\n${addonDescription}\n\n${limitations ? `Limitations: ${limitations}\n\n` : ''}Manage add-ons at ${BASE_URL}/billing\n\n— The ListWorx Team`,
  }),
};

/* ============================================================
   REALTOR / HOMEOWNER EMAIL TEMPLATES
   ============================================================ */

export const realtorEmails = {

  jobSubmissionConfirmation: (realtorName: string, clientName: string, propertyAddress: string, services: string[]): EmailTemplate => ({
    subject: 'Your ListWorx Referrals Are Ready',
    html: layout(
      'Your Referrals Are Ready',
      `Hi ${realtorName} — ListWorx has matched your request with IronClad-certified contractors.`,
      `
      ${p(`Your service request for <strong style="color:${C.white};">${propertyAddress}</strong> has been received and your matched contractor referrals are on the way.`)}

      ${dataTable([
        ['Submitted By', clientName],
        ['Property', propertyAddress],
        ['Services', services.join(', ')],
      ])}

      ${sectionLabel('How It Works')}
      ${checkList([
        '<strong style="color:#FFFFFF;">You Review</strong> — Look over the matched contractors and their contact details',
        '<strong style="color:#FFFFFF;">You Reach Out</strong> — Contact whichever contractor you prefer directly, at any time',
        '<strong style="color:#FFFFFF;">Contractors Are Ready</strong> — Each has been notified of the referral and is expecting to hear from you',
        '<strong style="color:#FFFFFF;">You Decide</strong> — No commitments, no pressure. Choose the best fit for your needs',
      ])}

      ${sectionLabel('IronClad Standards')}
      ${p('Every contractor referred through ListWorx maintains verified licensing and insurance and is held to ongoing IronClad compliance standards.')}

      ${divider()}
      ${small(`Questions? <a href="mailto:support@listworx.com" style="color:${C.rust};text-decoration:none;">support@listworx.com</a>`)}
      `,
      `Your request is in — we're matching you with up to 3 qualified contractors now.`,
      'requestor'
    ),
    text: `Your Contractor Referrals Are Ready\n\nHi ${realtorName},\n\nYour service request for ${clientName} at ${propertyAddress} has been received.\n\nServices: ${services.join(', ')}\n\nYour matched contractors will be sent shortly. Each has been notified of the referral and is expecting to hear from you.\n\nQuestions? Email support@listworx.com\n\n— The ListWorx Team`,
  }),

  contractorMatchSent: (
    realtorName: string,
    contractors: Array<{ name: string; company: string; phone: string; email: string; specialties: string[]; website?: string; bio?: string; logoUrl?: string | null; profileUrl?: string }>,
    propertyAddress: string
  ): EmailTemplate => {
    const count = contractors.length;

    const contractorCardHtml = (c: typeof contractors[0], index: number): string => {
      const initials = c.company.charAt(0).toUpperCase();
      const logoBlock = c.logoUrl
        ? `<img src="${c.logoUrl}" alt="${c.company}" width="52" height="52" style="display:block;width:52px;height:52px;border-radius:8px;object-fit:contain;border:1px solid ${C.border};" />`
        : `<div style="width:52px;height:52px;border-radius:8px;background-color:${C.rust}20;border:1px solid ${C.rust}40;text-align:center;line-height:52px;font-family:${C.font};font-size:22px;font-weight:800;color:${C.rust};">${initials}</div>`;

      const specialtyTags = c.specialties.slice(0, 4).map(s =>
        `<span style="display:inline-block;background-color:${C.cardAlt};border:1px solid ${C.border};color:${C.gray200};font-family:${C.font};font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;margin:2px 4px 2px 0;">${s}</span>`
      ).join('');

      return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;border:1px solid ${C.border};border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background-color:${C.cardAlt};padding:20px 24px;border-bottom:1px solid ${C.border};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;width:68px;">${logoBlock}</td>
                <td style="vertical-align:middle;padding-left:16px;">
                  <p style="font-family:${C.font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:${C.rust};margin:0 0 5px;padding:0;">Referral ${index + 1} of ${count}</p>
                  <p style="font-family:${C.font};font-size:20px;font-weight:800;color:${C.white};margin:0 0 2px;padding:0;line-height:1.2;">${c.company}</p>
                  <p style="font-family:${C.font};font-size:13px;color:${C.gray400};margin:0;padding:0;">${c.name}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:${C.card};padding:20px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${c.phone ? `<tr>
                <td style="padding:5px 0;width:80px;vertical-align:top;"><span style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${C.gray400};">Phone</span></td>
                <td style="padding:5px 0;"><a href="tel:${c.phone}" style="font-family:${C.font};font-size:14px;color:${C.rust};text-decoration:none;font-weight:600;">${c.phone}</a></td>
              </tr>` : ''}
              ${c.email ? `<tr>
                <td style="padding:5px 0;width:80px;vertical-align:top;"><span style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${C.gray400};">Email</span></td>
                <td style="padding:5px 0;"><a href="mailto:${c.email}" style="font-family:${C.font};font-size:14px;color:${C.rust};text-decoration:none;font-weight:600;">${c.email}</a></td>
              </tr>` : ''}
              ${c.website ? `<tr>
                <td style="padding:5px 0;width:80px;vertical-align:top;"><span style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${C.gray400};">Website</span></td>
                <td style="padding:5px 0;"><a href="${c.website}" target="_blank" style="font-family:${C.font};font-size:14px;color:${C.rust};text-decoration:none;font-weight:600;">${c.website.replace(/^https?:\/\//, '')}</a></td>
              </tr>` : ''}
              ${c.profileUrl ? `<tr>
                <td style="padding:5px 0;width:80px;vertical-align:top;"><span style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${C.gray400};">Profile</span></td>
                <td style="padding:5px 0;"><a href="${c.profileUrl}" target="_blank" style="font-family:${C.font};font-size:14px;color:${C.rust};text-decoration:none;font-weight:600;">View on ListWorx &rarr;</a></td>
              </tr>` : ''}
            </table>
            ${c.specialties.length > 0 ? `
            <div style="margin-top:14px;padding-top:14px;border-top:1px solid ${C.border};">
              <p style="font-family:${C.font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.gray400};margin:0 0 8px;">Specialties</p>
              ${specialtyTags}
            </div>` : ''}
          </td>
        </tr>
      </table>`;
    };

    return {
      subject: `Your ListWorx Referrals — ${count} IronClad Contractor${count !== 1 ? 's' : ''} Selected`,
      html: layout(
        'Your Contractor Referrals',
        `ListWorx has selected ${count} IronClad-certified contractor${count !== 1 ? 's' : ''} for your request.`,
        `
        ${p(`Here are your matched referrals for <strong style="color:${C.white};">${propertyAddress}</strong>. Review the options below and contact whoever you prefer — it's entirely your choice.`)}
        ${p('Each contractor has been notified of this referral and is expecting to hear from you. They will not reach out to you unsolicited.', C.gray400)}

        ${sectionLabel(`Your ${count} Matched Referral${count !== 1 ? 's' : ''}`)}

        ${contractors.map((c, i) => contractorCardHtml(c, i)).join('')}

        ${sectionLabel('Next Steps')}
        ${checkList([
          'Review the contractors above and their contact information',
          'Reach out to whichever contractor you prefer — you are in control',
          'Contractors have been notified and are expecting your call or email',
          'No commitments — choose the best fit at your own pace',
        ])}

        ${divider()}
        ${small(`All contractors are IronClad Standards™ certified. ListWorx curates this referral but is not a party to any service agreements. Questions? <a href="mailto:support@listworx.com" style="color:${C.rust};text-decoration:none;">support@listworx.com</a>`)}
        `,
        `Your ${count} referral${count !== 1 ? 's are' : ' is'} ready — review and contact whoever you prefer.`,
        'requestor'
      ),
      text: `Your Contractor Referrals\n\nHi ${realtorName},\n\nHere are your matched contractors for ${propertyAddress}:\n\n${contractors.map((c, i) => `${i + 1}. ${c.company}\n   Contact: ${c.name}\n   Phone: ${c.phone}\n   Email: ${c.email}\n   ${c.website ? `Website: ${c.website}\n   ` : ''}Specialties: ${c.specialties.join(', ')}`).join('\n\n')}\n\nContact them directly — you are in control. Each contractor is expecting to hear from you.\n\nAll contractors are IronClad Standards certified.\n\n— The ListWorx Team`,
    };
  },

  qualityAssuranceFollowUp: (realtorName: string, contractorName: string, companyName: string, propertyAddress: string, jobRequestId: string): EmailTemplate => ({
    subject: 'How Did Your Service Go?',
    html: layout(
      'How Was Your Experience?',
      `Hi ${realtorName} — we'd love your feedback on the recent work at ${propertyAddress}.`,
      `
      ${p(`We hope the work at <strong style="color:${C.white};">${propertyAddress}</strong> with <strong style="color:${C.white};">${companyName}</strong> went smoothly. Your honest feedback helps us maintain the quality of our contractor network.`)}

      ${p('It takes under 2 minutes and directly impacts whether this contractor remains in the ListWorx network.')}

      ${cta('Leave Your Feedback &rarr;', `${BASE_URL}/feedback/${jobRequestId}`)}
      ${linkFallback(`${BASE_URL}/feedback/${jobRequestId}`)}

      ${sectionLabel('Why Your Feedback Matters')}
      ${checkList([
        'Ensures contractors maintain IronClad Standards',
        'Improves future matching for you and your clients',
        'Identifies top-performing contractors in the network',
        'Allows us to address issues quickly',
      ])}

      ${sectionLabel('Did Something Go Wrong?')}
      ${warningCard(`
        ${p('If you experienced unprofessional conduct, missed appointments, surprise pricing, or any other IronClad Standards violation — please let us know immediately. We take compliance seriously and investigate every report.', C.gray100)}
        ${small(`<a href="mailto:support@listworx.com" style="color:${C.rust};text-decoration:none;font-weight:600;">Report an issue directly &rarr;</a>`)}
      `)}
      `,
      `Quick question about your recent service at ${propertyAddress} — takes under 2 minutes.`,
      'requestor'
    ),
    text: `How Was Your Experience?\n\nHi ${realtorName},\n\nWe hope the work at ${propertyAddress} with ${companyName} went well.\n\nYour feedback helps us maintain IronClad Standards:\n${BASE_URL}/feedback/${jobRequestId}\n\nIf something went wrong, contact support@listworx.com immediately.\n\n— The ListWorx Team`,
  }),
};
