/*
  # Create matches table for storing mutual likes

  1. New Tables
    - `matches`
      - `id` (uuid, primary key)
      - `user1_id` (uuid, references profiles)
      - `user2_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on `matches` table
    - Add policies for users to view their matches

  3. Indexes
    - Create indexes for efficient querying
    - Unique constraint on user1_id + user2_id
*/

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their matches as user1"
  ON matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id);

CREATE POLICY "Users can view their matches as user2"
  ON matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user2_id);

CREATE POLICY "System can create matches"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their matches as user1"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id);

CREATE POLICY "Users can update their matches as user2"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user2_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_is_active ON matches(is_active);
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);