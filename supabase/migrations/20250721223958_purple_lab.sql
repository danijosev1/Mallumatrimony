/*
  # Complete Supabase Schema Migration
  
  This migration recreates the entire database schema for the Mallu Matrimony application.
  
  ## Tables Created:
  1. profiles - Main user profiles
  2. extended_profiles - Detailed profile information
  3. profile_interactions - Likes, passes, super likes
  4. profile_views - Profile view tracking
  5. matches - Mutual matches between users
  6. messages - Chat messages between users
  7. contact_messages - Contact form submissions
  
  ## Security:
  - RLS enabled on all tables
  - Policies for authenticated users
  - Privacy controls for profile visibility
  
  ## Functions:
  - get_recommendations - Smart matching algorithm
  - get_user_matches - User's mutual matches
  - get_conversation_list - Chat conversations
  - get_user_dashboard_stats - Dashboard statistics
  - search_profiles - Advanced profile search
  - mark_messages_read - Mark messages as read
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  name text,
  age integer,
  gender text,
  religion text,
  caste text,
  height text,
  marital_status text,
  education text,
  profession text,
  income text,
  location text,
  about text,
  short_bio text,
  images text[] DEFAULT '{}',
  key_details text[] DEFAULT '{}',
  family_details jsonb DEFAULT '{}',
  preferences jsonb DEFAULT '{}',
  contact_info jsonb DEFAULT '{}',
  membership_plan text DEFAULT 'free' CHECK (membership_plan IN ('free', 'basic', 'premium', 'elite')),
  is_premium boolean DEFAULT false,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create extended_profiles table for detailed information
CREATE TABLE IF NOT EXISTS extended_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create profile_interactions table
CREATE TABLE IF NOT EXISTS profile_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'pass', 'super_like')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create profile_views table
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (sender_id != receiver_id)
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE extended_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view public profiles"
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

-- RLS Policies for extended_profiles
CREATE POLICY "Users can view own extended profile"
  ON extended_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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

-- RLS Policies for profile_interactions
CREATE POLICY "Users can view interactions they sent"
  ON profile_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view interactions they received"
  ON profile_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can create interactions"
  ON profile_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update interactions they sent"
  ON profile_interactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id);

-- RLS Policies for profile_views
CREATE POLICY "Users can view their profile views"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = viewed_profile_id);

CREATE POLICY "Users can create profile views"
  ON profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- RLS Policies for matches
CREATE POLICY "Users can view their matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create matches"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view messages they received"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = receiver_id);

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

-- RLS Policies for contact_messages
CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can view contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (false); -- Restrict to admin users only

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_religion ON profiles(religion);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_membership ON profiles(membership_plan);

CREATE INDEX IF NOT EXISTS idx_interactions_sender ON profile_interactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_interactions_receiver ON profile_interactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON profile_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON profile_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_views_viewed ON profile_views(viewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_views_created ON profile_views(created_at);

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_active ON matches(is_active);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- Function to get user recommendations
CREATE OR REPLACE FUNCTION get_recommendations(
  current_user_id uuid,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  full_name text,
  age integer,
  gender text,
  religion text,
  caste text,
  education text,
  profession text,
  location text,
  images text[],
  short_bio text,
  is_premium boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.full_name,
    p.age,
    p.gender,
    p.religion,
    p.caste,
    p.education,
    p.profession,
    p.location,
    p.images,
    p.short_bio,
    p.is_premium
  FROM profiles p
  WHERE p.id != current_user_id
    AND p.id NOT IN (
      SELECT receiver_id 
      FROM profile_interactions 
      WHERE sender_id = current_user_id
    )
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to get user matches
CREATE OR REPLACE FUNCTION get_user_matches(user_uuid uuid)
RETURNS TABLE (
  match_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_age integer,
  other_user_profession text,
  other_user_location text,
  other_user_images text[],
  match_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as match_id,
    CASE 
      WHEN m.user1_id = user_uuid THEN m.user2_id
      ELSE m.user1_id
    END as other_user_id,
    CASE 
      WHEN m.user1_id = user_uuid THEN p2.name
      ELSE p1.name
    END as other_user_name,
    CASE 
      WHEN m.user1_id = user_uuid THEN p2.age
      ELSE p1.age
    END as other_user_age,
    CASE 
      WHEN m.user1_id = user_uuid THEN p2.profession
      ELSE p1.profession
    END as other_user_profession,
    CASE 
      WHEN m.user1_id = user_uuid THEN p2.location
      ELSE p1.location
    END as other_user_location,
    CASE 
      WHEN m.user1_id = user_uuid THEN p2.images
      ELSE p1.images
    END as other_user_images,
    m.created_at as match_created_at
  FROM matches m
  LEFT JOIN profiles p1 ON m.user1_id = p1.id
  LEFT JOIN profiles p2 ON m.user2_id = p2.id
  WHERE (m.user1_id = user_uuid OR m.user2_id = user_uuid)
    AND m.is_active = true
  ORDER BY m.created_at DESC;
END;
$$;

-- Function to get conversation list
CREATE OR REPLACE FUNCTION get_conversation_list(current_user_id uuid)
RETURNS TABLE (
  other_user_id uuid,
  other_user_name text,
  other_user_images text[],
  last_message text,
  last_message_time timestamptz,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH conversation_users AS (
    SELECT DISTINCT
      CASE 
        WHEN sender_id = current_user_id THEN receiver_id
        ELSE sender_id
      END as other_user_id
    FROM messages
    WHERE sender_id = current_user_id OR receiver_id = current_user_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (
      CASE 
        WHEN sender_id = current_user_id THEN receiver_id
        ELSE sender_id
      END
    )
      CASE 
        WHEN sender_id = current_user_id THEN receiver_id
        ELSE sender_id
      END as other_user_id,
      content as last_message,
      created_at as last_message_time
    FROM messages
    WHERE sender_id = current_user_id OR receiver_id = current_user_id
    ORDER BY 
      CASE 
        WHEN sender_id = current_user_id THEN receiver_id
        ELSE sender_id
      END,
      created_at DESC
  ),
  unread_counts AS (
    SELECT 
      sender_id as other_user_id,
      COUNT(*) as unread_count
    FROM messages
    WHERE receiver_id = current_user_id AND read = false
    GROUP BY sender_id
  )
  SELECT 
    cu.other_user_id,
    COALESCE(p.name, p.full_name, 'Unknown') as other_user_name,
    p.images as other_user_images,
    lm.last_message,
    lm.last_message_time,
    COALESCE(uc.unread_count, 0) as unread_count
  FROM conversation_users cu
  LEFT JOIN profiles p ON cu.other_user_id = p.id
  LEFT JOIN last_messages lm ON cu.other_user_id = lm.other_user_id
  LEFT JOIN unread_counts uc ON cu.other_user_id = uc.other_user_id
  ORDER BY lm.last_message_time DESC NULLS LAST;
END;
$$;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(current_user_id uuid)
RETURNS TABLE (
  profile_views bigint,
  likes_received bigint,
  unread_messages bigint,
  total_matches bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profile_views WHERE viewed_profile_id = current_user_id) as profile_views,
    (SELECT COUNT(*) FROM profile_interactions WHERE receiver_id = current_user_id AND interaction_type = 'like') as likes_received,
    (SELECT COUNT(*) FROM messages WHERE receiver_id = current_user_id AND read = false) as unread_messages,
    (SELECT COUNT(*) FROM matches WHERE (user1_id = current_user_id OR user2_id = current_user_id) AND is_active = true) as total_matches;
END;
$$;

-- Function to search profiles
CREATE OR REPLACE FUNCTION search_profiles(
  current_user_id uuid,
  search_text text DEFAULT '',
  min_age integer DEFAULT 18,
  max_age integer DEFAULT 60,
  gender_filter text DEFAULT '',
  religion_filter text DEFAULT '',
  education_filter text DEFAULT '',
  location_filter text DEFAULT '',
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
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
  income text,
  images text[],
  short_bio text,
  is_premium boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.name,
    p.age,
    p.gender,
    p.religion,
    p.caste,
    p.education,
    p.profession,
    p.location,
    p.marital_status,
    p.income,
    p.images,
    p.short_bio,
    p.is_premium
  FROM profiles p
  WHERE p.id != current_user_id
    AND (search_text = '' OR (
      p.full_name ILIKE '%' || search_text || '%' OR
      p.location ILIKE '%' || search_text || '%' OR
      p.profession ILIKE '%' || search_text || '%' OR
      p.education ILIKE '%' || search_text || '%'
    ))
    AND (p.age IS NULL OR (p.age >= min_age AND p.age <= max_age))
    AND (gender_filter = '' OR p.gender = gender_filter)
    AND (religion_filter = '' OR p.religion = religion_filter)
    AND (education_filter = '' OR p.education = education_filter)
    AND (location_filter = '' OR p.location ILIKE '%' || location_filter || '%')
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  current_user_id uuid,
  other_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages 
  SET read = true 
  WHERE receiver_id = current_user_id 
    AND sender_id = other_user_id 
    AND read = false;
END;
$$;

-- Function to create match when mutual like occurs
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if this is a like interaction
  IF NEW.interaction_type = 'like' THEN
    -- Check if the receiver has also liked the sender
    IF EXISTS (
      SELECT 1 FROM profile_interactions 
      WHERE sender_id = NEW.receiver_id 
        AND receiver_id = NEW.sender_id 
        AND interaction_type = 'like'
    ) THEN
      -- Create a match (ensure user1_id < user2_id for consistency)
      INSERT INTO matches (user1_id, user2_id)
      VALUES (
        LEAST(NEW.sender_id, NEW.receiver_id),
        GREATEST(NEW.sender_id, NEW.receiver_id)
      )
      ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic match creation
DROP TRIGGER IF EXISTS trigger_create_match_on_mutual_like ON profile_interactions;
CREATE TRIGGER trigger_create_match_on_mutual_like
  AFTER INSERT ON profile_interactions
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- Function to update profile updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_extended_profiles_updated_at ON extended_profiles;
CREATE TRIGGER trigger_extended_profiles_updated_at
  BEFORE UPDATE ON extended_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();