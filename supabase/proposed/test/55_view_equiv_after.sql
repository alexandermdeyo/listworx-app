refresh materialized view public.active_contractors_view;
do $$ declare n_before int; n_after int; diff int; begin
  select count(*) into n_before from public._view_before;
  select count(*) into n_after from public.active_contractors_view;
  select count(*) into diff from (
    (select contractor_id, subscription_status from public._view_before
     except select contractor_id, subscription_status::text from public.active_contractors_view)
    union all
    (select contractor_id, subscription_status::text from public.active_contractors_view
     except select contractor_id, subscription_status from public._view_before)) x;
  if n_before = 0 then raise exception 'V5 snapshot empty'; end if;
  if diff <> 0 or n_before <> n_after then raise exception 'V5 view differs: before % after % diff %', n_before, n_after, diff; end if;
  raise notice 'PASS V5 view returns the same % contractors (lowercase status) as before', n_after;
end $$;
