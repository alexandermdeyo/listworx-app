import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/server/require-admin';


export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  try {
    const { email, password } = await request.json();


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
    const fallbackName = normalizedEmail.split('@')[0] || 'contractor';
    const existingUser = authUser.users.find(
      (u) => u.email?.trim().toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      // Changing the password of an existing account is only allowed for that
      // account's own signed-in session (e.g. after a reset or invite link).
      // Otherwise anyone could take over any account just by knowing its email.
      const caller = await getRequestUser(request);
      if (!caller || caller.id !== existingUser.id) {
        return NextResponse.json(
          {
            error:
              'An account with this email already exists. Please sign in, or use "Forgot password" on the login page to reset it.',
            code: 'account_exists',
          },
          { status: 409 }
        );
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, { password });
      if (updateError) {
        console.error('[SET PASSWORD] Error updating password:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Only create the app user row if it's missing; never change an existing role.
      const { data: existingRow } = await supabase.from('users').select('id').eq('id', existingUser.id).maybeSingle();
      if (!existingRow) {
        await supabase.from('users').insert({ id: existingUser.id, email: normalizedEmail, name: fallbackName, role: 'CONTRACTOR' });
      }

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

    const ownerName = contractorProfile?.owner_name?.trim() || '';
    const companyName = contractorProfile?.company_name || '';
    const resolvedName = ownerName || fallbackName;

    if (!contractorProfile) {
      console.log('[SET PASSWORD] No contractor profile found for email; continuing with auth+users creation');
    }

    console.log('[SET PASSWORD] Creating new auth user for:', email);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: resolvedName,
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

    const { error: newUserUpsertError } = await supabase.from('users').upsert(
      {
        id: newUser.user.id,
        email: normalizedEmail,
        name: resolvedName,
        role: 'CONTRACTOR',
      },
      { onConflict: 'id' }
    );

    if (newUserUpsertError) {
      console.error('[SET PASSWORD] Error upserting users row for new auth user:', newUserUpsertError);
      return NextResponse.json(
        { error: 'Failed to persist contractor user profile' },
        { status: 500 }
      );
    }

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
