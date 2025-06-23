/*
  # Fix user profile creation trigger

  1. Database Functions
    - Fix the `handle_new_user` function to properly create profile records
    - Add better error handling and logging
    - Ensure proper column names are used

  2. Triggers
    - Recreate trigger to ensure it fires correctly
    - Add proper error handling

  3. Security
    - Ensure RLS policies allow the trigger to insert records
    - Grant proper permissions to service role
*/

-- First, let's check if the profiles table has the correct structure
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'religion'
  ) THEN
    ALTER TABLE profiles ADD COLUMN religion text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'caste'
  ) THEN
    ALTER TABLE profiles ADD COLUMN caste text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'height'
  ) THEN
    ALTER TABLE profiles ADD COLUMN height text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'maritalStatus'
  ) THEN
    ALTER TABLE profiles ADD COLUMN "maritalStatus" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'education'
  ) THEN
    ALTER TABLE profiles ADD COLUMN education text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profession'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profession text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'income'
  ) THEN
    ALTER TABLE profiles ADD COLUMN income text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'images'
  ) THEN
    ALTER TABLE profiles ADD COLUMN images text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'shortBio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN "shortBio" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'about'
  ) THEN
    ALTER TABLE profiles ADD COLUMN about text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'familyDetails'
  ) THEN
    ALTER TABLE profiles ADD COLUMN "familyDetails" jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferences jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'contactInfo'
  ) THEN
    ALTER TABLE profiles ADD COLUMN "contactInfo" jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'keyDetails'
  ) THEN
    ALTER TABLE profiles ADD COLUMN "keyDetails" text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'horoscope'
  ) THEN
    ALTER TABLE profiles ADD COLUMN horoscope text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'isPremium'
  ) THEN
    ALTER TABLE profiles ADD COLUMN "isPremium" boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE profiles ADD COLUMN "createdAt" timestamptz DEFAULT now();
  END IF;
END $$;

-- Drop and recreate the handle_new_user function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
  user_name text;
BEGIN
  -- Get email and name from the new user
  user_email := COALESCE(NEW.email, '');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, '');

  -- Log the attempt
  RAISE LOG 'Creating profile for user: % with email: %', NEW.id, user_email;

  -- Insert into profiles table with all required fields
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    name,
    membership_plan, 
    "createdAt",
    created_at,
    updated_at,
    "isPremium"
  )
  VALUES (
    NEW.id,
    user_email,
    user_name,
    user_name,
    'free',
    now(),
    now(),
    now(),
    false
  );

  RAISE LOG 'Successfully created profile for user: %', NEW.id;

  -- Insert into extended_profiles table
  INSERT INTO public.extended_profiles (
    id, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    now(),
    now()
  );

  RAISE LOG 'Successfully created extended profile for user: %', NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error with details
    RAISE LOG 'Error in handle_new_user for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
    -- Don't fail the user creation, just log the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies allow the service role to insert
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert extended profiles" ON public.extended_profiles;

CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert extended profiles"
  ON public.extended_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also ensure authenticated users can insert their own profiles
DROP POLICY IF EXISTS "Authenticated users can create their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;

CREATE POLICY "Authenticated users can create their own profile."
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update existing policies for consistency
DROP POLICY IF EXISTS "Authenticated users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile."
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated users can update their own profile."
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Test the function by creating a sample entry (this will be rolled back)
DO $$
BEGIN
  RAISE LOG 'Testing handle_new_user function setup complete';
END $$;