-- Tests for 20261111000200_media_storage_ownership.sql. Each check raises on failure.
\set ON_ERROR_STOP on
\set admin '''a0000000-0000-4000-8000-000000000001'''
\set A     '''a0000000-0000-4000-8000-00000000000a'''
\set B     '''a0000000-0000-4000-8000-00000000000b'''
\i media_seed.sql

-- Cross-contractor attacks: all blocked ("denied" on insert, 0 rows on update/delete)
select test.expect('M1 A cannot overwrite B''s logo (upsert)', test.attempt(:A,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('logos','a0000000-0000-4000-8000-00000000000b/logo/1-b.png','a0000000-0000-4000-8000-00000000000a')
     on conflict (bucket_id, name) do update set owner_id = excluded.owner_id, updated_at = now()$q$), '^denied:42501$');
select test.expect('M2 A cannot update B''s logo in place', test.attempt(:A,
  $q$update storage.objects set metadata = '{"x":1}' where bucket_id='logos' and name like 'a0000000-0000-4000-8000-00000000000b/%'$q$), '^ok:0$');
select test.expect('M3 A cannot move B''s logo into own folder', test.attempt(:A,
  $q$update storage.objects set name = 'a0000000-0000-4000-8000-00000000000a/logo/stolen.png' where bucket_id='logos' and name='a0000000-0000-4000-8000-00000000000b/logo/1-b.png'$q$), '^ok:0$');
select test.expect('M4 A cannot delete B''s logo', test.attempt(:A,
  $q$delete from storage.objects where bucket_id='logos' and name='a0000000-0000-4000-8000-00000000000b/logo/1-b.png'$q$), '^ok:0$');
select test.expect('M5 A cannot delete B''s legacy root logo', test.attempt(:A,
  $q$delete from storage.objects where bucket_id='logos' and name='a0000000-0000-4000-8000-00000000000b-1774811482483.png'$q$), '^ok:0$');
select test.expect('M6 A cannot delete admin-made contractor logo', test.attempt(:A,
  $q$delete from storage.objects where bucket_id='logos' and name like 'contractor-logos/%'$q$), '^ok:0$');
select test.expect('M7 A cannot delete a realtor''s brand file', test.attempt(:A,
  $q$delete from storage.objects where bucket_id='logos' and name like 'a0000000-0000-4000-8000-0000000000ee/%'$q$), '^ok:0$');
select test.expect('M8 A cannot upload into B''s logo folder', test.attempt(:A,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('logos','a0000000-0000-4000-8000-00000000000b/logo/9-fake.png','a0000000-0000-4000-8000-00000000000a')$q$), '^denied:42501$');
select test.expect('M9 A cannot upload outside any user folder', test.attempt(:A,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('logos','contractor-logos/c0000000-0000-4000-8000-00000000000b.png','a0000000-0000-4000-8000-00000000000a')$q$), '^denied:42501$');
select test.expect('M10 A cannot delete B''s work photo', test.attempt(:A,
  $q$delete from storage.objects where bucket_id='contractor-work-photos' and name like 'a0000000-0000-4000-8000-00000000000b/%'$q$), '^ok:0$');
select test.expect('M11 A cannot plant a file in B''s work-photo folder', test.attempt(:A,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('contractor-work-photos','a0000000-0000-4000-8000-00000000000b/work-photos/2-fake.jpg','a0000000-0000-4000-8000-00000000000a')$q$), '^denied:42501$');
select test.expect('M12 A cannot overwrite B''s work photo (upsert)', test.attempt(:A,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('contractor-work-photos','a0000000-0000-4000-8000-00000000000b/work-photos/1-b.jpg','a0000000-0000-4000-8000-00000000000a')
     on conflict (bucket_id, name) do update set owner_id = excluded.owner_id$q$), '^denied:42501$');
select test.expect('M13 A cannot point own photo row at B''s file', test.attempt(:A,
  $q$insert into public.contractor_work_photos (contractor_id, storage_path) values ('c0000000-0000-4000-8000-00000000000a','a0000000-0000-4000-8000-00000000000b/work-photos/1-b.jpg')$q$), '^denied:42501$');
select test.expect('M14 A cannot add a photo row to B''s profile', test.attempt(:A,
  $q$insert into public.contractor_work_photos (contractor_id, storage_path) values ('c0000000-0000-4000-8000-00000000000b','a0000000-0000-4000-8000-00000000000a/work-photos/1-a.jpg')$q$), '^denied:42501$');
select test.expect('M15 logged-out visitor cannot upload or delete', test.attempt(null,
  $q$insert into storage.objects (bucket_id, name) values ('logos','x/logo/1.png')$q$), '^denied:42501$');
select test.expect('M16 logged-out visitor cannot delete', test.attempt(null,
  $q$delete from storage.objects where bucket_id in ('logos','contractor-work-photos')$q$), '^ok:0$');

