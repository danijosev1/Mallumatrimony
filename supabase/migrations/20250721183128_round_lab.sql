/*
  # Create profiles table and related schema

  1. New Tables
    - `profiles` - Main user profile table
    - `extended_profiles` - Additional profile information
    - `profile_interactions` - User interactions (likes, passes)
    - `profile_views` - Profile view tracking
    - `matches` - User matches
    - `messages` - User messages

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Foreign Keys
    - All tables properly reference profiles.id
    - Proper cascade relationships
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  name text,
  age integer,
  gender text,
  religion text,
  caste text,
  education text,
  profession text,
  location text,
  marital_status text,
  height text,
  income text,
  images text[] DEFAULT '{}',
  short_bio text,
  about text,
  phone text,
  is_premium boolean DEFAULT false,
  membership_plan text DEFAULT 'free',
  key_details text[] DEFAULT '{}',
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create extended_profiles table
CREATE TABLE IF NOT EXISTS extended_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  birth_date date,
  family_details jsonb DEFAULT '{}',
  father_occupation text,
  mother_occupation text,
  siblings text,
  family_type text,
  family_status text,
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
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profile_interactions table
CREATE TABLE IF NOT EXISTS profile_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'pass', 'super_like')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create profile_views table
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE extended_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Extended profiles policies
CREATE POLICY "Users can read all extended profiles"
  ON extended_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own extended profile"
  ON extended_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own extended profile"
  ON extended_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Profile interactions policies
CREATE POLICY "Users can read interactions they're involved in"
  ON profile_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create interactions"
  ON profile_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own interactions"
  ON profile_interactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Profile views policies
CREATE POLICY "Users can read views of their profile"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = viewed_profile_id OR auth.uid() = viewer_id);

CREATE POLICY "Users can create profile views"
  ON profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- Matches policies
CREATE POLICY "Users can read their matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create matches"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their matches"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
CREATE POLICY "Users can read their messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profile_interactions_sender ON profile_interactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_profile_interactions_receiver ON profile_interactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();