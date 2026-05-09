import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getCallerRole(): Promise<{ userId: string; role: string } | null> {
  try {
    const cookieStore = cookies();
    const supabase = createSsrClient(
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
    if (!user) return null;

    const { data } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return { userId: user.id, role: String(data?.role || '').toUpperCase() };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = await getCallerRole();
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { contractorId, actionType, overrideType, tier, duration, customDate, adminNote } =
      await req.json();

    if (!contractorId || !adminNote?.trim()) {
      return NextResponse.json({ error: 'contractorId and adminNote are required' }, { status: 400 });
    }

    if (!['activate', 'override', 'suspend'].includes(actionType)) {
      return NextResponse.json({ error: 'Invalid actionType' }, { status: 400 });
    }

    const isSuspend = actionType === 'suspend';
    const newStatus = isSuspend ? 'suspended' : 'active';

    // 1. Resolve tier_id if tier name given (needed before profile update)
    let tierId: string | null = null;
    if (tier && !isSuspend) {
      const { data: tierRow } = await supabaseAdmin
        .from('tiers')
        .select('id')
        .eq('name', tier)
        .maybeSingle();
      tierId = tierRow?.id ?? null;
    }

    // 2. Update contractor_profiles — status AND tier so feature gating works immediately
    const profileUpdate: Record<string, any> = {
      partner_status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (!isSuspend && tier) profileUpdate.tier = tier;
    if (isSuspend) profileUpdate.tier = null;

    const { error: profileErr } = await supabaseAdmin
      .from('contractor_profiles')
      .update(profileUpdate)
      .eq('id', contractorId);

    if (profileErr) throw new Error(`Profile update failed: ${profileErr.message}`);

    // 3. Compute period_end
    let periodEnd: string | null = null;
    if (!isSuspend) {
      if (duration === 'custom' && customDate) {
        periodEnd = new Date(customDate).toISOString();
      } else if (duration !== 'indefinite') {
        const days = parseInt(duration, 10);
        if (!isNaN(days)) {
          const d = new Date();
          d.setDate(d.getDate() + days);
          periodEnd = d.toISOString();
        }
      }
    }

    // 4. Upsert subscription row (safe: unique constraint on contractor_id)
    const subStatus = isSuspend ? 'cancelled' : 'active';
    const subPayload: Record<string, any> = {
      contractor_id: contractorId,
      status: subStatus,
      note: adminNote.trim(),
      updated_at: new Date().toISOString(),
    };
    if (tierId) subPayload.tier_id = tierId;
    if (periodEnd) subPayload.current_period_end = periodEnd;
    if (!isSuspend) subPayload.current_period_start = new Date().toISOString();

    const { error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subPayload, { onConflict: 'contractor_id' });

    if (subErr) {
      console.warn('Subscription upsert warning (may not have row yet):', subErr.message);
      // If no existing row (no contractor_id unique key match), try insert
      if (tierId) {
        await supabaseAdmin.from('subscriptions').insert({
          ...subPayload,
          tier_id: tierId,
        });
      }
    }

    // 5. Log to audit_logs
    const auditPayload: Record<string, any> = {
      user_id: caller.userId,
      action: 'subscription_override',
      contractor_id: contractorId,
      changes: {
        admin_id: caller.userId,
        action_type: actionType,
        override_type: overrideType || actionType,
        tier: tier || null,
        duration: duration || null,
        note: adminNote.trim(),
        new_status: newStatus,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    const { error: auditErr } = await supabaseAdmin.from('audit_logs').insert(auditPayload);
    if (auditErr) {
      console.warn('Audit log insert warning:', auditErr.message);
    }

    return NextResponse.json({
      message: isSuspend
        ? 'Contractor suspended successfully.'
        : `Contractor ${actionType === 'activate' ? 'activated' : 'override applied'} successfully.`,
    });
  } catch (err: any) {
    console.error('subscription-override error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
