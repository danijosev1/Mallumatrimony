/*
  # Add comprehensive profile fields for Kerala matrimonial website

  1. New Columns Added to extended_profiles
    - mother_tongue (text) - User's mother tongue
    - complexion (text) - Physical appearance
    - body_type (text) - Body type description
    - eating_habits (text) - Dietary preferences
    - drinking_habits (text) - Alcohol consumption habits
    - smoking_habits (text) - Smoking habits
    - family_type (text) - Nuclear/Joint family
    - family_status (text) - Economic status
    - father_occupation (text) - Father's profession
    - mother_occupation (text) - Mother's profession
    - siblings (text) - Sibling information
    - family_location (text) - Family's hometown
    - partner_age_min (text) - Minimum partner age preference
    - partner_age_max (text) - Maximum partner age preference
    - partner_height_min (text) - Minimum partner height preference
    - partner_height_max (text) - Maximum partner height preference
    - partner_religion (text) - Partner religion preference
    - partner_caste (text) - Partner caste preference
    - partner_education (text) - Partner education preference
    - partner_profession (text) - Partner profession preference
    - partner_income (text) - Partner income preference
    - partner_location (text) - Partner location preference
    - hobbies (text) - User's hobbies and interests
    - interests (text) - Additional interests
    - life_goals (text) - Life aspirations and goals
    - ideal_partner (text) - Description of ideal partner

  2. Security
    - All existing RLS policies remain intact
    - New columns follow same security model
*/

-- Add comprehensive profile fields to extended_profiles table
DO $$
BEGIN
  -- Personal details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'mother_tongue') THEN
    ALTER TABLE extended_profiles ADD COLUMN mother_tongue text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'complexion') THEN
    ALTER TABLE extended_profiles ADD COLUMN complexion text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'body_type') THEN
    ALTER TABLE extended_profiles ADD COLUMN body_type text;
  END IF;
  
  -- Lifestyle
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'eating_habits') THEN
    ALTER TABLE extended_profiles ADD COLUMN eating_habits text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'drinking_habits') THEN
    ALTER TABLE extended_profiles ADD COLUMN drinking_habits text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'smoking_habits') THEN
    ALTER TABLE extended_profiles ADD COLUMN smoking_habits text;
  END IF;
  
  -- Family details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'family_type') THEN
    ALTER TABLE extended_profiles ADD COLUMN family_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'family_status') THEN
    ALTER TABLE extended_profiles ADD COLUMN family_status text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'father_occupation') THEN
    ALTER TABLE extended_profiles ADD COLUMN father_occupation text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'mother_occupation') THEN
    ALTER TABLE extended_profiles ADD COLUMN mother_occupation text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'siblings') THEN
    ALTER TABLE extended_profiles ADD COLUMN siblings text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'family_location') THEN
    ALTER TABLE extended_profiles ADD COLUMN family_location text;
  END IF;
  
  -- Partner preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'partner_age_min') THEN
    ALTER TABLE extended_profiles ADD COLUMN partner_age_min text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'partner_age_max') THEN
    ALTER TABLE extended_profiles ADD COLUMN partner_age_max text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'partner_height_min') THEN
    ALTER TABLE extended_profiles ADD COLUMN partner_height_min text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'partner_height_max') THEN
    ALTER TABLE extended_profiles ADD COLUMN partner_height_max text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'partner_religion') THEN
    ALTER TABLE extended_profiles ADD COLUMN partner_religion text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'partner_caste') THEN
    ALTER TABLE extended_profiles ADD COLUMN partner_caste text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'partner_education') THEN
    ALTER TABLE extended_profiles ADD COLUMN partner_education text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'partner_profession') THEN
    ALTER TABLE extended_profiles ADD COLUMN partner_profession text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'partner_income') THEN
    ALTER TABLE extended_profiles ADD COLUMN partner_income text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'partner_location') THEN
    ALTER TABLE extended_profiles ADD COLUMN partner_location text;
  END IF;
  
  -- Interests and goals
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'hobbies') THEN
    ALTER TABLE extended_profiles ADD COLUMN hobbies text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'interests') THEN
    ALTER TABLE extended_profiles ADD COLUMN interests text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'life_goals') THEN
    ALTER TABLE extended_profiles ADD COLUMN life_goals text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extended_profiles' AND column_name = 'ideal_partner') THEN
    ALTER TABLE extended_profiles ADD COLUMN ideal_partner text;
  END IF;
END $$;