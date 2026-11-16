/**
 * Structural regression guard for app/api/approve-application/route.ts.
 *
 * This is NOT a behavioral/HTTP test (no isolated database or running
 * Next.js server was available in this session — see the Phase 1 security
 * report). It statically verifies that the admin auth guard added to fix
 * the unauthenticated-approval vulnerability is present and runs BEFORE any
 * Supabase call, so a future edit can't silently drop it back to the
 * unguarded state without this check failing.
 *
 * Run with:
 *   npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' tests/approve-application-route-guard.test.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`  PASS: ${message}`);
}

function run() {
  const routePath = join(__dirname, '..', 'app', 'api', 'approve-application', 'route.ts');
  const source = readFileSync(routePath, 'utf8');

  console.log('\napprove-application/route.ts — structural guard check\n');

  assert(
    source.includes("import { requireAdminCaller } from '@/lib/require-admin';"),
    'Route imports the shared admin-auth helper'
  );

  const guardIndex = source.indexOf('requireAdminCaller()');
  const unauthorizedIndex = source.indexOf("status: 401");
  const forbiddenIndex = source.indexOf("status: 403");
  const adminClientIndex = source.indexOf('createClient(');
  const updateIndex = source.indexOf(".update({ partner_status: PARTNER_STATUS.APPROVED })");

  assert(guardIndex !== -1, 'Route calls requireAdminCaller()');
  assert(unauthorizedIndex !== -1, 'Route has a 401 (Unauthorized) response path');
  assert(forbiddenIndex !== -1, 'Route has a 403 (Forbidden) response path');
  assert(adminClientIndex !== -1, 'Route still creates the service-role admin client');
  assert(updateIndex !== -1, 'Route still contains the approval update call');

  assert(
    guardIndex < adminClientIndex,
    'Admin-auth guard runs BEFORE the service-role Supabase client is created (no data access for rejected callers)'
  );
  assert(
    guardIndex < updateIndex,
    'Admin-auth guard runs BEFORE the partner_status update (rejected requests cannot change contractor records)'
  );
  assert(
    unauthorizedIndex < updateIndex && forbiddenIndex < updateIndex,
    'Both the 401 and 403 response paths are positioned before the update call in source order'
  );

  console.log('\nAll approve-application route-guard checks passed.\n');
}

run();
