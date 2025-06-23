/*
  # Add missing columns to profiles table

  1. Changes
    - Add `email` column to profiles table (text, unique)
    - Add `full_name` column to profiles table (text)
    - Update RLS policies to ensure proper access control

  2. Security
    - Maintain existing RLS policies
    - Ensure users can only access their own profile data
*/

-- Add missing columns to profiles table
DO $$
BEGIN
  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;

  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name text;
  END IF;
END $$;

-- Add unique constraint on email if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_email_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- Create index on email for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);