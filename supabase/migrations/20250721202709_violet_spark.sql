/*
  # Create extended profiles table for detailed user information

  1. New Tables
    - `extended_profiles`
      - `id` (uuid, primary key, references profiles)
      - `birth_date` (date)
      - `mother_tongue` (text)
      - `complexion` (text)
      - `body_type` (text)
      - `eating_habits` (text)
      - `drinking_habits` (text)
      - `smoking_habits` (text)
      - `family_type` (text)
      - `family_status` (text)
      - `father_occupation` (text)
      - `mother_occupation` (text)
      - `siblings` (text)
      - `family_location` (text)
      - Partner preference fields
      - `hobbies` (text)
      - `interests` (text)
      - `life_goals` (text)
      - `ideal_partner` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `extended_profiles` table
    - Add policies for users to manage their own extended profiles

  3. Indexes
    - Create indexes for filtering and search operations
*/

-- Create extended_profiles table
CREATE TABLE IF NOT EXISTS extended_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  birth_date date,
  mother_tongue text,
  complexion text CHECK (complexion IN ('Very Fair', 'Fair', 'Wheatish', 'Dark', 'Very Dark')),
  body_type text CHECK (body_type IN ('Slim', 'Average', 'Athletic', 'Heavy')),
  eating_habits text CHECK (eating_habits IN ('Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan')),
  drinking_habits text CHECK (drinking_habits IN ('Never', 'Occasionally', 'Socially', 'Regularly')),
  smoking_habits text CHECK (smoking_habits IN ('Never', 'Occasionally', 'Socially', 'Regularly')),
  family_type text CHECK (family_type IN ('Nuclear Family', 'Joint Family', 'Extended Family')),
  family_status text CHECK (family_status IN ('Middle Class', 'Upper Middle Class', 'Rich', 'Affluent')),
  father_occupation text,
  mother_occupation text,
  siblings text,
  family_location text,
  -- Partner preferences
  partner_age_min integer CHECK (partner_age_min >= 18),
  partner_age_max integer CHECK (partner_age_max <= 100),
  partner_height_min text,
  partner_height_max text,
  partner_religion text,
  partner_caste text,
  partner_education text,
  partner_profession text,
  partner_income text,
  partner_location text,
  -- Additional fields
  hobbies text,
  interests text,
  life_goals text,
  ideal_partner text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE extended_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own extended profile"
  ON extended_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own extended profile"
  ON extended_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_extended_profiles_birth_date ON extended_profiles(birth_date);
CREATE INDEX IF NOT EXISTS idx_extended_profiles_mother_tongue ON extended_profiles(mother_tongue);
CREATE INDEX IF NOT EXISTS idx_extended_profiles_family_type ON extended_profiles(family_type);
CREATE INDEX IF NOT EXISTS idx_extended_profiles_partner_age_range ON extended_profiles(partner_age_min, partner_age_max);
CREATE INDEX IF NOT EXISTS idx_extended_profiles_partner_religion ON extended_profiles(partner_religion);

-- Create trigger for updated_at
CREATE TRIGGER update_extended_profiles_updated_at
  BEFORE UPDATE ON extended_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();