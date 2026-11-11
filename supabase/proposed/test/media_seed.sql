-- Files owned by contractor B, an admin-made logo, a legacy root-level logo and a realtor brand file.
truncate storage.objects; truncate public.contractor_work_photos;
insert into storage.objects (bucket_id, name, owner_id) values
  ('logos', 'a0000000-0000-4000-8000-00000000000b/logo/1-b.png',          'a0000000-0000-4000-8000-00000000000b'),
  ('logos', 'a0000000-0000-4000-8000-00000000000b-1774811482483.png',      'a0000000-0000-4000-8000-00000000000b'),
  ('logos', 'contractor-logos/c0000000-0000-4000-8000-00000000000b.png',   'a0000000-0000-4000-8000-000000000001'),
  ('logos', 'a0000000-0000-4000-8000-0000000000ee/brand/1-r.png',          null),
  ('contractor-work-photos', 'a0000000-0000-4000-8000-00000000000b/work-photos/1-b.jpg', 'a0000000-0000-4000-8000-00000000000b'),
  ('contractor-work-photos', 'a0000000-0000-4000-8000-00000000000a/work-photos/1-a.jpg', 'a0000000-0000-4000-8000-00000000000a');

create or replace function test.expect(label text, actual text, want text) returns void language plpgsql as $$
begin
  if actual !~ want then raise exception '% FAIL: got %, expected %', label, actual, want; end if;
  raise notice '% pass (%)', label, actual;
end $$;
