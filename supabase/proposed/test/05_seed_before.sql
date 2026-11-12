-- Rows that exist BEFORE the migration, to check defaults on existing data.
insert into public.users (id, role, name, email) values
  ('a0000000-0000-4000-8000-000000000001', 'ADMIN', 'Admin', 'admin@example.com'),
  ('a0000000-0000-4000-8000-000000000002', 'CONTRACTOR', 'Pro A', 'a@example.com'),
  ('a0000000-0000-4000-8000-000000000003', 'CONTRACTOR', 'Pro B', 'b@example.com'),
  ('a0000000-0000-4000-8000-000000000004', 'CONTRACTOR', 'Pro C', 'c@example.com');
insert into public.contractor_profiles (id, user_id, company_name, owner_name, partner_status, ironclad_accepted)
values ('b0000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-000000000003', 'B Co', 'Bob', 'active', true);
