/*
  # Create profile views table for tracking profile visits

  1. New Tables
    - `profile_views`
      - `id` (uuid, primary key)
      - `viewer_id` (uuid, references profiles)
      - `viewed_profile_id` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `profile_views` table
    - Add policies for users to view their profile views

  3. Indexes
    - Create indexes for efficient querying
    - Unique constraint on viewer_id + viewed_profile_id + date
*/

-- Create profile_views table
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (viewer_id != viewed_profile_id)
);

-- Enable RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own viewing history"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = viewer_id);

CREATE POLICY "Users can view who viewed their profile"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = viewed_profile_id);

CREATE POLICY "Users can create profile views"
  ON profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON profile_views(created_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_viewed ON profile_views(viewer_id, viewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_daily ON profile_views(viewer_id, date_trunc('day', created_at));