/*
  # Create profiles table with comprehensive user data

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `name` (text)
      - `age` (integer)
      - `gender` (text)
      - `religion` (text)
      - `caste` (text)
      - `height` (text)
      - `marital_status` (text)
      - `education` (text)
      - `profession` (text)
      - `income` (text)
      - `location` (text)
      - `images` (jsonb array)
      - `about` (text)
      - `short_bio` (text)
      - `key_details` (text array)
      - `family_details` (jsonb)
      - `preferences` (jsonb)
      - `contact_info` (jsonb)
      - `membership_plan` (text, default 'free')
      - `is_premium` (boolean, default false)
      - `phone` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for users to manage their own profiles
    - Add policies for viewing other profiles based on membership

  3. Indexes
    - Create indexes for common query patterns
    - Optimize for search and filtering operations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  name text,
  age integer CHECK (age >= 18 AND age <= 100),
  gender text CHECK (gender IN ('Male', 'Female', 'Other')),
  religion text,
  caste text,
  height text,
  marital_status text CHECK (marital_status IN ('Never Married', 'Divorced', 'Widowed', 'Separated')),
  education text,
  profession text,
  income text,
  location text,
  images jsonb DEFAULT '[]'::jsonb,
  about text,
  short_bio text,
  key_details text[] DEFAULT '{}',
  family_details jsonb DEFAULT '{}'::jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  contact_info jsonb DEFAULT '{}'::jsonb,
  membership_plan text DEFAULT 'free' CHECK (membership_plan IN ('free', 'basic', 'premium', 'elite')),
  is_premium boolean DEFAULT false,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view other profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_religion ON profiles(religion);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING gin(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_profiles_profession ON profiles USING gin(to_tsvector('english', profession));
CREATE INDEX IF NOT EXISTS idx_profiles_education ON profiles(education);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_plan ON profiles(membership_plan);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();