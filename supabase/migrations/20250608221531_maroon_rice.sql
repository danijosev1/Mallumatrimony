/*
  # Complete database schema for Mallu Matrimony

  1. New Tables
    - `profiles` - Main user profiles with basic information
    - `extended_profiles` - Detailed profile information
    - `profile_views` - Track profile views for membership limits
    - `profile_interactions` - Track likes, passes, super likes
    - `matches` - Store mutual matches between users
    - `messages` - User messaging system
    - `contact_messages` - Contact form submissions

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for secure access
    - Service role permissions for automated operations

  3. Functions & Triggers
    - Auto-create profiles on user registration
    - Auto-create matches on mutual likes
    - Profile view counting for membership limits

  4. Performance
    - Indexes for search and query optimization
    - Efficient foreign key relationships
*/

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_profile_view_count(uuid, timestamptz);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS create_match_on_mutual_like();

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  name text,
  phone text,
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
  horoscope text,
  membership_plan text DEFAULT 'free' CHECK (membership_plan IN ('free', 'basic', 'premium', 'elite')),
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create extended_profiles table
CREATE TABLE IF NOT EXISTS public.extended_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  gender text,
  birth_date date,
  religion text,
  caste text,
  height text,
  marital_status text,
  education text,
  profession text,
  income text,
  location text,
  about text,
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
  partner_age_min text,
  partner_age_max text,
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
  preferences jsonb DEFAULT '{}',
  family_details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profile_views table
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create profile_interactions table
CREATE TABLE IF NOT EXISTS public.profile_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'pass', 'super_like')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user1_id, user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extended_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles for search" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own extended profile" ON public.extended_profiles;
DROP POLICY IF EXISTS "Users can update own extended profile" ON public.extended_profiles;
DROP POLICY IF EXISTS "Users can insert own extended profile" ON public.extended_profiles;
DROP POLICY IF EXISTS "Users can view other extended profiles" ON public.extended_profiles;
DROP POLICY IF EXISTS "Service role can insert extended profiles" ON public.extended_profiles;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view other profiles for search" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT TO service_role WITH CHECK (true);

-- Extended profiles policies
CREATE POLICY "Users can read own extended profile" ON public.extended_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own extended profile" ON public.extended_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own extended profile" ON public.extended_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view other extended profiles" ON public.extended_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert extended profiles" ON public.extended_profiles
  FOR INSERT TO service_role WITH CHECK (true);

-- Profile views policies
CREATE POLICY "Users can insert their own profile views" ON public.profile_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can view their own profile views" ON public.profile_views
  FOR SELECT TO authenticated USING (auth.uid() = viewer_id OR auth.uid() = viewed_profile_id);

-- Profile interactions policies
CREATE POLICY "Users can create interactions" ON public.profile_interactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their interactions" ON public.profile_interactions
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Matches policies
CREATE POLICY "Users can view their matches" ON public.matches
  FOR SELECT TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark received messages as read" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- Contact messages policies
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_gender_idx ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS profiles_age_idx ON public.profiles(age);
CREATE INDEX IF NOT EXISTS profiles_location_idx ON public.profiles(location);
CREATE INDEX IF NOT EXISTS profiles_religion_idx ON public.profiles(religion);
CREATE INDEX IF NOT EXISTS profiles_profession_idx ON public.profiles(profession);
CREATE INDEX IF NOT EXISTS profiles_membership_plan_idx ON public.profiles(membership_plan);
CREATE INDEX IF NOT EXISTS profile_views_viewer_id_idx ON public.profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS profile_views_created_at_idx ON public.profile_views(created_at);
CREATE INDEX IF NOT EXISTS profile_views_viewer_created_idx ON public.profile_views(viewer_id, created_at);
CREATE INDEX IF NOT EXISTS messages_sender_receiver_idx ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- Create function to get profile view counts
CREATE OR REPLACE FUNCTION get_profile_view_count(
  user_id uuid,
  start_date timestamptz DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF start_date IS NULL THEN
    RETURN (
      SELECT COUNT(*)
      FROM public.profile_views
      WHERE viewer_id = user_id
    );
  ELSE
    RETURN (
      SELECT COUNT(*)
      FROM public.profile_views
      WHERE viewer_id = user_id
        AND created_at >= start_date
    );
  END IF;
END;
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
  user_name text;
  provider_name text;
BEGIN
  -- Extract user information
  user_email := COALESCE(NEW.email, '');
  provider_name := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  
  -- Get name based on provider
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

  -- Insert into profiles table
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    name,
    membership_plan,
    is_premium,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_email,
    user_name,
    user_name,
    'free',
    false,
    now(),
    now()
  );

  -- Insert into extended_profiles table
  INSERT INTO public.extended_profiles (
    id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    now(),
    now()
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create matches on mutual likes
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a 'like' interaction
  IF NEW.interaction_type = 'like' THEN
    -- Check if the receiver has already liked the sender
    IF EXISTS (
      SELECT 1 FROM public.profile_interactions 
      WHERE sender_id = NEW.receiver_id 
      AND receiver_id = NEW.sender_id 
      AND interaction_type = 'like'
    ) THEN
      -- Create a match (ensure user1_id < user2_id for consistency)
      INSERT INTO public.matches (user1_id, user2_id)
      VALUES (
        LEAST(NEW.sender_id, NEW.receiver_id),
        GREATEST(NEW.sender_id, NEW.receiver_id)
      )
      ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_match_trigger ON public.profile_interactions;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER create_match_trigger
  AFTER INSERT ON public.profile_interactions
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION get_profile_view_count(uuid, timestamptz) TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.extended_profiles TO authenticated;
GRANT ALL ON public.contact_messages TO authenticated;