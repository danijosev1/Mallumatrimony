/*
  # Fresh Supabase Setup for Mallu Matrimony

  1. Clean slate setup with all required tables
  2. Proper RLS policies
  3. User registration triggers
  4. Contact form support
  5. Membership system
*/

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.profile_views CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.profile_interactions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.profile_photos CASCADE;
DROP TABLE IF EXISTS public.extended_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_match_on_mutual_like() CASCADE;
DROP FUNCTION IF EXISTS public.get_profile_view_count(uuid, timestamptz) CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
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
  images text[],
  short_bio text,
  about text,
  family_details jsonb DEFAULT '{}'::jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  contact_info jsonb DEFAULT '{}'::jsonb,
  key_details text[],
  horoscope text,
  is_premium boolean DEFAULT false,
  membership_plan text DEFAULT 'free' CHECK (membership_plan IN ('free', 'basic', 'premium', 'elite')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create extended_profiles table for detailed information
CREATE TABLE public.extended_profiles (
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
  preferences jsonb DEFAULT '{}'::jsonb,
  family_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profile_photos table
CREATE TABLE public.profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create profile_interactions table
CREATE TABLE public.profile_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'pass', 'super_like')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create matches table
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user1_id, user2_id)
);

-- Create profile_views table
CREATE TABLE public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX extended_profiles_gender_idx ON public.extended_profiles(gender);
CREATE INDEX profile_views_viewer_id_idx ON public.profile_views(viewer_id);
CREATE INDEX profile_views_created_at_idx ON public.profile_views(created_at);
CREATE INDEX messages_sender_receiver_idx ON public.messages(sender_id, receiver_id);
CREATE UNIQUE INDEX one_primary_photo_per_profile ON public.profile_photos(profile_id) WHERE is_primary = true;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extended_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Extended profiles policies
CREATE POLICY "Users can view their own extended profile"
  ON public.extended_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own extended profile"
  ON public.extended_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own extended profile"
  ON public.extended_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert extended profiles"
  ON public.extended_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Profile photos policies
CREATE POLICY "Users can manage their own photos"
  ON public.profile_photos FOR ALL
  TO authenticated
  USING (auth.uid() = profile_id);

-- Messages policies
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark received messages as read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id AND read = true);

-- Profile interactions policies
CREATE POLICY "Users can create interactions"
  ON public.profile_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their interactions"
  ON public.profile_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Matches policies
CREATE POLICY "Users can view their matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Profile views policies
CREATE POLICY "Users can insert their own profile views"
  ON public.profile_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can view their own profile views"
  ON public.profile_views FOR SELECT
  TO authenticated
  USING (auth.uid() = viewer_id OR auth.uid() = viewed_profile_id);

-- Contact messages policies (allow anonymous submissions)
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to handle new user registration
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

-- Function to create matches on mutual likes
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS trigger AS $$
BEGIN
  IF NEW.interaction_type = 'like' THEN
    -- Check for mutual like
    IF EXISTS (
      SELECT 1 FROM public.profile_interactions 
      WHERE sender_id = NEW.receiver_id 
      AND receiver_id = NEW.sender_id 
      AND interaction_type = 'like'
    ) THEN
      -- Create match
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

-- Function to get profile view count
CREATE OR REPLACE FUNCTION public.get_profile_view_count(
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

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER create_match_trigger
  AFTER INSERT ON public.profile_interactions
  FOR EACH ROW EXECUTE FUNCTION public.create_match_on_mutual_like();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;