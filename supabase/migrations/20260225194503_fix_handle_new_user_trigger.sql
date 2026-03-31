/*
  # Fix handle_new_user trigger to handle existing users
  
  Updates the handle_new_user function to properly sync auth users with existing public.users records.
  
  Changes:
  - Modified ON CONFLICT clause to update all relevant fields
  - Ensures existing users in public.users can have auth accounts created
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.users (id, name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CONTRACTOR'::user_role),
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    id = EXCLUDED.id,
    name = COALESCE(EXCLUDED.name, users.name),
    role = COALESCE(EXCLUDED.role, users.role),
    updated_at = NOW();

  RETURN NEW;
END;
$function$;
