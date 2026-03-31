import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { newEmail } = await request.json();

    if (!newEmail || typeof newEmail !== 'string') {
      return NextResponse.json({ error: 'New email is required.' }, { status: 400 });
    }

    const normalized = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const serverClient = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await serverClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (normalized === user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'The new email must be different from your current email.' },
        { status: 400 }
      );
    }

    const { error: updateAuthError } = await serverClient.auth.updateUser({ email: normalized });

    if (updateAuthError) {
      console.error('Auth email update error:', updateAuthError);
      return NextResponse.json(
        { error: "We couldn't update your email. Please try again or contact support." },
        { status: 500 }
      );
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: profileError } = await adminClient
      .from('contractor_profiles')
      .update({ email: normalized, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Profile email update error (auth already updated):', profileError);
      return NextResponse.json(
        {
          error:
            'Your login email was updated but your profile could not be synced. Please contact support.',
          partialUpdate: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Your email has been updated. If confirmation is required, please check your inbox before using the new email to sign in.',
    });
  } catch (err: any) {
    console.error('Unexpected error in update-email route:', err);
    return NextResponse.json(
      { error: "We couldn't update your email. Please try again or contact support." },
      { status: 500 }
    );
  }
}
