-- Stage 2 photo library (20261116000100_photo_library.sql)
\set admin '\'a0000000-0000-4000-8000-0000000000ad\''
\set contractor '\'a0000000-0000-4000-8000-0000000000c1\''

-- P1 uploads start pending even if the caller tries to approve on insert
set role service_role;
insert into photo_assets (id, storage_path, public_url, original_filename, mime_type, file_size, width, height, sha256, status, reviewed_by)
values ('b0000000-0000-4000-8000-000000000001', 'library/2026/11/a-photo.jpg', 'https://x.example/library/2026/11/a-photo.jpg', 'a.jpg', 'image/jpeg', 1000, 1536, 1024,
        repeat('a', 64), 'approved', 'a0000000-0000-4000-8000-0000000000ad');
insert into photo_assets (id, storage_path, public_url, original_filename, mime_type, file_size, width, height, sha256, is_ai_generated, usage_rights, alt_text)
values ('b0000000-0000-4000-8000-000000000002', 'library/2026/11/ai.png', 'https://x.example/library/2026/11/ai.png', 'ai.png', 'image/png', 2000, 1536, 1024,
        repeat('b', 64), true, 'ai_generated', 'Contractor showing a license card');
reset role;
do $$ begin
  if (select status from photo_assets where id='b0000000-0000-4000-8000-000000000001') <> 'pending'
     or (select reviewed_by from photo_assets where id='b0000000-0000-4000-8000-000000000001') is not null then
    raise exception 'P1 insert could set approval';
  end if;
  raise notice 'PASS P1 new photos always start pending';
end $$;

-- P2 server cannot change approval, the stored file, or delete rows directly
set role service_role;
do $$ begin
  begin update photo_assets set status='approved' where id='b0000000-0000-4000-8000-000000000001'; raise exception 'P2a'; exception when insufficient_privilege then null; end;
  begin update photo_assets set sha256=repeat('c',64) where id='b0000000-0000-4000-8000-000000000001'; raise exception 'P2b'; exception when insufficient_privilege then null; end;
  begin update photo_assets set storage_path='library/other.jpg' where id='b0000000-0000-4000-8000-000000000001'; raise exception 'P2c'; exception when insufficient_privilege then null; end;
  begin delete from photo_assets where id='b0000000-0000-4000-8000-000000000001'; raise exception 'P2d'; exception when insufficient_privilege then null; end;
  begin insert into photo_review_log (action) values ('forged'); raise exception 'P2e'; exception when insufficient_privilege then null; end;
  update photo_assets set alt_text='Roofer inspecting shingles', tags=array['roofing','C08'], intended_uses=array['blog_featured'], focus_x=40, focus_y=20
   where id='b0000000-0000-4000-8000-000000000001';
  raise notice 'PASS P2 server edits metadata only; approval, file and deletion locked';
end $$;
reset role;

-- P3 approval rules: alt text + rights; AI needs the checklist; rejection needs a reason
set role service_role;
do $$
declare r photo_assets;
begin
  begin perform photo_review('b0000000-0000-4000-8000-000000000001','approve','a0000000-0000-4000-8000-0000000000ad'); raise exception 'P3a unknown rights approved';
  exception when sqlstate '22023' then null; end;
  update photo_assets set usage_rights='owned' where id='b0000000-0000-4000-8000-000000000001';
  r := photo_review('b0000000-0000-4000-8000-000000000001','approve','a0000000-0000-4000-8000-0000000000ad','Looks good');
  if r.status <> 'approved' or r.reviewed_by is null then raise exception 'P3b'; end if;

  begin perform photo_review('b0000000-0000-4000-8000-000000000002','approve','a0000000-0000-4000-8000-0000000000ad', null, '{"hands_faces_natural":true}'); raise exception 'P3c AI approved without full checklist';
  exception when sqlstate '22023' then null; end;
  begin perform photo_review('b0000000-0000-4000-8000-000000000002','reject','a0000000-0000-4000-8000-0000000000ad', '  '); raise exception 'P3d reject without reason';
  exception when sqlstate '22023' then null; end;
  begin perform photo_review('b0000000-0000-4000-8000-000000000002','approve', null, null, '{"hands_faces_natural":true,"text_and_signs_correct":true,"not_presented_as_real":true}'); raise exception 'P3e no reviewer';
  exception when sqlstate '22023' then null; end;
  r := photo_review('b0000000-0000-4000-8000-000000000002','approve','a0000000-0000-4000-8000-0000000000ad', 'Hands checked',
       '{"hands_faces_natural":true,"text_and_signs_correct":true,"not_presented_as_real":true}');
  if r.status <> 'approved' then raise exception 'P3f'; end if;
  raise notice 'PASS P3 approval needs alt text, rights, reviewer; AI needs all three checks; reject needs reason';
