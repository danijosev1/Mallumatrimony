/*
  # Fix RLS policies for search page functionality

  1. Problem Analysis
    - Search page needs to display profiles from other users
    - Current policies may be too restrictive for profile discovery
    - Need to ensure authenticated users can view other profiles for matching

  2. Solution
    - Add policy to allow authenticated users to view other active profiles
    - Ensure extended_profiles can be viewed for search functionality
    - Maintain security while enabling profile discovery

  3. Security
    - Only allow viewing of active profiles
    - Maintain user privacy controls
    - Keep personal data secure while allowing basic profile viewing
*/

-- First, let's check and update the profiles table policies
DROP POLICY IF EXISTS "Users can view other profiles for search" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view active profiles" ON public.profiles;

-- Create a comprehensive policy for viewing profiles in search
CREATE POLICY "Authenticated users can view active profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always view their own profile
    auth.uid() = id 
    OR 
    -- Users can view other active profiles for search/matching
    (
      profile_status = 'active' OR profile_status IS NULL
    )
  );

-- Update extended_profiles policies for search functionality
DROP POLICY IF EXISTS "Users can view other extended profiles" ON public.extended_profiles;
DROP POLICY IF EXISTS "Authenticated users can view extended profiles for search" ON public.extended_profiles;

CREATE POLICY "Authenticated users can view extended profiles for search"
  ON public.extended_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always view their own extended profile
    auth.uid() = id
    OR
    -- Users can view extended profiles of active users for search
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = extended_profiles.id 
      AND (p.profile_status = 'active' OR p.profile_status IS NULL)
    )
  );

-- Ensure profile_photos can be viewed for search results
DROP POLICY IF EXISTS "Users can view profile photos for search" ON public.profile_photos;

CREATE POLICY "Users can view profile photos for search"
  ON public.profile_photos
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view photos of active profiles
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = profile_photos.profile_id 
      AND (p.profile_status = 'active' OR p.profile_status IS NULL)
    )
  );

-- Add index for better performance on profile_status queries
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(profile_status) 
WHERE profile_status IS NOT NULL;

-- Add helpful comment
COMMENT ON POLICY "Authenticated users can view active profiles" ON public.profiles 
IS 'Allows authenticated users to view active profiles for search and matching functionality';

COMMENT ON POLICY "Authenticated users can view extended profiles for search" ON public.extended_profiles 
IS 'Allows authenticated users to view extended profile details for search and matching';

COMMENT ON POLICY "Users can view profile photos for search" ON public.profile_photos 
IS 'Allows authenticated users to view photos of active profiles for search results';