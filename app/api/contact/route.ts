import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{ name, email, phone: phone || null, message, status: 'new' }])
      .select()
      .single();

    if (error) {
      console.error('Error saving contact submission:', error);
      return NextResponse.json(
        { error: 'Failed to submit contact form' },
        { status: 500 }
      );
    }

    // Notify admin of new contact submission
    const adminEmail = process.env.ADMIN_EMAIL || 'adeyo@listworx.co';
    const BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://listworx.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceKey) {
      fetch(`${supabaseUrl}/functions/v1/send-realtor-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          type: 'admin_new_job_request',
          to: adminEmail,
          realtorName: name,
          clientName: name,
          clientEmail: email,
          clientPhone: phone || 'Not provided',
          propertyAddress: `Contact form message: ${message.slice(0, 80)}${message.length > 80 ? '...' : ''}`,
          services: [],
          matchedContractors: 0,
        }),
      }).catch((err) => console.error('[contact] admin notification failed:', err));
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
