/*
  # Fix extended_profiles table constraint issue

  1. Problem
    - The extended_profiles table may be missing a proper primary key constraint
    - ON CONFLICT operations require a unique constraint to work properly
    - This causes the "no unique or exclusion constraint matching" error

  2. Solution
    - Ensure the extended_profiles table has a proper primary key constraint
    - Add any missing constraints that are needed for upsert operations
    - Verify the table structure matches the expected schema

  3. Safety
    - Use IF NOT EXISTS to avoid errors if constraints already exist
    - Preserve existing data during constraint modifications
*/

-- First, let's ensure the extended_profiles table exists and has the correct structure
CREATE TABLE IF NOT EXISTS extended_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  birth_date date,
  mother_tongue text,
  complexion text,
  body_type text,
  eating_habits text,
  drinking_habits text,
  smoking_habits text,
  family_type text,
  family_status text,
  father_occupation text,
  mother_occupation text,
  siblings text,
  family_location text,
  partner_age_min integer,
  partner_age_max integer,
  partner_height_min text,
  partner_height_max text,
  partner_religion text,
  partner_caste text,
  partner_education text,
  partner_profession text,
  partner_income text,
  partner_location text,
  hobbies text,
  interests text,
  life_goals text,
  ideal_partner text,
  family_details jsonb DEFAULT '{}',
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure the primary key constraint exists (this should already exist, but let's be sure)
DO $$
BEGIN
  -- Check if primary key constraint exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'extended_profiles' 
    AND constraint_type = 'PRIMARY KEY'
    AND table_schema = 'public'
  ) THEN
    -- Add primary key constraint if it doesn't exist
    ALTER TABLE extended_profiles ADD CONSTRAINT extended_profiles_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Ensure the foreign key constraint exists and is properly named
DO $$
BEGIN
  -- Drop existing foreign key if it exists with wrong name
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'extended_profiles' 
    AND constraint_name = 'extended_profiles_id_fkey'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE extended_profiles DROP CONSTRAINT extended_profiles_id_fkey;
  END IF;

  -- Add the foreign key constraint with proper CASCADE options
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'extended_profiles' 
    AND constraint_name = 'extended_profiles_id_profiles_fkey'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE extended_profiles 
    ADD CONSTRAINT extended_profiles_id_profiles_fkey 
    FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE extended_profiles ENABLE ROW LEVEL SECURITY;

-- Ensure proper RLS policies exist
DO $$
BEGIN
  -- Drop existing policies to recreate them properly
  DROP POLICY IF EXISTS "Users can view their own extended profile" ON extended_profiles;
  DROP POLICY IF EXISTS "Users can update their own extended profile" ON extended_profiles;
  DROP POLICY IF EXISTS "Users can insert their own extended profile" ON extended_profiles;
  DROP POLICY IF EXISTS "Users can view other extended profiles" ON extended_profiles;
  DROP POLICY IF EXISTS "Service role can insert extended profiles" ON extended_profiles;
  DROP POLICY IF EXISTS "Service role can update extended profiles" ON extended_profiles;

  -- Create comprehensive RLS policies
  CREATE POLICY "Users can view their own extended profile"
    ON extended_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  CREATE POLICY "Users can update their own extended profile"
    ON extended_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "Users can insert their own extended profile"
    ON extended_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "Users can view other extended profiles"
    ON extended_profiles
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Service role can insert extended profiles"
    ON extended_profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);

  CREATE POLICY "Service role can update extended profiles"
    ON extended_profiles
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_extended_profiles_updated_at ON extended_profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_extended_profiles_family_type ON extended_profiles(family_type);
CREATE INDEX IF NOT EXISTS idx_extended_profiles_partner_age ON extended_profiles(partner_age_min, partner_age_max);

-- Add helpful comment
COMMENT ON TABLE extended_profiles IS 'Extended profile information for users with detailed preferences and family information';
COMMENT ON CONSTRAINT extended_profiles_pkey ON extended_profiles IS 'Primary key constraint for extended_profiles table';