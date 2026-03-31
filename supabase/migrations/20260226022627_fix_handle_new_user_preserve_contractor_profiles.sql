/*
  # Fix handle_new_user to preserve contractor profiles

  When admin approves an application, it creates:
  1. User record in public.users
  2. Contractor profile with APPROVED status
  3. Auth user (which triggers handle_new_user)

  The current handle_new_user DELETES the user record, which cascades to delete the contractor profile!

  Solution: Check if user exists. If yes, just update the ID. Don't delete!
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  existing_user_record RECORD;
BEGIN
  -- Check if a user with this email already exists
  SELECT * INTO existing_user_record 
  FROM public.users 
  WHERE email = NEW.email;
  
  IF existing_user_record.id IS NOT NULL THEN
    -- User exists! Update the ID to match auth.users ID
    -- This preserves all related records (contractor_profiles, etc.)
    UPDATE public.users 
    SET id = NEW.id,
        updated_at = NOW()
    WHERE email = NEW.email;
    
    -- Update contractor_profiles user_id if exists
    UPDATE public.contractor_profiles
    SET user_id = NEW.id
    WHERE user_id = existing_user_record.id;
    
  ELSE
    -- No existing user, create new record
    INSERT INTO public.users (id, name, email, role, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CONTRACTOR'::user_role),
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$function$;