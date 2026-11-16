/**
 * Unit tests for the authorization logic in lib/require-admin.ts, used to
 * fix the unauthenticated approve-application endpoint
 * (security/ironclad-access-controls).
 *
 * Imports the real shipped module — not a copy — and exercises it with
 * lightweight fake Supabase-like objects. No network, no database.
 *
 * Run with:
 *   npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' tests/require-admin.test.ts
 */

import { classifyCaller, isRoleAdmin } from '../lib/require-admin';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`  PASS: ${message}`);
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`FAILED: ${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
  console.log(`  PASS: ${message}`);
}

// A fake Supabase admin client matching only the shape isRoleAdmin uses:
// .from(table).select(cols).eq(col, val).maybeSingle()
function fakeSupabaseAdmin(roleByUserId: Record<string, string | null>) {
  return {
    from(_table: string) {
      return {
        select(_cols: string) {
          return {
            eq(_col: string, userId: string) {
              return {
                async maybeSingle() {
                  const role = roleByUserId[userId];
                  return { data: role === undefined ? null : { role }, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
}

async function run() {
  console.log('\nrequire-admin.ts — classifyCaller\n');

  assertEqual(
    classifyCaller(false, false),
    'anonymous',
    'Scenario 1: no session user -> anonymous (route must return 401)'
  );

  assertEqual(
    classifyCaller(true, false),
    'non_admin',
    'Scenario 2/3: authenticated non-admin (e.g. contractor) -> non_admin (route must return 403)'
  );

  assertEqual(
    classifyCaller(true, true),
    'admin',
    'Scenario 10: authenticated admin -> admin (route may proceed)'
  );

  console.log('\nrequire-admin.ts — isRoleAdmin (against a fake users-table client)\n');

  const admin = fakeSupabaseAdmin({ 'user-admin': 'ADMIN', 'user-contractor': 'CONTRACTOR' });

  assertEqual(
    await isRoleAdmin(admin, 'user-admin'),
    true,
    'Admin user id resolves role=ADMIN -> true'
  );

  assertEqual(
    await isRoleAdmin(admin, 'user-contractor'),
    false,
    'Contractor user id resolves role=CONTRACTOR -> false (cannot approve/certify)'
  );

  assertEqual(
    await isRoleAdmin(admin, 'user-unknown'),
    false,
    'Unknown/missing users row -> false (fails closed, not open)'
  );

  assertEqual(
    await isRoleAdmin(
      fakeSupabaseAdmin({ 'user-lowercase': 'admin' }),
      'user-lowercase'
    ),
    true,
    'Role comparison is case-insensitive ("admin" row value still matches ADMIN check)'
  );

  console.log('\nAll require-admin tests passed.\n');
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
