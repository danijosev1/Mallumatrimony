/*
  # Fix User Registration Database Trigger

  1. Database Functions
    - Create or replace the `handle_new_user` function to automatically create profile records
    - Ensure proper error handling and permissions

  2. Triggers
    - Create trigger to automatically call `handle_new_user` on auth.users insert
    - Handle both profiles and extended_profiles table creation

  3. Security
    - Ensure RLS policies allow the trigger to insert records
    - Add service role permissions where needed
*/

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, membership_plan, "createdAt")
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'free',
    now()
  );

  -- Insert into extended_profiles table
  INSERT INTO public.extended_profiles (id, created_at, updated_at)
  VALUES (
    new.id,
    now(),
    now()
  );

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Add additional RLS policies to ensure service role can insert
DO $$
BEGIN
  -- Check if service role policy exists for profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Service role can insert profiles'
  ) THEN
    CREATE POLICY "Service role can insert profiles"
      ON public.profiles
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;

  -- Check if service role policy exists for extended_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'extended_profiles' 
    AND policyname = 'Service role can insert extended profiles'
  ) THEN
    CREATE POLICY "Service role can insert extended profiles"
      ON public.extended_profiles
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure authenticated users can also insert their own profiles (for manual creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Authenticated users can insert own profile'
  ) THEN
    CREATE POLICY "Authenticated users can insert own profile"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'extended_profiles' 
    AND policyname = 'Authenticated users can insert own extended profile'
  ) THEN
    CREATE POLICY "Authenticated users can insert own extended profile"
      ON public.extended_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;