import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('[SET PASSWORD] Request received for email:', email);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    console.log('[SET PASSWORD] Checking for existing auth user');
    const { data: authUser, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError) {
      console.error('[SET PASSWORD] Error listing users:', getUserError);
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = authUser.users.find(
      (u) => u.email?.trim().toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      console.log('[SET PASSWORD] Existing user found, updating password');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        console.error('[SET PASSWORD] Error updating password:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      console.log('[SET PASSWORD] Password updated successfully');

      await supabase.from('users').upsert(
        {
          id: existingUser.id,
          email: normalizedEmail,
          role: 'CONTRACTOR',
        },
        { onConflict: 'id' }
      );

      return NextResponse.json({ success: true });
    }

    console.log('[SET PASSWORD] No existing auth user — looking up contractor profile for:', normalizedEmail);
    const { data: contractorProfile, error: profileError } = await supabase
      .from('contractor_profiles')
      .select('company_name, owner_name')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error('[SET PASSWORD] Error fetching contractor profile:', profileError);
    }

    const ownerName = contractorProfile?.owner_name || '';
    const companyName = contractorProfile?.company_name || '';

    if (!contractorProfile) {
      console.log('[SET PASSWORD] No contractor profile found for email; continuing with auth+users creation');
    }

    console.log('[SET PASSWORD] Creating new auth user for:', email);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: ownerName,
        company_name: companyName,
        owner_name: ownerName,
        role: 'CONTRACTOR'
      }
    });

    if (createError) {
      console.error('[SET PASSWORD] Error creating user:', createError);
      return NextResponse.json(
        { error: `Failed to create account: ${createError.message}` },
        { status: 500 }
      );
    }

    if (!newUser || !newUser.user) {
      console.error('[SET PASSWORD] No user returned from createUser');
      return NextResponse.json(
        { error: 'Failed to create user account - no user returned' },
        { status: 500 }
      );
    }

    console.log('[SET PASSWORD] User created successfully:', newUser.user.id);

    await supabase.from('users').upsert(
      {
        id: newUser.user.id,
        email: normalizedEmail,
        full_name: ownerName,
        role: 'CONTRACTOR',
      },
      { onConflict: 'id' }
    );

    if (contractorProfile) {
      await supabase
        .from('contractor_profiles')
        .update({ user_id: newUser.user.id })
        .ilike('email', normalizedEmail)
        .is('user_id', null);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
