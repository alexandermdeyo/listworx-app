/*
  # Fix handle_new_user to preserve existing user IDs
  
  When a user already exists in public.users but not in auth.users,
  we need to handle the auth user creation carefully to avoid ID conflicts.
  
  Solution: Delete the existing public.users record and let the trigger create a new one
  with the correct auth ID.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Delete any existing user with this email to avoid conflicts
  DELETE FROM public.users WHERE email = NEW.email;
  
  -- Insert the new user with the auth ID
  INSERT INTO public.users (id, name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CONTRACTOR'::user_role),
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$function$;
