// Contractor media paths must match the storage ownership rule, and /api/media writes are admin-only.
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownedMediaPath, isOwnedMediaPath } from '../lib/media-paths.ts';
import { createMediaItem, updateMediaItem, deleteMediaItem, pickMediaItemFields } from '../lib/server/media-items.ts';

const A = 'a0000000-0000-4000-8000-00000000000a';
const B = 'a0000000-0000-4000-8000-00000000000b';

// Same rule as the storage policy: (storage.foldername(name))[1] = auth.uid()
const policyAllows = (name, uid) => { const parts = name.split('/'); return parts.slice(0, -1)[0] === uid; };

test('every contractor upload path lands in the uploader\'s own folder', () => {
  for (const kind of ['logo', 'profile-photo', 'work-photos', 'flyers']) {
    const p = ownedMediaPath(A, kind, 'My Logo (final).PNG', 1700000000000);
    assert.equal(p, `${A}/${kind}/1700000000000-my-logo-final-.png`);
    assert.ok(policyAllows(p, A), `${kind} path would be refused by storage`);
    assert.ok(!policyAllows(p, B), `${kind} path would be writable by another user`);
  }
});

test('file names cannot escape the owner folder', () => {
  const p = ownedMediaPath(A, 'logo', `../../${B}/logo/evil.png`, 1);
  assert.equal(p.split('/')[0], A);
  assert.equal(p.split('/').length, 3);
});

test('upload is refused without a real signed-in user id', () => {
  for (const bad of ['', undefined, null, 'c0000000', `${A}/x`]) {
    assert.throws(() => ownedMediaPath(bad, 'logo', 'a.png'));
  }
  assert.throws(() => ownedMediaPath(A, 'documents', 'a.png'));
});

test('dashboard only deletes files in its own folder (legacy and others\' paths skipped)', () => {
  assert.equal(isOwnedMediaPath(`${A}/work-photos/1-a.jpg`, A), true);
  assert.equal(isOwnedMediaPath(`${B}/work-photos/1-b.jpg`, A), false);
  assert.equal(isOwnedMediaPath(`work-photos/c0000000-0000-4000-8000-00000000000a/1.jpg`, A), false);
  assert.equal(isOwnedMediaPath(`${A}-1774811482483.png`, A), false);
  assert.equal(isOwnedMediaPath(null, A), false);
});

function fakeDeps(adminId) {
  const calls = [];
  return {
    calls,
    deps: {
      adminId: async () => adminId,
      insert: async (row) => { calls.push(['insert', row]); return { data: { id: 'm1', ...row }, error: null }; },
      update: async (id, patch) => { calls.push(['update', id, patch]); return { data: { id, ...patch }, error: null }; },
      remove: async (id) => { calls.push(['remove', id]); return { error: null }; },
    },
  };
}

test('/api/media: logged-out or non-admin callers cannot create, edit or delete', async () => {
  const f = fakeDeps(null);
  assert.equal((await createMediaItem({ title: 'x', url: 'https://evil.example' }, f.deps)).status, 401);
  assert.equal((await updateMediaItem({ id: 'm1', url: 'https://evil.example' }, f.deps)).status, 401);
  assert.equal((await deleteMediaItem('m1', f.deps)).status, 401);
  assert.deepEqual(f.calls, [], 'database was touched without an admin');
});

test('/api/media: admin can create, edit and delete', async () => {
  const f = fakeDeps('admin-1');
  assert.equal((await createMediaItem({ title: 'Interview', url: 'https://youtu.be/x', platform: 'other' }, f.deps)).status, 201);
  assert.equal(f.calls[0][1].platform, 'link');
  assert.equal((await updateMediaItem({ id: 'm1', is_featured: true }, f.deps)).status, 200);
  assert.equal((await deleteMediaItem('m1', f.deps)).status, 200);
  assert.equal(f.calls.length, 3);
});

test('/api/media: edits only touch editable columns', async () => {
  const f = fakeDeps('admin-1');
  await updateMediaItem({ id: 'm1', title: 'New', created_at: '2000-01-01', id_override: 'x', is_active: false }, f.deps);
  const patch = f.calls[0][2];
  assert.equal(patch.title, 'New');
  assert.equal(patch.is_active, false);
  assert.ok(!('created_at' in patch) && !('id_override' in patch) && !('id' in patch));
  assert.deepEqual(pickMediaItemFields(null), {});
});
