type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable.');
  }

  if (!defaultFrom && !from) {
    throw new Error('Missing RESEND_FROM_EMAIL environment variable.');
  }

  const recipients = Array.isArray(to) ? to : [to];

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from || defaultFrom,
      to: recipients,
      subject,
      html,
      text,
      reply_to: replyTo,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to send email.');
  }

  return data;
}