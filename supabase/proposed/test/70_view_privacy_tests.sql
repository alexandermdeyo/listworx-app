-- active_contractors_view privacy (Stage 1A). Runs after 20261114000100.
do $$ begin
  if has_column_privilege('anon','public.active_contractors_view','email','select') then raise exception 'P1 anon can read email'; end if;
  if has_column_privilege('anon','public.active_contractors_view','phone','select') then raise exception 'P2 anon can read phone'; end if;
  if has_column_privilege('authenticated','public.active_contractors_view','email','select') then raise exception 'P3 authenticated can read email'; end if;
  if not has_column_privilege('anon','public.active_contractors_view','contractor_id','select') then raise exception 'P4 anon lost contractor_id'; end if;
  if not has_column_privilege('authenticated','public.active_contractors_view','contractor_id','select') then raise exception 'P5 authenticated lost contractor_id'; end if;
  if not has_table_privilege('service_role','public.active_contractors_view','select') then raise exception 'P6 service_role lost access'; end if;
  if has_table_privilege('anon','public.active_contractors_view','insert') or has_table_privilege('anon','public.active_contractors_view','delete') then raise exception 'P7 anon write privileges remain'; end if;
  raise notice 'PASS P1-P7 view privileges';
end $$;
-- behave like the website and like an outsider
set role anon;
do $$ declare n int; begin
  select count(*) into n from public.active_contractors_view;  -- count(*) needs no column privilege
  perform contractor_id from public.active_contractors_view;
  raise notice 'PASS P8 anon can read contractor_id (% rows)', n;
end $$;
do $$ begin
  begin
    perform email from public.active_contractors_view;
    raise exception 'P9 anon read email';
  exception when insufficient_privilege then raise notice 'PASS P9 anon blocked from email';
  end;
end $$;
reset role;
