-- Fix profile completion issues by ensuring proper column names and constraints

-- First, let's make sure we have the correct column names in the profiles table
DO $$
BEGIN
  -- Add missing columns with correct names if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'marital_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN marital_status text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'short_bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN short_bio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'key_details'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN key_details text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'family_details'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN family_details jsonb DEFAULT '{}';
  END IF;

  -- Remove any conflicting columns with wrong names
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'maritalStatus'
  ) THEN
    -- Copy data if exists, then drop the column
    UPDATE public.profiles SET marital_status = "maritalStatus" WHERE "maritalStatus" IS NOT NULL;
    ALTER TABLE public.profiles DROP COLUMN "maritalStatus";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'shortBio'
  ) THEN
    UPDATE public.profiles SET short_bio = "shortBio" WHERE "shortBio" IS NOT NULL;
    ALTER TABLE public.profiles DROP COLUMN "shortBio";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'keyDetails'
  ) THEN
    UPDATE public.profiles SET key_details = "keyDetails" WHERE "keyDetails" IS NOT NULL;
    ALTER TABLE public.profiles DROP COLUMN "keyDetails";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'familyDetails'
  ) THEN
    UPDATE public.profiles SET family_details = "familyDetails" WHERE "familyDetails" IS NOT NULL;
    ALTER TABLE public.profiles DROP COLUMN "familyDetails";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'contactInfo'
  ) THEN
    UPDATE public.profiles SET contact_info = "contactInfo" WHERE "contactInfo" IS NOT NULL;
    ALTER TABLE public.profiles DROP COLUMN "contactInfo";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'isPremium'
  ) THEN
    UPDATE public.profiles SET is_premium = "isPremium" WHERE "isPremium" IS NOT NULL;
    ALTER TABLE public.profiles DROP COLUMN "isPremium";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN "createdAt";
  END IF;
END $$;

-- Ensure all required columns exist with proper defaults
ALTER TABLE public.profiles 
  ALTER COLUMN images SET DEFAULT '{}',
  ALTER COLUMN key_details SET DEFAULT '{}',
  ALTER COLUMN family_details SET DEFAULT '{}',
  ALTER COLUMN preferences SET DEFAULT '{}',
  ALTER COLUMN contact_info SET DEFAULT '{}';

-- Update the handle_new_user function to use correct column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
  user_name text;
  provider_name text;
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

  -- Insert into profiles table with correct column names
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

  -- Insert into extended_profiles table
  INSERT INTO public.extended_profiles (
    id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    now(),
    now()
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile records when a new user signs up, using correct column names';