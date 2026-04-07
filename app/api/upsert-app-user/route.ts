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

    const payload = {
      id,
      email: normalizedEmail,
      name: safeName,
      full_name: safeName,
      role,
    };

    let { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });

    if (error && (error.message || '').toLowerCase().includes('users_email_key')) {
      const { data: existingByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingByEmail?.id) {
        const updateResult = await supabase
          .from('users')
          .update({ name: safeName, full_name: safeName, role })
          .eq('id', existingByEmail.id);

        error = updateResult.error ?? null;
      }
    }

    if (error) {
      console.error('UPSERT APP USER FAILED:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to upsert app user' },
        { status: 500 }
      );
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