-- Contractors keep full control of their own media
select test.expect('O1 A uploads own logo', test.attempt(:A,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('logos','a0000000-0000-4000-8000-00000000000a/logo/2-a.png','a0000000-0000-4000-8000-00000000000a')$q$), '^ok:1$');
select test.expect('O2 A re-uploads own logo (upsert)', test.attempt(:A,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('logos','a0000000-0000-4000-8000-00000000000a/logo/2-a.png','a0000000-0000-4000-8000-00000000000a')
     on conflict (bucket_id, name) do update set updated_at = now()$q$), '^ok:1$');
select test.expect('O3 A uploads own profile photo', test.attempt(:A,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('logos','a0000000-0000-4000-8000-00000000000a/profile-photo/3-a.jpg','a0000000-0000-4000-8000-00000000000a')$q$), '^ok:1$');
select test.expect('O4 A deletes own logo', test.attempt(:A,
  $q$delete from storage.objects where bucket_id='logos' and name='a0000000-0000-4000-8000-00000000000a/logo/2-a.png'$q$), '^ok:1$');
select test.expect('O5 A uploads own work photo', test.attempt(:A,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('contractor-work-photos','a0000000-0000-4000-8000-00000000000a/work-photos/4-a.jpg','a0000000-0000-4000-8000-00000000000a')$q$), '^ok:1$');
select test.expect('O6 A re-uploads own flyer image (upsert)', test.attempt(:A,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('contractor-work-photos','a0000000-0000-4000-8000-00000000000a/work-photos/4-a.jpg','a0000000-0000-4000-8000-00000000000a')
     on conflict (bucket_id, name) do update set updated_at = now()$q$), '^ok:1$');
select test.expect('O7 A records own photo row', test.attempt(:A,
  $q$insert into public.contractor_work_photos (contractor_id, storage_path) values ('c0000000-0000-4000-8000-00000000000a','a0000000-0000-4000-8000-00000000000a/work-photos/4-a.jpg')$q$), '^ok:1$');
select test.expect('O8 A edits own photo caption', test.attempt(:A,
  $q$update public.contractor_work_photos set caption = 'Kitchen' where contractor_id = 'c0000000-0000-4000-8000-00000000000a'$q$), '^ok:1$');
select test.expect('O9 A deletes own work photo file', test.attempt(:A,
  $q$delete from storage.objects where bucket_id='contractor-work-photos' and name='a0000000-0000-4000-8000-00000000000a/work-photos/4-a.jpg'$q$), '^ok:1$');
select test.expect('O10 A deletes own photo row', test.attempt(:A,
  $q$delete from public.contractor_work_photos where contractor_id = 'c0000000-0000-4000-8000-00000000000a'$q$), '^ok:1$');
select test.expect('O11 everyone can still read public files', test.attempt(null,
  $q$select 1 from storage.objects where bucket_id in ('logos','contractor-work-photos')$q$), '^ok:[1-9]');

-- Admins keep access to every contractor's media
select test.expect('D1 admin uploads a contractor logo (CRM path)', test.attempt(:admin,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('logos','contractor-logos/c0000000-0000-4000-8000-00000000000a.png','a0000000-0000-4000-8000-000000000001')
     on conflict (bucket_id, name) do update set updated_at = now()$q$), '^ok:1$');
select test.expect('D2 admin uploads a promo-partner logo', test.attempt(:admin,
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('logos','promo-partners/1-x.png','a0000000-0000-4000-8000-000000000001')$q$), '^ok:1$');
select test.expect('D3 admin replaces B''s logo', test.attempt(:admin,
  $q$update storage.objects set updated_at = now() where bucket_id='logos' and name='a0000000-0000-4000-8000-00000000000b/logo/1-b.png'$q$), '^ok:1$');
select test.expect('D4 admin removes B''s work photo', test.attempt(:admin,
  $q$delete from storage.objects where bucket_id='contractor-work-photos' and name like 'a0000000-0000-4000-8000-00000000000b/%'$q$), '^ok:1$');
select test.expect('D5 admin removes legacy root logo', test.attempt(:admin,
  $q$delete from storage.objects where bucket_id='logos' and name='a0000000-0000-4000-8000-00000000000b-1774811482483.png'$q$), '^ok:1$');
select test.expect('D6 admin adds a photo row for B', test.attempt(:admin,
  $q$insert into public.contractor_work_photos (contractor_id, storage_path) values ('c0000000-0000-4000-8000-00000000000b','contractor-logos/x.png')$q$), '^ok:1$');

-- B's own file survived every attack above until the admin step
select test.expect('S1 B''s logo still owned by B', (select owner_id from storage.objects where name='a0000000-0000-4000-8000-00000000000b/logo/1-b.png'), '^a0000000-0000-4000-8000-00000000000b$');
\echo 'Media ownership tests: all passed.'
