import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';


type AllowedRole =
  | 'ADMIN'
  | 'CONTRACTOR'
  | 'REALTOR'
  | 'HOMEOWNER'
  | 'PROPERTY_MANAGER';

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  try {
    const body = await request.json();
    const { id, email, name, role } = body as {
      id?: string;
      email?: string;
      name?: string;
      role?: AllowedRole;
    };

    if (!id || !email || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: id, email, name, role' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const safeName = name.trim();

    if (!safeName) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const allowedRoles: AllowedRole[] = [
      'ADMIN',
      'CONTRACTOR',
      'REALTOR',
      'HOMEOWNER',
      'PROPERTY_MANAGER',
    ];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('users').upsert(
      {
        id,
        email: normalizedEmail,
        name: safeName,
        role,
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('UPSERT APP USER FAILED:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to upsert app user' },
        { status: 500 }
      );
    }

    // Create role-specific profile row.
    // Non-blocking — log the error but let signup succeed.
    // A missing profile can be repaired; a failed signup loses the user.
    if (role === 'REALTOR') {
      const { error: profileError } = await supabase
        .from('realtor_profiles')
        .upsert({ user_id: id }, { onConflict: 'user_id', ignoreDuplicates: true });
      if (profileError) {
        console.error('UPSERT REALTOR PROFILE FAILED:', profileError);
      }
    } else if (role === 'HOMEOWNER') {
      const { error: profileError } = await supabase
        .from('requestor_profiles')
        .upsert(
          { user_id: id, user_type: 'homeowner' },
          { onConflict: 'user_id', ignoreDuplicates: true }
        );
      if (profileError) {
        console.error('UPSERT REQUESTOR PROFILE (HOMEOWNER) FAILED:', profileError);
      }
    } else if (role === 'PROPERTY_MANAGER') {
      const { error: profileError } = await supabase
        .from('requestor_profiles')
        .upsert(
          { user_id: id, user_type: 'property_manager' },
          { onConflict: 'user_id', ignoreDuplicates: true }
        );
      if (profileError) {
        console.error('UPSERT REQUESTOR PROFILE (PROPERTY_MANAGER) FAILED:', profileError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('UPSERT APP USER ROUTE ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}