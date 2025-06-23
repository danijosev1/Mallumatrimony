/*
  # Configure Google OAuth and Contact Messages

  1. New Tables
    - `contact_messages` for storing contact form submissions
    
  2. Security
    - Enable RLS on contact_messages table
    - Add policies for anonymous and authenticated users to submit messages
    
  3. Notes
    - Google OAuth configuration must be done in Supabase Dashboard:
      1. Go to Authentication > Providers
      2. Enable Google provider
      3. Add your Google OAuth client ID and secret
      4. Set redirect URL to: https://your-project.supabase.co/auth/v1/callback
      5. In Google Cloud Console, add authorized redirect URIs
*/

-- Create contact_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on contact_messages table
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for contact messages
DROP POLICY IF EXISTS "Allow anonymous users to insert contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert contact messages" ON contact_messages;

CREATE POLICY "Allow anonymous users to insert contact messages"
  ON contact_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert contact messages"
  ON contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update the handle_new_user function to handle Google OAuth users better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
  user_name text;
  provider_name text;
BEGIN
  -- Get email, name, and provider from the new user
  user_email := COALESCE(NEW.email, '');
  provider_name := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  
  -- Extract name based on provider
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

  -- Log the attempt
  RAISE LOG 'Creating profile for % user: % with email: %', provider_name, NEW.id, user_email;

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

  RAISE LOG 'Successfully created profile for % user: %', provider_name, NEW.id;

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

  RAISE LOG 'Successfully created extended profile for % user: %', provider_name, NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error with details
    RAISE LOG 'Error in handle_new_user for % user %: % - %', provider_name, NEW.id, SQLSTATE, SQLERRM;
    -- Don't fail the user creation, just log the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile records when a new user signs up via email or OAuth providers like Google';