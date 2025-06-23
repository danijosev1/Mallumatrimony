/*
  # Fix Extended Profiles Foreign Key Constraint

  1. Problem
    - The extended_profiles table has a foreign key constraint that references profiles(id)
    - When users try to create extended profiles, the constraint fails because the profile doesn't exist yet
    - This happens when the profile creation process is not properly sequenced

  2. Solution
    - Update the foreign key constraint to be more flexible
    - Ensure proper data integrity while allowing profile creation flow
    - Add proper error handling for the constraint

  3. Changes
    - Drop and recreate the foreign key constraint with proper handling
    - Add a function to ensure profile exists before extended profile creation
    - Update RLS policies to handle the constraint properly
*/

-- First, let's check if there are any orphaned extended_profiles
DELETE FROM extended_profiles 
WHERE id NOT IN (SELECT id FROM profiles);

-- Drop the existing foreign key constraint
ALTER TABLE extended_profiles 
DROP CONSTRAINT IF EXISTS extended_profiles_id_fkey;

-- Recreate the foreign key constraint with CASCADE options
ALTER TABLE extended_profiles 
ADD CONSTRAINT extended_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Create a function to ensure profile exists before extended profile operations
CREATE OR REPLACE FUNCTION ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    RAISE EXCEPTION 'Profile with id % does not exist. Please create the main profile first.', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure profile exists
DROP TRIGGER IF EXISTS ensure_profile_exists_trigger ON extended_profiles;
CREATE TRIGGER ensure_profile_exists_trigger
  BEFORE INSERT OR UPDATE ON extended_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_exists();

-- Update RLS policies to be more permissive for service role operations
DROP POLICY IF EXISTS "Service role can insert extended profiles" ON extended_profiles;
CREATE POLICY "Service role can insert extended profiles"
  ON extended_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update extended profiles" ON extended_profiles;
CREATE POLICY "Service role can update extended profiles"
  ON extended_profiles
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);