/*
  # Fix profile creation and foreign key constraint issues
  
  1. Changes
     - Modify the handle_new_user function to ensure profiles are created before extended profiles
     - Add explicit error handling and transaction management
     - Fix the order of operations to prevent foreign key constraint violations
     - Add logging for better debugging
*/

-- Improve the handle_new_user function with better error handling and transaction management
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
  user_name text;
  provider_name text;
BEGIN
  -- Start a transaction to ensure both profile and extended profile are created together
  -- or neither is created if there's an error
  BEGIN
    -- Extract user information
    user_email := COALESCE(NEW.email, '');
    provider_name := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
    
    -- Get name based on provider
    IF provider_name = 'google' THEN
      user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(user_email, '@', 1)
      );
    ELSE
      user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(user_email, '@', 1)
      );
    END IF;

    RAISE LOG 'Creating profile for % user: % with email: %', provider_name, NEW.id, user_email;

    -- First, insert into profiles table with correct column names
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      name,
      membership_plan,
      is_premium,
      images,
      key_details,
      family_details,
      preferences,
      contact_info,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      user_email,
      user_name,
      user_name,
      'free',
      false,
      '{}',
      '{}',
      '{}',
      '{}',
      '{}',
      now(),
      now()
    );

    RAISE LOG 'Successfully created profile for % user: %', provider_name, NEW.id;

    -- Then, insert into extended_profiles table
    INSERT INTO public.extended_profiles (
      id,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      now(),
      now()
    );

    RAISE LOG 'Successfully created extended profile for % user: %', provider_name, NEW.id;

    -- If we get here, both inserts succeeded
    RETURN NEW;
  EXCEPTION
    WHEN others THEN
      -- Log the error with details
      RAISE LOG 'Error in handle_new_user for % user %: % - %', provider_name, NEW.id, SQLSTATE, SQLERRM;
      
      -- Don't fail the user creation, just log the error
      RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile records when a new user signs up, with improved error handling';

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to fix any existing users that might be missing profiles or extended profiles
CREATE OR REPLACE FUNCTION fix_missing_profiles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find users who have auth accounts but no profiles
  FOR user_record IN 
    SELECT au.id, au.email 
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Create missing profile
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      name,
      membership_plan,
      is_premium,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      user_record.email,
      split_part(user_record.email, '@', 1),
      split_part(user_record.email, '@', 1),
      'free',
      false,
      now(),
      now()
    );
    
    RAISE LOG 'Created missing profile for user: %', user_record.id;
  END LOOP;

  -- Find profiles that don't have extended profiles
  FOR user_record IN 
    SELECT p.id 
    FROM public.profiles p
    LEFT JOIN public.extended_profiles ep ON p.id = ep.id
    WHERE ep.id IS NULL
  LOOP
    -- Create missing extended profile
    INSERT INTO public.extended_profiles (
      id,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      now(),
      now()
    );
    
    RAISE LOG 'Created missing extended profile for user: %', user_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the fix function to repair any existing issues
SELECT fix_missing_profiles();

-- Drop the function after use
DROP FUNCTION fix_missing_profiles();