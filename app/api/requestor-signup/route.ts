import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, requestorRole, companyName } = body;

    if (!email || !password || !name || !requestorRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabaseAdmin = createAdminClient();

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: authError?.message || 'Auth creation failed' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: normalizedEmail,
        full_name: name.trim(),
        role: 'USER',
      });

    if (userInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: userInsertError.message },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from('realtor_profiles')
      .insert({
        user_id: userId,
        brokerage_name: companyName?.trim() || '',
        requester_type: requestorRole,
        display_name: name.trim(),
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // Send welcome email to new requestor (non-blocking)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://listworx.co';

    const roleLabel = requestorRole === 'REALTOR' ? 'Realtor'
      : requestorRole === 'HOMEOWNER' ? 'Homeowner'
      : requestorRole === 'PROPERTY_MANAGER' ? 'Property Manager'
      : 'Member';

    fetch(`${supabaseUrl}/functions/v1/send-realtor-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type: 'job_submission',
        to: normalizedEmail,
        realtorName: name.trim(),
        clientName: name.trim(),
        propertyAddress: 'Ready to submit your first request',
        services: [`${roleLabel} account activated`],
      }),
    }).catch((err) => console.error('[requestor-signup] welcome email failed:', err));

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
