/**
 * Phase 1F — final isolated testing of app/api/approve-application/route.ts.
 *
 * This is a MOCKED LOCAL HARNESS, not live HTTP integration against any
 * Supabase project (test branch or production). It imports and executes the
 * REAL exported POST handler from the real route file, with exactly two
 * dependencies swapped for controlled fakes before the route is required:
 *   - '@/lib/require-admin'   -> fake requireAdminCaller(), returns whatever
 *                                this test tells it to, per scenario.
 *   - '@supabase/supabase-js' -> fake createClient(), returns an in-memory
 *                                object that records every .update() call
 *                                and never makes a network request.
 *
 * No real Supabase credentials (test-branch or production) are used, read,
 * or required to run this. No network call happens. No email is sent (the
 * fake profile has no resolvable email, so the route's own "no email found"
 * branch is taken instead of calling fetch()).
 *
 * This is deliberate: the test branch (security-compliance-test /
 * cwggjrxzyfhdsnvcgkzc) is in a MIGRATIONS_FAILED state (reconfirmed this
 * phase via list_branches) and its service-role key was never available to
 * this session. Per Phase 1F's own instructions, a local harness with
 * isolated/mocked dependencies is used instead, and is reported as such —
 * not as live HTTP integration.
 *
 * Run with:
 *   TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}' \
 *     node -r ts-node/register -r tsconfig-paths/register tests/approve-application-handler.test.ts
 */

type Caller = { userId: string; classification: 'admin' | 'non_admin' } | null | 'THROW';

let callerToReturn: Caller = null;
let selectResult: { data: any; error: any } = { data: null, error: null };
const updateCalls: Array<{ table: string; payload: any }> = [];

const fakeRequireAdmin = {
  async requireAdminCaller() {
    if (callerToReturn === 'THROW') {
      throw new Error('simulated malformed/invalid session lookup failure');
    }
    return callerToReturn;
  },
};

function makeFakeSupabaseAdminClient() {
  return {
    from(table: string) {
      return {
        select(_cols: string) {
          return {
            eq(_col: string, _val: string) {
              return {
                async maybeSingle() {
                  return selectResult;
                },
              };
            },
          };
        },
        update(payload: any) {
          updateCalls.push({ table, payload });
          return {
            eq(_col: string, _val: string) {
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };
}

const fakeSupabaseJs = {
  createClient: (_url: string, _key: string, _opts: any) => makeFakeSupabaseAdminClient(),
};

// Inject the fakes into require.cache BEFORE the real route module is required,
// keyed by the exact resolved path each specifier maps to in this process.
const requireAdminPath = require.resolve('@/lib/require-admin');
const supabaseJsPath = require.resolve('@supabase/supabase-js');

(require.cache as any)[requireAdminPath] = {
  id: requireAdminPath,
  filename: requireAdminPath,
  loaded: true,
  exports: fakeRequireAdmin,
};

(require.cache as any)[supabaseJsPath] = {
  id: supabaseJsPath,
  filename: supabaseJsPath,
  loaded: true,
  exports: fakeSupabaseJs,
};

// The route reads these at call time via process.env; no real project is
// contacted because createClient() itself is faked above.
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-harness.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-harness-not-a-real-key';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { POST } = require('../app/api/approve-application/route');

function fakeRequest(body: any) {
  return { json: async () => body } as any;
}

function reset(caller: Caller, select: { data: any; error: any }) {
  callerToReturn = caller;
  selectResult = select;
  updateCalls.length = 0;
}

let failures = 0;
function check(condition: boolean, message: string) {
  if (condition) {
    console.log(`  PASS: ${message}`);
  } else {
    console.log(`  FAIL: ${message}`);
    failures++;
  }
}

async function run() {
  console.log('\napprove-application/route.ts — mocked handler tests\n');

  // 1. Anonymous request
  reset(null, { data: null, error: null });
  let res = await POST(fakeRequest({ contractorProfileId: 'synthetic-contractor-1' }));
  check(res.status === 401, 'Anonymous request returns 401');
  check(updateCalls.length === 0, 'Anonymous request causes no database writes');

  // 2. Authenticated non-admin
  reset({ userId: 'synthetic-user-non-admin', classification: 'non_admin' }, { data: null, error: null });
  res = await POST(fakeRequest({ contractorProfileId: 'synthetic-contractor-1' }));
  check(res.status === 403, 'Authenticated non-admin returns 403');
  check(updateCalls.length === 0, 'Non-admin request causes no database writes');

  // 3. Contractor self-approval (same guard, explicit scenario per Phase 1F spec)
  reset({ userId: 'synthetic-contractor-self', classification: 'non_admin' }, { data: null, error: null });
  res = await POST(fakeRequest({ contractorProfileId: 'synthetic-contractor-self-profile' }));
  check(res.status === 403, 'Contractor self-approval returns 403');
  check(updateCalls.length === 0, 'Contractor self-approval causes no database writes');

  // 4. Malformed authentication — unresolvable session (fails closed, same as anonymous)
  reset(null, { data: null, error: null });
  res = await POST(fakeRequest({ contractorProfileId: 'synthetic-contractor-1' }));
  check(res.status === 401, 'Unresolvable/malformed session returns 401');
  check(updateCalls.length === 0, 'Malformed-session request causes no database writes');

  // 4b. Malformed authentication — session lookup throws (never falls through to approval)
  reset('THROW', { data: null, error: null });
  res = await POST(fakeRequest({ contractorProfileId: 'synthetic-contractor-1' }));
  check(res.status === 500, 'Session-lookup failure is caught and returns 500, not a silent pass-through');
  check(updateCalls.length === 0, 'Session-lookup failure causes no database writes');

  // 5. Authorized admin — existing approval behavior preserved
  reset(
    { userId: 'synthetic-admin-user', classification: 'admin' },
    {
      data: {
        id: 'synthetic-contractor-2',
        user_id: 'synthetic-user-2',
        email: '',
        company_name: 'Synthetic Test Co',
        owner_name: 'Synthetic Owner',
        partner_status: 'under_review',
      },
      error: null,
    }
  );
  res = await POST(fakeRequest({ contractorProfileId: 'synthetic-contractor-2' }));
  const body = await res.json();
  check(res.status === 200, 'Authorized admin request succeeds (200)');
  check(updateCalls.length === 1, 'Authorized admin request causes exactly one database write');
  check(
    updateCalls[0]?.table === 'contractor_profiles' && updateCalls[0]?.payload?.partner_status === 'approved',
    "The write targets contractor_profiles and sets partner_status to 'approved'"
  );
  check(body.success === true, 'Response reports success for the admin path');
  check(
    typeof body.emailError === 'string' && body.emailError.includes('No email address found'),
    'No email dispatch attempted (synthetic profile has no resolvable email) — no external service invoked'
  );

  console.log();
  if (failures > 0) {
    console.error(`${failures} check(s) FAILED`);
    process.exit(1);
  }
  console.log('All approve-application mocked handler checks passed.\n');
}

run().catch((err) => {
  console.error('Unexpected harness error:', err);
  process.exit(1);
});