end $$;
reset role;

-- P4 changing AI flag or rights after approval sends the photo back to pending (and is logged)
set role service_role;
update photo_assets set usage_rights='licensed' where id='b0000000-0000-4000-8000-000000000002';
update photo_assets set description='new words' where id='b0000000-0000-4000-8000-000000000001';
reset role;
do $$ begin
  if (select status from photo_assets where id='b0000000-0000-4000-8000-000000000002') <> 'pending' then raise exception 'P4a'; end if;
  if (select status from photo_assets where id='b0000000-0000-4000-8000-000000000001') <> 'approved' then raise exception 'P4b description edit unapproved'; end if;
  if not exists (select 1 from photo_review_log where asset_id='b0000000-0000-4000-8000-000000000002' and action='auto_reset') then raise exception 'P4c'; end if;
  if (select count(*) from photo_review_log where action in ('approve','reject','reset')) <> 2 then raise exception 'P4d log count'; end if;
  raise notice 'PASS P4 rights/AI change after approval resets to pending; every review logged';
end $$;

-- P5 database constraints
do $$ begin
  begin insert into photo_assets (storage_path, public_url, original_filename, mime_type, file_size, width, height, sha256)
        values ('elsewhere/x.jpg','u','x','image/jpeg',1,1,1,repeat('d',64)); raise exception 'P5a'; exception when check_violation then null; end;
  begin insert into photo_assets (storage_path, public_url, original_filename, mime_type, file_size, width, height, sha256)
        values ('library/a-photo-dup.jpg','u','x','image/jpeg',1,1,1,'nothex'); raise exception 'P5b'; exception when check_violation then null; end;
  begin update photo_assets set intended_uses=array['billboard'] where id='b0000000-0000-4000-8000-000000000001'; raise exception 'P5c'; exception when check_violation then null; end;
  begin insert into photo_assets (storage_path, public_url, original_filename, mime_type, file_size, width, height, sha256)
        values ('library/2026/11/a-photo.jpg','u','x','image/jpeg',1,1,1,repeat('e',64)); raise exception 'P5d overwrite'; exception when unique_violation then null; end;
  raise notice 'PASS P5 library paths only, valid hashes and uses, no path reuse';
end $$;

-- P6 visitors and non-admins see nothing; admins can read
set role anon;
do $$ begin
  begin perform 1 from photo_assets; raise exception 'P6a anon read'; exception when insufficient_privilege then null; end;
  begin perform photo_review('b0000000-0000-4000-8000-000000000001','reject', null, 'x'); raise exception 'P6b'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :contractor, 'role', 'authenticated')::text, false);
do $$ begin
  if (select count(*) from photo_assets) <> 0 or (select count(*) from photo_review_log) <> 0 then raise exception 'P6c contractor sees photos'; end if;
  begin update photo_assets set title='x'; raise exception 'P6d'; exception when insufficient_privilege then null; end;
  begin perform photo_review('b0000000-0000-4000-8000-000000000001','reject', 'a0000000-0000-4000-8000-0000000000c1', 'x'); raise exception 'P6e'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims', json_build_object('sub', :admin, 'role', 'authenticated')::text, false);
do $$ begin
  if (select count(*) from photo_assets) <> 2 then raise exception 'P6f admin cannot read'; end if;
  begin update photo_assets set title='x'; raise exception 'P6g admin direct write'; exception when insufficient_privilege then null; end;
  raise notice 'PASS P6 anon and contractors blocked; admins read; writes only via the server';
end $$;
reset role;
select set_config('request.jwt.claims', '', false);
