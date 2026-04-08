import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

type AllowedRole =
  | 'ADMIN'
  | 'CONTRACTOR'
  | 'REALTOR'
  | 'HOMEOWNER'
  | 'PROPERTY_MANAGER';

const REQUESTOR_ROLES: AllowedRole[] = ['REALTOR', 'HOMEOWNER', 'PROPERTY_MANAGER'];

export async function POST(request: NextRequest) {
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

    if (REQUESTOR_ROLES.includes(role)) {
      const { error: requestorProfileError } = await supabase
        .from('requestor_profiles')
        .upsert(
          {
            user_id: id,
          },
          { onConflict: 'user_id' }
        );

      if (requestorProfileError) {
        console.error('UPSERT REQUESTOR PROFILE FAILED:', requestorProfileError);
        return NextResponse.json(
          {
            error:
              requestorProfileError.message ||
              'Failed to create requestor profile',
          },
          { status: 500 }
        );
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
