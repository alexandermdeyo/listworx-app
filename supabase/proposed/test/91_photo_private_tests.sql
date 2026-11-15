-- Stage 2 follow-up: private originals and the public copy (20261116000200_photo_private_storage.sql)
-- Runs after 90_photo_library_tests.sql (its two rows were created in the old public layout).

-- Q1 older rows keep working: their file is recorded as the live public copy, nothing lost
do $$ begin
  if exists (select 1 from photo_assets where storage_bucket = 'site-media' and (public_path is distinct from storage_path or not public_copy_live)) then
    raise exception 'Q1 older rows not mapped';
  end if;
  raise notice 'PASS Q1 older photos mapped to their existing public file';
end $$;

-- Q2 new uploads are private: public fields forced empty, original must be under originals/
set role service_role;
insert into photo_assets (id, storage_path, public_url, public_path, public_copy_live, original_filename, mime_type, file_size, width, height, sha256, usage_rights, alt_text)
values ('b0000000-0000-4000-8000-000000000011', 'originals/2026/11/new.jpg', 'https://x/library/new.jpg', 'library/new.jpg', true, 'new.jpg', 'image/jpeg', 10, 1600, 1000, repeat('f', 64), 'owned', 'A test photo');
reset role;
do $$ begin
  if (select storage_bucket || '|' || coalesce(public_url,'-') || '|' || coalesce(public_path,'-') || '|' || public_copy_live::text
      from photo_assets where id='b0000000-0000-4000-8000-000000000011') <> 'photo-library|-|-|false' then
    raise exception 'Q2 new upload not private';
  end if;
  begin insert into photo_assets (storage_path, original_filename, mime_type, file_size, width, height, sha256)
        values ('library/2026/11/sneaky.jpg', 'x', 'image/jpeg', 1, 1, 1, repeat('9', 64)); raise exception 'Q2b'; exception when check_violation then null; end;
  raise notice 'PASS Q2 new uploads start private (originals/ in photo-library, no public copy)';
end $$;

-- Q3 the server cannot fake a public copy or move a file directly
set role service_role;
do $$ begin
  begin update photo_assets set public_copy_live = true, public_url = 'u', public_path = 'library/x.jpg' where id='b0000000-0000-4000-8000-000000000011'; raise exception 'Q3a'; exception when insufficient_privilege then null; end;
  begin update photo_assets set storage_bucket = 'site-media', storage_path = 'library/x.jpg' where id='b0000000-0000-4000-8000-000000000011'; raise exception 'Q3b'; exception when insufficient_privilege then null; end;
  raise notice 'PASS Q3 public copy and file location change only through the publishing functions';
end $$;

-- Q4 a public copy can only be recorded for an approved, active photo
do $$
declare r photo_assets;
begin
  begin perform photo_public_copy('b0000000-0000-4000-8000-000000000011', 'created', 'a0000000-0000-4000-8000-0000000000ad', 'library/new.jpg', 'https://x/library/new.jpg'); raise exception 'Q4a pending got a copy';
  exception when sqlstate '22023' then null; end;
  perform photo_review('b0000000-0000-4000-8000-000000000011', 'approve', 'a0000000-0000-4000-8000-0000000000ad', 'ok');
  begin perform photo_public_copy('b0000000-0000-4000-8000-000000000011', 'created', 'a0000000-0000-4000-8000-0000000000ad', 'originals/new.jpg', 'u'); raise exception 'Q4b copy outside library/';
  exception when sqlstate '22023' then null; end;
  r := photo_public_copy('b0000000-0000-4000-8000-000000000011', 'created', 'a0000000-0000-4000-8000-0000000000ad', 'library/2026/11/new.jpg', 'https://x/library/2026/11/new.jpg');
  if not r.public_copy_live or r.public_url is null then raise exception 'Q4c'; end if;
  raise notice 'PASS Q4 public copy only for approved photos, only under library/';
end $$;
reset role;

-- Q5 rejected while unused: copy removed, address kept for the publish guard; retained is logged
set role service_role;
do $$
declare r photo_assets;
begin
  perform photo_review('b0000000-0000-4000-8000-000000000011', 'reject', 'a0000000-0000-4000-8000-0000000000ad', 'Hands look wrong');
  r := photo_public_copy('b0000000-0000-4000-8000-000000000011', 'removed', 'a0000000-0000-4000-8000-0000000000ad', null, null, 'Not used by published articles');
  if r.public_copy_live or r.public_url is null or r.status <> 'rejected' then raise exception 'Q5a'; end if;
  r := photo_public_copy('b0000000-0000-4000-8000-000000000001', 'retained', 'a0000000-0000-4000-8000-0000000000ad', null, null, 'Used by: Published post');
  if (select count(*) from photo_review_log where action in ('public_copy_created','public_copy_removed','public_copy_retained')) <> 3 then raise exception 'Q5b log'; end if;
  raise notice 'PASS Q5 withdrawal keeps the original and the address; every copy decision logged';
end $$;
reset role;

-- Q6 securing an older photo: only from the public bucket, only into originals/
set role service_role;
do $$
declare r photo_assets;
begin
  begin perform photo_secure_original('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-0000000000ad', 'originals/x.jpg'); raise exception 'Q6a'; exception when sqlstate '22023' then null; end;
  begin perform photo_secure_original('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000ad', 'library/x.jpg'); raise exception 'Q6b'; exception when sqlstate '22023' then null; end;
  r := photo_secure_original('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000ad', 'originals/2026/11/a-photo.jpg');
  if r.storage_bucket <> 'photo-library' or not r.public_copy_live or r.public_path <> 'library/2026/11/a-photo.jpg' then raise exception 'Q6c'; end if;
  raise notice 'PASS Q6 older originals move to private storage; their public copy record is unchanged';
end $$;
reset role;

-- Q7 visitors and signed-in users cannot run the publishing functions
set role authenticated;
do $$ begin
  begin perform photo_public_copy('b0000000-0000-4000-8000-000000000011', 'removed', null); raise exception 'Q7a'; exception when insufficient_privilege then null; end;
  begin perform photo_secure_original('b0000000-0000-4000-8000-000000000001', null, 'originals/y.jpg'); raise exception 'Q7b'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set role anon;
do $$ begin
  begin perform photo_public_copy('b0000000-0000-4000-8000-000000000011', 'removed', null); raise exception 'Q7c'; exception when insufficient_privilege then null; end;
  raise notice 'PASS Q7 only the website server can record public copies';
end $$;
reset role;
