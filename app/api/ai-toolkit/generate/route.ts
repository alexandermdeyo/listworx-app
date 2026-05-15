import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function buildPrompt(tool: string, inputs: Record<string, string>): string {
  switch (tool) {
    case 'social_caption':
      return `You are a marketing copywriter for a contractor business. Write 3 social media captions for a ${inputs.trade} contractor based on a ${inputs.job_type} job in ${inputs.city}. Tone: ${inputs.tone}. ${inputs.photo_description ? 'Photo context: ' + inputs.photo_description : ''}
Each caption should be ready to post on Facebook or Instagram. Keep each under 150 words. Write in a real, human voice — not corporate.
Format: Return exactly 3 captions separated by the text "---CAPTION---" with no other text before or after.`;

    case 'estimate_followup':
      return `Write a professional follow-up email from a contractor to a customer after giving an estimate.
Contractor name: ${inputs.your_name}
Business name: ${inputs.business_name}
Customer name: ${inputs.customer_name}
Job type: ${inputs.job_type}
Estimate amount: ${inputs.estimate_amount}
The email should be warm but professional, remind them of the estimate, reinforce trust, and include a clear but gentle call to action.
Keep it under 150 words. No subject line needed.
Return only the email body text.`;

    case 'job_completion_thankyou':
      return `Write a thank-you message from a contractor to a customer after completing a job.
Contractor: ${inputs.your_name}
Customer: ${inputs.customer_name}
Job completed: ${inputs.job_type}
Format: ${inputs.contact_preference === 'text' ? 'text message, under 160 characters' : 'short email, under 100 words'}
Include a natural, not pushy request for a Google review.
Return only the message text.`;

    case 'review_request':
      return `Write a short friendly message asking a customer to leave a Google review.
From: ${inputs.your_name}
To: ${inputs.customer_name}
Google Business link: ${inputs.google_link}
Keep it under 120 characters so it works as a text message. Sound like a real person, not a template. Return only the message text.`;

    case 'hiring_post':
      return `Write a job posting for a contractor hiring an employee.
Trade: ${inputs.trade}
City: ${inputs.city}
Pay range: ${inputs.pay_range}
Requirements: ${inputs.requirements}
Business name: ${inputs.business_name}
Write in plain language that attracts real tradespeople. Include a call to action at the end. Keep it under 300 words.
Return only the job posting text.`;

    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tool, inputs } = body as { tool: string; inputs: Record<string, string> };

    if (!tool || !inputs) {
      return NextResponse.json({ error: 'tool and inputs are required' }, { status: 400 });
    }

    const prompt = buildPrompt(tool, inputs);

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', errText);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
    }

    const data = await anthropicRes.json();
    const text: string = data.content?.[0]?.text || '';

    let result: string | string[] = text;
    if (tool === 'social_caption') {
      result = text.split('---CAPTION---').map((s: string) => s.trim()).filter(Boolean);
    }

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error('AI toolkit error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
